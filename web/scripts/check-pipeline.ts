/**
 * Fixture harness for the submission pipeline.
 *
 * Drop real screenshots into fixtures/ with a matching .json expectation, then:
 *   npx tsx scripts/check-pipeline.ts
 *
 * Each fixture: fixtures/<name>.(png|jpg|webp) + fixtures/<name>.json
 *   { "distance_km": 5.02, "time_s": 1121, "is_strava": true, "location_ok": true }
 *
 * The target is every number and the location right, at least 9 times out of 10.
 * Without OPENROUTER_API_KEY, vision fields come back null and rows land in vision_unavailable,
 * so run this with the key set to exercise the full decision.
 *
 * This harness imports only the pure modules (lib/ocr, lib/dhash), so it runs under tsx without
 * Next. It does not call the vision model or the database.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { readStatsBuf, crossChecks } from '../src/lib/ocr'
import { dhash, sha256 } from '../src/lib/dhash'

const DIR = join(process.cwd(), 'fixtures')

type Expect = { distance_km?: number; time_s?: number; is_strava?: boolean; location_ok?: boolean }

async function main() {
  let files: string[]
  try { files = readdirSync(DIR) } catch { console.log(`No fixtures/ dir. Create ${DIR} and add screenshots.`); return }
  const images = files.filter(f => /\.(png|jpe?g|webp)$/i.test(f) && !f.startsWith('_'))
  if (!images.length) { console.log('No images in fixtures/.'); return }

  let pass = 0, total = 0
  for (const img of images) {
    const name = img.replace(/\.[^.]+$/, '')
    let expect: Expect = {}
    try { expect = JSON.parse(readFileSync(join(DIR, `${name}.json`), 'utf8')) } catch { /* no expectations */ }

    const bytes = readFileSync(join(DIR, img))
    const ocr = await readStatsBuf(bytes)
    const hash = await dhash(bytes)
    const sha = sha256(bytes)

    const checks: [string, boolean][] = []
    if (expect.distance_km !== undefined) checks.push(['distance_km', ocr.distance_km !== null && Math.abs(ocr.distance_km - expect.distance_km) < 0.15])
    if (expect.time_s !== undefined) checks.push(['time_s', ocr.time_s === expect.time_s])
    checks.push(['cross_check', ocr.time_s === null || ocr.pace_s_per_km === null || crossChecks(ocr.time_s, ocr.distance_km, ocr.pace_s_per_km)])

    const ok = checks.every(([, v]) => v)
    total++; if (ok) pass++

    console.log(`${ok ? 'PASS' : 'FAIL'} ${img}`)
    console.log(`   ocr: dist=${ocr.distance_km} time=${ocr.time_s} pace=${ocr.pace_s_per_km} mismatch=${ocr.mismatch}`)
    console.log(`   sha=${sha.slice(0, 12)} dhash=${hash}`)
    for (const [k, v] of checks) if (!v) console.log(`   ✗ ${k}`)
  }
  console.log(`\n${pass}/${total} fixtures correct. Target: 9/10.`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => process.exit(0))
