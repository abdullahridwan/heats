import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { SignInButton } from '@clerk/nextjs'
import { Cover, Stamp } from '@/components/art'
import { Avatar, AvatarStack } from '@/components/avatar'
import { Countdown } from '@/components/countdown'
import { ShareStory } from '@/components/share-story'
import { joinHeat, leaveHeat } from '@/app/actions'
import { getGoing, getHeat, getHeatSheet, getMyHeatState, getMyProfile } from '@/lib/data'
import { park, themeVars } from '@/lib/themes'
import { clock, day, formatTime, hasStarted, heatNo, longDate, mon, ordinal } from '@/lib/time'

type Props = { params: Promise<{ number: string }>; searchParams: Promise<{ posted?: string; joined?: string }> }

const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const heat = await getHeat(parseInt((await params).number, 10))
  if (!heat) return {}
  return {
    title: `Heat ${heatNo(heat.number)} · ${heat.name}`,
    description: `${longDate(heat.starts_at)} at ${clock(heat.starts_at)} · ${heat.meet_point}, ${heat.park}. Free, every pace.`,
  }
}

const Check = () => (
  <span className="chk"><svg width="9" height="9" viewBox="0 0 12 12"><path d="M2.5 6.2 5 8.6l4.6-5" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
)

export default async function HeatPage({ params, searchParams }: Props) {
  const { number } = await params
  const { posted, joined } = await searchParams
  const heat = await getHeat(parseInt(number, 10))
  if (!heat) notFound()

  const { userId } = await auth()
  const [going, sheet, mine, me] = await Promise.all([getGoing(heat.id), getHeatSheet(heat.id), getMyHeatState(heat.id, userId), getMyProfile(userId)])
  const p = park(heat)
  const n = heatNo(heat.number)
  const started = hasStarted(heat.starts_at)
  const url = `${site}/h/${n}`

  let action: React.ReactNode
  if (!userId) {
    action = heat.status === 'open' && !started
      ? <SignInButton mode="modal" forceRedirectUrl={`/h/${n}`}><button className="btn theme block" type="button">Join heat {n}</button></SignInButton>
      : <SignInButton mode="modal" forceRedirectUrl={`/h/${n}`}><button className="btn block" type="button">Sign in to post your time</button></SignInButton>
  } else if (!me) {
    action = <Link className="btn theme block" href={`/onboarding?next=/h/${n}`}>Get your passport to join</Link>
  } else if (mine.result?.status === 'verified') {
    action = <div className="state"><b>Stamped. Heat {n} is in your passport.</b><div className="row-actions"><ShareStory src={`/api/story/result/${n}?alias=${me.alias}`} filename={`heat-${n}-${me.alias}.png`} url={url} title={`Stamped: Heat ${n}`} caption={`Stamped at Heat ${n} · ${heat.name}.`} heading="Share your stamp" label="Share your stamp" className="btn theme sm" /><Link className="btn ghost sm" href={`/p/${me.alias}`}>Open passport</Link></div></div>
  } else if (mine.result?.status === 'pending') {
    action = <div className="state"><b>{posted ? 'Got it.' : 'Your time is in review.'}</b><span className="muted" style={{ fontSize: 14 }}>{formatTime(mine.result.time_seconds)} posted. We&apos;ll check your screenshot and stamp your passport, usually within a few hours.</span><Link className="linkbtn" href={`/h/${n}/post`}>Fix your time</Link></div>
  } else if (mine.result?.status === 'rejected') {
    action = <div className="state"><b>We couldn&apos;t verify that one.</b><span className="muted" style={{ fontSize: 14 }}>{mine.result.reject_reason}</span><Link className="btn block" href={`/h/${n}/post`}>Post it again</Link></div>
  } else if (mine.registered && started) {
    action = <Link className="btn theme block" href={`/h/${n}/post`}>Post your time</Link>
  } else if (mine.registered) {
    action = (
      <div className="state">
        <b>You&apos;re in. Heat {n}.</b>
        <span className="muted" style={{ fontSize: 14 }}>Be at {heat.meet_point} by {clock(new Date(new Date(heat.starts_at).getTime() - 10 * 60e3).toISOString())}. The gun goes at {clock(heat.starts_at)} sharp.</span>
        <div className="row-actions">
          <a className="btn sm" href={`/api/ics/${n}`}>Add to calendar</a>
          <ShareStory src={`/api/story/heat/${n}?alias=${me.alias}`} filename={`heat-${n}.png`} url={url} title={`Run Heat ${n} with me`} caption={`I'm running Heat ${n} · ${heat.name}. Come run it with me.`} heading="Get your friends to the line" label="Share to your story" className="btn theme sm" autoOpen={joined === '1'} />
          <form action={leaveHeat}><input type="hidden" name="number" value={heat.number} /><button className="linkbtn" type="submit">Can&apos;t make it</button></form>
        </div>
      </div>
    )
  } else if (heat.status === 'open' && !started) {
    action = <form action={joinHeat}><input type="hidden" name="number" value={heat.number} /><button className="btn theme block" type="submit">Join heat {n}</button></form>
  } else {
    action = <div className="state"><b>This heat has run.</b><span className="muted" style={{ fontSize: 14 }}>Join the next one from the calendar.</span><Link className="btn sm" href="/#calendar">See upcoming heats</Link></div>
  }

  return (
    <div style={themeVars(heat)}>
      <div className="ambient themed" aria-hidden="true"><i /><i /><i /><i /></div>
      <main className="wrap">
        <section className="s first">
          <div className="race-top">
            <Cover heat={heat} />
            <div className="race-side">
              <div style={{ display: 'grid', gap: 12 }}>
                <span className="pill"><span className="dot" /><Countdown iso={heat.starts_at} /></span>
                <h1 className="big">{heat.name}</h1>
                <div className="host"><span className="dot" style={{ width: 22, height: 22, background: p.b }} />Hosted by Heats NYC · {heat.borough}</div>
              </div>
              <div style={{ display: 'grid', gap: 14 }}>
                <div className="meta-row">
                  <div className="calt"><b>{mon(heat.starts_at)}</b><span>{day(heat.starts_at)}</span></div>
                  <div><div className="a">{longDate(heat.starts_at)}</div><div className="b">{clock(heat.starts_at)} sharp{heat.note ? ` · ${heat.note}` : ''}</div></div>
                </div>
                <div className="meta-row">
                  <div className="pinbox"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B0C0A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg></div>
                  <div><div className="a">{heat.meet_point}</div><div className="b">{heat.address ? <a href={`https://maps.google.com/?q=${encodeURIComponent(`${heat.meet_point}, ${heat.address}, New York`)}`} target="_blank" rel="noreferrer">{heat.address}</a> : heat.park}</div></div>
                </div>
              </div>
              <div className="join">
                <div className="join-top">
                  <div className="going"><AvatarStack runners={going.runners} />{going.count ? <span><b>{going.count}</b> going</span> : <span>Be the first to join</span>}</div>
                  <span className="eyebrow">Free · every pace</span>
                </div>
                <div className="earn">
                  <Stamp heat={heat} salt="earn" />
                  <div style={{ display: 'grid', gap: 2 }}><b>Finish to earn this stamp</b><span>Heat {n} goes into your passport in {p.name}.</span></div>
                </div>
                {action}
              </div>
            </div>
          </div>
        </section>

        <section className="s">
          <div className="sheet">
            <div className="sheet-head"><h3>Heat sheet · {n}</h3><span className="eyebrow">{sheet.length ? `${sheet.length} verified · ${Number(heat.distance_km).toFixed(1)} km` : 'Screenshot proof'}</span></div>
            {sheet.length === 0 ? (
              <div className="empty">
                <b style={{ color: 'var(--ink)' }}>{started ? 'Results are coming in.' : 'The heat sheet opens after the gun.'}</b>
                <span>{started ? 'Times appear here once their screenshots are checked.' : `Run it, post a screenshot of your time, and you'll show up here.`}</span>
              </div>
            ) : sheet.map(r => (
              <Link key={r.result_id} href={`/p/${r.alias}`} className={`rowr${r.user_id === userId ? ' me' : ''}`}>
                <span className={`pl${r.place === 1 ? ' first' : ''}`}>{String(r.place).padStart(2, '0')}</span>
                <Avatar alias={r.alias} url={r.avatar_url} size={32} />
                <div className="who"><div className="nm">{r.alias}{r.user_id === userId && <span className="you">You</span>}</div>{r.note && <div className="cm">{r.note}</div>}</div>
                <span className="tm" title={`${ordinal(r.place)} place`}>{formatTime(r.time_seconds)}<Check /></span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
