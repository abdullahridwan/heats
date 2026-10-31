import { NextResponse } from 'next/server'
import { joinHeat, ensureRunner } from '@/lib/runners'
import { supabaseServer } from '@/lib/supabase-server'

export const runtime = 'nodejs'

// Where the email link lands. Exchanges the one-time code for a session cookie, creates the runner on
// first sign in (handle carried in the link), signs them up for the heat they were joining, then sends
// them on. The link must be opened in the same browser that asked for it (the PKCE verifier cookie).
export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const handle = url.searchParams.get('handle')
  const heat = Number(url.searchParams.get('heat')) || null
  const next = safeNext(url.searchParams.get('next'))
  const fail = (reason: string) => NextResponse.redirect(new URL(`/signin?error=${reason}`, url.origin))

  if (!code) return fail('link_invalid')
  const supabase = await supabaseServer()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) return fail('link_expired')

  const runner = await ensureRunner(data.user.id, (data.user.email ?? '').toLowerCase(), handle)
  if (!runner.ok) return fail(runner.error)

  if (heat) {
    await joinHeat(runner.runnerId, heat)
    return NextResponse.redirect(new URL(`/join/${heat}`, url.origin))
  }
  return NextResponse.redirect(new URL(next, url.origin))
}

// Only same-site paths, never an absolute URL from the query string.
function safeNext(next: string | null) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/calendar'
}
