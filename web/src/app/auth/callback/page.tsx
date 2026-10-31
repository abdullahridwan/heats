'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

// Where the email link lands. The session tokens arrive in the URL fragment (never sent to a server log),
// the handle and heat in the query. We pass them to /api/auth/session and go on.
// Returns an error code to show, or null when it is navigating away.
async function finishSignIn(): Promise<string | null> {
  const hash = new URLSearchParams(window.location.hash.slice(1))
  const query = new URLSearchParams(window.location.search)
  const access_token = hash.get('access_token')
  const refresh_token = hash.get('refresh_token')
  if (!access_token || !refresh_token) return hash.get('error_code') === 'otp_expired' ? 'link_expired' : 'link_invalid'
  // Drop the tokens from the address bar right away.
  window.history.replaceState(null, '', window.location.pathname)
  try {
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token,
        refresh_token,
        handle: query.get('handle'),
        heat: Number(query.get('heat')) || null,
        next: query.get('next'),
      }),
    })
    const d = (await res.json()) as { redirect?: string; error?: string }
    if (d.redirect) {
      window.location.replace(d.redirect)
      return null
    }
    return d.error ?? 'link_invalid'
  } catch {
    return 'link_invalid'
  }
}

export default function AuthCallback() {
  const [failed, setFailed] = useState<string | null>(null)

  useEffect(() => {
    finishSignIn().then(code => {
      if (code) setFailed(code)
    })
  }, [])

  return (
    <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
      {failed ? (
        <div style={{ display: 'grid', gap: 16, justifyItems: 'center' }}>
          <p className="serif" style={{ fontSize: 36, margin: 0 }}>
            {failed === 'handle_taken' ? 'That @ was just taken.' : 'That link didn’t work.'}
          </p>
          <p style={{ color: 'var(--text2)', margin: 0 }}>
            {failed === 'handle_taken' ? 'Join the heat again and pick another.' : 'It may have expired or already been used. Send a new one.'}
          </p>
          <Link href="/signin" className="btn btn-primary">Send a new link</Link>
        </div>
      ) : (
        <p className="serif" style={{ fontSize: 36, margin: 0 }}>Signing you in...</p>
      )}
    </main>
  )
}
