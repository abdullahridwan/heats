import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getHeat, getResults } from '@/lib/data'
import { formatTime, heatNo, shortDate } from '@/lib/time'
import styles from './page.module.css'

export const revalidate = 30

type Props = { params: Promise<{ n: string }> }

function parseHeatNumber(raw: string): number | null {
  return /^\d+$/.test(raw) ? Number(raw) : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { n } = await params
  const number = parseHeatNumber(n)
  const heat = number === null ? null : await getHeat(number)
  return { title: heat ? `Heat ${heatNo(heat.number)} results` : 'Results' }
}

export default async function HeatResults({ params }: Props) {
  const { n } = await params
  const number = parseHeatNumber(n)
  const heat = number === null ? null : await getHeat(number)
  if (!heat) notFound()
  // Top 10 keeps the sheet on one phone screen.
  const rows = (await getResults(heat.id)).slice(0, 10)

  return (
    <main className={styles.page}>
      <Link href="/calendar" aria-label="Back to calendar" className={styles.back}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </Link>

      <header className={styles.head}>
        <h1 className={styles.title}>Heat {heatNo(heat.number)}</h1>
        <p className={styles.meta}>{heat.park} / {shortDate(heat.opens_at)}</p>
      </header>

      {rows.length === 0 ? (
        <p className={styles.empty}>No finishers yet.</p>
      ) : (
        <ol className={styles.list}>
          {rows.map(r => {
            const podium = r.place <= 3
            const tone = r.place === 1 ? styles.first : r.place <= 3 ? styles.runnerUp : ''
            return (
              <li key={r.alias} className={`${styles.row} ${podium ? styles.podium : ''} ${tone}`}>
                <span className={styles.place}>{r.place}</span>
                <Link href={`/p/${r.alias}`} className={styles.alias}>@{r.alias}</Link>
                <span className={styles.time}>{formatTime(r.time_s)}</span>
              </li>
            )
          })}
        </ol>
      )}
    </main>
  )
}
