import { NextRequest, NextResponse } from 'next/server';
import { getEventsBetween } from '@/app/lib/data';
import { getWalkingEta } from '@/app/lib/walk';

// Define a minimal type for events
interface Event {
  id: string;
  lat: number | null;
  lng: number | null;
  startsAt: string;
  endsAt: string;
  walk?: { minutes: number };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start') || '18:00';
  const end = searchParams.get('end') || '20:00';
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  const today = new Date();
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const windowStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), sh, sm);
  const windowEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), eh, em);

  const data: any = await getEventsBetween(windowStart, windowEnd);
  const events: Event[] = Array.isArray(data) ? data : data.events || [];
  const lastUpdated = (data && !Array.isArray(data) && data.lastUpdated) || null;

  let withLoc: Event[] = events;
  if (lat && lng) {
    const origin = { lat: Number(lat), lng: Number(lng) };
    const etas = await getWalkingEta(
      origin,
      events.map((e: Event) => ({
        id: e.id,
        lat: e.lat ?? undefined, // 👈 convert null → undefined
        lng: e.lng ?? undefined, // 👈 convert null → undefined
      }))
    );
    withLoc = events
      .map((e: Event) => ({ ...e, walk: etas[e.id] }))
      .sort((a, b) => (a.walk?.minutes ?? 999) - (b.walk?.minutes ?? 999));
  } else {
    withLoc = events.sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );
  }

  return NextResponse.json({ events: withLoc, lastUpdated });
}
