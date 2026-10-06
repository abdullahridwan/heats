import Link from 'next/link'
import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { Cover, Medal, Stamp } from '@/components/art'
import { AvatarStack } from '@/components/avatar'
import { Countdown } from '@/components/countdown'
import { HeatTimeline } from '@/components/heat-timeline'
import { ShareButton } from '@/components/share-button'
import { getFinishes, getGoing, getHeats, getMyProfile, getMyRegistrations } from '@/lib/data'
import { computeMedals, MEDAL_INFO } from '@/lib/medals'
import { hasDb } from '@/lib/supabase/server'
import { themeVars } from '@/lib/themes'
import { clock, heatNo, isUpcoming, longDate } from '@/lib/time'

const FAN = [
  { left: '0%', top: '6%', r: -10 }, { left: '30%', top: '0%', r: 7 }, { left: '58%', top: '8%', r: -5 }, { left: '16%', top: '38%', r: 9 }, { left: '46%', top: '40%', r: -12 },
]

// What a signed-in runner sees at "/": their next heat, their passport and the season.
export async function SignedInHome({ userId }: { userId: string }) {
  const profile = await getMyProfile(userId)
  if (hasDb && !profile) redirect('/onboarding')
  const [heats, joined, user] = await Promise.all([getHeats(), getMyRegistrations(userId), currentUser()])
  const finishes = profile ? await getFinishes(profile.id) : []
  const medals = computeMedals(finishes)
  const earned = medals.filter(m => m.earned)
  const going = Object.fromEntries(await Promise.all(heats.map(async h => [h.id, await getGoing(h.id)] as const)))

  const upcoming = heats.filter(h => h.status === 'open' && isUpcoming(h.starts_at))
  const nextJoined = upcoming.find(h => joined.has(h.id))
  const next = nextJoined ?? upcoming[0]
  const name = profile?.alias ?? user?.firstName ?? 'runner'
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  return (
    <>
      <div className="ambient" aria-hidden="true"><i /><i /><i /><i /></div>
      <main className="wrap">
        <section className="s first">
          <div className="head" data-reveal="">
            <span className="eyebrow">Welcome back</span>
            <h2>Hey, {name}.</h2>
            <p>{finishes.length
              ? `${finishes.length} ${finishes.length === 1 ? 'heat' : 'heats'} stamped and ${earned.length} ${earned.length === 1 ? 'medal' : 'medals'} so far.`
              : 'Your passport is empty. The next heat is a good one to start with.'}</p>
          </div>

          <div className="home-grid">
            {next && (
              <div className="next" style={themeVars(next)}>
                <Cover heat={next} />
                <div className="next-side">
                  <span className="eyebrow">{nextJoined ? 'Your next heat' : 'Next heat'}</span>
                  <span className="pill"><span className="dot" /><Countdown iso={next.starts_at} /></span>
                  <h3 className="big-h" style={{ fontSize: 'clamp(28px, 3.4vw, 40px)' }}>{next.name}</h3>
                  <span className="muted" style={{ fontSize: 14.5 }}>{longDate(next.starts_at)} · {clock(next.starts_at)} · {next.meet_point}</span>
                  <div className="going"><AvatarStack runners={(going[next.id]?.runners ?? []).slice(0, 5)} />{going[next.id]?.count ? <span><b>{going[next.id].count}</b> going</span> : <span>Be the first to join</span>}</div>
                  {nextJoined ? (
                    <div className="state">
                      <b>You&apos;re in. Heat {heatNo(next.number)}.</b>
                      <div className="row-actions">
                        <a className="btn sm" href={`/api/ics/${heatNo(next.number)}`}>Add to calendar</a>
                        <Link className="btn ghost sm" href={`/h/${heatNo(next.number)}`}>Race page</Link>
                        <ShareButton url={`${site}/h/${heatNo(next.number)}`} title={`Run Heat ${heatNo(next.number)} with me`} className="btn ghost sm" />
                      </div>
                    </div>
                  ) : (
                    <Link className="btn theme block" href={`/h/${heatNo(next.number)}`}>Join heat {heatNo(next.number)}</Link>
                  )}
                </div>
              </div>
            )}

            <div className="mypass">
              <div className="subhead"><h3>Your passport</h3>{profile && <Link className="linkbtn" href={`/p/${profile.alias}`}>Open</Link>}</div>
              <div className="fan">
                {finishes.length
                  ? finishes.slice(-5).map((f, i) => <Stamp key={f.heat.id} heat={f.heat} salt={`home${i}`} style={{ left: FAN[i].left, top: FAN[i].top, ['--r' as string]: `${FAN[i].r}deg` }} />)
                  : <div className="fan-empty"><span className="slot" style={{ position: 'static', width: 120 }}><span><b>Stamp 1</b>{next ? `Heat ${heatNo(next.number)}` : 'Your first heat'}</span></span></div>}
              </div>
              <div className="subhead"><span className="eyebrow">{earned.length} of 8 medals</span></div>
              <div className="mini-medals">
                {medals.map(m => (
                  <span key={m.kind} className={m.earned ? '' : 'locked'} title={`${MEDAL_INFO[m.kind].name}: ${m.earned ? `earned ${m.on}` : MEDAL_INFO[m.kind].how}`}>
                    <Medal kind={m.kind} salt="home" />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="s" id="calendar">
          <div className="head" data-reveal="">
            <span className="eyebrow">Fall season · New York</span>
            <h2>Upcoming heats</h2>
            <p>Every park, every week. Join as many as you like. Each one is a new stamp in its own color.</p>
          </div>
          <HeatTimeline heats={heats} going={going} joined={joined} />
        </section>
      </main>
    </>
  )
}

