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
        {/* A postage stamp: perforated edge, picture frame inside. */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" aria-hidden="true">
          <path d="M4.5 2.5L5.33 2.50A1.05 1.05 0 0 0 7.42 2.50L9.07 2.50A1.05 1.05 0 0 0 11.18 2.50L12.82 2.50A1.05 1.05 0 0 0 14.93 2.50L16.57 2.50A1.05 1.05 0 0 0 18.68 2.50L19.50 2.50L19.50 3.35A1.05 1.05 0 0 0 19.50 5.45L19.50 7.15A1.05 1.05 0 0 0 19.50 9.25L19.50 10.95A1.05 1.05 0 0 0 19.50 13.05L19.50 14.75A1.05 1.05 0 0 0 19.50 16.85L19.50 18.55A1.05 1.05 0 0 0 19.50 20.65L19.50 21.50L18.68 21.50A1.05 1.05 0 0 0 16.57 21.50L14.93 21.50A1.05 1.05 0 0 0 12.82 21.50L11.18 21.50A1.05 1.05 0 0 0 9.07 21.50L7.42 21.50A1.05 1.05 0 0 0 5.33 21.50L4.50 21.50L4.50 20.65A1.05 1.05 0 0 0 4.50 18.55L4.50 16.85A1.05 1.05 0 0 0 4.50 14.75L4.50 13.05A1.05 1.05 0 0 0 4.50 10.95L4.50 9.25A1.05 1.05 0 0 0 4.50 7.15L4.50 5.45A1.05 1.05 0 0 0 4.50 3.35L4.50 2.50Z" />
          <rect x="7.5" y="5.5" width="9" height="11" rx="0.5" />
        </svg>
        Stamp case
      </Link>
    </nav>
  )
}
