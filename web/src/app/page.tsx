import Link from 'next/link'
import { Medal, Stamp } from '@/components/art'
import { getHeats, serverNow } from '@/lib/data'

export const revalidate = 30

const FALLBACK = { number: 1, name: 'Chilly Central Park 5K', opens_at: '2026-10-10T04:00:00Z', closes_at: '2026-10-11T03:59:59Z', location_terms: ['Central Park'] }

// One screen: what it is and the one action on the left, the Luma RSVP on the right.
export default async function Home() {
  const heat = (await getHeats())[0] ?? FALLBACK
  const now = await serverNow()
  const open = now >= new Date(heat.opens_at).getTime() && now <= new Date(heat.closes_at).getTime()
  const over = now > new Date(heat.closes_at).getTime()
  const luma = process.env.NEXT_PUBLIC_LUMA_URL
  const lumaEventId = process.env.NEXT_PUBLIC_LUMA_EVENT_ID
  const showEmbed = Boolean(lumaEventId) && !over

  return (
    <main className="wrap h-one">
      <div className="h-copy">
        <span className="h-live">
          {over ? <>{heat.name} · Finished</> : open ? <><i />{heat.name} · Live now</> : <>{heat.name} · Sat Oct 10</>}
        </span>
        <h1 className="h-title wm">
          {over ? <>The race<br />is <mark>done.</mark></> : <>Free 5K in<br />Central Park.<br /><mark>{open ? 'Today.' : 'Saturday.'}</mark></>}
        </h1>
        <p className="h-sub">
          {over
            ? 'Thanks to everyone who ran it. Your stamp is in your run passport.'
            : <>Start at Engineers&apos; Gate any time {open ? 'today' : 'on race day'}, at any pace. Post your Strava screenshot to get your stamp.</>}
        </p>
        <div className="h-ctas">
          {over ? <Link className="btn volt lg" href="/results">See the results</Link>
            : open ? <Link className="btn volt lg" href="/post">Ran it? Submit your run</Link>
            : <a className="btn volt lg" href="#rsvp">RSVP free</a>}
        </div>
        <div className="h-reward" aria-label="Finish and you get the stamp and the Founding Runner medal">
          <Stamp heat={heat} salt="hero" className="h-stamp" />
          <Medal kind="founding" salt="hero" className="h-medal" />
          <span>Finish and they&apos;re yours.<br /><Link className="lp-inline" href="/about">How it works</Link></span>
        </div>
      </div>

      {showEmbed ? (
        <div className="h-rsvp" id="rsvp">
          <p className="h-rsvp-t">{open ? "Haven't signed up? There's still time." : 'Save your spot.'}</p>
          <div className="h-embed">
            <iframe
              src={`https://luma.com/embed/event/${lumaEventId}/simple`}
              title={`RSVP for ${heat.name} on Luma`}
              width="600"
              height="640"
              allow="fullscreen"
              style={{ border: 0 }}
            />
          </div>
          {luma && <a className="h-luma" href={luma} target="_blank" rel="noopener noreferrer">Embed not loading? Open on Luma ↗</a>}
        </div>
      ) : null}
    </main>
  )
}
