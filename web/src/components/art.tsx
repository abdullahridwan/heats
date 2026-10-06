import type { CSSProperties } from 'react'
import { courseSVG, guilloche, medalSVG, stampSVG, type MedalKind } from '@/lib/art'
import { coverBG, park } from '@/lib/themes'
import { heatNo } from '@/lib/time'
import type { Heat } from '@/lib/types'

type StampHeat = Pick<Heat, 'number' | 'park' | 'starts_at' | 'color_key' | 'stamp_shape'>

export function Stamp({ heat, salt, className = '', style }: { heat: StampHeat; salt?: string; className?: string; style?: CSSProperties }) {
  return <span className={`stamp ${className}`} style={style} dangerouslySetInnerHTML={{ __html: stampSVG(heat, salt) }} />
}

export function Medal({ kind, salt, className = '', style }: { kind: MedalKind; salt?: string; className?: string; style?: CSSProperties }) {
  return <span className={`medal-art ${className}`} style={style} dangerouslySetInnerHTML={{ __html: medalSVG(kind, salt) }} />
}

export function Cover({ heat, label = true, className = '' }: { heat: Heat; label?: boolean; className?: string }) {
  const photo = heat.cover_url
  return (
    <div className={`cover ${className}`} style={{ background: photo ? `center/cover url(${photo})` : coverBG(heat) }}>
      {label && <span className="ctag">HEAT {heatNo(heat.number)}</span>}
      {label && <span className="ctag r">{Number(heat.distance_km).toFixed(1)} KM</span>}
      <span className="course-wrap" dangerouslySetInnerHTML={{ __html: courseSVG(heat, { light: !!photo }) }} />
      {label && <span className="cname" style={photo ? { color: '#fff' } : undefined}>{heat.park}</span>}
    </div>
  )
}

export function Guilloche({ colors, cx, cy }: { colors: string[]; cx: number; cy: number }) {
  return <svg className="g" viewBox="0 0 250 350" preserveAspectRatio="xMidYMid slice" aria-hidden="true" dangerouslySetInnerHTML={{ __html: guilloche(colors, cx, cy) }} />
}

export function Mark({ size = 28, variant = 'volt' }: { size?: number; variant?: 'volt' | 'ink' }) {
  const bg = variant === 'volt' ? 'url(#hm-g)' : '#0B0C0A'
  const fg = variant === 'volt' ? '#0B0C0A' : '#CCFF00'
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs><linearGradient id="hm-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E3FF5C" /><stop offset="1" stopColor="#B8F000" /></linearGradient></defs>
      <rect width="100" height="100" rx="24" fill={bg} />
      <polygon points="32,22 46,22 38,78 24,78" fill={fg} />
      <polygon points="62,22 76,22 68,78 54,78" fill={fg} />
      <polygon points="37,43 67,43 65.4,55 35.4,55" fill={fg} />
    </svg>
  )
}

// The rubber-stamp ink filter every stamp references. Render once, in the root layout.
export function InkFilter() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <filter id="ink" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves={2} seed={4} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={3.2} xChannelSelector="R" yChannelSelector="G" result="d" />
        <feTurbulence type="fractalNoise" baseFrequency="1.8" numOctaves={1} seed={9} result="s" />
        <feColorMatrix in="s" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -4.2 0 0 0 3.05" result="m" />
        <feComposite in="d" in2="m" operator="in" />
      </filter>
    </svg>
  )
}

export const parkDot = (h: Pick<Heat, 'color_key'>) => park(h).b
