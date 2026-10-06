import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getMe } from '@/lib/auth'
import { db } from '@/lib/db'
import { getHeat } from '@/lib/data'
import { runPipeline } from '@/lib/pipeline'
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
  const me = await getMe()
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const { path, note } = parsed.data

  // The runner may only submit their own upload path.
  if (!path.startsWith(`${me.id}/`)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const heat = await getHeat(parsed.data.heat ?? 1)
  if (!heat) return NextResponse.json({ error: 'no_heat' }, { status: 404 })

  // Window check against the server clock.
  const now = Date.now()
  if (now < new Date(heat.opens_at).getTime() || now > new Date(heat.closes_at).getTime()) {
    return NextResponse.json({ error: 'window_closed' }, { status: 403 })
  }

  // The user row must exist (a runner has picked an alias).
  const { data: user } = await db().from('users').select('id').eq('id', me.id).maybeSingle()
  if (!user) return NextResponse.json({ error: 'no_profile' }, { status: 409 })

  // Fetch the image from storage with the service key.
  const { data: blob, error: dlErr } = await db().storage.from('proofs').download(path)
  if (dlErr || !blob) return NextResponse.json({ error: 'image_missing' }, { status: 404 })
  const bytes = Buffer.from(await blob.arrayBuffer())
  const contentType = blob.type || 'application/octet-stream'

  // One live submission per runner per heat. A verified row is locked; needs_review / rejected
  // rows can be resubmitted up to 5 attempts.
  const { data: existing } = await db()
    .from('submissions').select('id, status, attempts')
    .eq('user_id', me.id).eq('heat_id', heat.id).maybeSingle()

  if (existing?.status === 'verified' || existing?.status === 'auto_verified') {
    return NextResponse.json({ error: 'already_stamped' }, { status: 409 })
  }
  if (existing && (existing.attempts as number) >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: 'too_many_attempts' }, { status: 429 })
  }

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
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'pipeline_failed'
    const status = msg === 'too_large' ? 413 : msg === 'bad_type' ? 415 : 500
    return NextResponse.json({ error: msg }, { status })
  }

  const fields = {
    user_id: me.id,
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

  if (existing) {
    const { error } = await db().from('submissions')
      .update({ ...fields, attempts: (existing.attempts as number) + 1 })
      .eq('id', existing.id)
    if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 })
  } else {
    const { error } = await db().from('submissions').insert({ ...fields, attempts: 1 })
    if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 })
  }

  // Place is only meaningful once the row is stamped.
  let place: number | null = null
  if (result.status === 'auto_verified') {
    const { data } = await db().from('results').select('place').eq('heat_id', heat.id).eq('alias', (await aliasOf(me.id))).maybeSingle()
    place = (data?.place as number) ?? null
  }

  return NextResponse.json({
    status: result.status,
    review_reason: result.review_reason,
    distance_km: result.distance_km,
    time_s: result.time_s,
    place,
    heat: heatNo(heat.number),
  })
}

async function aliasOf(userId: string): Promise<string> {
  const { data } = await db().from('users').select('alias').eq('id', userId).maybeSingle()
  return (data?.alias as string) ?? ''
}
