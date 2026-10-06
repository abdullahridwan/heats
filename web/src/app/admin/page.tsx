import { notFound } from 'next/navigation'
import { isAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { signedProofUrl } from '@/lib/db'
import { formatTime, heatNo, longDate } from '@/lib/time'
import { DecisionForms } from './decision-forms'

export const metadata = { title: 'Review', robots: { index: false } }

type Row = {
  id: string
  alias: string | null
  heat_no: string
  heat_name: string
  opens_at: string
  image_url: string | null
  time_s: number | null
  distance_km: number | null
  pace_s_per_km: number | null
  note: string | null
  status: string
  review_reason: string | null
  attempts: number
  created_at: string
  is_strava: boolean | null
  location_ok: boolean | null
}

export default async function Admin() {
  if (!(await isAdmin())) notFound()

  const { data: pending } = await db()
    .from('submissions')
    .select('id, user_id, image_path, time_s, distance_km, pace_s_per_km, note, status, review_reason, attempts, created_at, is_strava, location_ok, users(alias), heats(number, name, opens_at)')
    .in('status', ['needs_review'])
    .order('created_at')

  const rows: Row[] = await Promise.all((pending ?? []).map(async r => {
    const heat = r.heats as unknown as { number: number; name: string; opens_at: string } | null
    const user = r.users as unknown as { alias: string } | null
    return {
      id: r.id as string,
      alias: user?.alias ?? null,
      heat_no: heatNo(heat?.number ?? 0),
      heat_name: heat?.name ?? '',
      opens_at: heat?.opens_at ?? '',
      image_url: await signedProofUrl(r.image_path as string),
      time_s: r.time_s as number | null,
      distance_km: r.distance_km as number | null,
      pace_s_per_km: r.pace_s_per_km as number | null,
      note: r.note as string | null,
      status: r.status as string,
      review_reason: r.review_reason as string | null,
      attempts: r.attempts as number,
      created_at: r.created_at as string,
      is_strava: r.is_strava as boolean | null,
      location_ok: r.location_ok as boolean | null,
    }
  }))

  return (
    <main className="wrap">
      <section className="s first">
        <div className="head">
          <span className="eyebrow">Admin</span>
          <h2>{rows.length ? `${rows.length} to review` : 'All caught up'}</h2>
          <p>Each row shows why it was held. Check the card against the reason, then stamp or reject.</p>
        </div>
        <div className="queue">
          {rows.length === 0 && <div className="notice">Nothing waiting. New submissions land here automatically.</div>}
          {rows.map(r => (
            <div className="review" key={r.id}>
              <a href={r.image_url ?? '#'} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.image_url ?? ''} alt={`Screenshot from ${r.alias ?? 'runner'}`} />
              </a>
              <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
                <div><b style={{ fontSize: 18 }}>{r.alias ?? 'unknown'}</b> <span className="muted">· Heat {r.heat_no} · {r.heat_name}</span></div>
                <div className="mono" style={{ fontSize: 34, letterSpacing: '-.03em' }}>{r.time_s ? formatTime(r.time_s) : '—'}</div>
                <div className="muted" style={{ fontSize: 14 }}>
                  {r.distance_km !== null ? `${Number(r.distance_km).toFixed(2)} km` : 'distance ?'}
                  {r.pace_s_per_km ? ` · ${formatTime(r.pace_s_per_km)}/km` : ''}
                  {r.note ? ` · “${r.note}”` : ''}
                </div>
                <div className="muted" style={{ fontSize: 13 }}>
                  Held: <b>{r.review_reason ?? '—'}</b> · strava {String(r.is_strava)} · location {String(r.location_ok)} · attempt {r.attempts} · uploaded {new Date(r.created_at).toLocaleString('en-US')}
                </div>
                <div className="muted" style={{ fontSize: 13 }}>Heat window opens {longDate(r.opens_at)}</div>
                <DecisionForms id={r.id} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
