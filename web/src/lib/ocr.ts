import path from 'node:path'
import sharp from 'sharp'
import { createWorker, PSM, type Worker } from 'tesseract.js'

// OCR of a Strava-style stats band. Tesseract is the biggest serverless risk, so the caller
// treats any failure here as ocr.failed → needs_review rather than throwing. The language data
// is bundled in assets/tessdata (tracked in git, traced into the submissions function) and
// langPath points at it, so nothing is downloaded at runtime.
//
// Two passes. Pass 1 reads the whole band and finds the Distance / Time / Pace labels. Pass 2
// re-reads the value directly under each label with a digits-only whitelist and a single-line
// layout, because pass 1 garbles stylised numerals ("18m 41s" came back as "18mé4ls" on a real
// card). The time is then chosen by cross-checking against pace × distance.

const LANG_DIR = path.join(process.cwd(), 'assets', 'tessdata')
const LANG_CACHE = process.env.TESSERACT_CACHE ?? '/tmp'
const SCALE = 2

export type OcrResult = {
  ok: boolean
  distance_km: number | null
  time_s: number | null
  pace_s_per_km: number | null
  mismatch: boolean
  raw: string
  /** every time we considered, for the admin / debugging */
  time_candidates: number[]
}

const FAILED: OcrResult = { ok: false, distance_km: null, time_s: null, pace_s_per_km: null, mismatch: false, raw: '', time_candidates: [] }

// Fuzzy label match: OCR gives "Tlme", "Dlstance", "Pace". Normalise and compare loosely.
const normLabel = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '').replace(/[li1]/g, 'i').replace(/[0]/g, 'o')
type Kind = 'distance' | 'time' | 'pace'
function looksLike(label: string, target: Kind) {
  const n = normLabel(label)
  const t = target
  if (n === t) return true
  if (n.length >= 4 && n.includes(t)) return true
  if (target === 'distance' && /^d.{0,3}stance$/.test(n)) return true
  if (target === 'time' && (/^t.{0,2}me$/.test(n) || /^(ti|tim|ime)$/.test(n))) return true
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

// "113 mi" → 1.13 mi when time ÷ pace says the distance is about 1.8 km. Tries each decimal
// position and keeps the first that lands within 3% of the predicted distance. The final
// cross-check still decides whether the whole read is trusted.
function recoverDecimal(texts: string[], times: number[], paceS: number): number | null {
  for (const txt of texts) {
    const unit = /mi/i.test(txt) ? 'mi' : /km/i.test(txt) ? 'km' : null
    const digits = txt.replace(/[^0-9]/g, '')
    if (!unit || digits.length < 2 || digits.length > 4) continue
    for (const t of times) {
      const predicted = t / paceS
      for (let i = 1; i < digits.length; i++) {
        const km = parseFloat(`${digits.slice(0, i)}.${digits.slice(i)}`) * (unit === 'mi' ? 1.609344 : 1)
        if (Math.abs(km - predicted) <= predicted * 0.03) return km
      }
    }
  }
  return null
}

// A clock-looking duration inside a longer string ("18:41", "1:02:10"). Returns null if none.
function parseClockish(s: string): number | null {
  const m = s.match(/(\d{1,2}:\d{2}(?::\d{2})?)/)
  return m ? parseDuration(m[1]) : null
}

// ───────────────────────── worker

let workerPromise: Promise<Worker> | null = null
async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker('eng', 1, {
      langPath: LANG_DIR,
      cachePath: LANG_CACHE,
      gzip: false,
      logger: () => {},
    }).catch(e => {
      // Don't cache a failed start: the next request should get a fresh attempt.
      workerPromise = null
      throw e
    })
  }
  return workerPromise
}

// One worker, one job at a time. The re-read passes change the whitelist and layout mode, so
// two requests must never interleave on the same worker.
let chain: Promise<unknown> = Promise.resolve()
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn)
  chain = run.catch(() => undefined)
  return run
}

type Word = { text: string; x0: number; y0: number; x1: number; y1: number }

async function recognizeWords(worker: Worker, img: Buffer): Promise<{ text: string; words: Word[] }> {
  const { data } = await worker.recognize(img, {}, { blocks: true })
  const words: Word[] = []
  for (const b of data.blocks ?? []) for (const p of b.paragraphs) for (const l of p.lines) for (const w of l.words) {
    words.push({ text: w.text, x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1 })
  }
  return { text: data.text, words }
}

const WHITELIST: Record<Kind, string> = {
  time: '0123456789hms ',
  distance: '0123456789.,kmi ',
  pace: '0123456789:/kmi ',
}

