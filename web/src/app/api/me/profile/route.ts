import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getMe } from '@/lib/auth'
import { db } from '@/lib/db'
import type { UserRow } from '@/lib/types'

export const runtime = 'nodejs'

const Body = z.object({
  alias: z.string().trim().toLowerCase().regex(/^[a-z0-9._]{3,20}$/),
})

// Create the user row: alias plus the lowercased email from Clerk (matches Luma RSVPs).
export async function POST(req: Request) {
  const me = await getMe()
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!me.email) return NextResponse.json({ error: 'no_email' }, { status: 400 })

  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'invalid_alias' }, { status: 400 })

  const { error } = await db().from('users').insert({
    id: me.id,
    alias: parsed.data.alias,
    email: me.email,
    avatar_url: me.avatarUrl,
  })

  if (error) {
    if (error.code === '23505') {
      const { data } = await db().from('users').select('*').eq('id', me.id).maybeSingle()
      if (data) return NextResponse.json({ user: data as UserRow })
      return NextResponse.json({ error: 'alias_taken' }, { status: 409 })
    }
    return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
  }

  const { data } = await db().from('users').select('*').eq('id', me.id).maybeSingle()
  return NextResponse.json({ user: data as UserRow })
}
