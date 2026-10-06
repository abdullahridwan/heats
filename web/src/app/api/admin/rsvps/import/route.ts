import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// Luma CSV import (optional). Expects columns: email, name (heat is taken from the first heat).
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const csv = await req.text()
  const lines = csv.split(/\r?\n/).filter(Boolean)
  if (!lines.length) return NextResponse.json({ imported: 0 })

  const header = lines[0].split(',').map(h => h.trim().toLowerCase())
  const ei = header.indexOf('email')
  const ni = header.indexOf('name')
  if (ei === -1) return NextResponse.json({ error: 'no_email_column' }, { status: 400 })

  const { data: heat } = await db().from('heats').select('id').order('number').limit(1).maybeSingle()
  if (!heat) return NextResponse.json({ error: 'no_heat' }, { status: 404 })

  const rows = lines.slice(1).map(l => {
    const cells = l.split(',').map(c => c.trim())
    return { email: (cells[ei] ?? '').toLowerCase(), name: ni >= 0 ? cells[ni] : null, heat_id: heat.id }
  }).filter(r => r.email)

  const { error } = await db().from('rsvps').upsert(rows, { onConflict: 'email,heat_id' })
  if (error) return NextResponse.json({ error: 'import_failed' }, { status: 500 })
  return NextResponse.json({ imported: rows.length })
}
