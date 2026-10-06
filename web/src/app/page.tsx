import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { Cover, Medal, Stamp } from '@/components/art'
import { Countdown } from '@/components/countdown'
import { getHeats, getMe, getResults, getStamps } from '@/lib/data'
import { computeMedals, MEDAL_INFO, MEDAL_ORDER } from '@/lib/medals'
import { clock, day, formatTime, heatNo, longDate, mon } from '@/lib/time'

export const revalidate = 30

const HERO_HEAT = { number: 1, name: 'Chilly Central Park 5K', opens_at: '2026-10-10T04:00:00Z', location_terms: ['Central Park'] }

export default async function Home() {
  const heats = await getHeats()
  const heat = heats[0]
  const { userId } = await auth()
  const me = await getMe(userId)
  const stamps = me ? await getStamps(me.id) : []
  const results = heat ? await getResults(heat.id) : []
  const medals = computeMedals(stamps)

  return (
    <>
      <div className="ambient" aria-hidden="true"><i /><i /><i /><i /></div>
      <main className="wrap">
        <header className="hero">
          <div>
            <h1 className="wm" aria-label="Heats">Heats</h1>
            <p className="sub">Free community 5Ks across New York. Show up, run, get stamped.</p>
            {heat && (
              <div className="hero-cta">
                <span className="gun">
                  <span className="dot" />
                  Heat {heatNo(heat.number)} · post by <b><Countdown iso={heat.closes_at} format="clock" /></b>
                </span>
              </div>
            )}
            <div className="row-actions" style={{ marginTop: 20 }}>
              <Link className="btn theme" href="/post">Claim your stamp</Link>
              <Link className="btn ghost" href="/results">See the heat sheet</Link>
            </div>
          </div>
          <div className="cluster" aria-label="Heats stamps and medals">
            <Stamp heat={HERO_HEAT} salt="hero1" style={{ left: '4%', top: '6%', width: '48%', ['--r' as string]: '-10deg', ['--i' as string]: 0 }} />
            <Stamp heat={HERO_HEAT} salt="hero2" style={{ left: '42%', top: '0%', width: '44%', ['--r' as string]: '8deg', ['--i' as string]: 1 }} />
            <Stamp heat={HERO_HEAT} salt="hero3" style={{ left: '2%', top: '48%', width: '50%', ['--r' as string]: '7deg', ['--i' as string]: 2 }} />
            <Medal kind="founding" salt="hero" className="pin" style={{ right: '0%', top: '22%', width: '30%', ['--r' as string]: '9deg', ['--i' as string]: 3 }} />
            <Medal kind="podium" salt="hero" className="pin" style={{ right: '10%', top: '62%', width: '24%', ['--r' as string]: '-8deg', ['--i' as string]: 4 }} />
          </div>
        </header>

        {heat && (
          <section className="s" id="heat">
            <div className="head" data-reveal="">
              <span className="eyebrow">Heat {heatNo(heat.number)}</span>
              <h2>{heat.name}</h2>
              <p>Pick any 5K route around {heat.location_terms[0]}. Run it inside the window, screenshot your card and post it. Every verified finish gets stamped.</p>
            </div>
            <div className="race-top">
              <Cover heat={heat} />
              <div className="race-side">
                <span className="pill"><span className="dot" /><Countdown iso={heat.closes_at} /></span>
                <h1 className="big" style={{ fontSize: 'clamp(30px, 4vw, 48px)' }}>{heat.name}</h1>
                <div className="meta-row">
                  <div className="calt"><b>{mon(heat.opens_at)}</b><span>{day(heat.opens_at)}</span></div>
                  <div><div className="a">{longDate(heat.opens_at)}</div><div className="b">{clock(heat.opens_at)} to {clock(heat.closes_at)} · any route</div></div>
                </div>
                <div className="join">
                  <div className="earn"><Stamp heat={heat} salt="earn" /><div style={{ display: 'grid', gap: 2 }}><b>Finish to earn this stamp</b><span>Heat {heatNo(heat.number)} goes into your passport.</span></div></div>
                  <Link className="btn theme block" href="/post">Post your time</Link>
                  <span className="eyebrow">Free · every pace · {Number(heat.min_km)}–{Number(heat.max_km)} km</span>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="s" id="passport">
          <div className="head" data-reveal="">
            <span className="eyebrow">Run passport</span>
            <h2>Every finish gets a stamp.</h2>
            <p>Each verified finish adds the heat&apos;s stamp. Three medals mark the moments worth chasing.</p>
          </div>
          <div className="medals" data-reveal="">
            {MEDAL_ORDER.map((k, i) => (
              <div className="medal" key={k} style={{ ['--i' as string]: i, ['--spin' as string]: `${5 + i * 1.3}s` }}>
                <Medal kind={k} salt="lm" />
                <span className="medal-shadow" aria-hidden="true" />
                <b>{MEDAL_INFO[k].name}</b>
                <i className="obj" style={{ fontStyle: 'normal' }}>{MEDAL_INFO[k].obj}</i>
                <span className="st" style={{ background: 'var(--volt-soft)', color: '#4B7A00' }}>{MEDAL_INFO[k].how}</span>
              </div>
            ))}
          </div>
          <div className="rules3" data-reveal="">
            <div className="panel"><span className="k">Stamp</span><h3>Every verified finish</h3><p>Any pace, no cutoff. Each stamp is the heat, in its color, dated.</p></div>
            <div className="panel"><span className="k">Medal</span><h3>Three moments</h3><p>Founding Runner, Podium, Closer. Two of them only lock in after the window closes.</p></div>
            <div className="panel"><span className="k">Share</span><h3>Built to be posted</h3><p>Every result gets a story card, so your friends know where to run next.</p></div>
          </div>
        </section>

        {me && stamps.length > 0 && (
          <section className="s">
            <div className="head"><span className="eyebrow">Your passport</span><h2>{stamps.length} {stamps.length === 1 ? 'heat' : 'heats'} stamped, {medals.filter(m => m.earned).length} of 3 medals.</h2></div>
            <div className="sheet">
              {[...stamps].reverse().map(s => (
                <div className="rowr" key={s.heat.id} style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
                  <div className="who"><div className="nm">Heat {heatNo(s.heat.number)} · {s.heat.name}</div><div className="cm">{s.place ? `${s.place} of ${s.finishers}` : ''}{s.note ? ` · ${s.note}` : ''}</div></div>
                  <span className="tm">{formatTime(s.time_s)}</span>
                </div>
              ))}
            </div>
            <div className="row-actions"><Link className="btn theme" href={`/p/${me.alias}`}>Open passport</Link></div>
          </section>
        )}

        {results.length > 0 && (
          <section className="s" id="results">
            <div className="head"><span className="eyebrow">Heat sheet</span><h2>{results.length} stamped.</h2></div>
            <div className="sheet">
              {results.map(r => (
                <Link key={`${r.heat_id}-${r.alias}`} href={`/p/${r.alias}`} className="rowr">
                  <span className={`pl${r.place === 1 ? ' first' : ''}`}>{String(r.place).padStart(2, '0')}</span>
                  <span />
                  <div className="who"><div className="nm">{r.alias}</div>{r.note && <div className="cm">{r.note}</div>}</div>
                  <span className="tm">{formatTime(r.time_s)}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="s" id="community">
          <div className="head" data-reveal="">
            <span className="eyebrow">Community</span>
            <h2>Run with your city.</h2>
            <p>A running club without the club: no dues, no tryouts, no pace groups to keep up with.</p>
          </div>
          <div className="values" data-reveal="">
            <div className="value grain" style={{ background: 'radial-gradient(at 20% 0%, #E6FF6B, transparent 60%), #F8FDEB' }}><h3>Every pace</h3><p>No cutoff time, ever. Walk it if you want. Your stamp looks the same.</p></div>
            <div className="value grain" style={{ background: 'radial-gradient(at 80% 0%, #FFC9B8, transparent 60%), #FFF8F5' }}><h3>Last one in, loudest cheer</h3><p>The last runner in a heat earns the Closer medal.</p></div>
            <div className="value grain" style={{ background: 'radial-gradient(at 20% 0%, #C8D8FF, transparent 60%), #F6F8FF' }}><h3>Screenshot, stamp, share</h3><p>Post your card, get verified, post the stamp to your story.</p></div>
          </div>
        </section>
      </main>
    </>
  )
}
