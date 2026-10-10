/**
 * Dumps the site's own stamp, medal and course art for the Remotion video project (../video).
 * Run: npx tsx --conditions=react-server scripts/dump-art.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import { medalSVG, stampSVG } from '../src/lib/art'
import { COURSE } from '../src/lib/themes'

const heat = { number: 1, name: 'Chilly Central Park 5K', opens_at: '2026-10-10T04:00:00Z', closes_at: '2026-10-11T03:59:59Z', location_terms: ['Central Park'] }
const out = path.resolve(__dirname, '../../video/src/art.json')
fs.writeFileSync(out, JSON.stringify({ stamp: stampSVG(heat as never, 'v'), medal: medalSVG('founding', 'v'), course: COURSE }, null, 1))
console.log('wrote', out)
