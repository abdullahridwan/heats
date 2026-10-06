// SVG art ported from the brand kit (brand/heats-brandkit.html). Returns markup strings so the
// output matches the kit exactly. Fonts come from CSS classes (.t-wm / .t-mono) because next/font
// hashes family names.
import type { Heat } from './types'
import { COURSES, park } from './themes'
import { heatNo, stampDate } from './time'

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export function stampName(p: string) {
  const short = p.toUpperCase().replace(' GREENWAY', '').replace('BROOKLYN BRIDGE PARK', 'BKLYN BRIDGE')
  return short.length > 17 ? short.slice(0, 16) + '.' : short
}

type StampHeat = Pick<Heat, 'number' | 'park' | 'starts_at' | 'color_key' | 'stamp_shape'>

export function stampSVG(h: StampHeat, salt = 'a') {
  const c = park(h).d
  const id = `st${h.number}${salt}`
  const n = heatNo(h.number)
  const date = stampDate(h.starts_at)
  const name = esc(stampName(h.park))
  const mono = `class="t-mono" fill="${c}"`
  const big = (y: number, size = 52) => `<text x="100" y="${y}" text-anchor="middle" class="t-wm" font-size="${size}" letter-spacing="-2" fill="${c}">${n}</text>`
  let body = ''
  if (h.stamp_shape === 'circle') {
    body = `<circle cx="100" cy="100" r="92" fill="none" stroke="${c}" stroke-width="5"/><circle cx="100" cy="100" r="80" fill="none" stroke="${c}" stroke-width="1.6"/>` +
      `<path id="${id}t" d="M 34 100 A 66 66 0 0 1 166 100" fill="none"/><path id="${id}b" d="M 26 100 A 74 74 0 0 0 174 100" fill="none"/>` +
      `<text ${mono} font-size="12.5" letter-spacing="2.4" text-anchor="middle"><textPath href="#${id}t" startOffset="50%">${name}</textPath></text>` +
      `<text ${mono} font-size="11" letter-spacing="2.4" text-anchor="middle"><textPath href="#${id}b" startOffset="50%">${date} · 5K</textPath></text>` +
      `<circle cx="40" cy="100" r="2.6" fill="${c}"/><circle cx="160" cy="100" r="2.6" fill="${c}"/>` +
      `<text x="100" y="80" text-anchor="middle" class="t-mono" font-size="10" letter-spacing="4" fill="${c}">HEAT</text>` + big(124)
  } else if (h.stamp_shape === 'octagon') {
    const oct = (r: number) => Array.from({ length: 8 }, (_, i) => { const a = Math.PI / 8 + (i * Math.PI) / 4; return `${(100 + r * Math.cos(a)).toFixed(1)},${(100 + r * Math.sin(a)).toFixed(1)}` }).join(' ')
    body = `<polygon points="${oct(94)}" fill="none" stroke="${c}" stroke-width="5" stroke-linejoin="round"/><polygon points="${oct(82)}" fill="none" stroke="${c}" stroke-width="1.6"/>` +
      `<text x="100" y="58" text-anchor="middle" ${mono} font-size="11.5" letter-spacing="2">${name}</text>` +
      `<text x="100" y="74" text-anchor="middle" class="t-mono" font-size="11" letter-spacing="4" fill="${c}">HEAT</text>` + big(120) +
      `<line x1="52" y1="134" x2="148" y2="134" stroke="${c}" stroke-width="1.4"/>` +
      `<text x="100" y="152" text-anchor="middle" ${mono} font-size="10.5" letter-spacing="2">${date}</text>`
  } else if (h.stamp_shape === 'rect') {
    body = `<rect x="10" y="34" width="180" height="132" rx="14" fill="none" stroke="${c}" stroke-width="5"/><rect x="21" y="45" width="158" height="110" rx="7" fill="none" stroke="${c}" stroke-width="1.4" stroke-dasharray="3 3"/>` +
      `<text x="100" y="66" text-anchor="middle" ${mono} font-size="11.5" letter-spacing="2">${name}</text>` + big(116, 46) +
      `<text x="100" y="142" text-anchor="middle" ${mono} font-size="10.5" letter-spacing="2">${date} · NYC</text>`
  } else {
    body = `<ellipse cx="100" cy="100" rx="94" ry="74" fill="none" stroke="${c}" stroke-width="5"/><ellipse cx="100" cy="100" rx="82" ry="62" fill="none" stroke="${c}" stroke-width="1.6"/>` +
      `<text x="100" y="66" text-anchor="middle" ${mono} font-size="10.5" letter-spacing="2">${name}</text>` + big(118, 46) +
      `<text x="100" y="142" text-anchor="middle" ${mono} font-size="10" letter-spacing="2">${date}</text>`
  }
  return `<svg viewBox="0 0 200 200" role="img" aria-label="Heat ${n} ${esc(h.park)} stamp"><g filter="url(#ink)" opacity=".93">${body}</g></svg>`
}

