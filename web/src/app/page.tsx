import Link from 'next/link'
import { Guilloche, Medal, Stamp } from '@/components/art'
import { ShareButton } from '@/components/share-button'
import { getHeats, serverNow } from '@/lib/data'
import { heatNo } from '@/lib/time'

export const revalidate = 30

const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://heats-two.vercel.app'

const FALLBACK = { number: 1, name: 'Chilly Central Park 5K', opens_at: '2026-10-10T04:00:00Z', closes_at: '2026-10-11T03:59:59Z', location_terms: ['Central Park'] }

export default async function Home() {
  const heat = (await getHeats())[0] ?? FALLBACK
  const now = await serverNow()
  const open = now >= new Date(heat.opens_at).getTime() && now <= new Date(heat.closes_at).getTime()
  const over = now > new Date(heat.closes_at).getTime()
  const luma = process.env.NEXT_PUBLIC_LUMA_URL
  const lumaEventId = process.env.NEXT_PUBLIC_LUMA_EVENT_ID
  const n = heatNo(heat.number)

  return (
    <main>
      {/* ── Hero: the brand, and the one thing to do today */}
      <section className="wrap h-hero">
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
              : <>Start at Engineers&apos; Gate any time {open ? 'today' : 'on race day'}, until 11:59&nbsp;PM, at any pace. Post your Strava screenshot and this stamp goes in your run passport.</>}
          </p>
          <div className="h-ctas">
            {over ? (
              <Link className="btn volt lg" href="/results">See the results</Link>
            ) : open ? (
              <>
                <a className="btn volt lg" href="#run">Haven&apos;t signed up? RSVP</a>
                <Link className="btn ink lg" href="/post">Ran it? Submit your run</Link>
              </>
            ) : (
              <a className="btn volt lg" href="#run">RSVP free</a>
            )}
          </div>
          <p className="h-fine">Free · Every pace · <Link className="lp-inline" href="/about">How it works</Link></p>
        </div>

        <div className="h-pp" aria-label={`A Heats run passport with the ${heat.name} stamp and the Founding Runner medal`} role="img">
          <div className="h-cover pcover">
            <Guilloche colors={['#CCFF00', '#7A9900']} cx={125} cy={175} />
            <div className="inner">
              <span className="l1">CITY OF NEW YORK</span>
              <svg width="56" height="56" viewBox="0 0 100 100" aria-hidden="true"><rect x="3" y="3" width="94" height="94" rx="24" fill="none" stroke="#CCFF00" strokeWidth="3" /><polygon points="32,22 46,22 38,78 24,78" fill="#CCFF00" /><polygon points="62,22 76,22 68,78 54,78" fill="#CCFF00" /><polygon points="37,43 67,43 65.4,55 35.4,55" fill="#CCFF00" /></svg>
              <span className="wm">Heats</span>
              <span className="l2">Run Passport</span>
            </div>
          </div>
          <div className="h-page">
            <Guilloche colors={['rgba(204,255,0,.55)', 'rgba(180,71,27,.16)']} cx={60} cy={80} />
            <div className="phdr"><span>STAMPS</span><span>FALL 2026 · P.1</span></div>
            <Stamp heat={heat} salt="hero" className="h-stamp" />
          </div>
          <Medal kind="founding" salt="hero" className="h-medal" />
        </div>
      </section>

      {/* ── Today's race + RSVP */}
      {!over && (
        <section className="h-sec h-run" id="run">
          <div className="wrap h-split">
            <div className="h-head">
              <span className="eyebrow">{open ? <><i className="h-dot" />Heat {n} · Happening now</> : `Heat ${n} · Saturday, October 10`}</span>
              <h2>{heat.name}</h2>
              <p>Start at Engineers&apos; Gate and run 5K any time {open ? 'today' : 'on race day'}, from 12:00 AM to 11:59 PM. Free, every pace. RSVP here, then go run.</p>
              <dl className="h-facts">
                <div><dt>Start</dt><dd>Engineers&apos; Gate · 5th Ave &amp; E 90th St</dd></div>
                <div><dt>When</dt><dd>{open ? 'Today' : 'Sat Oct 10'}, any time until 11:59 PM</dd></div>
                <div><dt>Distance</dt><dd>5K, tracked on Strava</dd></div>
                <div><dt>Cost</dt><dd>Free</dd></div>
              </dl>
              {luma && <a className="h-luma" href={luma} target="_blank" rel="noopener noreferrer">Embed not loading? Open on Luma ↗</a>}
              {open && (
                <div className="h-ran">
                  <span>Already ran it?</span>
                  <Link className="btn ink" href="/post">Submit my run</Link>
                </div>
              )}
            </div>
            {lumaEventId ? (
              <div className="h-embed">
                <iframe
                  src={`https://luma.com/embed/event/${lumaEventId}/simple`}
                  title={`RSVP for ${heat.name} on Luma`}
                  width="600"
                  height="620"
                  loading="lazy"
                  allow="fullscreen"
                  style={{ border: 0 }}
                />
              </div>
            ) : luma ? (
              <a className="btn volt lg" href={luma} target="_blank" rel="noopener noreferrer">RSVP on Luma</a>
            ) : null}
          </div>
        </section>
      )}

      {/* ── Closing CTA: bring someone */}
      <section className="wrap h-close">
        <h2 className="wm">{over ? <>Thanks for<br />running.</> : <>Run it with<br />a friend.</>}</h2>
        <p>{over ? 'See the results and your passport.' : 'Send them the link. Free, any pace, any time today.'}</p>
        <div className="h-ctas center">
          {over
            ? <Link className="btn volt lg" href="/results">See the results</Link>
            : <ShareButton url={site} title={`${heat.name} · Heats`} className="btn volt lg" />}
          {!over && <Link className="btn ghost lg" href="/post">Submit my run</Link>}
        </div>
      </section>
    </main>
  )
}
