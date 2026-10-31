import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ADMIN_COOKIE } from '@/lib/admin'

export const runtime = 'nodejs'

export async function POST() {
  const store = await cookies()
  store.delete(ADMIN_COOKIE)
  return NextResponse.json({ ok: true })
}
