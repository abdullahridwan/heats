import Link from 'next/link'
import { getCalendar, getSignedUpHeatIds } from '@/lib/data'
import { getRunner } from '@/lib/session'
import { heatNo, shortDate, weekday } from '@/lib/time'
import { Stamp } from '@/components/stamp'
import type { Heat } from '@/lib/types'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Calendar' }

const dayName = (iso: string) => weekday(iso).slice(0, 3)

// The heat's own stamp stands in for a date tile: small, tilted, a little preview of what you collect.
function MiniStamp({ heat, i }: { heat: Heat; i: number }) {
  return (
    <span className={styles.mini}>
      <Stamp scene={heat.scene} heatNo={heatNo(heat.number)} width={42} tilt={i % 2 ? 4 : -4} />
    </span>
  )
}

export default async function Calendar({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const [{ all }, runner, { live, upcoming: allUpcoming, past: allPast }] = await Promise.all([searchParams, getRunner(), getCalendar()])
  // One phone screen by default: the live heat, the next few, the latest result. ?all=1 shows the season.
  const showAll = all === '1'
  const upcoming = showAll ? allUpcoming : allUpcoming.slice(0, live ? 3 : 4)
  const past = showAll ? allPast : allPast.slice(0, 1)
  const hidden = allUpcoming.length - upcoming.length + allPast.length - past.length
  const joined = new Set<string>(runner ? await getSignedUpHeatIds(runner.id) : [])

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <h1 className={styles.title}>Calendar</h1>
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
            {upcoming.map((h, i) => (
              <li key={h.id} className={styles.row}>
                <MiniStamp heat={h} i={i} />
                <div className={styles.info}>
                  <p className={styles.heatName}>Heat {heatNo(h.number)} <span className={styles.when}>/ {dayName(h.opens_at)} {shortDate(h.opens_at)}</span></p>
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
            {past.map((h, i) => (
              <li key={h.id} className={styles.row}>
                <MiniStamp heat={h} i={i} />
                <div className={styles.info}>
                  <p className={styles.heatName}>Heat {heatNo(h.number)} <span className={styles.when}>/ {dayName(h.opens_at)} {shortDate(h.opens_at)}</span></p>
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

      {hidden > 0 && (
        <Link href="/calendar?all=1" className={styles.more}>See all {allUpcoming.length + allPast.length} heats</Link>
      )}
    </main>
  )
}
