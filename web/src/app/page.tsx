import Link from 'next/link'
import { Medal, Stamp } from '@/components/art'
import { Countdown } from '@/components/countdown'
import { HeroPlayer, StepPlayer } from '@/components/remotion/players'
import { getHeats, getResults, serverNow } from '@/lib/data'
import { heatNo } from '@/lib/time'

export const revalidate = 30

const STEPS = [
  { scene: 'rsvp', title: 'RSVP on Luma', body: 'Free, takes ten seconds. You make your Heats account after the run, when you claim your stamp.' },
  { scene: 'run', title: "Start at Engineers' Gate", body: 'Run 5K in Central Park any time on race day. Track it on Strava.' },
  { scene: 'post', title: 'Post your screenshot', body: 'Upload the Strava share card. We read your distance, time and location.' },
  { scene: 'stamp', title: 'Get stamped', body: "The heat's stamp lands in your run passport, and you're on the heat sheet." },
] as const

// The main button. Luma is another site, so it opens in a new tab.
function CtaButton({ cta }: { cta: { href: string; label: string } }) {
  if (cta.href.startsWith('#')) return <a className="btn volt lg" href={cta.href}>{cta.label}</a>
  return cta.href.startsWith('http')
    ? <a className="btn volt lg" href={cta.href} target="_blank" rel="noopener noreferrer">{cta.label}</a>
    : <Link className="btn volt lg" href={cta.href}>{cta.label}</Link>
}

export default async function Home() {
  const heat = (await getHeats())[0]
  const results = heat ? await getResults(heat.id) : []
  const now = await serverNow()
  const opens = heat ? new Date(heat.opens_at).getTime() : 0
  const closes = heat ? new Date(heat.closes_at).getTime() : 0
  const open = now >= opens && now <= closes
  const over = now > closes
  const luma = process.env.NEXT_PUBLIC_LUMA_URL
  const lumaEventId = process.env.NEXT_PUBLIC_LUMA_EVENT_ID
  const showEmbed = Boolean(lumaEventId) && !over

  // One primary action, depending on where we are in the race.
  const cta = open ? { href: '/post', label: 'Submit my run' }
    : over ? { href: '/results', label: 'See the results' }
    : luma ? { href: luma, label: 'RSVP on Luma' }
    : { href: '/post', label: 'Run Heat 001' }
  // Before the race the hero button jumps to the RSVP box on this page instead of leaving the site.
  const heroCta = !open && !over && showEmbed ? { href: '#rsvp', label: 'RSVP on Luma' } : cta
  const n = heat ? heatNo(heat.number) : '001'

  return (
    <main className="wrap">
      <header className="lp-hero">
        <div className="lp-copy">
          <span className="lp-kicker"><span className="dot" />Heat {n} · Sat Oct 10 · Engineers&apos; Gate</span>
          <h1 className="lp-h1">Free 5Ks across New York. Run it, get&nbsp;stamped.</h1>
          <p className="lp-sub">Start at Engineers&apos; Gate in Central Park any time on race day and run 5K. Post your Strava screenshot and we stamp your run passport.</p>
          <div className="lp-ctas">
            <CtaButton cta={heroCta} />
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
          <h2>Four steps. That&apos;s the whole thing.</h2>
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

      {showEmbed && (
        <section className="lp-sec" id="rsvp">
          <div className="lp-split" data-reveal="">
            <div className="lp-head">
              <span className="eyebrow">RSVP</span>
              <h2>Save your spot.</h2>
              <p>Free, and no Heats account needed yet. RSVP on Luma, run any time on Saturday, then come back and submit your run.</p>
              {luma && <a className="lp-link" href={luma} target="_blank" rel="noopener noreferrer">Open on Luma ↗</a>}
            </div>
            <div className="lp-embed">
              <iframe
                src={`https://luma.com/embed/event/${lumaEventId}/simple`}
                title="Register for Chilly Central Park 5K on Luma"
                width="600"
                height="740"
                loading="lazy"
                allow="fullscreen"
                style={{ border: 0 }}
              />
            </div>
          </div>
        </section>
      )}

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
        <h2>{over ? 'Heat 002 is coming.' : "See you at Engineers' Gate."}</h2>
        <p>{over ? 'Thanks for running Heat 001. The next one is on its way.' : 'Saturday, October 10 · 5th Ave & E 90th St. Free, every pace, any time of day.'}</p>
        <CtaButton cta={cta} />
      </section>
    </main>
  )
}
