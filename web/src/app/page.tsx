import type { CSSProperties } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Stamp } from '@/components/stamp'
import { CasePlayer, JoinPlayer, SubmitPlayer } from '@/components/how/players'
import { Footer } from '@/components/site/footer'
import { LaneFrame } from '@/components/site/lane-frame'
import { Nav } from '@/components/site/nav'
import { getCalendar, getHeats } from '@/lib/data'
import { getRunner } from '@/lib/session'
import { heatNo } from '@/lib/time'
import styles from './page.module.css'

const FALLBACK_SCENES = ['central_fall', 'central_dusk', 'prospect', 'hudson', 'flushing', 'bbp']

async function seasonStamps(): Promise<{ scene: string; number: number }[]> {
  try {
    const heats = await getHeats()
    if (heats.length > 0) return heats.map(h => ({ scene: h.scene, number: h.number }))
  } catch {
    // No database yet: show the placeholder set.
  }
  return FALLBACK_SCENES.map((scene, i) => ({ scene, number: i + 1 }))
}

async function shell() {
  const [runner, calendar] = await Promise.all([getRunner().catch(() => null), getCalendar().catch(() => null)])
  return { runner, nextHeat: calendar ? (calendar.live ?? calendar.upcoming[0] ?? null) : null }
}

export default async function Home() {
  const [stamps, { runner, nextHeat }] = await Promise.all([seasonStamps(), shell()])
  // The landing page is for people who have not joined yet. Signed in, home is the calendar.
  if (runner) redirect('/calendar')
  const last = stamps.length - 1
  const mid = last / 2

  return (
    <LaneFrame footer={<Footer nextHeat={nextHeat} runner={runner} />}>
    <Nav runner={runner} />
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.h1}>
          Run New York.
          <br />
          <em>One stamp at a time.</em>
        </h1>
        <p className={styles.heroSub}>
          A free 5K every weekend, somewhere new in the city.
          <br />
          Run it any time Saturday or Sunday.
          <br />
          Post your Strava screenshot, and that park&apos;s stamp is yours.
        </p>
        <Link href="/calendar" className={styles.cta}>
          Join a heat, <span className={styles.ctaSerif}>it&apos;s free</span>
        </Link>
      </section>

      <section aria-label="The 2026 stamp set" className={styles.setSection}>
        <div className={styles.fan}>
          {stamps.map((s, i) => {
            const t = last === 0 ? 0 : (i - mid) / mid
            const style = {
              '--rot': `${(t * 14).toFixed(2)}deg`,
              '--dy': `${(Math.abs(t) * 32).toFixed(1)}px`,
              zIndex: stamps.length - Math.round(Math.abs(i - mid)),
            } as CSSProperties
            return (
              <div key={`${s.number}-${s.scene}`} className={styles.fanItem} style={style}>
                <Stamp scene={s.scene} heatNo={heatNo(s.number)} width={150} />
              </div>
            )
          })}
        </div>
        <p className={styles.caption}>The 2026 set. One stamp per heat, one heat every weekend.</p>
      </section>

      <section id="how" className={styles.how}>
        <div className={styles.howHead}>
          <span className={styles.pill}>How it works</span>
          <h2 className={styles.h2}>Every weekend, a new corner of the city</h2>
          <p className={styles.sub}>Three steps. Each heat happens somewhere different, and each one has its own stamp.</p>
        </div>

        <div className={styles.bentoTop}>
          <article className={styles.panel}>
            <div className={styles.panelHead}>
              <span className={styles.num}>1</span>
              <h3 className={styles.h3}>Sign up for a heat</h3>
            </div>
            <p className={styles.panelSub}>A new park every weekend. Join the ones you want.</p>
            <div className={styles.phone}>
              <div className={styles.notch} aria-hidden="true" />
              <div className={styles.screen}>
                <JoinPlayer />
              </div>
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHead}>
              <span className={styles.num}>2</span>
              <h3 className={styles.h3}>Submit your Strava</h3>
            </div>
            <p className={styles.panelSub}>Run 5K any time Saturday or Sunday, then post the screenshot.</p>
            <div className={styles.phone}>
              <div className={styles.notch} aria-hidden="true" />
              <div className={styles.screen}>
                <SubmitPlayer />
              </div>
            </div>
          </article>
        </div>

        <article className={`${styles.panel} ${styles.panelWide}`}>
          <div className={styles.panelHead}>
            <span className={styles.num}>3</span>
            <h3 className={styles.h3}>Get your stamp</h3>
          </div>
          <p className={styles.panelSub}>Postmarked with the date and the park. It lands in your stamp case for good.</p>
          <div className={styles.caseCard}>
            <div className={styles.caseHead}>
              <span className={styles.caseTitle}>Stamp case</span>
              <span className={styles.caseMeta}>@the_subway_surfer / 4 of 6</span>
            </div>
            <div className={styles.caseScroll}>
              <div className={styles.caseStage}>
                <CasePlayer />
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
    </LaneFrame>
  )
}
