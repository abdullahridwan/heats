import { isAdmin } from '@/lib/admin'
import { getHeats } from '@/lib/data'
import { db, signedProofUrl } from '@/lib/db'
import { SCENES } from '@/lib/stamps'
import { clock, formatTime, heatNo, longDate, shortDate } from '@/lib/time'
import { DecisionForms } from './decision-forms'
import { HeatsEditor } from './heats-editor'
import { LoginForm, SignOutButton } from './login-form'
import styles from './page.module.css'

export const metadata = { title: 'Admin', robots: { index: false } }

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
  review_reason: string | null
  attempts: number
  created_at: string
  is_strava: boolean | null
  location_ok: boolean | null
}

export default async function Admin() {
  if (!(await isAdmin())) {
    return (
      <main className={styles.login}>
        <LoginForm />
      </main>
    )
  }

  const [{ data: pending }, heats] = await Promise.all([
    db()
      .from('submissions')
      .select('id, user_id, image_path, time_s, distance_km, pace_s_per_km, note, status, review_reason, attempts, created_at, is_strava, location_ok, users(alias), heats(number, name, opens_at)')
      .in('status', ['needs_review'])
      .order('created_at'),
    getHeats(),
  ])

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
      review_reason: r.review_reason as string | null,
      attempts: r.attempts as number,
      created_at: r.created_at as string,
      is_strava: r.is_strava as boolean | null,
      location_ok: r.location_ok as boolean | null,
    }
  }))

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.eyebrow}>Heats</p>
            <h1 className={styles.title}>Admin</h1>
          </div>
          <SignOutButton />
        </header>

        <section className={styles.section} aria-labelledby="queue-title">
          <h2 id="queue-title" className={styles.sectionTitle}>Review queue</h2>
          <p className={styles.muted}>
            {rows.length ? `${rows.length} to review. ` : ''}Each row shows why it was held. Check the card against the reason, then stamp or reject.
          </p>
          <div className={styles.queue}>
            {rows.length === 0 && <div className={styles.notice}>Nothing waiting. New submissions land here automatically.</div>}
            {rows.map(r => (
              <div className={styles.review} key={r.id}>
                <a href={r.image_url ?? '#'} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {r.image_url && <img src={r.image_url} alt={`Screenshot from ${r.alias ?? 'runner'}`} />}
                </a>
                <div className={styles.reviewBody}>
                  <div>
                    <span className={styles.alias}>{r.alias ?? 'unknown'}</span>{' '}
                    <span className={styles.meta}>· Heat {r.heat_no} · {r.heat_name}</span>
                  </div>
                  <div className={styles.time}>{r.time_s ? formatTime(r.time_s) : '-'}</div>
                  <div className={styles.meta}>
                    {r.distance_km !== null ? `${Number(r.distance_km).toFixed(2)} km` : 'distance ?'}
                    {r.pace_s_per_km ? ` · ${formatTime(r.pace_s_per_km)}/km` : ''}
                    {r.note ? ` · “${r.note}”` : ''}
                  </div>
                  <div className={styles.meta}>
                    Held: <b>{r.review_reason ?? '-'}</b> · strava {String(r.is_strava)} · location {String(r.location_ok)} · attempt {r.attempts} · uploaded {new Date(r.created_at).toLocaleString('en-US')}
                  </div>
                  <div className={styles.meta}>Heat window opens {longDate(r.opens_at)}</div>
                  <DecisionForms id={r.id} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="heats-title">
          <h2 id="heats-title" className={styles.sectionTitle}>Heats</h2>
          <p className={styles.muted}>Every heat runs Saturday 00:00 to Sunday 23:59, New York time. Saving an existing number updates that heat.</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">No.</th>
                  <th scope="col">Name</th>
                  <th scope="col">Park</th>
                  <th scope="col">Scene</th>
                  <th scope="col">Saturday</th>
                  <th scope="col">Window</th>
                </tr>
              </thead>
              <tbody>
                {heats.length === 0 && (
                  <tr><td colSpan={6}>No heats yet.</td></tr>
                )}
                {heats.map(h => (
                  <tr key={h.id}>
                    <td className={styles.mono}>{heatNo(h.number)}</td>
                    <td>{h.name}</td>
                    <td>{h.park}</td>
                    <td>{SCENES[h.scene as keyof typeof SCENES]?.name ?? h.scene}</td>
                    <td>{longDate(h.opens_at)}</td>
                    <td>{`${shortDate(h.opens_at)} ${clock(h.opens_at)} to ${shortDate(h.closes_at)} ${clock(h.closes_at)}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <HeatsEditor heats={heats} />
        </section>
      </div>
    </main>
  )
}
