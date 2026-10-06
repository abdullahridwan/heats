import path from 'node:path'
import sharp from 'sharp'
import { createWorker, type Worker } from 'tesseract.js'

// OCR of a Strava-style stats band. Tesseract is the biggest serverless risk, so the caller
// treats any failure here as ocr.failed → needs_review rather than throwing. We bundle the
// language data and point langPath at it so nothing is downloaded at runtime.

const LANG_DIR = path.join(process.cwd(), 'eng.traineddata') // file; tesseract wants a dir, set below
const LANG_CACHE = process.env.TESSERACT_CACHE ?? '/tmp'

export type OcrResult = {
  ok: boolean
  distance_km: number | null
  time_s: number | null
  pace_s_per_km: number | null
  mismatch: boolean
  raw: string
}

// Fuzzy label match: OCR gives "Tlme", "Dlstance", "Pace". Normalise and compare loosely.
const normLabel = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '').replace(/[li1]/g, 'i').replace(/[0]/g, 'o')
function looksLike(label: string, target: 'distance' | 'time' | 'pace') {
  const n = normLabel(label)
  const t = target
  if (n === t) return true
  if (n.length >= 4 && n.includes(t)) return true
  // distance: d?stance ; time: t?me ; pace: pace
  if (target === 'distance' && /^d.{0,3}stance$/.test(n)) return true
  if (target === 'time' && /^t.{0,2}me$/.test(n)) return true
  if (target === 'pace' && /^p.{0,2}ce$/.test(n)) return true
  return false
}

// "18m 41s" | "1h 02m 10s" | "1:02:10" | "18:41" → seconds
export function parseDuration(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, '')
  let m: RegExpMatchArray | null
  if ((m = s.match(/^(?:(\d+)h)?(\d+)m(?:(\d+)s)?$/))) {
    return (+(m[1] ?? 0)) * 3600 + (+m[2]) * 60 + (+(m[3] ?? 0))
  }
  if ((m = s.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/))) {
    const a = +m[1], b = +m[2], c = m[3] ? +m[3] : null
    return c === null ? a * 60 + b : a * 3600 + b * 60 + c
  }
  return null
}

// "5.02 km" | "3.11 mi" | "3.11mi" → km
export function parseDistance(raw: string): number | null {
  const s = raw.trim().toLowerCase()
  const m = s.match(/(\d+(?:[.,]\d+)?)\s*(km|mi|m)?/)
  if (!m) return null
  let v = parseFloat(m[1].replace(',', '.'))
  const unit = m[2] ?? 'km'
  if (unit === 'mi') v *= 1.609344
  if (unit === 'm' && !/km/.test(s)) v /= 1000
  return v
}

export function parsePace(raw: string): number | null {
  const s = raw.trim().toLowerCase()
  const perMi = /(?:^|\/)\s*mi\b|per\s*mi/.test(s)
  const duration = parseDuration(s.replace(/\s*\/?\s*(km|mi).*$/, ''))
  if (duration === null) return null
  const perKm = perMi ? duration / 1.609344 : duration
  return Math.round(perKm)
}

// time ≈ pace × distance, within max(5 s, 1%). Catches misreads even when each field looks sane.
export function crossChecks(timeS: number | null, distanceKm: number | null, paceS: number | null) {
  if (timeS === null || distanceKm === null || paceS === null) return false
  const predicted = paceS * distanceKm
  const tol = Math.max(5, timeS * 0.01)
  return Math.abs(predicted - timeS) <= tol
}

let workerPromise: Promise<Worker> | null = null
async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker('eng', 1, {
      langPath: path.dirname(LANG_DIR),
      cachePath: LANG_CACHE,
      gzip: false,
      logger: () => {},
    })
  }
  return workerPromise
}

