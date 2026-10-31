import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { db } from '@/lib/db'
import { heatNo } from '@/lib/time'

export const runtime = 'nodejs'

// The review queue, with 1-hour signed image URLs for the private proofs bucket.
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const status = new URL(req.url).searchParams.get('status')
  const statuses = status ? status.split(',') : ['needs_review']

  const { data: rows } = await db()
    .from('submissions')
    .select('id, user_id, heat_id, image_path, distance_km, time_s, note, status, review_reason, attempts, created_at, users(alias), heats(number, name, closes_at)')
    .in('status', statuses)
    .order('created_at')

  const list = rows ?? []
  const paths = list.map(r => r.image_path as string)
  const { data: signed } = paths.length
    ? await db().storage.from('proofs').createSignedUrls(paths, 3600)
    : { data: [] as { signedUrl: string }[] }

  return NextResponse.json({
    submissions: list.map((r, i) => ({
      ...r,
      heat_no: heatNo((r.heats as unknown as { number: number } | null)?.number ?? 0),
      image_url: signed?.[i]?.signedUrl ?? null,
    })),
  })
}
