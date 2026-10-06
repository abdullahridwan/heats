import type { Heat } from './types'
import { PARKS, COURSE } from './themes'
import { heatNo, stampDate } from './time'

export type MedalKind = 'founding' | 'podium' | 'closer'

// Stamp art. v1 keeps the single Central Park palette (PARKS.volt) and the circle shape; the
// stamps still read heat number, park and date off the heat row.

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export function stampName(p: string) {
  const short = p.toUpperCase().replace(' GREENWAY', '').replace('BROOKLYN BRIDGE PARK', 'BKLYN BRIDGE')
  return short.length > 17 ? short.slice(0, 16) + '.' : short
}

type StampHeat = Pick<Heat, 'number' | 'name' | 'opens_at' | 'location_terms'>

export function stampSVG(h: StampHeat, salt = 'a') {
  const c = PARKS.volt.d
  const id = `st${h.number}${salt}`
  const n = heatNo(h.number)
  const date = stampDate(h.opens_at)
  const name = esc(stampName(h.location_terms[0] ?? h.name))
  const mono = `class="t-mono" fill="${c}"`
  const body =
    `<circle cx="100" cy="100" r="92" fill="none" stroke="${c}" stroke-width="5"/><circle cx="100" cy="100" r="80" fill="none" stroke="${c}" stroke-width="1.6"/>` +
    `<path id="${id}t" d="M 34 100 A 66 66 0 0 1 166 100" fill="none"/><path id="${id}b" d="M 26 100 A 74 74 0 0 0 174 100" fill="none"/>` +
    `<text ${mono} font-size="12.5" letter-spacing="2.4" text-anchor="middle"><textPath href="#${id}t" startOffset="50%">${name}</textPath></text>` +
    `<text ${mono} font-size="11" letter-spacing="2.4" text-anchor="middle"><textPath href="#${id}b" startOffset="50%">${date} · 5K</textPath></text>` +
    `<circle cx="40" cy="100" r="2.6" fill="${c}"/><circle cx="160" cy="100" r="2.6" fill="${c}"/>` +
    `<text x="100" y="80" text-anchor="middle" class="t-mono" font-size="10" letter-spacing="4" fill="${c}">HEAT</text>` +
    `<text x="100" y="124" text-anchor="middle" class="t-wm" font-size="52" letter-spacing="-2" fill="${c}">${n}</text>`
  return `<svg viewBox="0 0 200 200" role="img" aria-label="Heat ${n} stamp"><g filter="url(#ink)" opacity=".93">${body}</g></svg>`
}

// ───────────── medals: three enamel pins for v1

