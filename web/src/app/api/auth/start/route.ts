import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { normalizeHandle, validateHandle } from '@/lib/handles'
import { supabaseServer } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const Body = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  handle: z.string().optional(),
})

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'bad_email' }, { status: 400 })
  const { email, handle: rawHandle } = parsed.data

  const { data: existing } = await db().from('users').select('id').eq('email', email).maybeSingle()
  const newRunner = !existing

  let handle: string | null = null
  if (newRunner) {
    if (!rawHandle) return NextResponse.json({ error: 'handle_required' }, { status: 400 })
    handle = normalizeHandle(rawHandle)
    const check = validateHandle(handle)
    if (!check.ok) return NextResponse.json({ error: `handle_${check.reason}` }, { status: 400 })

    const { data: taken } = await db().from('users').select('id').eq('alias', handle).maybeSingle()
    if (taken) return NextResponse.json({ error: 'handle_taken' }, { status: 409 })
  }

  const supabase = await supabaseServer()
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
  if (error) {
    const rateLimited = error.status === 429 || /rate/i.test(error.message)
    if (rateLimited) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
    return NextResponse.json({ error: 'send_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, newRunner })
}
