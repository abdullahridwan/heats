/**
 * Renders the Luma artwork from the site's own art code:
 *   brand/luma/heats-logo.png        calendar avatar (the volt H mark)
 *   brand/luma/heat-001-cover.png    event cover for Heat 001
 * Run: npx tsx --conditions=react-server scripts/luma-assets.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import { stampSVG } from '../src/lib/art'
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

mkdirSync(OUT, { recursive: true })
writeFileSync(path.join(OUT, 'heats-logo.png'), render(logo, 1000))
writeFileSync(path.join(OUT, 'heat-001-cover.png'), render(cover, S))
console.log('wrote', OUT)
