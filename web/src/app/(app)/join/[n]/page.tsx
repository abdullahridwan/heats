import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getRunner } from '@/lib/session'
import { getHeat, getSignedUpHeatIds, heatState } from '@/lib/data'
import { heatNo } from '@/lib/time'
import { JoinFlow } from './join-flow'
import styles from './page.module.css'

export const metadata = { title: 'Join a heat' }

export default async function JoinPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params
  const number = Number(n)
  if (!Number.isInteger(number) || number < 1) notFound()

  const heat = await getHeat(number)
  if (!heat) notFound()

  if (heatState(heat) === 'past') {
    return (
      <main className={styles.page}>
        <nav className={styles.top} aria-label="Heat">
          <Link href="/calendar" className={styles.back} aria-label="Back to calendar">
            <BackIcon />
          </Link>
          <span className={styles.mono}>Heat {heatNo(heat.number)} / {heat.park}</span>
        </nav>
        <div className={styles.over}>
          <h1 className={styles.disp}>This heat is over.</h1>
          <Link href={`/results/${heat.number}`} className={styles.btn}>See the results</Link>
        </div>
      </main>
    )
  }

  const runner = await getRunner()
  const signedUp = runner ? (await getSignedUpHeatIds(runner.id)).includes(heat.id) : false
  const mode = !runner ? 'onboard' : signedUp ? 'joined' : 'confirm'

  return <JoinFlow heat={heat} mode={mode} />
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  )
}