function starPts(cx: number, cy: number, R: number, r: number, n: number, rot = -90) {
  const a0 = (rot * Math.PI) / 180
  return Array.from({ length: n * 2 }, (_, i) => { const rr = i % 2 ? r : R, a = a0 + (i * Math.PI) / n; return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}` }).join(' ')
}
const WM = 'class="t-wm" text-anchor="middle"'
const MO = 'class="t-mono" font-weight="600" text-anchor="middle"'

type MedalDef = { c: string; shape: (fills: boolean) => string; detail: (G: string, id: string) => string; after?: (G: string) => string }

const MEDALS: Record<MedalKind, MedalDef> = {
  // Founding Runner: a volt sunburst for Heat 001.
  founding: {
    c: '#CCFF00',
    shape: () => `<polygon points="${starPts(80, 80, 74, 60, 20)}"/>`,
    detail: G => `<circle cx="80" cy="80" r="44" fill="#0B0C0A" stroke="${G}" stroke-width="3"/>` +
      `<text x="80" y="66" ${MO} font-size="8" letter-spacing="2.5" fill="#E3C065">FOUNDING</text>` +
      `<text x="80" y="99" ${WM} font-size="34" fill="#CCFF00">01</text>` +
      `<text x="80" y="112" ${MO} font-size="8" letter-spacing="2.5" fill="#E3C065">RUNNER</text>`,
  },
  // Podium: the three blocks.
  podium: {
    c: '#3BD481',
    shape: () => '<path d="M18 76 H58 V50 H102 V92 H142 V136 H18 Z"/>',
    detail: G => `<line x1="58" y1="76" x2="58" y2="136" stroke="${G}" stroke-width="2.5"/><line x1="102" y1="92" x2="102" y2="136" stroke="${G}" stroke-width="2.5"/>` +
      `<text x="38" y="114" ${WM} font-size="22" fill="#0B0C0A">2</text><text x="80" y="100" ${WM} font-size="26" fill="#0B0C0A">1</text><text x="122" y="124" ${WM} font-size="20" fill="#0B0C0A">3</text>`,
    after: G => `<polygon points="${starPts(80, 28, 14, 6, 5)}" fill="${G}" stroke="#9C7A22" stroke-width=".8" stroke-linejoin="round"/>`,
  },
  // Closer: the megaphone.
  closer: {
    c: '#2ED3C6',
    shape: () => '<path d="M28 68 L58 60 L118 28 Q126 24 126 34 L126 126 Q126 136 118 132 L58 100 L28 92 Q22 90 22 80 Q22 70 28 68 Z"/><rect x="52" y="96" width="15" height="32" rx="5" transform="rotate(-12 59 112)"/>',
    detail: G => `<line x1="111" y1="35" x2="111" y2="125" stroke="${G}" stroke-width="2.5"/><line x1="58" y1="61" x2="58" y2="99" stroke="${G}" stroke-width="2.5"/><text x="85" y="86" ${WM} font-size="14" fill="#0B0C0A">LAST</text>`,
    after: G => `<path d="M136 64 Q144 80 136 96" fill="none" stroke="${G}" stroke-width="4" stroke-linecap="round"/><path d="M144 50 Q158 80 144 110" fill="none" stroke="${G}" stroke-width="4" stroke-linecap="round"/>`,
  },
}

export function medalSVG(kind: MedalKind, salt = 'a') {
  const M = MEDALS[kind], id = `md${kind}${salt}`, G = `url(#${id}au)`
  const defs = `<defs><linearGradient id="${id}au" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF4C2"/><stop offset=".3" stop-color="#E3C065"/><stop offset=".55" stop-color="#A07A1C"/><stop offset=".78" stop-color="#F3DB8C"/><stop offset="1" stop-color="#B8902F"/></linearGradient>` +
    `<linearGradient id="${id}gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<clipPath id="${id}c">${M.shape(false)}</clipPath></defs>`
  const rim = `<g fill="${G}" stroke="${G}" stroke-width="11" stroke-linejoin="round">${M.shape(false)}</g>`
  const enamel = `<g fill="${M.c}" stroke="#9C7A22" stroke-width="1.6" stroke-linejoin="round">${M.shape(true)}</g>`
  const gloss = `<g clip-path="url(#${id}c)" pointer-events="none"><rect width="160" height="90" fill="url(#${id}gl)"/><ellipse cx="52" cy="40" rx="36" ry="11" fill="#fff" opacity=".3" transform="rotate(-30 52 40)"/></g>`
  return `<svg viewBox="0 0 160 160" aria-hidden="true">${defs}${rim}${enamel}${M.detail(G, id)}${gloss}${M.after ? M.after(G) : ''}</svg>`
}

// Guilloche security pattern for passport pages
export function guilloche(colors: string[], cx: number, cy: number) {
  let s = ''
  for (let k = 0; k < 36; k++) s += `<ellipse cx="${cx}" cy="${cy}" rx="150" ry="58" fill="none" stroke="${colors[k % colors.length]}" stroke-width=".6" transform="rotate(${k * 5} ${cx} ${cy})"/>`
  for (let j = 0; j < 14; j++) s += `<circle cx="${cx}" cy="${cy}" r="${40 + j * 14}" fill="none" stroke="${colors[j % colors.length]}" stroke-width=".4"/>`
  return s
}

// The course line for the cover art (single Central Park loop in v1).
export function courseSVG(opts: { light?: boolean } = {}) {
  const c = COURSE
  const stroke = opts.light ? PARKS.volt.b : '#0B0C0A'
  return `<svg class="course" viewBox="0 0 200 200" aria-hidden="true" style="color:${stroke}"><g${c.t ? ` transform="${c.t}"` : ''}>${c.extra ?? ''}` +
    `<path class="cpath" pathLength="1" d="${c.d}" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle class="cstart" cx="${c.s[0]}" cy="${c.s[1]}" r="7.5" fill="${PARKS.volt.b}" stroke="#0B0C0A" stroke-width="2.6"/></g></svg>`
}
