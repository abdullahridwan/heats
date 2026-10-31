import Link from 'next/link'
import type { Runner } from '@/lib/types'

export function stampCaseHref(runner: Runner | null): string {
  return runner ? `/p/${runner.alias}` : '/signin?next=/calendar'
}

export function ContourMark({ color = '#061236', size = 30 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
      <g fill="none" stroke={color} strokeWidth={14}>
        <rect x={22} y={48} width={156} height={104} rx={52} />
        <rect x={46} y={72} width={108} height={56} rx={28} />
      </g>
    </svg>
  )
}

export function Nav({ runner }: { runner: Runner | null }) {
  return (
    <header className="site-nav">
      <nav aria-label="Main" className="site-nav-inner">
        <div className="site-nav-start">
          <Link href="/" aria-label="Heats home" className="site-nav-logo">
            <ContourMark />
          </Link>
          <div className="site-nav-links">
            <Link className="site-nav-link" href="/calendar">Calendar</Link>
            <Link className="site-nav-link" href="/#how">How it works</Link>
            <Link className="site-nav-link" href={stampCaseHref(runner)}>Stamp case</Link>
          </div>
        </div>
        <div className="site-nav-actions">
          {runner
            ? <Link className="btn btn-ghost btn-sm" href={`/p/${runner.alias}`}>@{runner.alias}</Link>
            : <Link className="btn btn-primary btn-sm" href="/calendar">Join a heat</Link>}
        </div>
      </nav>
    </header>
  )
}