// Re-read the value directly under a label, in two contrast variants, with a digits-only
// whitelist and single-line layout. Returns the raw strings (parsed by the caller).
async function rereadBelow(worker: Worker, band: Buffer, bw: number, bh: number, label: Word, nextX: number, kind: Kind): Promise<string[]> {
  const lh = Math.max(1, label.y1 - label.y0)
  const left = Math.max(0, Math.min(bw - 40, label.x0 - 24))
  const right = Math.max(left + 40, Math.min(bw, nextX - 8))
  const top = Math.max(0, Math.min(bh - 20, label.y1 + 4))
  const height = Math.max(20, Math.min(bh - top, Math.round(lh * 3.8)))
  const base = sharp(band).extract({ left, top, width: right - left, height })
  const variants = [
    await base.clone().resize({ height: 140 }).png().toBuffer(),
    await base.clone().negate().resize({ height: 140 }).png().toBuffer(),
  ]
  const out: string[] = []
  try {
    await worker.setParameters({ tessedit_char_whitelist: WHITELIST[kind], tessedit_pageseg_mode: PSM.SINGLE_LINE })
    for (const v of variants) {
      const { data } = await worker.recognize(v)
      const t = data.text.trim()
      if (t) out.push(t)
    }
  } finally {
    await worker.setParameters({ tessedit_char_whitelist: '', tessedit_pageseg_mode: PSM.AUTO })
  }
  return out
}

// Where the stats can be. The standard activity screen puts them in a band below the map; share
// stickers and photo cards put them anywhere, often light text over a photo. Try the band first
// (fast, least noise), then the whole card, then the whole card inverted, and stop at the first read
// whose time, distance and pace agree.
const REGIONS: { top: number; bottom: number; negate: boolean }[] = [
  { top: 0.58, bottom: 1, negate: false },
  { top: 0, bottom: 0.5, negate: false },
  { top: 0, bottom: 1, negate: false },
  { top: 0, bottom: 1, negate: true },
]

export async function readStatsBuf(buf: Buffer): Promise<OcrResult> {
  let best: OcrResult = FAILED
  for (const r of REGIONS) {
    const res = await readRegion(buf, r.top, r.bottom, r.negate)
    if (res.ok && !res.mismatch) return res
    if (res.ok && !best.ok) best = res
    if (!best.raw && res.raw) best = { ...best, raw: res.raw }
  }
  return best
}

