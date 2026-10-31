import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { normalizeHandle, validateHandle } from '@/lib/handles'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const Body = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  handle: z.string().optional(),
  heat: z.number().int().optional(),
  next: z.string().optional(),
})

// Sends the sign-in email. The link goes to /auth/callback, carrying the claimed handle and the heat
// being joined, so tapping it finishes everything in one step.
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'bad_email' }, { status: 400 })
  const { email, handle: rawHandle, heat, next } = parsed.data

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

  const callback = new URL('/auth/callback', new URL(req.url).origin)
  if (handle) callback.searchParams.set('handle', handle)
  if (heat) callback.searchParams.set('heat', String(heat))
  if (next && next.startsWith('/') && !next.startsWith('//')) callback.searchParams.set('next', next)

  // Implicit flow: the link carries the session itself, so it works in any browser or app (the Gmail
  // in-app browser, another phone). The SSR client is PKCE-only, which needs the same browser.
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { flowType: 'implicit', persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: callback.toString() },
  })
  if (error) {
    const rateLimited = error.status === 429 || /rate/i.test(error.message)
    if (rateLimited) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
    return NextResponse.json({ error: 'send_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, newRunner })
}
