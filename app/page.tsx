'use client';
import { useEffect, useMemo, useState } from 'react';

export default function Page() {
  const [start, setStart] = useState<string>('18:00');
  const [end, setEnd] = useState<string>('20:00');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const query = useMemo(() => ({ start, end, date, loc: userLoc }), [start, end, date, userLoc]);

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams({
        start,
        end,
        date,
        ...(userLoc ? { lat: String(userLoc.lat), lng: String(userLoc.lng) } : {}),
      });
      const res = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json();
      setEvents(data.events || []);
      setLastUpdated(data.lastUpdated || null);
    };
    run();
  }, [query]);

  const food = events.filter(e => e.hasFood);
  const noFood = events.filter(e => !e.hasFood);

  return (
    <main className="max-w-5xl mx-auto space-y-6 px-4 py-6 text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-semibold text-center mb-6">JFC Audits – Find Events</h1>

      {lastUpdated && (
        <p className="text-sm text-gray-500 text-center">
          Last updated:{' '}
          {new Date(lastUpdated).toLocaleString('en-US', {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
        </p>
      )}

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <TimeSelect label="Start" value={start} onChange={setStart} />
        <TimeSelect label="End" value={end} onChange={setEnd} />
        <DateSelect label="Date" value={date} onChange={setDate} />
        <LocationControls onDetect={setUserLoc} />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <EventColumn title="Food provided" items={food} />
        <EventColumn title="No food mentioned" items={noFood} />
      </section>
    </main>
  );
}

function DateSelect({ label, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-600">{label}</label>
      <input
        type="date"
        className="w-full rounded-lg border border-gray-300 p-2 bg-white dark:bg-gray-800 dark:border-gray-700"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

function TimeSelect({ label, value, onChange }: any) {
  const options = Array.from({ length: 24 * 4 }, (_, i) => {
    const hh = Math.floor(i / 4).toString().padStart(2, '0');
    const mm = ((i % 4) * 15).toString().padStart(2, '0');
    return `${hh}:${mm}`;
  });
  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-600">{label}</label>
      <select
        className="w-full rounded-lg border border-gray-300 p-2 bg-white dark:bg-gray-800 dark:border-gray-700"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function LocationControls({ onDetect }: { onDetect: (loc: { lat: number; lng: number }) => void }) {
  const detect = () =>
    navigator.geolocation?.getCurrentPosition(pos =>
      onDetect({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    );
  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-600">Location (optional)</label>
      <button
        onClick={detect}
        className="rounded-lg border px-3 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
      >
        Use my location
      </button>
    </div>
  );
}

function EventColumn({ title, items }: any) {
  return (
    <div>
      <h2 className="sticky top-0 z-10 bg-white/70 dark:bg-gray-900/70 backdrop-blur text-lg font-semibold pb-3">
        {title}
      </h2>
      <div className="space-y-3">
        {items.map((e: any) => (
          <EventCard key={e.id} e={e} />
        ))}
      </div>
    </div>
  );
}

function EventCard({ e }: any) {
  return (
    <div className="block rounded-xl border border-gray-300 dark:border-gray-700 p-4 hover:shadow-md transition space-y-2 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div className="font-medium">{e.title}</div>
        <div className="flex items-center gap-2">
          {e.hasFood && (
            <span className="text-xs rounded bg-green-200 text-green-900 px-2 py-1">Food</span>
          )}
        </div>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{e.clubName}</div>
      <div className="text-sm">{e.startsAtPretty} — {e.venueName}</div>
      {e.walk && <div className="text-xs text-gray-500">~{e.walk.minutes} min walk</div>}

      <a
        href="https://forms.office.com/Pages/ResponsePage.aspx?id=u5ghSHuuJUuLem1_Mvqgg5aXtm8KyJhPgD4IEdKnjmxUN0pRUkdKQjlXUzVJNjIyRDlVNlQ3QlBCQy4u"
        target="_blank"
        className="inline-block text-center w-full mt-2 text-sm bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        Claim Audit
      </a>
    </div>
  );
}
