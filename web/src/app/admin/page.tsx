import { notFound } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { reviewResult, setHeatStatus } from '@/app/actions'
import { hasDb } from '@/lib/supabase/server'
import { isAdmin, supabaseAdmin } from '@/lib/supabase/admin'
import { clock, formatTime, heatNo, shortDate } from '@/lib/time'

export const metadata = { title: 'Review', robots: { index: false } }

type Pending = {
  id: string; time_seconds: number; note: string | null; screenshot_path: string; created_at: string
  profiles: { alias: string }; heats: { number: number; name: string; starts_at: string; distance_km: number }
}

export default async function Admin() {
  const { userId } = await auth()
  if (!isAdmin(userId)) notFound()
  if (!hasDb) return <main className="wrap"><section className="s first"><div className="notice">Connect Supabase to review results.</div></section></main>

  const db = supabaseAdmin()
  const [{ data: pending }, { data: heats }] = await Promise.all([
    db.from('results').select('id, time_seconds, note, screenshot_path, created_at, profiles(alias), heats(number, name, starts_at, distance_km)').eq('status', 'pending').order('created_at'),
    db.from('heats').select('id, number, name, status, starts_at').order('number'),
  ])
  const rows = (pending ?? []) as unknown as Pending[]
  const { data: signed } = rows.length ? await db.storage.from('proofs').createSignedUrls(rows.map(r => r.screenshot_path), 3600) : { data: [] }

  return (
    <main className="wrap">
      <section className="s first">
        <div className="head"><span className="eyebrow">Admin</span><h2>{rows.length ? `${rows.length} to review` : 'All caught up'}</h2>
          <p>Check four things: the date is race day, the start is within about 15 minutes of the gun, the distance is at least 4.9 km, and the time is within 5 seconds of what they entered.</p></div>
        <div className="queue">
          {rows.map((r, i) => (
            <div className="review" key={r.id}>
              <a href={signed?.[i]?.signedUrl ?? '#'} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={signed?.[i]?.signedUrl ?? ''} alt={`Screenshot from ${r.profiles.alias}`} />
              </a>
              <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
                <div><b style={{ fontSize: 18 }}>{r.profiles.alias}</b> <span className="muted">· Heat {heatNo(r.heats.number)} · {r.heats.name}</span></div>
                <div className="mono" style={{ fontSize: 34, letterSpacing: '-.03em' }}>{formatTime(r.time_seconds)}</div>
                <div className="muted" style={{ fontSize: 14 }}>Gun: {shortDate(r.heats.starts_at)}, {clock(r.heats.starts_at)} · Distance: {Number(r.heats.distance_km).toFixed(1)} km{r.note ? ` · “${r.note}”` : ''}</div>
                <div className="row-actions">
                  <form action={reviewResult}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="decision" value="verify" /><button className="btn volt sm" type="submit">Approve and stamp</button></form>
                  <form action={reviewResult} className="row-actions"><input type="hidden" name="id" value={r.id} /><input type="hidden" name="decision" value="reject" />
                    <input className="input" name="reason" placeholder="Reason, e.g. distance is 3.2 km" style={{ width: 260, padding: '8px 12px', fontSize: 14 }} aria-label="Reason for rejecting" />
                    <button className="btn ghost sm" type="submit">Reject</button></form>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="s">
        <h3>Heats</h3>
        <div className="sheet">
          {(heats ?? []).map(h => (
            <form key={h.id} action={setHeatStatus} className="rowr" style={{ gridTemplateColumns: '60px minmax(0,1fr) 160px auto' }}>
              <span className="pl first">{heatNo(h.number)}</span>
              <span className="who"><span className="nm">{h.name}</span><span className="cm">{shortDate(h.starts_at)}</span></span>
              <input type="hidden" name="id" value={h.id} />
              <select className="input" name="status" defaultValue={h.status} style={{ padding: '8px 10px', fontSize: 14 }} aria-label={`Status for heat ${h.number}`}>
                {['draft', 'open', 'results', 'closed'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button className="btn ghost sm" type="submit">Save</button>
            </form>
          ))}
        </div>
      </section>
    </main>
  )
}
