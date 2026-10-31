'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function TabBar({ stampHref }: { stampHref: string }) {
  const pathname = usePathname()
  const onStamp = pathname.startsWith('/p/')
  return (
    <nav aria-label="Tabs" className="tab-bar">
      <Link href="/calendar" className="tab-link" aria-current={onStamp ? undefined : 'page'}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
        Calendar
      </Link>
      <Link href={stampHref} className="tab-link" aria-current={onStamp ? 'page' : undefined}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeDasharray="2.2 1.6" aria-hidden="true">
          <rect x="5" y="3" width="14" height="18" rx="1" />
        </svg>
        Stamp case
      </Link>
    </nav>
  )
}
