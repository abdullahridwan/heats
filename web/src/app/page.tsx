import Link from 'next/link'
import { Guilloche, Medal, Stamp } from '@/components/art'
import { getHeats, serverNow } from '@/lib/data'
import { heatNo } from '@/lib/time'

export const revalidate = 30

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
          <a className="h-live" href={over ? '/results' : '#run'}>
            {over ? <>Heat {n} is done · See the results</>
              : open ? <><i />Live now · {heat.name} · until 11:59 PM</>
              : <>Heat {n} · {heat.name} · Sat Oct 10</>}
            <span aria-hidden="true">→</span>
          </a>
          <h1 className="h-title wm">Run New York.<br />Get <mark>stamped.</mark></h1>
          <p className="h-sub">Free 5Ks across the city, one park at a time. Run on race day, post your Strava screenshot, and the stamp goes in your run passport.</p>
          <div className="h-ctas">
            {over ? (
              <Link className="btn volt lg" href="/results">See the results</Link>
            ) : (
              <>
                <a className="btn volt lg" href="#run">{open ? 'Run it today' : 'RSVP free'}</a>
                {open && <Link className="btn ghost lg" href="/post">Submit my run</Link>}
              </>
            )}
          </div>
          <p className="h-fine">Free · Every pace · Any time on race day</p>
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
            <div className="h-slot a"><b>Heat 002</b>Coming soon</div>
            <div className="h-slot b"><b>Heat 003</b>Coming soon</div>
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

      {/* ── Closing CTA */}
      <section className="wrap h-close">
        <h2 className="wm">{over ? <>Heat 002<br />is coming.</> : <>See you at<br />Engineers&apos; Gate.</>}</h2>
        <div className="h-ctas center">
          {over ? (
            <Link className="btn volt lg" href="/results">See the results</Link>
          ) : (
            <>
              <a className="btn volt lg" href="#run">{open ? 'Run it today' : 'RSVP free'}</a>
              {open && <Link className="btn ghost lg" href="/post">Submit my run</Link>}
            </>
          )}
        </div>
      </section>
    </main>
  )
}
