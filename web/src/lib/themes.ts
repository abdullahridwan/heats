import type { CSSProperties } from 'react'

export type Park = { name: string; b: string; d: string; s: string; g: string }

// v1 is a single heat in a single park, so there is one palette. The --e-* vars stay so the
// brand-kit CSS keeps working unchanged.
export const CENTRAL: Park = { name: 'Volt', b: '#CCFF00', d: '#4B7A00', s: '#F2FFC4', g: '#BFE7FF' }
export const PARKS: Record<string, Park> = { volt: CENTRAL }

export const AVATAR_COLORS = ['#CCFF00', '#FF7A5C', '#5B8CFF', '#FFAA2B', '#A58BFF', '#3BD481', '#2ED3C6']

export function themeVars(): CSSProperties {
  return { ['--e-b' as string]: CENTRAL.b, ['--e-d' as string]: CENTRAL.d, ['--e-s' as string]: CENTRAL.s, ['--e-g' as string]: CENTRAL.g }
}

export const coverBG = () =>
  `radial-gradient(at 18% 14%, ${CENTRAL.b} 0, transparent 55%), radial-gradient(at 88% 22%, ${CENTRAL.g} 0, transparent 52%), radial-gradient(at 60% 96%, ${CENTRAL.s} 0, transparent 60%), ${CENTRAL.s}`

export type Course = { d: string; t?: string; s: [number, number]; extra?: string }

// The Central Park loop, drawn from the brand kit.
export const COURSE: Course = {
  d: 'M84 18 C104 14 118 16 120 30 L124 168 C124 182 110 186 98 184 C84 182 78 176 78 160 L74 44 C72 30 74 20 84 18 Z',
  t: 'rotate(-29 100 100)',
  s: [122, 96],
}
