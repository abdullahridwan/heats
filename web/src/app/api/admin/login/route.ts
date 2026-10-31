import { createHash, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ADMIN_COOKIE, adminCookieOptions, adminCookieValue } from '@/lib/admin'

export const runtime = 'nodejs'

const Body = z.object({ password: z.string().min(1).max(200) })

// Hash both sides so the comparison is always over equal-length buffers.
const digest = (s: string) => createHash('sha256').update(s).digest()

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null))
  const expected = process.env.ADMIN_PASSWORD
  if (!parsed.success || !expected) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  if (!timingSafeEqual(digest(parsed.data.password), digest(expected))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const value = adminCookieValue()
  if (!value) return NextResponse.json({ error: 'not_configured' }, { status: 500 })

  const store = await cookies()
  store.set(ADMIN_COOKIE, value, adminCookieOptions)
  return NextResponse.json({ ok: true })
}
