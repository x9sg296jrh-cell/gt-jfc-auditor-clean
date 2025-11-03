'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [start, setStart] = useState('18:00');
  const [end, setEnd] = useState('20:00');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchEvents() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `/api/events?start=${start}&end=${end}&date=${selectedDate}`
      );
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      setEvents(data.events);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <main className="min-h-screen bg-[#0b0f19] text-gray-100 px-6 py-10">
      <h1 className="text-3xl font-bold mb-8 text-white">
        JFC Audits – Find Events
      </h1>

      <div className="flex flex-wrap items-center gap-4 mb-10">
        {/* Start Time */}
        <div>
          <label className="block text-sm mb-1 text-gray-400">Start</label>
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-gray-100"
          />
        </div>

        {/* End Time */}
        <div>
          <label className="block text-sm mb-1 text-gray-400">End</label>
          <input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-gray-100"
          />
        </div>

        {/* Date Picker */}
        <div>
          <label className="block text-sm mb-1 text-gray-400">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-gray-100"
          />
        </div>

        {/* Load Events Button */}
        <div className="self-end">
          <Button
            onClick={fetchEvents}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-5 py-2 transition-all duration-200"
          >
            {loading ? 'Loading...' : 'Load Events'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-red-400 mb-6 border border-red-600 rounded-lg p-3 bg-red-900/30">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.length === 0 && !loading ? (
          <p className="text-gray-400">No events match your filters.</p>
        ) : (
          events.map((e: any) => (
            <div
              key={e.id}
              className="bg-gray-900 border border-gray-700 rounded-xl p-5 shadow-lg hover:border-blue-500 transition-all duration-200"
            >
              <h2 className="text-lg font-semibold mb-1 text-white">
                {e.name}
              </h2>
              <p className="text-sm text-gray-400 mb-1">{e.org}</p>
              <p className="text-sm text-gray-500 mb-2">{e.location}</p>
              <p className="text-sm text-gray-400">
                {new Date(e.startsAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <div className="mt-3 flex justify-between items-center">
                <a
                  href={e.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  View on Engage
                </a>
                <Button
                  variant="outline"
                  className="border-blue-600 text-blue-400 hover:bg-blue-900/30"
                >
                  Claim Audit
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
