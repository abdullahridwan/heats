import type { ReactNode } from 'react'
import Link from 'next/link'
import { unstable_rethrow } from 'next/navigation'
import { ContourMark, stampCaseHref } from '@/components/site/nav'
import { getRunner } from '@/lib/session'

// The app pages (calendar, join, post, stamp case, results, sign in): plain white, a slim header, and
// each page sized to one phone screen above the tab bar. The track-lane frame and footer are landing only.
export default async function AppLayout({ children }: { children: ReactNode }) {
  let runner = null
  try {
    runner = await getRunner()
  } catch (e) {
    unstable_rethrow(e)
  }
  return (
    <div className="app-body">
      <header>
        <nav aria-label="Main" className="app-header">
          <Link href={runner ? '/calendar' : '/'} aria-label="Heats home" className="app-header-logo">
            <ContourMark />
          </Link>
          <div className="app-header-links">
            <Link className="app-header-link app-header-hide-sm" href="/calendar">Calendar</Link>
            <Link className="app-header-link app-header-hide-sm" href={stampCaseHref(runner)}>Stamp case</Link>
            {runner
              ? <Link className="app-header-link" href={`/p/${runner.alias}`}>@{runner.alias}</Link>
              : <Link className="app-header-link" href="/signin?next=/calendar">Sign in</Link>}
          </div>
        </nav>
      </header>
      {children}
    </div>
  )
}
