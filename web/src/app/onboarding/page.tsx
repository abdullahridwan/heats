import { redirect } from 'next/navigation'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getMe } from '@/lib/data'
import { OnboardingForm } from './form'

export const metadata = { title: 'Get your passport' }

export default async function Onboarding({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
  const { userId } = await auth()
  if (await getMe(userId)) redirect(safeNext)
  const user = await currentUser()
  const suggestion = (user?.username ?? user?.firstName ?? '').toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 20)

  return (
    <>
      <div className="ambient" aria-hidden="true"><i /><i /><i /><i /></div>
      <main className="wrap narrow">
        <section className="s first">
          <div className="head">
            <span className="eyebrow">Run passport</span>
            <h2>Pick the name on your passport.</h2>
            <p>It shows on the heat sheet and on your public passport page. Your stamps and medals collect here.</p>
          </div>
          <div className="panel"><OnboardingForm next={safeNext} suggestion={suggestion} /></div>
        </section>
      </main>
    </>
  )
}
