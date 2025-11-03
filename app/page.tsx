'use client';
import { useEffect, useMemo, useState } from 'react';

export default function Page() {
  const [start, setStart] = useState('18:00');
  const [end, setEnd] = useState('20:00');
  const [userLoc, setUserLoc] = useState<{lat:number;lng:number}|null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string|null>(null);

  const query = useMemo(()=>({start,end,loc:userLoc}),[start,end,userLoc]);

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams({
        start, end,
        ...(userLoc ? { lat:String(userLoc.lat), lng:String(userLoc.lng) } : {}),
      });
      const res = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json();
      setEvents(data.events || []);
      setLastUpdated(data.lastUpdated || null);
    };
    run();
  },[query]);

  const food = events.filter(e=>e.hasFood);
  const noFood = events.filter(e=>!e.hasFood);

  return (
    <main>
      {/* Sticky GT header */}
      <div className="header fixed top-0 left-0 right-0 z-50">
        <div className="header-inner">
          <div>
            <div className="app-title">JFC Audits – Find Events</div>
            {lastUpdated && (
              <div className="subtle">
                Last updated {new Date(lastUpdated).toLocaleString('en-US',{dateStyle:'short', timeStyle:'short'})}
              </div>
            )}
          </div>

          <div className="controls">
            <TimeSelect label="Start" value={start} onChange={setStart} />
            <TimeSelect label="End" value={end} onChange={setEnd} />
            <LocationControls onDetect={setUserLoc} />
            <button
              className="btn-primary"
              onClick={async()=>{
                const res = await fetch('/api/refresh',{method:'POST'});
                const data = await res.json();
                if(data.success){ alert('✅ Events refreshed'); location.reload(); }
                else{ alert('❌ Refresh failed'); console.error(data.error); }
              }}
            >
              🔄 Refresh Events
            </button>
          </div>
        </div>
      </div>

      {/* Space below sticky header */}
      <div style={{height: 96}} />

      {/* Columns */}
      <div className="grid">
        <Section title="🍽️ Food provided">
          {food.length ? food.map(e => <EventCard key={e.id} e={e} />)
                       : <Empty />}
        </Section>

        <Section title="🚫 No food mentioned">
          {noFood.length ? noFood.map(e => <EventCard key={e.id} e={e} />)
                         : <Empty />}
        </Section>
      </div>
    </main>
  );
}

function TimeSelect({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}) {
  const options = Array.from({length:96},(_,i)=>{
    const hh = String(Math.floor(i/4)).padStart(2,'0');
    const mm = String((i%4)*15).padStart(2,'0');
    return `${hh}:${mm}`;
  });
  return (
    <div style={{display:'flex', flexDirection:'column', gap:4}}>
      <label>{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)}>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function LocationControls({onDetect}:{onDetect:(loc:{lat:number;lng:number})=>void}) {
  const detect = () =>
    navigator.geolocation?.getCurrentPosition(pos =>
      onDetect({lat:pos.coords.latitude, lng:pos.coords.longitude})
    );
  return (
    <div style={{display:'flex', flexDirection:'column', gap:4}}>
      <label>Location (optional)</label>
      <button className="btn-secondary" onClick={detect}>📍 Use my location</button>
    </div>
  );
}

function Section({title, children}:{title:string; children:any}) {
  return (
    <section>
      <div className="section-title">
        <span className="section-rule" />
        <span>{title}</span>
      </div>
      <div style={{display:'grid', gap:'1rem'}}>{children}</div>
    </section>
  );
}

function Empty() {
  return <p className="subtle italic">No events match your filters.</p>;
}

function EventCard({ e }: { e:any }) {
  const [showForm, setShowForm] = useState(false);
  const [auditor, setAuditor] = useState('');
  const [foodVerified, setFoodVerified] = useState<boolean|null>(null);
  const [notes, setNotes] = useState('');

  // status chips
  const now = new Date();
  const start = new Date(e.startsAt);
  const end = new Date(e.endsAt);
  const diffStart = (start.getTime() - now.getTime())/60000;
  const diffEnd = (end.getTime() - now.getTime())/60000;

  let statusClass = '';
  let statusText: string | null = null;
  if (diffStart <= 10 && diffStart > 0){ statusText = 'Starting soon'; statusClass='badge badge-start'; }
  else if (diffStart <= 0 && diffEnd > 10){ statusText = 'In progress'; statusClass='badge badge-live'; }
  else if (diffEnd <= 10 && diffEnd > 0){ statusText = 'Ending soon'; statusClass='badge badge-end'; }

  const submit = (ev:React.FormEvent) => {
    ev.preventDefault();
    console.log({event:e.title, club:e.clubName, auditor, foodVerified, notes});
    alert(`✅ Audit recorded for ${e.title}`);
    setShowForm(false); setAuditor(''); setFoodVerified(null); setNotes('');
  };

  return (
    <>
      <div className="card">
        <div className="card-head">
          <div style={{fontWeight:600, fontSize:'1.05rem'}}>{e.title}</div>
          <div style={{display:'flex', gap:8}}>
            {statusText && <span className={statusClass}>{statusText}</span>}
            {e.hasFood && <span className="badge badge-food">Food</span>}
          </div>
        </div>

        <div className="subtle" style={{marginTop:4}}>
          {e.clubName} • {e.venueName || 'Location TBD'}
        </div>

        <div style={{marginTop:6}}>
          <a className="link" href={e.sourceUrl} target="_blank">View on Engage</a>
        </div>

        <div style={{marginTop:10}}>
          <button className="btn-secondary" onClick={()=>setShowForm(true)}>Claim Audit</button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={submit}
                className="bg-[color:var(--card-bg)] rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl border border-[color:var(--border)]">
            <h3 className="text-lg font-semibold">Claim Audit – {e.title}</h3>

            <div>
              <label>Your Name / GT Email</label>
              <input value={auditor} onChange={ev=>setAuditor(ev.target.value)} required placeholder="buzz@gatech.edu"/>
            </div>

            <div>
              <label>Was food provided?</label>
              <div style={{display:'flex', gap:12, marginTop:6}}>
                <label><input type="radio" name="food" checked={foodVerified===true} onChange={()=>setFoodVerified(true)} /> Yes</label>
                <label><input type="radio" name="food" checked={foodVerified===false} onChange={()=>setFoodVerified(false)} /> No</label>
              </div>
            </div>

            <div>
              <label>Notes</label>
              <textarea rows={3} value={notes} onChange={ev=>setNotes(ev.target.value)} />
            </div>

            <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
              <button type="button" className="btn-secondary" onClick={()=>setShowForm(false)}>Cancel</button>
              <button className="btn-primary" type="submit">Submit</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
