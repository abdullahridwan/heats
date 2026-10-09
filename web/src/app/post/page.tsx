import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { getHeats, getMe, getMySubmission, serverNow } from '@/lib/data'
import { PostForm } from './post-form'
import { heatNo, longDate } from '@/lib/time'

export const metadata = { title: 'Submit my run' }

export default async function PostPage() {
  const heats = await getHeats()
  const heat = heats[0]
  if (!heat) return <main className="wrap narrow"><section className="s first"><div className="panel"><b>No heat open.</b></div></section></main>

  const { userId } = await auth()
  const me = await getMe(userId)
  if (userId && !me) redirect('/onboarding?next=/post')

  const mine = me ? await getMySubmission(me.id, heat.id) : null
  const now = await serverNow()
  const before = now < new Date(heat.opens_at).getTime()
  const after = now > new Date(heat.closes_at).getTime()
  const luma = process.env.NEXT_PUBLIC_LUMA_URL
  const stamped = mine?.status === 'verified' || mine?.status === 'auto_verified'

  return (
    <main className="wrap narrow">
      <section className="s first">
        <div className="head">
          <span className="eyebrow">Heat {heatNo(heat.number)} · {longDate(heat.opens_at)}</span>
          <h2>Submit my run</h2>
          <p>Screenshot your run from Strava, Garmin, Apple Watch, Nike or Coros. It must show a map, the distance and the time. A 5K anywhere in {heat.location_terms[0]} counts.</p>
        </div>

        {before ? (
          <div className="panel">
            <b>Submissions open on race day.</b>
            <span className="muted">Run 5K any time on {longDate(heat.opens_at)}, then come back here and submit your run. Submissions close at 11:59 PM that night.</span>
            {luma && <div className="row-actions"><a className="btn volt" href={luma} target="_blank" rel="noopener noreferrer">RSVP on Luma</a></div>}
          </div>
        ) : after ? (
          <div className="panel"><b>The window is closed.</b><span className="muted">Heat {heatNo(heat.number)} took submissions on {longDate(heat.opens_at)}. See the <a href="/results" style={{ textDecoration: 'underline' }}>results</a>.</span></div>
        ) : !userId ? (
          <div className="panel">
            <b>You ran it. Claim your stamp.</b>
            <span className="muted">Make your free Heats passport, then upload your Strava screenshot. It takes about a minute.</span>
            <div className="row-actions">
              <SignUpButton mode="modal" forceRedirectUrl="/post"><button className="btn volt" type="button">Get my stamp</button></SignUpButton>
              <SignInButton mode="modal" forceRedirectUrl="/post"><button className="btn ghost" type="button">I already have a passport</button></SignInButton>
            </div>
          </div>
        ) : stamped ? (
          <div className="panel"><b>You&apos;re stamped.</b><span className="muted">Heat {heatNo(heat.number)} is in your passport.</span></div>
        ) : (
          <div className="panel">
            <PostForm
              heatNumber={heat.number}
              alias={me?.alias ?? ''}
              minKm={Number(heat.min_km)}
              maxKm={Number(heat.max_km)}
              attempts={mine?.attempts ?? 0}
              initialNote={mine?.note ?? ''}
              previousStatus={mine?.status ?? null}
              previousReason={mine?.review_reason ?? null}
            />
          </div>
        )}
      </section>
    </main>
  )
}
