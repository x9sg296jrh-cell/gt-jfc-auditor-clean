// lib/data.ts

function todayAt(h: number, m: number) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}


// Mock events (you can edit these)
const MOCK: any[] = [
  {
    id: 'evt1',
    sourceUrl: 'https://gatech.campuslabs.com/engage/event/11678430',
    title: 'Robotics Club Weekly Meeting',
    clubName: 'Robotics Club',
    startsAt: todayAt(18, 0).toISOString(), // 6:00 PM today
    endsAt: todayAt(19, 0).toISOString(),   // 7:00 PM
    venueName: 'Clough Commons 152',
    lat: 33.7756,
    lng: -84.3963,
    hasFood: true,
    foodNotes: 'pizza + drinks'
  },
  {
    id: 'evt2',
    sourceUrl: 'https://gatech.campuslabs.com/engage/event/11729688',
    title: 'IEEE General Body Meeting',
    clubName: 'IEEE at GT',
    startsAt: todayAt(18, 30).toISOString(), // 6:30 PM
    endsAt: todayAt(20, 0).toISOString(),    // 8:00 PM
    venueName: 'Van Leer Building 102',
    lat: 33.7773,
    lng: -84.3973,
    hasFood: false,
    foodNotes: ''
  },
  {
    id: 'evt3',
    sourceUrl: 'https://gatech.campuslabs.com/engage/event/11655382',
    title: 'Entrepreneurship Mixer',
    clubName: 'Startup Exchange',
    startsAt: todayAt(19, 0).toISOString(), // 7:00 PM
    endsAt: todayAt(20, 0).toISOString(),   // 8:00 PM
    venueName: 'Scheller Atrium',
    lat: 33.776, 
    lng: -84.389,
    hasFood: true,
    foodNotes: 'light refreshments'
  }
];

export async function getEventsBetween(windowStart: Date, windowEnd: Date) {
  const s = windowStart.getTime();
  const e = windowEnd.getTime();
  // keep events that overlap the selected window
  return MOCK.filter(ev => {
    const evS = new Date(ev.startsAt).getTime();
    const evE = new Date(ev.endsAt).getTime();
    return evS <= e && evE >= s;
  });
}
