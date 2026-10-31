import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Stamp } from '@/components/stamp'
import { getRunnerByAlias, getStampCase } from '@/lib/data'
import { getRunner } from '@/lib/session'
import { day, formatTime, heatNo, mon, shortDate } from '@/lib/time'
import { ShareButton } from './share-button'
import { SignOutButton } from './sign-out-button'
import styles from './page.module.css'

type Props = { params: Promise<{ alias: string }> }

// Small alternating tilts so the stamps look hand-placed, not gridded.
const TILTS = [-3, 2, -2, 3, -1, 1]

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { alias } = await params
  return { title: `@${alias}'s stamp case` }
}

export default async function StampCase({ params }: Props) {
  const { alias: raw } = await params
  const runner = await getRunnerByAlias(raw.toLowerCase())
  if (!runner) notFound()

  const [{ stamps, heats }, viewer] = await Promise.all([getStampCase(runner.id), getRunner()])
  const byHeat = new Map(stamps.map(s => [s.heat.id, s] as const))
  const parks = new Set(stamps.map(s => s.heat.park)).size
  const isOwner = viewer?.id === runner.id
  const stampLabel = `${stamps.length} ${stamps.length === 1 ? 'stamp' : 'stamps'}`
  const parkLabel = `${parks} ${parks === 1 ? 'park' : 'parks'}`

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>Stamp case</h1>
        <p className={styles.sub}>@{runner.alias} / {stampLabel} / {parkLabel}</p>
      </header>

      <section aria-label="Stamps" className={styles.grid}>
        {heats.map((h, i) => {
          const s = byHeat.get(h.id)
          const no = heatNo(h.number)
          if (s) {
            return (
              <div key={h.id} className={styles.cell}>
                <Stamp
                  scene={h.scene}
                  heatNo={no}
                  postmark={`${mon(h.opens_at)} ${day(h.opens_at)}`}
                  width={78}
                  tilt={TILTS[i % TILTS.length] ?? 0}
                />
                <p className={styles.cellMeta}>{formatTime(s.time_s)}</p>
              </div>
            )
          }
          return (
            <div key={h.id} className={`${styles.cell} ${styles.muted}`}>
              <Stamp scene={h.scene} heatNo={no} width={78} tilt={TILTS[i % TILTS.length] ?? 0} className={styles.missed} />
              <p className={styles.cellMeta}>{shortDate(h.opens_at)}</p>
            </div>
          )
        })}
      </section>

      <footer className={styles.footer}>
        <ShareButton alias={runner.alias} title={`@${runner.alias}'s stamp case`} />
        <p className={styles.url}>heats.run/p/{runner.alias}</p>
        {isOwner && <SignOutButton />}
      </footer>
    </main>
  )
}
