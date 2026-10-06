import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// Luma CSV import (optional). Expects columns: email, name (heat is taken from the first heat).
// Minimal RFC 4180 parser: quoted fields, escaped quotes, commas and newlines inside quotes.
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [], cell = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell); cell = ''
      if (row.some(x => x.trim())) rows.push(row)
      row = []
    } else cell += c
  }
  row.push(cell)
  if (row.some(x => x.trim())) rows.push(row)
  return rows
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const csv = await req.text()
  const table = parseCsv(csv)
  if (!table.length) return NextResponse.json({ imported: 0 })

  const header = table[0].map(h => h.trim().toLowerCase())
  const ei = header.indexOf('email')
  const ni = header.indexOf('name')
  if (ei === -1) return NextResponse.json({ error: 'no_email_column' }, { status: 400 })

  const { data: heat } = await db().from('heats').select('id').order('number').limit(1).maybeSingle()
  if (!heat) return NextResponse.json({ error: 'no_heat' }, { status: 404 })

  const rows = table.slice(1).map(cells => {
    return { email: (cells[ei] ?? '').toLowerCase(), name: ni >= 0 ? cells[ni] : null, heat_id: heat.id }
  }).filter(r => r.email)

  const { error } = await db().from('rsvps').upsert(rows, { onConflict: 'email,heat_id' })
  if (error) return NextResponse.json({ error: 'import_failed' }, { status: 500 })
  return NextResponse.json({ imported: rows.length })
}
