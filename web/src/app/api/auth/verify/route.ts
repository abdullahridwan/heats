import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { normalizeHandle, validateHandle } from '@/lib/handles'
import { supabaseServer } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const Body = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  code: z.string().regex(/^\d{6}$/),
  handle: z.string().optional(),
  heat: z.number().int().optional(),
})

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const { email, code, handle: rawHandle, heat: heatNumber } = parsed.data

  // Signs the browser in: the session cookie is written by supabaseServer().
  const supabase = await supabaseServer()
  const { data: otp, error: otpErr } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
  if (otpErr || !otp.user) return NextResponse.json({ error: 'bad_code' }, { status: 400 })
  const authUser = otp.user

  let runnerId: string
  let alias: string

  const { data: byId } = await db().from('users').select('id, alias').eq('id', authUser.id).maybeSingle()
  if (byId) {
    runnerId = byId.id as string
    alias = byId.alias as string
  } else {
    const { data: byEmail } = await db().from('users').select('id, alias').eq('email', email).maybeSingle()
    if (byEmail) {
      // A row from before email-code sign in (the old Clerk ids). Move it onto this auth id so
      // getRunner() finds it from now on. If other rows already point at it, keep the old id.
      const { error: moveErr } = await db().from('users').update({ id: authUser.id }).eq('id', byEmail.id)
      runnerId = moveErr ? (byEmail.id as string) : authUser.id
      alias = byEmail.alias as string
    } else {
      if (!rawHandle) return NextResponse.json({ error: 'handle_required' }, { status: 400 })
      const handle = normalizeHandle(rawHandle)
      const check = validateHandle(handle)
      if (!check.ok) return NextResponse.json({ error: `handle_${check.reason}` }, { status: 400 })

      const { error: insErr } = await db().from('users').insert({ id: authUser.id, alias: handle, email })
      if (insErr) {
        if (insErr.code === '23505') return NextResponse.json({ error: 'handle_taken' }, { status: 409 })
        return NextResponse.json({ error: 'save_failed' }, { status: 500 })
      }
      runnerId = authUser.id
      alias = handle
    }
  }

  if (heatNumber !== undefined) {
    const { data: heat } = await db().from('heats').select('id, closes_at').eq('number', heatNumber).maybeSingle()
    if (heat && new Date(heat.closes_at as string).getTime() > Date.now()) {
      await db().from('signups').upsert(
        { user_id: runnerId, heat_id: heat.id },
        { onConflict: 'user_id,heat_id', ignoreDuplicates: true },
      )
    }
  }

  return NextResponse.json({ alias })
}
