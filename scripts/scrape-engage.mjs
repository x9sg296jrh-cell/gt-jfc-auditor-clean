// scripts/scrape-engage.mjs
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const OUTPUT_FILE = path.join("data", "events.json");

// Extensive list of food keywords
const foodKeywords = [
  "food", "free food", "meal", "lunch", "dinner", "breakfast", "snack",
  "refreshments", "pizza", "cookies", "drinks", "coffee", "tea", "boba",
  "dessert", "beverage", "soda", "sandwich", "catering", "barbecue", "bbq",
  "grill", "popcorn", "ice cream", "cake", "pasta", "chips", "taco", "burger",
  "salad", "brunch", "cookout", "potluck", "appetizer", "feast", "picnic",
  "banquet", "subs", "wraps", "rice", "noodle", "dumpling", "sushi", "candy",
  "smoothie", "fruit", "pretzel", "food truck", "taste", "tasting", "cook",
  "chef", "eat", "eating", "buffet", "light snacks", "light refreshments",
  "refreshments served", "pizza party", "snack break", "treats", "meal served",
  "serving food", "providing food", "join us for lunch", "join us for dinner",
  "enjoy lunch", "enjoy dinner", "culinary", "kitchen", "taste test", "meal ticket",
  "feed", "food giveaway", "pantry", "catered", "meals available", "food provided"
];

// Fetch all events from Engage API
async function fetchEvents() {
  const url = "https://gatech.campuslabs.com/engage/api/discovery/event/search?orderByField=endsOn&orderByDirection=ascending&take=200&status=Approved";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.value || [];
}

function detectFood(description, name) {
  const text = `${name} ${description}`.toLowerCase();
  return foodKeywords.some((word) => text.includes(word));
}

async function run() {
  console.log("🔍 Fetching Engage events via API...");
  const eventsRaw = await fetchEvents();
  console.log(`Found ${eventsRaw.length} events`);

  const events = eventsRaw.map((ev) => {
    const startsAt = ev.startsOn;
    const endsAt = ev.endsOn;
    const venueName = ev.location || "TBA";
    const description = ev.description || "";
    const title = ev.name || "Untitled Event";
    const clubName = ev.organizationName || "Unknown Org";
    const sourceUrl = `https://gatech.campuslabs.com/engage/event/${ev.id}`;
    const hasFood = detectFood(description, title);

    return {
      id: ev.id,
      sourceUrl,
      title,
      clubName,
      startsAt,
      endsAt,
      venueName,
      lat: ev.latitude || null,
      lng: ev.longitude || null,
      hasFood,
      foodNotes: hasFood ? "Detected by keyword match" : "",
    };
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ events }, null, 2));
  console.log(`✅ Saved ${events.length} events to ${OUTPUT_FILE}`);
}

run().catch((err) => {
  console.error("❌ Scraper failed:", err);
  process.exit(1);
});
