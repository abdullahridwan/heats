/**
 * Renders the Luma artwork from the site's own art code:
 *   brand/luma/heats-logo.png        calendar avatar (the volt H mark)
 *   brand/luma/heat-001-cover.png    event cover for Heat 001
 * Run: npx tsx --conditions=react-server scripts/luma-assets.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import { medalSVG, stampSVG } from '../src/lib/art'
import { COURSE, CENTRAL } from '../src/lib/themes'

const OUT = path.join(process.cwd(), '..', 'brand', 'luma')
const FONTS = ['archivo-black-italic-wide', 'geist-400', 'geist-600', 'geist-mono-500', 'geist-mono-600'].map(f => path.join(process.cwd(), 'assets/fonts', `${f}.ttf`))
const render = (svg: string, width: number) =>
  new Resvg(svg, { font: { loadSystemFonts: false, fontFiles: FONTS, defaultFontFamily: 'Geist' }, fitTo: { mode: 'width', value: width } }).render().asPng()

const STYLE = `<style>
  .t-wm{font-family:'Archivo Expanded Black','Archivo Expanded','Archivo';font-style:italic;font-weight:900}
  .t-mono{font-family:'Geist Mono';font-weight:600}
  .g4{font-family:'Geist';font-weight:400}.g6{font-family:'Geist';font-weight:600}.m5{font-family:'Geist Mono';font-weight:500}
</style>`
const INK = `<filter id="ink" x="-10%" y="-10%" width="120%" height="120%">
  <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="4" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="d"/>
  <feTurbulence type="fractalNoise" baseFrequency="1.8" numOctaves="1" seed="9" result="s"/>
  <feColorMatrix in="s" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -4.2 0 0 0 3.05" result="m"/>
  <feComposite in="d" in2="m" operator="in"/></filter>
<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .5 0"/></filter>`

const nest = (svg: string, vb: number, x: number, y: number, size: number, rot = 0) =>
  `<g transform="translate(${x} ${y}) rotate(${rot} ${size / 2} ${size / 2}) scale(${size / vb})">${svg.replace('<svg viewBox', `<svg width="${vb}" height="${vb}" viewBox`)}</g>`

// ───────── logo: the H mark, same geometry as components/art.tsx <Mark>
const logo = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 100 100">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E3FF5C"/><stop offset="1" stop-color="#B8F000"/></linearGradient></defs>
  <rect width="100" height="100" fill="url(#g)"/>
  <polygon points="32,22 46,22 38,78 24,78" fill="#0B0C0A"/><polygon points="62,22 76,22 68,78 54,78" fill="#0B0C0A"/><polygon points="37,43 67,43 65.4,55 35.4,55" fill="#0B0C0A"/>
</svg>`

// ───────── cover: the site's race cover (volt gradient, grain, Central Park loop) + the Heat 001 stamp
const S = 1080
const HEAT = { number: 1, name: 'Chilly Central Park 5K', opens_at: '2026-10-10T04:00:00Z', location_terms: ['Central Park'] }
const blob = (cx: number, cy: number, r: number, c: string, id: string) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient><rect width="${S}" height="${S}" fill="url(#${id})"/>`
const cover = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${STYLE}<defs>${INK}</defs>
  <rect width="${S}" height="${S}" fill="${CENTRAL.s}"/>
  ${blob(190, 150, 640, CENTRAL.b, 'a')}${blob(960, 240, 560, CENTRAL.g, 'b')}${blob(650, 1060, 620, CENTRAL.s, 'c')}
  <rect width="${S}" height="${S}" filter="url(#grain)" opacity=".22"/>
  <text x="70" y="104" class="t-mono" font-size="30" letter-spacing="3" fill="#0B0C0A" opacity=".72">HEAT 001</text>
  <text x="1010" y="104" text-anchor="end" class="t-mono" font-size="30" letter-spacing="3" fill="#0B0C0A" opacity=".72">5.0 KM</text>
  <g transform="translate(150 150) scale(3.6)"><g transform="${COURSE.t ?? ''}">
    <path d="${COURSE.d}" fill="none" stroke="#0B0C0A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${COURSE.s[0]}" cy="${COURSE.s[1]}" r="7.5" fill="${CENTRAL.b}" stroke="#0B0C0A" stroke-width="2.6"/>
  </g></g>
  ${nest(stampSVG(HEAT, 'cover'), 200, 560, 520, 470, -10)}
  <text x="70" y="900" class="g6" font-size="84" letter-spacing="-3" fill="#0B0C0A">Chilly Central</text>
  <text x="70" y="986" class="g6" font-size="84" letter-spacing="-3" fill="#0B0C0A">Park 5K</text>
  <text x="70" y="1040" class="t-wm" font-size="34" letter-spacing="-1" fill="#0B0C0A">HEATS</text>
  <text x="1010" y="1040" text-anchor="end" class="m5" font-size="26" fill="#0B0C0A" opacity=".72">SAT OCT 10 · ANY TIME</text>
</svg>`

// ───────── cloud cover: sky to match Luma's clouds theme, same loop + stamp + type
const puff = (cx: number, cy: number, k: number) =>
  `<g transform="translate(${cx} ${cy}) scale(${k})" filter="url(#soft)" fill="#fff">` +
  `<ellipse cx="0" cy="20" rx="170" ry="52"/><ellipse cx="-70" cy="0" rx="80" ry="62"/><ellipse cx="20" cy="-22" rx="96" ry="78"/><ellipse cx="105" cy="6" rx="70" ry="54"/></g>`
const clouds = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${STYLE}<defs>${INK}
  <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FAEF2"/><stop offset=".55" stop-color="#BBD4F7"/><stop offset="1" stop-color="#EEF4FD"/></linearGradient>
</defs>
  <rect width="${S}" height="${S}" fill="url(#sky)"/>
  <g opacity=".95">${puff(860, 230, 1.1)}${puff(170, 560, 0.85)}${puff(930, 690, 0.75)}${puff(420, 860, 1.25)}</g>
  <rect width="${S}" height="${S}" filter="url(#grain)" opacity=".16"/>
  <text x="70" y="104" class="t-mono" font-size="30" letter-spacing="3" fill="#0B0C0A" opacity=".75">HEAT 001</text>
  <text x="1010" y="104" text-anchor="end" class="t-mono" font-size="30" letter-spacing="3" fill="#0B0C0A" opacity=".75">5.0 KM</text>
  <g transform="translate(150 150) scale(3.6)"><g transform="${COURSE.t ?? ''}">
    <path d="${COURSE.d}" fill="none" stroke="#0B0C0A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${COURSE.s[0]}" cy="${COURSE.s[1]}" r="7.5" fill="${CENTRAL.b}" stroke="#0B0C0A" stroke-width="2.6"/>
  </g></g>
  ${nest(stampSVG(HEAT, 'clouds'), 200, 590, 540, 440, -10)}
  <text x="70" y="900" class="g6" font-size="84" letter-spacing="-3" fill="#0B0C0A">Chilly Central</text>
  <text x="70" y="986" class="g6" font-size="84" letter-spacing="-3" fill="#0B0C0A">Park 5K</text>
  <text x="70" y="1040" class="t-wm" font-size="34" letter-spacing="-1" fill="#0B0C0A">HEATS</text>
  <text x="1010" y="1040" text-anchor="end" class="m5" font-size="26" fill="#0B0C0A" opacity=".75">ENGINEERS' GATE · SAT OCT 10</text>
</svg>`

// ───────── calendar banner: Heats as a whole. Content sits in the middle band so any crop works.
const BW = 2400, BH = 1000
const bblob = (cx: number, cy: number, r: number, c: string, o: number, id: string) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${c}" stop-opacity="${o}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient><rect width="${BW}" height="${BH}" fill="url(#${id})"/>`
const banner = `<svg xmlns="http://www.w3.org/2000/svg" width="${BW}" height="${BH}" viewBox="0 0 ${BW} ${BH}">${STYLE}<defs>${INK}</defs>
  <rect width="${BW}" height="${BH}" fill="#FFFFFF"/>
  ${bblob(380, 160, 900, CENTRAL.b, 0.55, 'ba')}${bblob(2050, 220, 900, '#B8CCFF', 0.75, 'bb')}${bblob(1250, 1050, 800, CENTRAL.g, 0.6, 'bc')}
  <rect width="${BW}" height="${BH}" filter="url(#grain)" opacity=".14"/>
  <text x="300" y="520" class="t-wm" font-size="250" letter-spacing="-10" fill="#0B0C0A">HEATS</text>
  <text x="306" y="625" class="g6" font-size="62" letter-spacing="-2" fill="#0B0C0A">Free community 5Ks across New York.</text>
  <text x="306" y="700" class="g4" font-size="44" fill="#3B3E38">Run it. Post your Strava screenshot. Get stamped.</text>
  ${nest(stampSVG(HEAT, 'banner'), 200, 1560, 250, 500, -9)}
  <g transform="translate(1930 520) rotate(10 110 110)">${medalSVG('founding', 'banner').replace('<svg viewBox', '<svg width="220" height="220" viewBox')}</g>
</svg>`

// ───────── flat system: solid volt + black only. No gradients, glow or grain.
const VOLT = '#CCFF00', BLACK = '#0B0C0A'
const inkStamp = (salt: string) => stampSVG(HEAT, salt).replaceAll('#B4471B', BLACK)

const bannerFlat = `<svg xmlns="http://www.w3.org/2000/svg" width="${BW}" height="${BH}" viewBox="0 0 ${BW} ${BH}">${STYLE}<defs>${INK}</defs>
  <rect width="${BW}" height="${BH}" fill="${VOLT}"/>
  <text x="300" y="540" class="t-wm" font-size="280" letter-spacing="-12" fill="${BLACK}">HEATS</text>
  <text x="308" y="650" class="g6" font-size="64" letter-spacing="-2" fill="${BLACK}">Free community 5Ks across New York.</text>
  <text x="308" y="724" class="g4" font-size="44" fill="${BLACK}" opacity=".7">Run it. Post your Strava screenshot. Get stamped.</text>
  ${nest(inkStamp('bflat'), 200, 1600, 240, 520, -9)}
</svg>`

const coverFlat = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${STYLE}<defs>${INK}</defs>
  <rect width="${S}" height="${S}" fill="${VOLT}"/>
  <text x="70" y="104" class="t-mono" font-size="30" letter-spacing="3" fill="${BLACK}">HEAT 001</text>
  <text x="1010" y="104" text-anchor="end" class="t-mono" font-size="30" letter-spacing="3" fill="${BLACK}">5.0 KM</text>
  <g transform="translate(150 150) scale(3.6)"><g transform="${COURSE.t ?? ''}">
    <path d="${COURSE.d}" fill="none" stroke="${BLACK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${COURSE.s[0]}" cy="${COURSE.s[1]}" r="7.5" fill="#FFFFFF" stroke="${BLACK}" stroke-width="2.6"/>
  </g></g>
  ${nest(inkStamp('cflat'), 200, 590, 540, 440, -10)}
  <text x="70" y="900" class="g6" font-size="84" letter-spacing="-3" fill="${BLACK}">Chilly Central</text>
  <text x="70" y="986" class="g6" font-size="84" letter-spacing="-3" fill="${BLACK}">Park 5K</text>
  <text x="70" y="1040" class="t-wm" font-size="34" letter-spacing="-1" fill="${BLACK}">HEATS</text>
  <text x="1010" y="1040" text-anchor="end" class="m5" font-size="26" fill="${BLACK}">ENGINEERS' GATE · SAT OCT 10</text>
</svg>`

// ───────── type banner: white, one readable headline, the wordmark bleeding off the bottom.
// Text is measured with resvg so the highlight hugs its word exactly.
function measure(text: string, cls: string, size: number, spacing: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="1000">${STYLE}<text x="0" y="700" class="${cls}" font-size="${size}" letter-spacing="${spacing}">${text}</text></svg>`
  const bb = new Resvg(svg, { font: { loadSystemFonts: false, fontFiles: FONTS, defaultFontFamily: 'Geist' } }).getBBox()
  return bb ? { x: bb.x, w: bb.width, top: bb.y, h: bb.height } : { x: 0, w: 0, top: 0, h: 0 }
}
const M = 130                      // left margin, shared by every element
const HS = 230, HL = -8            // headline size + tracking
const free = measure('FREE', 't-wm', HS, HL)
const space = measure('FREE 5KS', 't-wm', HS, HL).w - measure('FREE', 't-wm', HS, HL).w - measure('5KS', 't-wm', HS, HL).w
const fiveK = measure('5KS', 't-wm', HS, HL)
const kX = M + free.w + space
const L1 = 400, L2 = 640           // headline baselines
const pad = 22
const bannerType = `<svg xmlns="http://www.w3.org/2000/svg" width="${BW}" height="${BH}" viewBox="0 0 ${BW} ${BH}">${STYLE}<defs>${INK}</defs>
  <rect width="${BW}" height="${BH}" fill="#FFFFFF"/>
  <text x="${M}" y="130" class="t-mono" font-size="30" letter-spacing="5" fill="${BLACK}">HEATS NYC</text>
  <text x="${BW - M}" y="130" text-anchor="end" class="t-mono" font-size="30" letter-spacing="5" fill="${BLACK}">COMMUNITY 5KS · EVERY PACE</text>
  <rect x="${kX - fiveK.x - pad}" y="${L1 - (700 - fiveK.top) - pad}" width="${fiveK.w + pad * 2}" height="${fiveK.h + pad * 2}" fill="${VOLT}"/>
  <text x="${M - free.x}" y="${L1}" class="t-wm" font-size="${HS}" letter-spacing="${HL}" fill="${BLACK}">FREE <tspan>5KS</tspan></text>
  <text x="${M - free.x}" y="${L2}" class="t-wm" font-size="${HS}" letter-spacing="${HL}" fill="${BLACK}">NYC ONLY.</text>
  <text x="${M - 10}" y="1185" class="t-wm" font-size="560" letter-spacing="-22" fill="${BLACK}">HEATS</text>
</svg>`

mkdirSync(OUT, { recursive: true })
writeFileSync(path.join(OUT, 'heats-logo.png'), render(logo, 1000))
writeFileSync(path.join(OUT, 'heat-001-cover.png'), render(cover, S))
writeFileSync(path.join(OUT, 'heat-001-cover-clouds.png'), render(clouds, S))
writeFileSync(path.join(OUT, 'calendar-cover.png'), render(bannerType, BW))
writeFileSync(path.join(OUT, 'heat-001-cover-flat.png'), render(coverFlat, S))
console.log('wrote', OUT)
