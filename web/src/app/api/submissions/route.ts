import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { runPipeline } from '@/lib/pipeline'
import { getRunner } from '@/lib/session'
import { heatNo } from '@/lib/time'

export const runtime = 'nodejs'
export const maxDuration = 30

const Body = z.object({
  path: z.string().min(1),
  note: z.string().trim().max(100).optional().nullable(),
  heat: z.number().int().optional(),
})

const MAX_ATTEMPTS = 5

export async function POST(req: Request) {
  const runner = await getRunner()
  if (!runner) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const { path, note } = parsed.data

  // The runner may only submit their own upload path.
  if (!path.startsWith(`${runner.id}/`) || path.includes('..')) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  // Explicit heat number, or the live heat when omitted.
  const nowIso = new Date().toISOString()
  const heatQuery = db().from('heats')
    .select('id, number, opens_at, closes_at, location_terms, min_km, max_km')
  const { data: heat } = parsed.data.heat !== undefined
    ? await heatQuery.eq('number', parsed.data.heat).maybeSingle()
    : await heatQuery.lte('opens_at', nowIso).gte('closes_at', nowIso)
      .order('opens_at', { ascending: false }).limit(1).maybeSingle()
  if (!heat) return NextResponse.json({ error: 'no_heat' }, { status: 404 })

  // Window check against the server clock.
  const now = Date.now()
  if (now < new Date(heat.opens_at).getTime() || now > new Date(heat.closes_at).getTime()) {
    return NextResponse.json({ error: 'window_closed' }, { status: 403 })
  }

  // Fetch the image from storage with the service key.
  const { data: blob, error: dlErr } = await db().storage.from('proofs').download(path)
  if (dlErr || !blob) return NextResponse.json({ error: 'image_missing' }, { status: 404 })
  const bytes = Buffer.from(await blob.arrayBuffer())
  const contentType = blob.type || 'application/octet-stream'

  // One live submission per runner per heat. A verified row is locked; needs_review / rejected
  // rows can be resubmitted up to 5 attempts.
  const { data: existing } = await db()
    .from('submissions').select('id, status, attempts')
    .eq('user_id', runner.id).eq('heat_id', heat.id).maybeSingle()

  if (existing?.status === 'verified' || existing?.status === 'auto_verified') {
    return NextResponse.json({ error: 'already_stamped' }, { status: 409 })
  }
  if (existing && (existing.attempts as number) >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: 'too_many_attempts' }, { status: 429 })
  }

  // From here the answer streams as newline-delimited JSON: one {type:'step'} line per check as it
  // finishes, then one {type:'done'} or {type:'error'} line. Errors before this point stay plain JSON.
  const enc = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(enc.encode(JSON.stringify(obj) + '\n'))
      try {
        let result
        try {
          result = await runPipeline({
            heatId: heat.id,
            locationTerms: heat.location_terms,
            minKm: Number(heat.min_km),
            maxKm: Number(heat.max_km),
            bytes,
            contentType,
            ignoreSubmissionId: existing?.id as string | undefined,
            onStep: st => send({ type: 'step', ...st }),
          })
        } catch (e) {
          send({ type: 'error', error: e instanceof Error ? e.message : 'pipeline_failed' })
          return
        }

        const fields = {
          user_id: runner.id,
          heat_id: heat.id,
          image_path: path,
          sha256: result.sha256,
          dhash: result.dhash,
          distance_km: result.distance_km,
          time_s: result.time_s,
          pace_s_per_km: result.pace_s_per_km,
          ocr_raw: result.ocr_raw as object,
          vision_raw: result.vision_raw as object,
          is_strava: result.is_strava,
          location_ok: result.location_ok,
          note: note ?? null,
          status: result.status,
          review_reason: result.review_reason,
        }

        const { error } = existing
          ? await db().from('submissions').update({ ...fields, attempts: (existing.attempts as number) + 1 }).eq('id', existing.id)
          : await db().from('submissions').insert({ ...fields, attempts: 1 })
        if (error) {
          send({ type: 'error', error: 'save_failed' })
          return
        }

        // Place is only meaningful once the row is stamped.
        let place: number | null = null
        if (result.status === 'auto_verified') {
          const { data } = await db().from('results').select('place').eq('heat_id', heat.id).eq('alias', runner.alias).maybeSingle()
          place = (data?.place as number) ?? null
        }

        send({
          type: 'done',
          status: result.status,
          review_reason: result.review_reason,
          distance_km: result.distance_km,
          time_s: result.time_s,
          place,
          heat: heatNo(heat.number),
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
