'use client';
import { useEffect, useMemo, useState } from 'react';

export default function Page() {
  const [start, setStart] = useState<string>('18:00');
  const [end, setEnd] = useState<string>('20:00');
  const [userLoc, setUserLoc] = useState<{lat:number; lng:number} | null>(null);
  const [events, setEvents] = useState<any[]>([]);

  const query = useMemo(() => ({ start, end, loc: userLoc }), [start, end, userLoc]);

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams({ start, end, ...(userLoc ? { lat: String(userLoc.lat), lng: String(userLoc.lng) } : {}) });
      const res = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json();
      setEvents(data.events || []);
    };
    run();
  }, [query]);

  const food = events.filter(e => e.hasFood);
  const noFood = events.filter(e => !e.hasFood);

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">JFC Audits – Find Events</h1>

      <button
  onClick={async () => {
    const res = await fetch("/api/refresh", { method: "POST" });
    const data = await res.json();
    if (data.success) {
      alert("✅ Events refreshed successfully!");
      location.reload();
    } else {
      alert("❌ Refresh failed. Check console.");
      console.error(data.error);
    }
  }}
  className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
>
  🔄 Refresh Events
</button>


      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <TimeSelect label="Start" value={start} onChange={setStart} />
        <TimeSelect label="End" value={end} onChange={setEnd} />
        <LocationControls onDetect={setUserLoc} />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <EventColumn title="Food provided" items={food} />
        <EventColumn title="No food mentioned" items={noFood} />
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
    <div className="space-y-2">
      <label className="text-sm text-gray-600">{label}</label>
      <select className="w-full rounded-lg border p-2" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function LocationControls({ onDetect }: { onDetect: (loc: {lat:number; lng:number}) => void }) {
  const detect = () => navigator.geolocation?.getCurrentPosition(pos => onDetect({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-600">Location (optional)</label>
      <button onClick={detect} className="rounded-lg border px-3 py-2">Use my location</button>
    </div>
  );
}

function EventColumn({ title, items }: any) {
  return (
    <div>
      <h2 className="sticky top-0 z-10 bg-white/70 backdrop-blur text-lg font-semibold pb-3">{title}</h2>
      <div className="space-y-3">
        {items.map((e:any) => <EventCard key={e.id} e={e} />)}
      </div>
    </div>
  );
}



function EventCard({ e }: any) {
  const [showForm, setShowForm] = useState(false);
  const [auditor, setAuditor] = useState('');
  const [foodVerified, setFoodVerified] = useState<boolean | null>(null);
  const [notes, setNotes] = useState('');

  // --- time tags (same logic as before) ---
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

  // --- submit handler ---
  const handleSubmit = (eSubmit: React.FormEvent) => {
    eSubmit.preventDefault();
    console.log({
      eventTitle: e.title,
      club: e.clubName,
      auditor,
      foodVerified,
      notes,
    });
    alert(`✅ Audit recorded for ${e.title}`);
    setShowForm(false);
    setAuditor('');
    setFoodVerified(null);
    setNotes('');
  };

  return (
    <>
      <div className="block rounded-xl border p-4 hover:shadow transition space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-medium">{e.title}</div>
          <div className="flex items-center gap-2">
            {status && <span className={`text-xs px-2 py-1 rounded ${statusColor}`}>{status}</span>}
            {e.hasFood && <span className="text-xs rounded bg-green-200 text-green-900 px-2 py-1">Food</span>}
          </div>
        </div>
        <div className="text-sm text-gray-600">{e.clubName}</div>
        <div className="text-sm">{e.startsAtPretty} — {e.venueName}</div>
        {e.walk && <div className="text-xs text-gray-600">~{e.walk.minutes} min walk</div>}

        <div className="flex gap-2 pt-2">
          <a
            href={e.sourceUrl}
            target="_blank"
            className="text-blue-600 text-sm underline hover:text-blue-800"
          >
            View on Engage
          </a>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm bg-gray-100 border px-2 py-1 rounded hover:bg-gray-200"
          >
            Claim Audit
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl"
          >
            <h2 className="text-lg font-semibold mb-2">Claim Audit – {e.title}</h2>
            <div>
              <label className="block text-sm mb-1">Your Name / GT Email</label>
              <input
                type="text"
                value={auditor}
                onChange={(e) => setAuditor(e.target.value)}
                required
                className="w-full border rounded-lg p-2"
                placeholder="jdoe@gatech.edu"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Was food provided?</label>
              <div className="flex gap-3">
                <label>
                  <input
                    type="radio"
                    name="food"
                    checked={foodVerified === true}
                    onChange={() => setFoodVerified(true)}
                  />{' '}
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="food"
                    checked={foodVerified === false}
                    onChange={() => setFoodVerified(false)}
                  />{' '}
                  No
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border rounded-lg p-2"
                rows={3}
                placeholder="Any comments, missing items, or photos..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border px-3 py-1 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

