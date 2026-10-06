import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getHeat, getMyHeatState, getMyProfile } from '@/lib/data'
import { themeVars } from '@/lib/themes'
import { formatTime, hasStarted, heatNo, shortDate } from '@/lib/time'
import { PostForm } from './post-form'

export const metadata = { title: 'Post your time' }

export default async function PostPage({ params }: { params: Promise<{ number: string }> }) {
  const heat = await getHeat(parseInt((await params).number, 10))
  if (!heat) notFound()
  const n = heatNo(heat.number)
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!(await getMyProfile(userId))) redirect(`/onboarding?next=/h/${n}/post`)
  const mine = await getMyHeatState(heat.id, userId)
  const started = hasStarted(heat.starts_at)

  return (
    <div style={themeVars(heat)}>
      <div className="ambient themed" aria-hidden="true"><i /><i /><i /><i /></div>
      <main className="wrap narrow">
        <section className="s first">
          <div className="head">
            <Link className="eyebrow" href={`/h/${n}`}>← Heat {n} · {heat.name}</Link>
            <h2>Post your time</h2>
            <p>Add a screenshot from any running app: Strava, Garmin, Apple Watch, Nike or Coros. Make sure it shows the date, distance and time.</p>
          </div>
          {!started ? (
            <div className="panel"><b>The gun hasn&apos;t gone yet.</b><span className="muted">Come back after the run on {shortDate(heat.starts_at)}.</span></div>
          ) : !mine.registered ? (
            <div className="panel"><b>You didn&apos;t join this heat.</b><span className="muted">Only runners who joined Heat {n} can post a time.</span></div>
          ) : mine.result?.status === 'verified' ? (
            <div className="panel"><b>You&apos;re already stamped.</b><span className="muted">{formatTime(mine.result.time_seconds)} is on the heat sheet.</span></div>
          ) : (
            <div className="panel">
              <PostForm number={heat.number} heatId={heat.id} userId={userId} distanceKm={Number(heat.distance_km)} date={shortDate(heat.starts_at)}
                initialTime={mine.result ? formatTime(mine.result.time_seconds) : ''} initialNote={mine.result?.note ?? ''} />
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
