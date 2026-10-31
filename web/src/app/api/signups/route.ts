import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getRunner } from '@/lib/session'

export const runtime = 'nodejs'

const Body = z.object({ heat: z.number().int() })

export async function POST(req: Request) {
  const runner = await getRunner()
  if (!runner) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 })

  const { data: heat } = await db()
    .from('heats').select('id, closes_at').eq('number', parsed.data.heat).maybeSingle()
  if (!heat) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (new Date(heat.closes_at as string).getTime() < Date.now()) {
    return NextResponse.json({ error: 'closed' }, { status: 409 })
  }

  const { error } = await db().from('signups').upsert(
    { user_id: runner.id, heat_id: heat.id },
    { onConflict: 'user_id,heat_id', ignoreDuplicates: true },
  )
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
