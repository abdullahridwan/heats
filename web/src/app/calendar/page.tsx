import Link from 'next/link'
import { getCalendar, getSignedUpHeatIds } from '@/lib/data'
import { getRunner } from '@/lib/session'
import { day, heatNo, mon, shortDate, weekday } from '@/lib/time'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Calendar' }

const dayName = (iso: string) => weekday(iso).slice(0, 3)

function DateTile({ iso }: { iso: string }) {
  return (
    <div className={styles.tile}>
      <span className={styles.tileMonth}>{mon(iso)}</span>
      <span className={styles.tileDay}>{day(iso)}</span>
    </div>
  )
}

export default async function Calendar() {
  const [runner, { live, upcoming, past }] = await Promise.all([getRunner(), getCalendar()])
  const joined = new Set<string>(runner ? await getSignedUpHeatIds(runner.id) : [])

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <h1 className={styles.title}>Calendar</h1>
        <svg width="30" height="30" viewBox="0 0 200 200" aria-hidden="true" className={styles.icon}>
          <g fill="none" stroke="currentColor" strokeWidth="14">
            <rect x="22" y="48" width="156" height="104" rx="52" />
            <rect x="46" y="72" width="108" height="56" rx="28" />
          </g>
        </svg>
      </header>

      {live && (
        <section aria-label="This weekend" className={styles.live}>
          <p className={styles.liveLabel}>
            <span className={styles.liveDot} aria-hidden="true" />
            LIVE NOW
          </p>
          <div>
            <h2 className={styles.liveTitle}>Heat {heatNo(live.number)}</h2>
            <p className={styles.liveMeta}>
              {live.park} / {dayName(live.opens_at)} {shortDate(live.opens_at)} to {dayName(live.closes_at)} {shortDate(live.closes_at)}
            </p>
          </div>
          <Link href="/post" className={styles.liveButton}>Submit your run</Link>
        </section>
      )}

      <section aria-labelledby="coming-up">
        <h2 id="coming-up" className={styles.label}>Coming up</h2>
        {upcoming.length === 0 ? (
          <p className={styles.empty}>More heats coming soon.</p>
        ) : (
          <ul className={styles.list}>
            {upcoming.map(h => (
              <li key={h.id} className={styles.row}>
                <DateTile iso={h.opens_at} />
                <div className={styles.info}>
                  <p className={styles.heatName}>Heat {heatNo(h.number)}</p>
                  <p className={styles.park}>{h.park}</p>
                </div>
                {joined.has(h.id) ? (
                  <span className={styles.badgeIn}>You&apos;re in</span>
                ) : (
                  <Link href={`/join/${h.number}`} className={styles.join}>Join</Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section aria-labelledby="past">
          <h2 id="past" className={styles.label}>Past</h2>
          <ul className={styles.list}>
            {past.map(h => (
              <li key={h.id} className={styles.row}>
                <DateTile iso={h.opens_at} />
                <div className={styles.info}>
                  <p className={styles.heatName}>Heat {heatNo(h.number)}</p>
                  <p className={styles.park}>{h.park}</p>
                </div>
                <Link
                  href={`/results/${h.number}`}
                  className={styles.outline}
                  aria-label={`Results for Heat ${heatNo(h.number)}`}
                >
                  Results
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
