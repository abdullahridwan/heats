import type { CSSProperties } from 'react'
import type { Heat } from './types'

export type Park = { name: string; b: string; d: string; s: string; g: string }

// Park colors from the brand kit. b = bright fill, d = deep stamp ink, s = soft tint, g = second gradient glow
export const PARKS: Record<string, Park> = {
  volt:    { name: 'Volt',        b: '#CCFF00', d: '#4B7A00', s: '#F2FFC4', g: '#BFE7FF' },
  coral:   { name: 'Coral',       b: '#FF7A5C', d: '#D2361B', s: '#FFE5DD', g: '#FFD3E4' },
  hudson:  { name: 'Hudson Blue', b: '#5B8CFF', d: '#1F4FD8', s: '#E0E9FF', g: '#C9F1FF' },
  sunset:  { name: 'Sunset',      b: '#FFAA2B', d: '#B35A00', s: '#FFEECF', g: '#FFC9B8' },
  lilac:   { name: 'Lilac',       b: '#A58BFF', d: '#5B37E0', s: '#EEE9FF', g: '#D2EEFF' },
  forest:  { name: 'Forest',      b: '#3BD481', d: '#0F7A45', s: '#DBF8E8', g: '#F0FFB8' },
  seafoam: { name: 'Seafoam',     b: '#2ED3C6', d: '#00766C', s: '#D6F8F5', g: '#D8E6FF' },
}

export const park = (h: Pick<Heat, 'color_key'>) => PARKS[h.color_key] ?? PARKS.volt

export const AVATAR_COLORS = ['#CCFF00', '#FF7A5C', '#5B8CFF', '#FFAA2B', '#A58BFF', '#3BD481', '#2ED3C6']

export function themeVars(h: Pick<Heat, 'color_key'>): CSSProperties {
  const p = park(h)
  return { ['--e-b' as string]: p.b, ['--e-d' as string]: p.d, ['--e-s' as string]: p.s, ['--e-g' as string]: p.g }
}

export const coverBG = (h: Pick<Heat, 'color_key'>) => {
  const p = park(h)
  return `radial-gradient(at 18% 14%, ${p.b} 0, transparent 55%), radial-gradient(at 88% 22%, ${p.g} 0, transparent 52%), radial-gradient(at 60% 96%, ${p.s} 0, transparent 60%), ${p.s}`
}

export type Course = { d: string; t?: string; s: [number, number]; extra?: string }

export const COURSES: Record<string, Course> = {
  cp:    { d: 'M84 18 C104 14 118 16 120 30 L124 168 C124 182 110 186 98 184 C84 182 78 176 78 160 L74 44 C72 30 74 20 84 18 Z', t: 'rotate(-29 100 100)', s: [122, 96] },
  loop:  { d: 'M100 22 C150 22 178 60 176 104 C174 150 140 180 98 178 C56 176 24 146 26 100 C28 56 58 22 100 22 Z', s: [26, 100] },
  line:  { d: 'M40 182 C52 140 60 110 74 84 C88 58 110 40 160 18', s: [40, 182] },
  line2: { d: 'M24 150 C58 150 74 118 100 118 C126 118 140 72 176 52', s: [24, 150] },
  oval:  { d: 'M40 100 C40 58 70 40 100 40 C130 40 160 58 160 100 C160 142 130 160 100 160 C70 160 40 142 40 100 Z', s: [100, 160] },
  xc:    { d: 'M28 164 C52 124 36 92 70 82 C102 72 88 40 120 34 C152 28 164 70 142 96 C120 122 160 140 174 170', s: [28, 164] },
  bw:    { d: 'M18 128 L182 72', s: [18, 128], extra: '<path d="M18 156 C40 150 60 162 82 156 S124 150 146 156 S170 160 182 152" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="4 6" opacity=".5"/>' },
}

export const BOROUGHS = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'] as const
