// scripts/scrape-engage.mjs
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// small helper to resolve paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE = 'https://gatech.campuslabs.com/engage';

function parseDateTimeBlock(txt) {
  const times = [...(txt || '').matchAll(/(\d{1,2}:\d{2}\s*(AM|PM))/gi)].map(m => m[0]);
  const today = new Date();
  const defStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 18, 0);
  const defEnd = new Date(defStart.getTime() + 60 * 60000);

  if (times.length >= 2) {
    const toHM = (s) => {
      const m = s.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!m) return [18, 0];
      let hh = Number(m[1]) % 12;
      if (/PM/i.test(m[3])) hh += 12;
      return [hh, Number(m[2])];
    };
    const [sh, sm] = toHM(times[0]);
    const [eh, em] = toHM(times[1]);
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), sh, sm);
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), eh, em);
    return { startsAt: start.toISOString(), endsAt: end.toISOString() };
  }
  return { startsAt: defStart.toISOString(), endsAt: defEnd.toISOString() };
}

async function scrape() {
  const storageStatePath = path.join(__dirname, '..', 'engage-auth.json');
  const dataOut = path.join(__dirname, '..', 'data', 'events.json');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: fs.existsSync(storageStatePath) ? storageStatePath : undefined,
  });
  const page = await context.newPage();

  await page.goto(`${BASE}/events`, { waitUntil: 'networkidle' });

  await context.storageState({ path: storageStatePath });

  const links = await page.$$eval('a[href*="/engage/event/"]', as =>
    Array.from(new Set(as.map(a => a.href))).filter(h => /\/event\/\d+/.test(h))
  );

  const out = [];
  for (const href of links) {
    try {
      await page.goto(href, { waitUntil: 'networkidle' });

      const title = (await page.locator('h1').first().textContent())?.trim() || '';
      const clubName = await page.locator('text=Host Organization').locator('xpath=..').innerText().catch(() => '');
      const dtBlock = (await page.locator('text=Date and Time').locator('xpath=..').textContent()) || '';
      const { startsAt, endsAt } = parseDateTimeBlock(dtBlock);

      let venueName = '';
      const locBlock = await page.locator('text=Location').locator('xpath=..').textContent().catch(() => '');
      if (locBlock) venueName = locBlock.replace(/Location/i, '').trim();

      const desc = (await page.locator('[data-testid="event-description"], [class*=Description]').first().textContent().catch(() => '')) || '';

      const txt = (desc || '').toLowerCase();
      const yes = /(free\s+food|food\s+will\s+be\s+provided|we\s+will\s+have\s+food|light\s+refreshments|snack(s)?|pizza|sandwich(es)?|bagel(s)?|donut(s)?|doughnut(s)?|cookies?|chips|boba|bubble\s+tea|coffee|tea|sushi|chipotle|chick[- ]?fil[- ]?a|moe's|zaxby|cane's|cater(?:ed|ing)|refreshments?)/i;
      const no = /(no\s+food|food\s+not\s+provided|bring\s+your\s+own\s+food)/i;
      let hasFood = false;
      if (no.test(txt)) hasFood = false;
      else if (yes.test(txt)) hasFood = true;

      out.push({
        id: href.split('/').pop(),
        sourceUrl: href,
        title,
        clubName,
        startsAt,
        endsAt,
        venueName,
        lat: null,
        lng: null,
        hasFood,
        foodNotes: '',
      });
    } catch (err) {
      console.error('Failed to scrape:', href, err?.message);
    }
  }

    fs.mkdirSync(path.dirname(dataOut), { recursive: true });
const payload = {
  lastUpdated: new Date().toISOString(),
  events: out
};
fs.writeFileSync(dataOut, JSON.stringify(payload, null, 2), 'utf8');

  console.log(`✅ Saved ${out.length} events to ${dataOut}`);

  await browser.close();
}

scrape().catch(err => {
  console.error(err);
  process.exit(1);
});
