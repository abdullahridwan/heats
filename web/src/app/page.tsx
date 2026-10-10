import Link from 'next/link'
import { Stamp } from '@/components/art'
import { getHeats, serverNow } from '@/lib/data'
import { heatNo } from '@/lib/time'

export const revalidate = 30

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
)
const CAL = 'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z'
const PIN = 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'
const RUN = 'M13 4a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0M9 21l2.5-5.5L14 17v4M7 12l3-4 4 1 2 3 3 1M11.5 15.5 10 8'

// The homepage is the race: an event card with the one action that matters now, and the Luma RSVP beside it.
export default async function Home() {
  const heat = (await getHeats())[0]
  const now = await serverNow()
  const open = heat ? now >= new Date(heat.opens_at).getTime() && now <= new Date(heat.closes_at).getTime() : false
  const over = heat ? now > new Date(heat.closes_at).getTime() : false
  const luma = process.env.NEXT_PUBLIC_LUMA_URL
  const lumaEventId = process.env.NEXT_PUBLIC_LUMA_EVENT_ID
  const showEmbed = Boolean(lumaEventId) && !over
  const n = heat ? heatNo(heat.number) : '001'

  return (
    <main className="wrap">
      <section className={showEmbed ? 'race' : 'race solo'}>
        <article className="race-card">
          <div className="race-top">
            <span className={over ? 'race-tag' : 'race-tag on'}>
              {open ? <><i />Live today</> : over ? 'Finished' : `Heat ${n}`}
            </span>
            {heat && <Stamp heat={heat} salt="hero" className="race-stamp" />}
          </div>
          <h1>Chilly Central Park 5K</h1>
          <ul className="race-facts">
            <li><Icon d={CAL} /><span><b>{open ? 'Today' : 'Saturday'}, October 10</b>Any time, 12:00 AM to 11:59 PM</span></li>
            <li><Icon d={PIN} /><span><b>Engineers&apos; Gate, Central Park</b>5th Ave &amp; E 90th St</span></li>
            <li><Icon d={RUN} /><span><b>Free · 5K · every pace</b>Run it on Strava, get the stamp</span></li>
          </ul>
          <div className="race-cta">
            {over ? (
              <Link className="btn volt lg" href="/results">See the results</Link>
            ) : open ? (
              <>
                <p>Already ran it?</p>
                <Link className="btn volt lg" href="/post">Submit my run</Link>
              </>
            ) : (
              <a className="btn volt lg" href={showEmbed ? '#rsvp' : luma ?? '#'}>RSVP</a>
            )}
          </div>
        </article>

        {showEmbed && (
          <div className="race-rsvp" id="rsvp">
            <div className="race-rsvp-head">
              <h2>{open ? "Haven't signed up? There's still time." : 'Save your spot.'}</h2>
              {luma && <a href={luma} target="_blank" rel="noopener noreferrer">Open on Luma ↗</a>}
            </div>
            <iframe
              src={`https://luma.com/embed/event/${lumaEventId}/simple`}
              title="Register for Chilly Central Park 5K on Luma"
              width="600"
              height="640"
              allow="fullscreen"
              style={{ border: 0 }}
            />
          </div>
        )}
      </section>

      <section className="lp-close">
        <h2>{over ? 'Heat 002 is coming.' : 'Ran it? Get your stamp.'}</h2>
        {over
          ? <Link className="btn volt lg" href="/results">See the results</Link>
          : <Link className="btn volt lg" href="/post">Submit my run</Link>}
        <Link className="lp-inline" href="/about">How Heats works</Link>
      </section>
    </main>
  )
}