// Crop from `topFrac` down, greyscale, upscale (small screenshots get more), normalise, optionally
// invert, then extract the Distance / Time / Pace values from whatever layout OCR produces.
async function readRegion(buf: Buffer, topFrac: number, bottomFrac: number, negate: boolean): Promise<OcrResult> {
  let meta
  try { meta = await sharp(buf).metadata() } catch { return FAILED }
  const W = meta.width ?? 0, H = meta.height ?? 0
  if (!W || !H) return FAILED

  const bandTop = Math.floor(H * topFrac)
  const bandH = Math.max(1, Math.floor(H * bottomFrac) - bandTop)
  // Tesseract wants glyphs roughly 30px tall: aim for a ~1600px-wide working image.
  const scale = Math.min(6, Math.max(SCALE, Math.ceil(1600 / W)))
  const bw = W * scale, bh = bandH * scale

  let bandBuf: Buffer
  try {
    let img = sharp(buf)
      .extract({ left: 0, top: bandTop, width: W, height: bandH })
      .greyscale()
      .resize(bw, bh, { fit: 'fill' })
      .normalise()
    if (negate) img = img.negate()
    bandBuf = await img.png().toBuffer()
  } catch {
    return FAILED
  }

  return serial(async () => {
    let raw = ''
    try {
      const worker = await getWorker()
      await worker.setParameters({ tessedit_char_whitelist: '', tessedit_pageseg_mode: PSM.AUTO })
      const first = await recognizeWords(worker, bandBuf)
      raw = first.text

      // ── pass 1: whole-band extraction, tolerant of the layout OCR produces
      let distance_km: number | null = null
      let time1: number | null = null
      let pace_s_per_km: number | null = null
      let distText = ''
      const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const dm = line.match(/(\d+(?:[.,]\d+)?)\s*(km|mi)\b/i)
        const hasDistLabel = looksLike(line, 'distance')
        const isPaceLine = /\/\s*(km|mi)\b|per\s*(km|mi)\b/i.test(line)
        const tm = line.replace(/[^0-9:hms.\s]/gi, ' ').trim()
        const hasTimeLabel = looksLike(line, 'time') || looksLike(lines[i - 1] ?? '', 'time')
        const hasPaceLabel = looksLike(line, 'pace') || isPaceLine

        if (pace_s_per_km === null && isPaceLine) {
          const p = parsePace(line.replace(/^.*?([\d:]+)\s*\/\s*(km|mi).*$/i, '$1/$2'))
          if (p !== null) pace_s_per_km = p
        }
        if (distance_km === null && dm && !isPaceLine) {
          const d = parseDistance(dm[0]); if (d !== null) { distance_km = d; distText = dm[0] }
        }
        if (time1 === null && !isPaceLine) {
          // Unlabelled "45m 52s" is unambiguous enough to take; bare digits are not.
          const hms = /\d+\s*m\s*\d+\s*s\b|\d+\s*h\s*\d+\s*m/i.test(line) ? parseDuration(tm) : null
          const cand = hasTimeLabel ? (parseClockish(line) ?? parseDuration(tm)) : (parseClockish(line) ?? hms)
          if (cand !== null && cand >= 60) time1 = cand
        }
        if (distance_km === null && hasDistLabel) { const d = parseDistance(lines[i + 1] ?? ''); if (d !== null) distance_km = d }
        if (time1 === null && looksLike(line, 'time')) { const nxt = lines[i + 1] ?? ''; const t = parseClockish(nxt) ?? parseDuration(nxt); if (t !== null && t >= 60) time1 = t }
        if (pace_s_per_km === null && hasPaceLabel) { const p = parsePace(lines[i + 1] ?? ''); if (p !== null) pace_s_per_km = p }
      }
      if (time1 === null) {
        for (const line of lines) {
          if (/\/\s*(km|mi)\b/i.test(line)) continue
          const c = parseClockish(line)
          if (c !== null && c >= 600) { time1 = c; break }
        }
      }

      // ── pass 2: re-read the value under each label
      const labelWords = first.words.map(w => ({ w, kind: (['distance', 'time', 'pace'] as Kind[]).find(k => looksLike(w.text, k)) })).filter((x): x is { w: Word; kind: Kind } => !!x.kind)
      const rowNextX = (label: Word) => {
        const lh = Math.max(1, label.y1 - label.y0)
        const right = labelWords.map(x => x.w).filter(o => o !== label && Math.abs(o.y0 - label.y0) < lh && o.x0 > label.x1)
        return right.length ? Math.min(...right.map(o => o.x0)) : bw
      }
      const reread = async (kind: Kind): Promise<string[]> => {
        const hit = labelWords.find(x => x.kind === kind)
        return hit ? rereadBelow(worker, bandBuf, bw, bh, hit.w, rowNextX(hit.w), kind) : []
      }

      const timeCands = new Set<number>()
      for (const s of await reread('time')) { const t = parseDuration(s) ?? parseClockish(s); if (t !== null && t >= 60) timeCands.add(t) }
      const rereadTimes = [...timeCands]
      if (time1 !== null) timeCands.add(time1)

      // Distance and pace usually read fine in pass 1; re-read them only when missing or when
      // nothing agrees yet, and keep whichever value makes pace × distance match a time.
      const pick = <T,>(cur: T | null, cands: T[], fits: (v: T) => boolean): T | null => {
        if (cur !== null && fits(cur)) return cur
        // Nothing to cross-check against: trust the digits-only re-read over the whole-band read.
        return cands.find(fits) ?? cands[0] ?? cur
      }
      const anyTime = (f: (t: number) => boolean) => [...timeCands].some(f)
      if (distance_km === null || !anyTime(t => crossChecks(t, distance_km, pace_s_per_km))) {
        const dTexts = (await reread('distance')).filter(s => /(km|mi)/i.test(s))
        const ds = dTexts.map(parseDistance).filter((d): d is number => d !== null)
        distance_km = pick(distance_km, ds, d => anyTime(t => crossChecks(t, d, pace_s_per_km)))
        // A lost decimal point ("113 mi" for 1.13 mi) is recoverable: time ÷ pace says how far.
        if (pace_s_per_km !== null && !anyTime(t => crossChecks(t, distance_km, pace_s_per_km))) {
          const rec = recoverDecimal([distText, ...dTexts], [...timeCands], pace_s_per_km)
          if (rec !== null) distance_km = rec
        }
      }
      if (pace_s_per_km === null || !anyTime(t => crossChecks(t, distance_km, pace_s_per_km))) {
        const ps = (await reread('pace')).map(s => (/(km|mi)/i.test(s) ? parsePace(s) : null)).filter((p): p is number => p !== null)
        pace_s_per_km = pick(pace_s_per_km, ps, p => anyTime(t => crossChecks(t, distance_km, p)))
      }

      // Choose the time: the one that agrees with pace × distance; prefer the digits-only read.
      const agreeing = [...timeCands].filter(t => crossChecks(t, distance_km, pace_s_per_km))
      const time_s = agreeing.find(t => rereadTimes.includes(t)) ?? agreeing[0] ?? rereadTimes[0] ?? time1

      const ok = distance_km !== null && time_s !== null
      const mismatch = ok && pace_s_per_km !== null && !crossChecks(time_s, distance_km, pace_s_per_km)
      return { ok, distance_km, time_s, pace_s_per_km, mismatch, raw, time_candidates: [...timeCands] }
    } catch {
      return { ...FAILED, raw }
    }
  })
}

// Exported so tests can hit the parsers without touching a worker.
export const _internal = { looksLike, normLabel }
