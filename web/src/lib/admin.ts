import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

export const ADMIN_COOKIE = 'heats_admin'

export const adminCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
}

// The value stored in the admin cookie. Null when ADMIN_SESSION_SECRET is not configured.
export function adminCookieValue(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) return null
  return createHmac('sha256', secret).update('admin').digest('hex')
}

export async function isAdmin(): Promise<boolean> {
  const expected = adminCookieValue()
  if (!expected) return false
  const got = (await cookies()).get(ADMIN_COOKIE)?.value
  if (!got) return false
  const a = Buffer.from(got)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
