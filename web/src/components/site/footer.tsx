import Link from 'next/link'
import { shortDate, weekday } from '@/lib/time'
import type { Heat, Runner } from '@/lib/types'
import { ContourMark, stampCaseHref } from '@/components/site/nav'

export function Footer({ nextHeat, runner }: { nextHeat: Heat | null; runner: Runner | null }) {
  return (
    <footer className="site-foot">
      <div className="site-foot-top">
        <div className="site-foot-copy">
          <h2 className="site-foot-title serif">
            Your first stamp is <em>one weekend away.</em>
          </h2>
          <p className="site-foot-sub">Free 5Ks across New York, every Saturday and Sunday through December.</p>
        </div>
        <div className="site-foot-ctas">
          <Link className="site-foot-cta site-foot-cta-volt" href="/calendar">Join a heat</Link>
          <Link className="site-foot-cta site-foot-cta-line" href="/post">Submit your run</Link>
        </div>
      </div>
      <div className="site-foot-rule" />
      <div className="site-foot-cols">
        <div className="site-foot-col">
          <p className="site-foot-head">Run</p>
          <Link href="/calendar">Calendar</Link>
          <Link href="/post">Submit your run</Link>
          <Link href="/#how">How it works</Link>
        </div>
        <div className="site-foot-col">
          <p className="site-foot-head">You</p>
          <Link href={stampCaseHref(runner)}>Stamp case</Link>
          {runner ? null : <Link href="/signin">Sign in</Link>}
        </div>
      </div>
      <div className="site-foot-base">
        <span>
          <ContourMark color="#CCFF00" size={22} />
          © 2026 Heats, New York
        </span>
        {nextHeat ? (
          <span>
            <span className="site-foot-dot" aria-hidden="true" />
            Next heat: {weekday(nextHeat.opens_at).slice(0, 3)} {shortDate(nextHeat.opens_at)}, {nextHeat.park}
          </span>
        ) : null}
      </div>
    </footer>
  )
}
