import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdmin } from '@/lib/admin'
import { db } from '@/lib/db'
import { SCENES, type SceneKey } from '@/lib/stamps'

export const runtime = 'nodejs'

const SCENE_KEYS = Object.keys(SCENES) as [SceneKey, ...SceneKey[]]

const Body = z
  .object({
    number: z.number().int().min(1),
    name: z.string().trim().min(1).max(80),
    park: z.string().trim().min(1).max(60),
    scene: z.enum(SCENE_KEYS),
    opens_at: z.iso.datetime({ offset: true }),
    closes_at: z.iso.datetime({ offset: true }),
    location_terms: z.array(z.string().trim().min(1).max(60)).max(30),
    min_km: z.number().positive().max(100),
    max_km: z.number().positive().max(100),
  })
  .refine(b => Date.parse(b.closes_at) > Date.parse(b.opens_at), {
    path: ['closes_at'],
    message: 'closes_at must be after opens_at',
  })
  .refine(b => b.min_km < b.max_km, {
    path: ['max_km'],
    message: 'max_km must be greater than min_km',
  })

// Create or update a heat. Heats are keyed by number, so saving an existing number updates it.
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'bad_request', message: parsed.error.issues[0]?.message ?? 'Invalid heat' },
      { status: 400 },
    )
  }

  const h = parsed.data
  const { error } = await db()
    .from('heats')
    .upsert(
      {
        number: h.number,
        name: h.name,
        park: h.park,
        scene: h.scene,
        opens_at: h.opens_at,
        closes_at: h.closes_at,
        location_terms: h.location_terms,
        min_km: h.min_km,
        max_km: h.max_km,
      },
      { onConflict: 'number' },
    )
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
