"use client";

import { useState, useEffect } from "react";

type Event = {
  id: string;
  sourceUrl: string;
  title: string;
  clubName: string;
  startsAt: string;
  endsAt: string;
  venueName?: string;
  lat?: number;
  lng?: number;
  hasFood?: boolean;
  foodNotes?: string;
};

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");
  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/events");
      const data = await res.json();

      if (Array.isArray(data)) {
        setEvents(data);
      } else if (Array.isArray(data.events)) {
        setEvents(data.events);
      } else {
        console.error("Unexpected API response:", data);
        setEvents([]);
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const getLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      (err) => alert("Failed to get location: " + err.message)
    );
  };

  // ✅ Proper local time filtering
const filteredEvents = events.filter((e) => {
  const eventStart = new Date(e.startsAt);
  const eventLocal = new Date(
    eventStart.getTime() - eventStart.getTimezoneOffset() * 60000
  ); // convert UTC→local

  const selectedLocal = new Date(date);
  const sameDay = eventLocal.toDateString() === selectedLocal.toDateString();

  const eventHour = eventLocal.getHours();
  const startHour = parseInt(startTime.split(":")[0]);
  const endHour = parseInt(endTime.split(":")[0]);

  return sameDay && eventHour >= startHour && eventHour <= endHour;
});

const foodEvents = filteredEvents.filter((e) => e.hasFood);
const noFoodEvents = filteredEvents.filter((e) => !e.hasFood);


  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0");
    return `${hour}:00`;
  });

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-gray-100 px-6 py-10">
      <h1 className="text-4xl font-bold text-center mb-8">JFC Audits – Find Events</h1>

      {/* Filters Section */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Start</label>
          <select
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="p-2 border rounded-md bg-white dark:bg-neutral-800"
          >
            {timeOptions.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">End</label>
          <select
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="p-2 border rounded-md bg-white dark:bg-neutral-800"
          >
            {timeOptions.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="p-2 border rounded-md bg-white dark:bg-neutral-800"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Location (optional)</label>
          <button
            onClick={getLocation}
            className="p-2 px-4 rounded-md font-semibold bg-gray-200 dark:bg-white text-black hover:bg-gray-300 transition"
          >
            Use my location
          </button>
        </div>
      </div>

      {/* Event Columns */}
      {loading ? (
        <p className="text-center text-gray-500">Loading events...</p>
      ) : (
        <div className="flex flex-wrap justify-center gap-10">
          {/* Food Provided */}
          <div className="w-full md:w-5/12">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              🍽️ Food provided
            </h2>
            <div className="flex flex-col gap-4">
              {foodEvents.length ? (
                foodEvents.map((e, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white dark:bg-neutral-800 shadow">
                    <h3 className="font-semibold text-lg">{e.title}</h3>
                    <p className="text-sm text-gray-500">
                      {e.clubName} • {e.venueName}
                    </p>
                    <a
                      href={e.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-blue-600 dark:text-blue-400"
                    >
                      View on Engage
                    </a>
                    <button
                      onClick={() =>
                        window.open(
                          "https://forms.office.com/r/yeDTMtMWK3",
                          "_blank"
                        )
                      }
                      className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                      Claim Audit
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No events found.</p>
              )}
            </div>
          </div>

          {/* No Food */}
          <div className="w-full md:w-5/12">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              🚫 No food mentioned
            </h2>
            <div className="flex flex-col gap-4">
              {noFoodEvents.length ? (
                noFoodEvents.map((e, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white dark:bg-neutral-800 shadow">
                    <h3 className="font-semibold text-lg">{e.title}</h3>
                    <p className="text-sm text-gray-500">
                      {e.clubName} • {e.venueName}
                    </p>
                    <a
                      href={e.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-blue-600 dark:text-blue-400"
                    >
                      View on Engage
                    </a>
                    <button
                      onClick={() =>
                        window.open(
                          "https://forms.office.com/r/yeDTMtMWK3",
                          "_blank"
                        )
                      }
                      className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                      Claim Audit
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No events found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
