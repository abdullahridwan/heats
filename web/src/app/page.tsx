import Link from 'next/link'
import { Stamp } from '@/components/art'
import { getHeats, serverNow } from '@/lib/data'

export const revalidate = 30

const FALLBACK = { number: 1, name: 'Chilly Central Park 5K', opens_at: '2026-10-10T04:00:00Z', closes_at: '2026-10-11T03:59:59Z', location_terms: ['Central Park'] }

export default async function Home() {
  const heat = (await getHeats())[0] ?? FALLBACK
  const now = await serverNow()
  const open = now >= new Date(heat.opens_at).getTime() && now <= new Date(heat.closes_at).getTime()
  const over = now > new Date(heat.closes_at).getTime()
  const luma = process.env.NEXT_PUBLIC_LUMA_URL
  const lumaEventId = process.env.NEXT_PUBLIC_LUMA_EVENT_ID
  const showEmbed = Boolean(lumaEventId) && !over

  return (
    <main className="wrap hm">
      <header className="hm-hero">
        <p className="hm-status">
          {open && <i aria-hidden="true" />}
          {heat.name} {over ? 'is finished' : open ? 'is live' : 'is on Saturday'}
        </p>
        <div className="hm-stage">
          <h1 className="hm-title wm">
            {over ? <>The race<br />is <mark>done.</mark></> : <>Free 5K in<br />Central Park.<br /><mark>{open ? 'Today.' : 'Saturday.'}</mark></>}
          </h1>
          <Stamp heat={heat} salt="hero" className="hm-stamp" />
        </div>
        <p className="hm-sub">
          {over
            ? 'Thanks to everyone who ran it. Your stamp is in your run passport.'
            : <>Start at Engineers&apos; Gate any time {open ? 'today' : 'on race day'}, at any pace. Post your Strava screenshot to get your stamp.</>}
        </p>
        <div className="hm-cta">
          {over ? <Link className="btn volt lg" href="/results">See the results</Link>
            : open ? <Link className="btn volt lg" href="/post">Ran it? Submit your run</Link>
            : <a className="btn volt lg" href="#rsvp">RSVP free</a>}
          <Link className="hm-link" href="/about">How it works</Link>
        </div>
      </header>

      {showEmbed && (
        <section className="hm-rsvp" id="rsvp" aria-labelledby="rsvp-t">
          <h2 id="rsvp-t">{open ? "Haven't signed up? There's still time." : 'Save your spot.'}</h2>
          <div className="hm-embed">
            <iframe
              src={`https://luma.com/embed/event/${lumaEventId}/simple`}
              title={`RSVP for ${heat.name} on Luma`}
              width="600"
              height="640"
              allow="fullscreen"
              style={{ border: 0 }}
            />
          </div>
          {luma && <a className="hm-link" href={luma} target="_blank" rel="noopener noreferrer">Embed not loading? Open on Luma</a>}
        </section>
      )}
    </main>
  )
}
