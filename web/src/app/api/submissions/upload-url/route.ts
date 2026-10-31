import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getRunner } from '@/lib/session'

export const runtime = 'nodejs'

// A signed upload URL for the private proofs bucket, keyed to the runner's own folder.
// Uploads go straight to Supabase so the ~4.5 MB Vercel body limit never bites (a
// 1080×1920 PNG can exceed it).
export async function POST() {
  const runner = await getRunner()
  if (!runner) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const path = `${runner.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`
  const { data, error } = await db().storage.from('proofs').createSignedUploadUrl(path)
  if (error || !data) return NextResponse.json({ error: 'signed_url_failed' }, { status: 500 })

  return NextResponse.json({ path, token: data.token, signedUrl: data.signedUrl })
}
