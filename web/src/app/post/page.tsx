import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getHeats, getMe, getMySubmission, serverNow } from '@/lib/data'
import { PostForm } from './post-form'
import { heatNo, longDate } from '@/lib/time'

export const metadata = { title: 'Post your time' }

export default async function PostPage() {
  const heats = await getHeats()
  const heat = heats[0]
  if (!heat) return <main className="wrap narrow"><section className="s first"><div className="panel"><b>No heat open.</b></div></section></main>

  const { userId } = await auth()
  const me = await getMe(userId)
  if (userId && !me) redirect('/onboarding?next=/post')

  const mine = me ? await getMySubmission(me.id, heat.id) : null
  const now = await serverNow()
  const open = now >= new Date(heat.opens_at).getTime() && now <= new Date(heat.closes_at).getTime()
  const stamped = mine?.status === 'verified' || mine?.status === 'auto_verified'

  return (
    <main className="wrap narrow">
      <section className="s first">
        <div className="head">
          <span className="eyebrow">Heat {heatNo(heat.number)} · {longDate(heat.opens_at)}</span>
          <h2>Post your time</h2>
          <p>Screenshot your run from Strava, Garmin, Apple Watch, Nike or Coros. It must show a map, the distance and the time. A 5K anywhere in {heat.location_terms[0]} counts.</p>
        </div>

        {!open ? (
          <div className="panel"><b>The window is closed.</b><span className="muted">Heat {heatNo(heat.number)} takes submissions between {longDate(heat.opens_at)} and the end of that day.</span></div>
        ) : !userId ? (
          <div className="panel"><b>Sign in to claim your stamp.</b><span className="muted">You need a passport to post a time. It takes ten seconds.</span></div>
        ) : stamped ? (
          <div className="panel"><b>You&apos;re stamped.</b><span className="muted">Heat {heatNo(heat.number)} is in your passport.</span></div>
        ) : (
          <div className="panel">
            <PostForm
              heatNumber={heat.number}
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
