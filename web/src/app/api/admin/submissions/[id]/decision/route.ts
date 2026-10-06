import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

const Body = z.object({
  decision: z.enum(['verify', 'reject']),
  reason: z.string().trim().max(200).optional(),
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await import('@clerk/nextjs/server').then(m => m.auth())
  if (!(await isAdmin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const { id } = await params
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 })

  const update = parsed.data.decision === 'verify'
    ? { status: 'verified' as const, review_reason: null, reviewed_by: userId, reviewed_at: new Date().toISOString() }
    : { status: 'rejected' as const, review_reason: parsed.data.reason || 'rejected by admin', reviewed_by: userId, reviewed_at: new Date().toISOString() }

  const { error } = await db().from('submissions').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: 'update_failed' }, { status: 500 })

  return NextResponse.json({ ok: true, status: update.status })
}