export function courseSVG(h: Pick<Heat, 'color_key' | 'course_key'>, opts: { light?: boolean } = {}) {
  const c = COURSES[h.course_key ?? ''] ?? COURSES.loop
  const p = park(h)
  const stroke = opts.light ? p.b : '#0B0C0A'
  return `<svg class="course" viewBox="0 0 200 200" aria-hidden="true" style="color:${stroke}"><g${c.t ? ` transform="${c.t}"` : ''}>${c.extra ?? ''}` +
    `<path class="cpath" pathLength="1" d="${c.d}" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle class="cstart" cx="${c.s[0]}" cy="${c.s[1]}" r="7.5" fill="${p.b}" stroke="#0B0C0A" stroke-width="2.6"/></g></svg>`
}

// ───────────── medals: enamel pins, each its own object

export type MedalKind = 'sun' | 'watch' | 'token' | 'mega' | 'star' | 'flame' | 'podium' | 'flower'

function starPts(cx: number, cy: number, R: number, r: number, n: number, rot = -90) {
  const a0 = (rot * Math.PI) / 180
  return Array.from({ length: n * 2 }, (_, i) => { const rr = i % 2 ? r : R, a = a0 + (i * Math.PI) / n; return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}` }).join(' ')
}
const WM = 'class="t-wm" text-anchor="middle"'
const MO = 'class="t-mono" font-weight="600" text-anchor="middle"'
const PETALS = ['#CCFF00', '#FF7A5C', '#5B8CFF', '#FFAA2B', '#A58BFF']

type MedalDef = { c: string; fills?: boolean; shape: (fills: boolean) => string; detail: (G: string, id: string) => string; after?: (G: string) => string }

const MEDALS: Record<MedalKind, MedalDef> = {
  sun: { c: '#CCFF00',
    shape: () => `<polygon points="${starPts(80, 80, 74, 62, 24)}"/>`,
    detail: G => `<circle cx="80" cy="80" r="45" fill="#0B0C0A" stroke="${G}" stroke-width="3"/><circle cx="80" cy="80" r="38" fill="none" stroke="#E3C065" stroke-width="1" stroke-dasharray="1.5 3"/>` +
      `<text x="80" y="64" ${MO} font-size="8" letter-spacing="2.5" fill="#E3C065">FIRST</text><text x="80" y="95" ${WM} font-size="32" fill="#CCFF00">01</text><text x="80" y="108" ${MO} font-size="8" letter-spacing="2.5" fill="#E3C065">HEAT</text>` },
  watch: { c: '#FF7A5C',
    shape: () => '<circle cx="80" cy="90" r="56"/><rect x="69" y="12" width="22" height="14" rx="4"/><rect x="75" y="24" width="10" height="12"/><rect x="117" y="36" width="16" height="11" rx="3" transform="rotate(45 125 41.5)"/>',
    detail: G => {
      let t = ''
      for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6, r1 = i % 3 ? 37 : 33; t += `<line x1="${(80 + r1 * Math.sin(a)).toFixed(1)}" y1="${(90 - r1 * Math.cos(a)).toFixed(1)}" x2="${(80 + 41 * Math.sin(a)).toFixed(1)}" y2="${(90 - 41 * Math.cos(a)).toFixed(1)}" stroke="#C9A24A" stroke-width="2" stroke-linecap="round"/>` }
      return `<circle cx="80" cy="90" r="45" fill="#FFF7F3" stroke="${G}" stroke-width="2.5"/>${t}<path d="M80 90 L80 52 A38 38 0 0 1 112 70 Z" fill="#FF7A5C" opacity=".25"/>` +
        `<line x1="80" y1="90" x2="104" y2="62" stroke="#D2361B" stroke-width="4" stroke-linecap="round"/><circle cx="80" cy="90" r="5.5" fill="#0B0C0A" stroke="${G}" stroke-width="1.5"/><text x="80" y="121" ${WM} font-size="17" fill="#0B0C0A">PR</text>`
    } },
  token: { c: '#E9CF7A',
    shape: () => '<circle cx="80" cy="80" r="68"/>',
    detail: (G, id) => `<circle cx="80" cy="80" r="55" fill="none" stroke="#1F4FD8" stroke-width="21"/><circle cx="80" cy="80" r="65.5" fill="none" stroke="${G}" stroke-width="1.6"/><circle cx="80" cy="80" r="44.5" fill="none" stroke="${G}" stroke-width="1.6"/>` +
      `<path id="${id}tt" d="M 29 80 A 51 51 0 0 1 131 80" fill="none"/><path id="${id}tb" d="M 21 80 A 59 59 0 0 0 139 80" fill="none"/>` +
      `<text ${MO} font-size="8.6" letter-spacing="1.8" fill="#fff"><textPath href="#${id}tt" startOffset="50%">GOOD FOR ONE HEAT</textPath></text>` +
      `<text ${MO} font-size="8.6" letter-spacing="1.8" fill="#fff"><textPath href="#${id}tb" startOffset="50%">NEW YORK · 3 BOROUGHS</textPath></text>` +
      '<circle cx="24.5" cy="80" r="2" fill="#fff"/><circle cx="135.5" cy="80" r="2" fill="#fff"/>' +
      '<polygon points="63,55 74,55 80,67 86,55 97,55 85.5,76 85.5,104 74.5,104 74.5,76" fill="#FFFFFF" stroke="#9C7A22" stroke-width="1.6" stroke-linejoin="round"/>' },
  mega: { c: '#2ED3C6',
    shape: () => '<path d="M28 68 L58 60 L118 28 Q126 24 126 34 L126 126 Q126 136 118 132 L58 100 L28 92 Q22 90 22 80 Q22 70 28 68 Z"/><rect x="52" y="96" width="15" height="32" rx="5" transform="rotate(-12 59 112)"/>',
    detail: G => `<line x1="111" y1="35" x2="111" y2="125" stroke="${G}" stroke-width="2.5"/><line x1="58" y1="61" x2="58" y2="99" stroke="${G}" stroke-width="2.5"/><text x="85" y="86" ${WM} font-size="14" fill="#0B0C0A">LAST</text>`,
    after: G => `<path d="M136 64 Q144 80 136 96" fill="none" stroke="${G}" stroke-width="4" stroke-linecap="round"/><path d="M144 50 Q158 80 144 110" fill="none" stroke="${G}" stroke-width="4" stroke-linecap="round"/>` },
  star: { c: '#A58BFF',
    shape: () => `<polygon points="${starPts(80, 86, 76, 36, 5)}"/>`,
    detail: G => `<polygon points="${starPts(80, 86, 56, 26, 5)}" fill="none" stroke="${G}" stroke-width="1.6" stroke-linejoin="round"/><text x="80" y="101" ${WM} font-size="34" fill="#0B0C0A">5</text>` },
  flame: { c: '#FFAA2B',
    shape: () => '<path d="M80 10 C94 40 124 54 124 94 C124 124 104 146 80 146 C56 146 36 126 36 98 C36 72 54 62 58 42 C66 56 70 62 74 66 C76 48 74 30 80 10 Z"/>',
    detail: G => `<path d="M80 58 C88 76 106 86 106 108 C106 126 95 136 80 136 C65 136 54 126 54 110 C54 94 65 88 69 76 C73 84 76 87 78 89 C79 79 78 70 80 58 Z" fill="#CCFF00" stroke="${G}" stroke-width="1.6"/><text x="80" y="124" ${WM} font-size="16" fill="#0B0C0A">4W</text>` },
  podium: { c: '#3BD481',
    shape: () => '<path d="M18 76 H58 V50 H102 V92 H142 V136 H18 Z"/>',
    detail: G => `<line x1="58" y1="76" x2="58" y2="136" stroke="${G}" stroke-width="2.5"/><line x1="102" y1="92" x2="102" y2="136" stroke="${G}" stroke-width="2.5"/>` +
      `<text x="38" y="114" ${WM} font-size="22" fill="#0B0C0A">2</text><text x="80" y="100" ${WM} font-size="26" fill="#0B0C0A">1</text><text x="122" y="124" ${WM} font-size="20" fill="#0B0C0A">3</text>`,
    after: G => `<polygon points="${starPts(80, 28, 14, 6, 5)}" fill="${G}" stroke="#9C7A22" stroke-width=".8" stroke-linejoin="round"/>` },
  flower: { c: '#FFFFFF', fills: true,
    shape: fills => {
      let s = ''
      for (let k = 0; k < 5; k++) { const a = ((-90 + k * 72) * Math.PI) / 180; s += `<circle cx="${(80 + 36 * Math.cos(a)).toFixed(1)}" cy="${(82 + 36 * Math.sin(a)).toFixed(1)}" r="30"${fills ? ` fill="${PETALS[k]}"` : ''}/>` }
      return s + `<circle cx="80" cy="82" r="25"${fills ? ' fill="#0B0C0A"' : ''}/>`
    },
    detail: G => `<circle cx="80" cy="82" r="20" fill="none" stroke="${G}" stroke-width="1" stroke-dasharray="1.5 3"/><text x="80" y="87" ${WM} font-size="13" fill="#CCFF00">5/5</text>` },
}

export function medalSVG(kind: MedalKind, salt = 'a') {
  const M = MEDALS[kind], id = `md${kind}${salt}`, G = `url(#${id}au)`
  const defs = `<defs><linearGradient id="${id}au" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF4C2"/><stop offset=".3" stop-color="#E3C065"/><stop offset=".55" stop-color="#A07A1C"/><stop offset=".78" stop-color="#F3DB8C"/><stop offset="1" stop-color="#B8902F"/></linearGradient>` +
    `<linearGradient id="${id}gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<clipPath id="${id}c">${M.shape(false)}</clipPath></defs>`
  const rim = `<g fill="${G}" stroke="${G}" stroke-width="11" stroke-linejoin="round">${M.shape(false)}</g>`
  const enamel = `<g fill="${M.c}" stroke="#9C7A22" stroke-width="1.6" stroke-linejoin="round">${M.shape(!!M.fills)}</g>`
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
