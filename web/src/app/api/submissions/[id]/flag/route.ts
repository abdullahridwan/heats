import { NextResponse } from 'next/server'
import { getMe } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// "Numbers wrong?" — the runner flags their own stamped submission for a human look.
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getMe()
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params

  const { data: row } = await db()
    .from('submissions').select('id, user_id, status')
    .eq('id', id).maybeSingle()
  if (!row || row.user_id !== me.id) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  // Only an auto-stamped row can be flagged. A rejected row must not be able to re-enter review
  // (that would bypass the admin's call and the attempt cap), and a human-verified row is final.
  if (row.status !== 'auto_verified') return NextResponse.json({ error: 'not_flaggable' }, { status: 409 })

  const { error } = await db().from('submissions')
    .update({ status: 'needs_review', review_reason: 'runner_flagged' })
    .eq('id', id).eq('user_id', me.id).eq('status', 'auto_verified')
  if (error) return NextResponse.json({ error: 'update_failed' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
