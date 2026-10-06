import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { Medal, Stamp } from '@/components/art'
import { HeatTimeline } from '@/components/heat-timeline'
import { SignedInHome } from '@/components/signed-in-home'
import { Countdown } from '@/components/countdown'
import { HowItWorks } from '@/components/how-it-works'
import { MedalGrid, PassportBook } from '@/components/passport'
import { RacePreview } from '@/components/race-preview'
import { getGoing, getHeats, SAMPLE_FINISHES, SAMPLE_PROFILE } from '@/lib/data'
import { computeMedals } from '@/lib/medals'
import { park } from '@/lib/themes'
import { heatNo, isUpcoming } from '@/lib/time'

// Hero art: a fanned set of season stamps, independent of what's in the database
const HERO = [
  { number: 1, park: 'Central Park', starts_at: '2026-10-10T14:00:00Z', color_key: 'volt', stamp_shape: 'circle', left: '2%', top: '4%', width: '46%', rot: -10 },
  { number: 2, park: 'Prospect Park', starts_at: '2026-10-17T13:00:00Z', color_key: 'coral', stamp_shape: 'octagon', left: '44%', top: '0%', width: '44%', rot: 8 },
  { number: 3, park: 'Hudson River Greenway', starts_at: '2026-10-25T12:00:00Z', color_key: 'hudson', stamp_shape: 'rect', left: '4%', top: '50%', width: '48%', rot: 6 },
  { number: 5, park: "Randall's Island", starts_at: '2026-11-07T14:00:00Z', color_key: 'lilac', stamp_shape: 'oval', left: '38%', top: '46%', width: '40%', rot: -14 },
] as const

const SAMPLE = { ...SAMPLE_PROFILE, alias: 'you' }

