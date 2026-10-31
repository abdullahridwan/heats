import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { normalizeHandle, validateHandle } from '@/lib/handles'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get('h') ?? ''
  const handle = normalizeHandle(raw)

  const check = validateHandle(handle)
  if (!check.ok) return NextResponse.json({ available: false, reason: check.reason })

  const { data: taken } = await db().from('users').select('id').eq('alias', handle).maybeSingle()
  if (taken) return NextResponse.json({ available: false, reason: 'taken' })

  return NextResponse.json({ available: true })
}
