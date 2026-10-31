import type { CSSProperties, JSX } from 'react'
import { emptySlotSVG, stampSVG } from '@/lib/stamps'

// Server-compatible: no hooks, no 'use client'. The uid is derived from the stamp's identity so
// the markup is identical on server and client and every id is unique per stamp on a page.
function stampUid(scene: string, heatNo: string, postmark?: string | null): string {
  return `s${heatNo}${scene}${postmark ? `p${postmark}` : ''}`.replace(/[^a-zA-Z0-9]/g, '')
}

export function Stamp(p: {
  scene: string
  heatNo: string
  postmark?: string | null
  width?: number
  tilt?: number
  className?: string
}): JSX.Element {
  const uid = stampUid(p.scene, p.heatNo, p.postmark)
  const style: CSSProperties = {
    display: 'inline-block',
    width: `${p.width ?? 120}px`,
    transform: p.tilt !== undefined ? `rotate(${p.tilt}deg)` : undefined,
    filter: 'drop-shadow(0 8px 12px rgba(6,18,54,.16))',
  }
  return (
    <span
      className={p.className}
      style={style}
      dangerouslySetInnerHTML={{
        __html: stampSVG({ scene: p.scene, heatNo: p.heatNo, uid, postmark: p.postmark }),
      }}
    />
  )
}

export function EmptySlot(p: { heatNo: string; width?: number }): JSX.Element {
  const style: CSSProperties = {
    display: 'inline-block',
    width: `${p.width ?? 120}px`,
  }
  return <span style={style} dangerouslySetInnerHTML={{ __html: emptySlotSVG(p.heatNo) }} />
}