export default async function Home() {
  const { userId } = await auth()
  if (userId) return <SignedInHome userId={userId} />

  const heats = await getHeats()
  const open = heats.filter(h => h.status === 'open')
  const next = open.find(h => isUpcoming(h.starts_at)) ?? open[0]
  const goingList = await Promise.all(heats.map(h => getGoing(h.id)))
  const going = Object.fromEntries(heats.map((h, i) => [h.id, goingList[i]]))
  const sampleMedals = computeMedals(SAMPLE_FINISHES)
  const nextAfterSample = heats.find(h => !SAMPLE_FINISHES.some(f => f.heat.number === h.number))

  return (
    <>
      <div className="ambient" aria-hidden="true"><i /><i /><i /><i /></div>
      <main className="wrap">
        <header className="hero">
          <div>
            <h1 className="wm" aria-label="Heats">Heats</h1>
            <p className="sub">Free community 5Ks across New York. Show up, run, get stamped.</p>
            <div className="hero-cta">
              {next && (
                <Link className="gun" href={`/h/${heatNo(next.number)}`}>
                  <span className="dot" style={{ background: park(next).b, boxShadow: `0 0 0 3px ${park(next).s}` }} />
                  Heat {heatNo(next.number)} gun in <b><Countdown iso={next.starts_at} format="clock" /></b>
                </Link>
              )}
            </div>
          </div>
          <div className="cluster" aria-label="Stamps and medals from Heats races">
            {HERO.map((h, i) => (
              <Stamp key={h.number} heat={h} salt="hero" style={{ left: h.left, top: h.top, width: h.width, ['--r' as string]: `${h.rot}deg`, ['--i' as string]: i }} />
            ))}
            <Medal kind="sun" salt="hero" className="pin" style={{ right: '0%', top: '22%', width: '30%', ['--r' as string]: '9deg', ['--i' as string]: 4 }} />
            <Medal kind="token" salt="hero" className="pin" style={{ right: '10%', top: '62%', width: '24%', ['--r' as string]: '-8deg', ['--i' as string]: 5 }} />
          </div>
        </header>

        <section className="s" id="calendar">
          <div className="head" data-reveal="">
            <span className="eyebrow">Fall season · New York</span>
            <h2>A different park every week. A different color every heat.</h2>
            <p>Each heat has its own color, which carries through its cover, race page, heat sheet, share card and stamp. Pick a Saturday and come run.</p>
          </div>
          <HeatTimeline heats={heats} going={going} />
        </section>

        <section className="s" id="race">
          <div className="head" data-reveal="">
            <span className="eyebrow">Race page</span>
            <h2>Every heat wears its park&apos;s color.</h2>
            <p>Tap a heat. Join it, watch the countdown to the gun, then find yourself on the heat sheet with a note next to your time.</p>
          </div>
          <RacePreview heats={heats} going={going} />
        </section>

        <section className="s" id="passport">
          <div className="head" data-reveal="">
            <span className="eyebrow">Run passport</span>
            <h2>Every finish gets a stamp.</h2>
            <p>Every runner gets a passport. Each verified finish adds that heat&apos;s stamp in its color, so your season fills the pages. Here&apos;s a sample passport after five heats.</p>
          </div>
          <PassportBook profile={SAMPLE} finishes={SAMPLE_FINISHES} medalsEarned={sampleMedals.filter(m => m.earned).length} nextHeat={nextAfterSample} salt="lp" />
        </section>

        <section className="s" id="medals">
          <div className="head" data-reveal="">
            <span className="eyebrow">Medals</span>
            <h2>Win medals for milestones.</h2>
            <p>Eight enamel pins, each its own object. A couple reward speed. Most reward showing up.</p>
          </div>
          <MedalGrid medals={sampleMedals} salt="lm" showcase />
          <div className="rules3" data-reveal="">
            <div className="panel"><span className="k">Stamp</span><h3>Every verified finish</h3><p>Every finish counts, at any pace. Each stamp is one heat in its color, dated, and never repeats.</p></div>
            <div className="panel"><span className="k">Medal</span><h3>Milestones and moments</h3><p>Your first heat, a PR, five heats, every borough. Finishing last earns one too.</p></div>
            <div className="panel"><span className="k">Share</span><h3>Built to be posted</h3><p>Every result gets a story card in the heat&apos;s color, so your friends know where the next one is.</p></div>
          </div>
        </section>

        {heats[0] && (
          <section className="s" id="how">
            <div className="head" data-reveal="">
              <span className="eyebrow">How it works</span>
              <h2>A real race, minus the overhead.</h2>
              <p>No bibs, no chip timing, no entry fee. Just a shared course, a start time and a heat sheet.</p>
            </div>
            <HowItWorks heat={heats[0]} />
          </section>
        )}

        <section className="s" id="community">
          <div className="head" data-reveal="">
            <span className="eyebrow">Community</span>
            <h2>Run with your city.</h2>
            <p>Heats is a running club without the club: no dues, no tryouts, no pace groups to keep up with. You show up at a park on Saturday and there&apos;s a crowd at the line.</p>
          </div>
          <div className="values" data-reveal="">
            <div className="value grain" style={{ background: 'radial-gradient(at 20% 0%, #E6FF6B, transparent 60%), radial-gradient(at 100% 100%, #CFF7E2, transparent 60%), #F8FDEB' }}><h3>Every pace</h3><p>No cutoff time, ever. Walk it if you want. Your stamp looks the same.</p></div>
            <div className="value grain" style={{ background: 'radial-gradient(at 80% 0%, #FFC9B8, transparent 60%), radial-gradient(at 0% 100%, #FFE3EF, transparent 60%), #FFF8F5' }}><h3>Last one in, loudest cheer</h3><p>Everyone waits at the line until the last runner finishes. That runner earns the Closer medal.</p></div>
            <div className="value grain" style={{ background: 'radial-gradient(at 20% 0%, #C8D8FF, transparent 60%), radial-gradient(at 100% 90%, #E4DEFF, transparent 60%), #F6F8FF' }}><h3>Coffee after</h3><p>Every heat ends at a local spot nearby. The race takes 25 minutes and the hang lasts an hour.</p></div>
          </div>
        </section>
      </main>
    </>
  )
}
