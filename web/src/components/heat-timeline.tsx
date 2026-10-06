import Link from 'next/link'
import { Cover } from '@/components/art'
import { AvatarStack } from '@/components/avatar'
import type { Going } from '@/lib/data'
import { park } from '@/lib/themes'
import { clock, day, heatNo, mon, weekday } from '@/lib/time'
import type { Heat } from '@/lib/types'

export function HeatTimeline({ heats, going, joined }: { heats: Heat[]; going: Record<string, Going>; joined?: Set<string> }) {
  return (
    <div className="cal-list" data-reveal="">
      {heats.map((h, i) => {
        const p = park(h)
        const g = going[h.id] ?? { count: 0, runners: [] }
        const isIn = joined?.has(h.id)
        return (
          <div className="cal-day" key={h.id} style={{ ['--c' as string]: p.b, ['--i' as string]: i }}>
            <div className="cal-date"><b>{mon(h.starts_at).charAt(0) + mon(h.starts_at).slice(1).toLowerCase()} {day(h.starts_at)}</b><span>{weekday(h.starts_at)}</span></div>
            <Link className="ev" href={`/h/${heatNo(h.number)}`}>
              <div style={{ minWidth: 0 }}>
                <div className="time">
                  <span className="mono">{clock(h.starts_at)}</span>
                  <span className="tag" style={{ background: p.s, color: p.d }}>{h.borough}</span>
                  {isIn && <span className="tag" style={{ background: 'var(--ink)', color: '#fff' }}>You&apos;re in</span>}
                  {h.status !== 'open' && <span className="tag" style={{ border: '1px solid var(--hair)' }}>Results</span>}
                </div>
                <div className="ttl">{h.name}</div>
                <div className="where">{h.meet_point}{h.note ? ` · ${h.note}` : ''}</div>
                <div className="foot">
                  <AvatarStack runners={g.runners.slice(0, 4)} size={26} />
                  <span>{g.count ? <><b style={{ color: 'var(--ink)' }}>{g.count}</b> going</> : 'Be the first to join'}</span>
                </div>
              </div>
              <Cover heat={h} label={false} className="thumb" />
            </Link>
          </div>
        )
      })}
    </div>
  )
}
