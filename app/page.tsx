'use client';
import { useEffect, useMemo, useState } from 'react';

export default function Page() {
  const [start, setStart] = useState<string>('18:00');
  const [end, setEnd] = useState<string>('20:00');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [userLoc, setUserLoc] = useState<{lat:number; lng:number} | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const query = useMemo(() => ({ start, end, loc: userLoc }), [start, end, userLoc]);

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams({
        start, end, date,
        ...(userLoc ? { lat: String(userLoc.lat), lng: String(userLoc.lng) } : {})
      });
      const res = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json();
      setEvents(data.events || []);
      setLastUpdated(data.lastUpdated || null);
    };
    run();
  }, [query, date]);

  const food = events.filter(e => e.hasFood);
  const noFood = events.filter(e => !e.hasFood);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8 text-gray-900 dark:text-gray-100">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">JFC Audits – Find Events</h1>
        {lastUpdated && (
          <p className="text-sm text-gray-500">
            Last updated:{' '}
            {new Date(lastUpdated).toLocaleString('en-US', {
              dateStyle: 'short',
              timeStyle: 'short',
            })}
          </p>
        )}
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <TimeSelect label="Start" value={start} onChange={setStart} />
        <TimeSelect label="End" value={end} onChange={setEnd} />
        <DateSelect label="Date" value={date} onChange={setDate} />
        <LocationControls onDetect={setUserLoc} />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <EventColumn title="🍕 Food Provided" items={food} />
        <EventColumn title="🥤 No Food Mentioned" items={noFood} />
      </section>
    </main>
  );
}

function TimeSelect({ label, value, onChange }: any) {
  const options = Array.from({ length: 24 * 4 }, (_, i) => {
    const hh = Math.floor(i / 4).toString().padStart(2, '0');
    const mm = ((i % 4) * 15).toString().padStart(2, '0');
    return `${hh}:${mm}`;
  });
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</label>
      <select className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function DateSelect({ label, value, onChange }: any) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</label>
      <input
        type="date"
        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

function LocationControls({ onDetect }: { onDetect: (loc: {lat:number; lng:number}) => void }) {
  const detect = () => navigator.geolocation?.getCurrentPosition(pos => onDetect({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Location (optional)</label>
      <button onClick={detect} className="rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 w-full hover:bg-gray-100 dark:hover:bg-gray-800">
        📍 Use my location
      </button>
    </div>
  );
}

function EventColumn({ title, items }: any) {
  return (
    <div>
      <h2 className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900/80 backdrop-blur text-lg font-semibold pb-3">{title}</h2>
      <div className="space-y-4">
        {items.map((e:any) => <EventCard key={e.id} e={e} />)}
      </div>
    </div>
  );
}

function EventCard({ e }: any) {
  const microsoftFormBase = 'https://forms.office.com/Pages/ResponsePage.aspx?id=u5ghSHuuJUuLem1_Mvqgg5aXtm8KyJhPgD4IEdKnjmxUN0pRUkdKQjlXUzVJNjIyRDlVNlQ3QlBCQy4u';
  const formUrl = `${microsoftFormBase}&clubName=${encodeURIComponent(e.clubName)}&eventTitle=${encodeURIComponent(e.title)}`;

  const now = new Date();
  const start = new Date(e.startsAt);
  const end = new Date(e.endsAt);
  const diffStart = (start.getTime() - now.getTime()) / 60000;
  const diffEnd = (end.getTime() - now.getTime()) / 60000;

  let status: string | null = null;
  let statusColor = '';
  if (diffStart <= 10 && diffStart > 0) {
    status = 'Starting soon';
    statusColor = 'bg-green-100 text-green-800';
  } else if (diffStart <= 0 && diffEnd > 10) {
    status = 'In progress';
    statusColor = 'bg-blue-100 text-blue-800';
  } else if (diffEnd <= 10 && diffEnd > 0) {
    status = 'Ending soon';
    statusColor = 'bg-red-100 text-red-800';
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-lg">{e.title}</div>
        {status && <span className={`text-xs px-2 py-1 rounded ${statusColor}`}>{status}</span>}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{e.clubName}</div>
      <div className="text-sm">{e.startsAtPretty} — {e.venueName}</div>
      {e.walk && <div className="text-xs text-gray-500">~{e.walk.minutes} min walk</div>}
      <div className="flex gap-2 pt-3">
        <a
          href={e.sourceUrl}
          target="_blank"
          className="text-blue-600 dark:text-blue-400 text-sm underline hover:text-blue-800"
        >
          View on Engage
        </a>
        <a
          href={formUrl}
          target="_blank"
          className="text-sm bg-yellow-500 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-600 transition"
        >
          Claim Audit
        </a>
      </div>
    </div>
  );
}
