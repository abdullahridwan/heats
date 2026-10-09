import 'server-only'
import path from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import { medalSVG, stampSVG, type MedalKind } from './art'
import { PARKS } from './themes'
import { formatTime, heatNo, longDate, ordinal } from './time'
import type { Heat, Stamp } from './types'

// 1080×1920 Instagram-story images, drawn as one SVG with the real stamp/medal art and rendered
// by resvg. Two frames matter in v1: the "I'm running" invite and the "Stamped" result.
const W = 1080, H = 1920
const FONT_DIR = path.join(process.cwd(), 'assets/fonts')
const FONTS = ['archivo-black-italic-wide', 'geist-400', 'geist-600', 'geist-mono-500', 'geist-mono-600'].map(f => path.join(FONT_DIR, `${f}.ttf`))

const site = () => (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://heats.run').replace(/^https?:\/\//, '').replace(/\/$/, '')
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export function renderPng(svg: string) {
  const r = new Resvg(svg, { font: { loadSystemFonts: false, fontFiles: FONTS, defaultFontFamily: 'Geist' }, fitTo: { mode: 'width', value: W } })
  return r.render().asPng()
}

const STYLE = `<style>
  .t-wm{font-family:'Archivo Expanded Black','Archivo Expanded','Archivo';font-style:italic;font-weight:900}
  .t-mono{font-family:'Geist Mono';font-weight:600}
  .g4{font-family:'Geist';font-weight:400}
  .g6{font-family:'Geist';font-weight:600}
  .m5{font-family:'Geist Mono';font-weight:500}
</style>`

const DEFS = `<defs>
  <filter id="ink" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="4" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feTurbulence type="fractalNoise" baseFrequency="1.8" numOctaves="1" seed="9" result="s"/>
    <feColorMatrix in="s" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -4.2 0 0 0 3.05" result="m"/>
    <feComposite in="d" in2="m" operator="in"/>
  </filter>
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .5 0"/>
  </filter>
  <filter id="lift" x="-10%" y="-10%" width="120%" height="140%"><feDropShadow dx="0" dy="24" stdDeviation="28" flood-color="#0B0C0A" flood-opacity=".16"/></filter>
</defs>`

function frame(body: string, bg: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${STYLE}${DEFS}${bg}${body}</svg>`
}

function parkBg(id: string) {
  const p = PARKS.volt
  const blob = (cx: number, cy: number, r: number, c: string, n: string) =>
    `<radialGradient id="${id}${n}" cx="${cx}" cy="${cy}" r="${r}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient><rect width="${W}" height="${H}" fill="url(#${id}${n})"/>`
  return `<rect width="${W}" height="${H}" fill="${p.s}"/>` +
    blob(200, 260, 900, p.b, 'a') + blob(980, 420, 760, p.g, 'b') + blob(640, 1880, 900, '#FFFFFF', 'c') +
    `<rect width="${W}" height="${H}" filter="url(#grain)" opacity=".2"/>`
}

const nest = (svg: string, vb: number, x: number, y: number, size: number, rot = 0) =>
  `<g transform="translate(${x} ${y}) rotate(${rot} ${size / 2} ${size / 2}) scale(${size / vb})">${svg.replace('<svg viewBox', `<svg width="${vb}" height="${vb}" viewBox`)}</g>`

const header = () =>
  `<text x="80" y="140" class="t-wm" font-size="52" letter-spacing="-2" fill="#0B0C0A">HEATS</text>` +
  `<text x="1000" y="136" text-anchor="end" class="m5" font-size="28" fill="#0B0C0A" opacity=".7">${esc(site())}</text>`

function wrap(text: string, maxChars: number) {
  const lines: string[] = []
  for (const w of text.split(' ')) {
    const last = lines[lines.length - 1]
    if (last && (last + ' ' + w).length <= maxChars) lines[lines.length - 1] = last + ' ' + w
    else lines.push(w)
  }
  return lines
}

// ───────── "I'm running Heat 001"
export function heatStory(heat: Heat, opts: { alias?: string }) {
  const n = heatNo(heat.number)
  const lines = wrap(heat.name, 16)
  const nameY = 470
  const name = lines.map((l, i) => `<text x="80" y="${nameY + i * 128}" class="g6" font-size="120" letter-spacing="-6" fill="#0B0C0A">${esc(l)}</text>`).join('')
  const after = nameY + (lines.length - 1) * 128 + 96
  const opens = new Date(heat.opens_at)
  const dateIso = opens.toISOString()
  const body =
    header() +
    `<rect x="80" y="236" width="${opts.alias ? 330 : 300}" height="64" rx="32" fill="#FFFFFF" fill-opacity=".8"/>` +
    `<circle cx="116" cy="268" r="10" fill="${PARKS.volt.b}" stroke="#0B0C0A" stroke-width="2"/>` +
    `<text x="140" y="279" class="t-mono" font-size="28" letter-spacing="3" fill="#0B0C0A">${opts.alias ? "I'M RUNNING" : 'JOIN ME'}</text>` +
    name +
    `<text x="80" y="${after}" class="g4" font-size="42" fill="#0B0C0A" opacity=".8">Heat ${n} · ${esc(longDate(dateIso))}</text>` +
    `<text x="80" y="${after + 58}" class="g4" font-size="42" fill="#0B0C0A" opacity=".8">All day · Free · every pace</text>` +
    nest(stampSVG(heat, 'story'), 200, 400, Math.max(after + 110, 900), 600, -10) +
    `<g filter="url(#lift)"><rect x="60" y="1500" width="960" height="330" rx="48" fill="#FFFFFF"/></g>` +
    `<text x="80" y="1600" class="g6" font-size="44" letter-spacing="-1" fill="#0B0C0A">${opts.alias ? `${esc(opts.alias)} is in` : `Heat ${n} is open`}</text>` +
    `<text x="80" y="1652" class="g4" font-size="32" fill="#5E625B">Show up, run it, get stamped</text>` +
    `<rect x="100" y="1700" width="880" height="96" rx="30" fill="${PARKS.volt.b}"/>` +
    `<text x="540" y="1762" text-anchor="middle" class="g6" font-size="38" fill="#0B0C0A">Run it with me · ${esc(site())}/post</text>`
  return frame(body, parkBg('hb'))
}

// ───────── "Stamped": a stamped result
export function resultStory(heat: Heat, r: { alias: string; time_s: number; place: number; finishers: number; note: string | null }) {
  const n = heatNo(heat.number)
  const note = r.note ? wrap(`“${r.note}”`, 30).slice(0, 2) : []
  const title = wrap(`Heat ${n} · ${heat.name}`, 28).slice(0, 2)
  const top = 420 + (title.length - 1) * 70
  const body =
    header() +
    `<rect x="80" y="236" width="270" height="64" rx="32" fill="#0B0C0A"/>` +
    `<circle cx="116" cy="268" r="10" fill="${PARKS.volt.b}"/>` +
    `<text x="140" y="279" class="t-mono" font-size="28" letter-spacing="3" fill="#FFFFFF">STAMPED</text>` +
    title.map((l, i) => `<text x="80" y="${400 + i * 70}" class="g6" font-size="60" letter-spacing="-2" fill="#0B0C0A">${esc(l)}</text>`).join('') +
    `<text x="72" y="${top + 280}" class="m5" font-size="290" letter-spacing="-22" fill="#0B0C0A">${formatTime(r.time_s)}</text>` +
    `<text x="80" y="${top + 380}" class="g6" font-size="64" letter-spacing="-2" fill="#0B0C0A">${ordinal(r.place)} of ${r.finishers}</text>` +
    note.map((l, i) => `<text x="80" y="${top + 470 + i * 60}" class="g4" font-size="46" fill="#0B0C0A" opacity=".7">${esc(l)}</text>`).join('') +
    nest(stampSVG(heat, 'res'), 200, 380, 1000, 640, -12) +
    `<text x="80" y="1760" class="t-wm" font-size="40" letter-spacing="-1" fill="#0B0C0A">@${esc(r.alias)}</text>` +
    `<text x="1000" y="1760" text-anchor="end" class="m5" font-size="30" fill="#0B0C0A" opacity=".7">${esc(site())}/results</text>`
  return frame(body, parkBg('rb'))
}

// ───────── "My run passport"
const PSPOTS = [
  { x: 40, y: 90, r: -9 }, { x: 330, y: 70, r: 8 }, { x: 610, y: 100, r: -5 },
  { x: 60, y: 380, r: 6 }, { x: 350, y: 360, r: -12 }, { x: 620, y: 390, r: 10 },
]
export function passportStory(alias: string, stamps: Stamp[], medals: { kind: MedalKind; earned: boolean }[]) {
  const best = stamps.length ? Math.min(...stamps.map(f => f.time_s)) : null
  const earned = medals.filter(m => m.earned)
  const recent = stamps.slice(-6)
  const stat = (x: number, v: string, l: string) =>
    `<rect x="${x}" y="560" width="290" height="150" rx="28" fill="#FFFFFF" stroke="#ECEDE7" stroke-width="2"/>` +
    `<text x="${x + 30}" y="638" class="m5" font-size="60" letter-spacing="-3" fill="#0B0C0A">${esc(v)}</text>` +
    `<text x="${x + 30}" y="684" class="g4" font-size="28" fill="#5E625B">${l}</text>`
  let guill = ''
  for (let k = 0; k < 30; k++) guill += `<ellipse cx="460" cy="380" rx="520" ry="200" fill="none" stroke="${['#CCFF00', '#FFB3A1', '#9FD8F5'][k % 3]}" stroke-opacity=".45" stroke-width="1.2" transform="rotate(${k * 6} 460 380)"/>`
  const page =
    `<g transform="translate(80 770)"><g filter="url(#lift)"><rect width="920" height="740" rx="36" fill="#FFFFFF"/></g>` +
    `<clipPath id="pg"><rect width="920" height="740" rx="36"/></clipPath><g clip-path="url(#pg)">${guill}</g>` +
    `<rect width="920" height="740" rx="36" fill="none" stroke="#ECEDE7" stroke-width="2"/>` +
    `<text x="40" y="58" class="m5" font-size="22" letter-spacing="5" fill="#5E625B">STAMPS</text>` +
    `<text x="880" y="58" text-anchor="end" class="m5" font-size="22" letter-spacing="5" fill="#5E625B">2026</text>` +
    (recent.length
      ? recent.map((f, i) => nest(stampSVG(f.heat, `ps${i}`), 200, PSPOTS[i].x, PSPOTS[i].y, 270, PSPOTS[i].r)).join('')
      : `<circle cx="460" cy="380" r="150" fill="none" stroke="#CDD0C7" stroke-width="4" stroke-dasharray="14 12"/><text x="460" y="392" text-anchor="middle" class="g6" font-size="40" fill="#5E625B">First stamp soon</text>`) +
    `</g>`
  const size = earned.length > 3 ? 128 : 148
  const gap = 16
  const total = earned.length * size + Math.max(0, earned.length - 1) * gap
  const medalsRow = earned.length
    ? earned.map((m, i) => nest(medalSVG(m.kind, `pm${i}`), 160, 540 - total / 2 + i * (size + gap), 1560, size)).join('')
    : `<text x="540" y="1640" text-anchor="middle" class="g4" font-size="36" fill="#5E625B">Medals unlock as you run</text>`
  const body =
    header() +
    `<text x="80" y="330" class="t-mono" font-size="30" letter-spacing="6" fill="#0B0C0A" opacity=".7">MY RUN PASSPORT</text>` +
    `<text x="76" y="470" class="g6" font-size="${alias.length > 12 ? 104 : 136}" letter-spacing="-6" fill="#0B0C0A">${esc(alias)}</text>` +
    stat(80, String(stamps.length), stamps.length === 1 ? 'heat' : 'heats') + stat(395, String(earned.length), 'medals') + stat(710, best ? formatTime(best) : '—', 'best 5K') +
    page + medalsRow +
    `<rect x="100" y="1730" width="880" height="96" rx="30" fill="#0B0C0A"/>` +
    `<text x="540" y="1792" text-anchor="middle" class="g6" font-size="38" fill="#CCFF00">Get your passport · ${esc(site())}</text>`
  return frame(body, `<rect width="${W}" height="${H}" fill="#FFFFFF"/>`)
}
