import 'server-only'
import sharp from 'sharp'
import { db } from './db'
import { dhash, hamming, sha256 } from './dhash'
import { readStatsBuf, type OcrResult } from './ocr'
import { checkCard, type VisionResult } from './vision'

const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp'])
const HAMMING_MAX = 6

export type ReviewReason =
  | 'not_strava' | 'location' | 'ocr_mismatch' | 'distance'
  | 'duplicate' | 'runner_flagged' | 'vision_unavailable'

export type PipelineInput = {
  heatId: string
  locationTerms: string[]
  minKm: number
  maxKm: number
  bytes: Buffer
  contentType: string
  /** exclude this submission id when checking duplicates (resubmits) */
  ignoreSubmissionId?: string
  /** called as each check finishes, so the runner can watch the checklist fill in */
  onStep?: (step: PipelineStep) => void
}

export type StepId = 'numbers' | 'distance' | 'app' | 'park' | 'duplicate'
export type PipelineStep = { id: StepId; state: 'ok' | 'fail' | 'skip'; detail?: string }

export type PipelineOutput = {
  status: 'auto_verified' | 'needs_review'
  review_reason: ReviewReason | null
  sha256: string
  dhash: string
  distance_km: number | null
  time_s: number | null
  pace_s_per_km: number | null
  ocr_raw: unknown
  vision_raw: unknown
  is_strava: boolean | null
  location_ok: boolean | null
}

// The whole card sent to the vision model, scaled to ~768px wide, as a data URL. Whole card because
// share stickers put the stats and route anywhere, and the model doubles as a second number reader.
async function cardDataUrl(buf: Buffer): Promise<string | null> {
  try {
    const out = await sharp(buf).resize(768, null, { withoutEnlargement: true }).webp({ quality: 80 }).toBuffer()
    return `data:image/webp;base64,${out.toString('base64')}`
  } catch {
    return null
  }
}

// OCR's read when it is clean, otherwise the vision model's read of the same card.
function effectiveNumbers(ocr: OcrResult, vision: VisionResult | null): OcrResult {
  if (ocr.ok && !ocr.mismatch) return ocr
  if (vision?.distance_km && vision.time_s) {
    return { ...ocr, ok: true, mismatch: false, distance_km: vision.distance_km, time_s: vision.time_s, pace_s_per_km: null }
  }
  return ocr
}

export function decide(o: {
  duplicate: boolean
  vision: VisionResult | null
  ocr: OcrResult
  km: number | null
  minKm: number
  maxKm: number
}): { status: 'auto_verified' | 'needs_review'; review_reason: ReviewReason | null } {
  if (o.duplicate) return { status: 'needs_review', review_reason: 'duplicate' }
  if (!o.ocr.ok || o.ocr.mismatch) return { status: 'needs_review', review_reason: 'ocr_mismatch' }
  if (o.km === null || o.km < o.minKm || o.km > o.maxKm) return { status: 'needs_review', review_reason: 'distance' }
  // Vision is the only source of not_strava / location. If it didn't answer, we never auto-verify
  // and we never blame the runner (vision_unavailable).
  if (!o.vision) return { status: 'needs_review', review_reason: 'vision_unavailable' }
  if (!o.vision.is_strava_card) return { status: 'needs_review', review_reason: 'not_strava' }
  if (!o.vision.location_ok) return { status: 'needs_review', review_reason: 'location' }
  return { status: 'auto_verified', review_reason: null }
}

// Returns true when this image is a duplicate of an existing submission for the heat.
// Exact: same sha256. Near: hamming ≤ 6 AND the same parsed time and distance, because two
// different runners' cards over the same park look alike at the pixel level.
export async function isDuplicate(heatId: string, sha: string, hash: string, timeS: number | null, km: number | null, ignoreId?: string): Promise<boolean> {
  let q = db().from('submissions').select('id, sha256, dhash, time_s, distance_km').eq('heat_id', heatId)
  if (ignoreId) q = q.neq('id', ignoreId)
  const { data } = await q
  for (const row of data ?? []) {
    if (row.sha256 === sha) return true
    const close = hamming(hash, row.dhash as string) <= HAMMING_MAX
    if (close && row.time_s === timeS && num(row.distance_km) !== null && km !== null && Math.abs(num(row.distance_km)! - km) < 0.05) return true
  }
  return false
}

function numbersDetail(r: OcrResult): string {
  const parts: string[] = []
  if (r.distance_km !== null) parts.push(`${r.distance_km.toFixed(2)} km`)
  if (r.time_s !== null) parts.push(`${Math.floor(r.time_s / 60)}:${String(r.time_s % 60).padStart(2, '0')}`)
  return parts.join(' / ')
}

const num = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v))

export async function runPipeline(input: PipelineInput): Promise<PipelineOutput> {
  if (input.bytes.byteLength > MAX_BYTES) throw new Error('too_large')
  if (!ALLOWED.has(input.contentType)) throw new Error('bad_type')

  const sha = sha256(input.bytes)
  const hash = await dhash(input.bytes)

  const step = input.onStep ?? (() => {})
  const minKm = Number(input.minKm), maxKm = Number(input.maxKm)
  const numberSteps = (r: OcrResult) => {
    const read = r.ok && !r.mismatch
    step({ id: 'numbers', state: read ? 'ok' : 'fail', detail: read ? numbersDetail(r) : undefined })
    const inRange = r.distance_km !== null && r.distance_km >= minKm && r.distance_km <= maxKm
    step({ id: 'distance', state: inRange ? 'ok' : 'fail', detail: r.distance_km !== null ? `${r.distance_km.toFixed(2)} km` : undefined })
  }

  // OCR and vision are independent, so run them together; each reports its checks as soon as it lands.
  // A clean OCR read ticks the number checks right away; otherwise they wait for the vision model's read.
  let numbersShown = false
  const [ocrRaw, vision] = await Promise.all([
    readStatsBuf(input.bytes).then(r => {
      if (r.ok && !r.mismatch) { numberSteps(r); numbersShown = true }
      return r
    }),
    (async (): Promise<VisionResult | null> => {
      const img = await cardDataUrl(input.bytes)
      const v = img ? await checkCard(img, input.locationTerms) : null
      step({ id: 'app', state: v ? (v.is_strava_card ? 'ok' : 'fail') : 'skip' })
      step({ id: 'park', state: v ? (v.location_ok ? 'ok' : 'fail') : 'skip' })
      return v
    })(),
  ])
  const ocr = effectiveNumbers(ocrRaw, vision)
  if (!numbersShown) numberSteps(ocr)

  const km = ocr.distance_km
  const timeS = ocr.time_s
  const duplicate = await isDuplicate(input.heatId, sha, hash, timeS, km, input.ignoreSubmissionId)
  step({ id: 'duplicate', state: duplicate ? 'fail' : 'ok' })

  const { status, review_reason } = decide({
    duplicate, vision, ocr, km,
    minKm, maxKm,
  })

  return {
    status, review_reason,
    sha256: sha, dhash: hash,
    distance_km: km, time_s: timeS, pace_s_per_km: ocr.pace_s_per_km,
    ocr_raw: ocrRaw, vision_raw: vision,
    is_strava: vision ? vision.is_strava_card : null,
    location_ok: vision ? vision.location_ok : null,
  }
}
