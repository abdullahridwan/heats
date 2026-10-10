import Link from 'next/link'
import { Medal, Stamp } from '@/components/art'
import { Countdown } from '@/components/countdown'
import { getHeats, serverNow } from '@/lib/data'
import { heatNo } from '@/lib/time'

export const revalidate = 30

// The homepage is the race. It does one job per phase: RSVP before, RSVP or submit on race day, results after.
export default async function Home() {
  const heat = (await getHeats())[0]
  const now = await serverNow()
  const opens = heat ? new Date(heat.opens_at).getTime() : 0
  const closes = heat ? new Date(heat.closes_at).getTime() : 0
  const open = now >= opens && now <= closes
  const over = now > closes
  const luma = process.env.NEXT_PUBLIC_LUMA_URL
  const lumaEventId = process.env.NEXT_PUBLIC_LUMA_EVENT_ID
  const showEmbed = Boolean(lumaEventId) && !over
  const n = heat ? heatNo(heat.number) : '001'

  return (
    <main className="wrap">
      <header className="lp-hero">
        <div className="lp-copy">
          <span className="lp-kicker">
            <span className={open ? 'dot live' : 'dot'} />
            Heat {n} · {open ? 'Happening today' : over ? 'Ran Sat Oct 10' : 'Sat Oct 10'} · Engineers&apos; Gate
          </span>
          <h1 className="lp-h1">Chilly Central Park&nbsp;5K</h1>
          {over ? (
            <p className="lp-sub">Heat {n} is done. Thanks to everyone who ran it. Heat 002 is on its way.</p>
          ) : (
            <p className="lp-sub">
              Run 5K from Engineers&apos; Gate any time {open ? 'today' : 'on Saturday'}, at your own pace. Post your Strava
              screenshot by 11:59&nbsp;PM and get the stamp. Free.
            </p>
          )}
          <div className="lp-ctas">
            {over ? (
              <Link className="btn volt lg" href="/results">See the results</Link>
            ) : open ? (
              <>
                <Link className="btn volt lg" href="/post">Submit my run</Link>
                {showEmbed && <a className="btn ghost lg" href="#rsvp">Not signed up yet?</a>}
              </>
            ) : (
              <a className="btn volt lg" href={showEmbed ? '#rsvp' : luma ?? '#'}>RSVP</a>
            )}
          </div>
          {heat && !over && (
            <p className="lp-fine">
              {open ? <>Submissions close in <Countdown iso={heat.closes_at} format="clock" /></>
                : <>Race day starts in <Countdown iso={heat.opens_at} format="clock" /></>}
              {' · '}<Link className="lp-inline" href="/about">How it works</Link>
            </p>
          )}
        </div>
        <div className="lp-art" aria-label={`The Heat ${n} stamp and the Founding Runner medal`}>
          {heat && <Stamp heat={heat} salt="lp" className="lp-stamp" />}
          <Medal kind="founding" salt="lp" className="lp-medal" />
        </div>
      </header>

      {showEmbed && (
        <section className="lp-sec" id="rsvp">
          <div className="lp-split">
            <div className="lp-head">
              <span className="eyebrow">RSVP</span>
              <h2>{open ? 'Still time to run today.' : 'Save your spot.'}</h2>
              <p>
                {open
                  ? "RSVP in ten seconds, head to Engineers' Gate (5th Ave & E 90th St) and run 5K before midnight. Then come back and submit your run."
                  : "Free, and no Heats account needed yet. Run any time on Saturday, then come back and submit your run."}
              </p>
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

      <section className="lp-close">
        <h2>{over ? 'Heat 002 is coming.' : 'Ran it? Get your stamp.'}</h2>
        {over
          ? <Link className="btn volt lg" href="/results">See the results</Link>
          : <Link className="btn volt lg" href="/post">Submit my run</Link>}
      </section>
    </main>
  )
}