// Crop the bottom ~36% (the stats band), greyscale, upscale 2×, normalise, then extract the
// Distance / Time / Pace values from whatever layout OCR produces.
export async function readStatsBuf(buf: Buffer): Promise<OcrResult> {
  const base = sharp(buf)
  const meta = await base.metadata()
  const W = meta.width ?? 0, H = meta.height ?? 0
  if (!W || !H) return { ok: false, distance_km: null, time_s: null, pace_s_per_km: null, mismatch: false, raw: '' }

  // Crop the stats band. Real cards put the stats below the map, but the map/stat split varies,
  // so take a generous band from 58% down rather than 64% — cheaper to over-include than to clip.
  const bandTop = Math.floor(H * 0.58)
  const band = sharp(buf)
    .extract({ left: 0, top: bandTop, width: W, height: H - bandTop })
    .greyscale()
    .resize(W * 2, (H - bandTop) * 2, { fit: 'fill' })
    .normalise()

  let raw = ''
  try {
    const bandBuf = await band.png().toBuffer()
    const worker = await getWorker()
    const { data } = await worker.recognize(bandBuf)
    raw = data.text

    // Robust extraction. OCR may put the label and value on one line ("Distance 5.02 km"), on
    // separate lines, or merge rows. Rather than trusting layout, collect every value-looking
    // token in the band, then classify: the value nearest a label wins; if there are no labels,
    // fall back to shape (a duration, a distance with a unit, a duration-with-/km).
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)

    const dur = (s: string) => parseDuration(s)
    const dist = (s: string) => parseDistance(s)
    const pace = (s: string) => parsePace(s)

    // Candidates: pull substrings that look like each field.
    let distance_km: number | null = null
    let time_s: number | null = null
    let pace_s_per_km: number | null = null

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // distance: number followed by km/mi anywhere on the line
      const dm = line.match(/(\d+(?:[.,]\d+)?)\s*(km|mi)\b/i)
      const hasDistLabel = looksLike(line, 'distance')
      // time: h/m/s form or clock form (but not a "/km" or "/mi" pace)
      const isPaceLine = /\/\s*(km|mi)\b|per\s*(km|mi)\b/i.test(line)
      const tm = line.replace(/[^0-9:hms.\s]/gi, ' ').trim()
      const hasTimeLabel = looksLike(line, 'time') || looksLike(lines[i - 1] ?? '', 'time')
      const hasPaceLabel = looksLike(line, 'pace') || isPaceLine

      if (pace_s_per_km === null && isPaceLine) {
        const p = pace(line.replace(/^.*?([\d:]+)\s*\/\s*(km|mi).*$/i, '$1/$2'))
        if (p !== null) pace_s_per_km = p
      }
      if (distance_km === null && dm && !isPaceLine) {
        const d = dist(dm[0]); if (d !== null) distance_km = d
      }
      if (time_s === null && !isPaceLine) {
        // Prefer a labelled time; else any duration-shaped token on the line.
        const cand = hasTimeLabel ? (parseClockish(line) ?? dur(tm)) : parseClockish(line)
        if (cand !== null && cand >= 60) time_s = cand
      }

      // value on the line below a bare label
      if (distance_km === null && hasDistLabel) { const d = dist(lines[i + 1] ?? ''); if (d !== null) distance_km = d }
      if (time_s === null && looksLike(line, 'time')) { const nxt = lines[i + 1] ?? ''; const t = parseClockish(nxt) ?? dur(nxt); if (t !== null && t >= 60) time_s = t }
      if (pace_s_per_km === null && hasPaceLabel) { const p = pace(lines[i + 1] ?? ''); if (p !== null) pace_s_per_km = p }
    }

    // If the time never surfaced (e.g. it fell on one merged line), take the first duration-shaped
    // token in the whole band that isn't a pace.
    if (time_s === null) {
      for (const line of lines) {
        if (/\/\s*(km|mi)\b/i.test(line)) continue
        const c = parseClockish(line)
        if (c !== null && c >= 600) { time_s = c; break }
      }
    }

    const ok = distance_km !== null && time_s !== null
    const mismatch = ok && pace_s_per_km !== null && !crossChecks(time_s, distance_km, pace_s_per_km)
    return { ok, distance_km, time_s, pace_s_per_km, mismatch, raw }
  } catch {
    return { ok: false, distance_km: null, time_s: null, pace_s_per_km: null, mismatch: false, raw }
  }
}

// A clock-looking duration inside a longer string ("18:41", "1:02:10"). Returns null if none.
function parseClockish(s: string): number | null {
  const m = s.match(/(\d{1,2}:\d{2}(?::\d{2})?)/)
  return m ? parseDuration(m[1]) : null
}

// Exported so tests can hit the parsers without touching a worker.
export const _internal = { looksLike, normLabel }
