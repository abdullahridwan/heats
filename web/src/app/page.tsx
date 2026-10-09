import Link from 'next/link'
import { Medal, Stamp } from '@/components/art'
import { Countdown } from '@/components/countdown'
import { HeroPlayer, StepPlayer } from '@/components/remotion/players'
import { getHeats, getResults, serverNow } from '@/lib/data'
import { heatNo } from '@/lib/time'

export const revalidate = 30

const STEPS = [
  { scene: 'run', title: 'Run 5K in Central Park', body: 'Any route, any time on race day. Track it on Strava.' },
  { scene: 'post', title: 'Post your screenshot', body: 'Upload the Strava share card. We read your distance, time and location.' },
  { scene: 'stamp', title: 'Get stamped', body: "The heat's stamp lands in your run passport, and you're on the heat sheet." },
] as const

export default async function Home() {
  const heat = (await getHeats())[0]
  const results = heat ? await getResults(heat.id) : []
  const now = await serverNow()
  const opens = heat ? new Date(heat.opens_at).getTime() : 0
  const closes = heat ? new Date(heat.closes_at).getTime() : 0
  const open = now >= opens && now <= closes
  const over = now > closes
  const luma = process.env.NEXT_PUBLIC_LUMA_URL

  // One primary action, depending on where we are in the race.
  const cta = open ? { href: '/post', label: 'Post your time' }
    : over ? { href: '/results', label: 'See the results' }
    : luma ? { href: luma, label: 'RSVP on Luma' }
    : { href: '/post', label: 'Run Heat 001' }
  const n = heat ? heatNo(heat.number) : '001'

  return (
    <main className="wrap">
      <header className="lp-hero">
        <div className="lp-copy">
          <span className="lp-kicker"><span className="dot" />Heat {n} · Sat Oct 10 · Central Park</span>
          <h1 className="lp-h1">Free 5Ks across New York. Run it, get&nbsp;stamped.</h1>
          <p className="lp-sub">Run 5K anywhere in Central Park, any time on race day. Post your Strava screenshot and we stamp your run passport.</p>
          <div className="lp-ctas">
            <Link className="btn volt lg" href={cta.href}>{cta.label}</Link>
            <a className="btn ghost lg" href="#how">How it works</a>
          </div>
          {heat && (
            <p className="lp-fine">
              Free · every pace ·{' '}
              {open ? <>posting closes in <Countdown iso={heat.closes_at} format="clock" /></>
                : over ? <>{results.length} {results.length === 1 ? 'runner' : 'runners'} stamped</>
                : <>opens in <Countdown iso={heat.opens_at} format="clock" /></>}
            </p>
          )}
        </div>
        <div className="lp-video"><HeroPlayer /></div>
      </header>

      <section className="lp-sec" id="how">
        <div className="lp-head" data-reveal="">
          <span className="eyebrow">How it works</span>
          <h2>Three steps. That&apos;s the whole thing.</h2>
        </div>
        <div className="lp-steps" data-reveal="">
          {STEPS.map((s, i) => (
            <article className="lp-step" key={s.scene}>
              <div className="lp-clip"><StepPlayer scene={s.scene} /></div>
              <div className="lp-step-txt">
                <span className="lp-n">0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-sec">
        <div className="lp-split" data-reveal="">
          <div className="lp-head">
            <span className="eyebrow">The stamp</span>
            <h2>Only the people who run it get it.</h2>
            <p>Every heat has its own stamp. Run Heat {n} and you also get the Founding Runner medal, which will never be given out again.</p>
          </div>
          <div className="lp-art" aria-label="The Heat 001 stamp and the Founding Runner medal">
            {heat && <Stamp heat={heat} salt="lp" className="lp-stamp" />}
            <Medal kind="founding" salt="lp" className="lp-medal" />
          </div>
        </div>
      </section>

      <section className="lp-final">
        <h2>{over ? 'Heat 002 is coming.' : 'See you in Central Park.'}</h2>
        <p>{over ? 'Thanks for running Heat 001. The next one is on its way.' : 'Saturday, October 10. Free, every pace, any time of day.'}</p>
        <Link className="btn volt lg" href={cta.href}>{cta.label}</Link>
      </section>
    </main>
  )
}
