import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ensureRunner, joinHeat } from '@/lib/runners'
import { supabaseServer } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const Body = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  handle: z.string().optional().nullable(),
  heat: z.number().int().optional().nullable(),
  next: z.string().optional().nullable(),
})

// Finishes an email-link sign in. The /auth/callback page hands over the tokens from the link; we store
// the session in cookies, create the runner on first sign in, join the heat, and say where to go next.
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'link_invalid' }, { status: 400 })
  const { access_token, refresh_token, handle, heat, next } = parsed.data

  const supabase = await supabaseServer()
  const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
  if (error || !data.user) return NextResponse.json({ error: 'link_expired' }, { status: 401 })

  const runner = await ensureRunner(data.user.id, (data.user.email ?? '').toLowerCase(), handle)
  if (!runner.ok) return NextResponse.json({ error: runner.error }, { status: 409 })

  if (heat) {
    await joinHeat(runner.runnerId, heat)
    return NextResponse.json({ redirect: `/join/${heat}` })
  }
  const safe = next && next.startsWith('/') && !next.startsWith('//') ? next : '/calendar'
  return NextResponse.json({ redirect: safe })
}
