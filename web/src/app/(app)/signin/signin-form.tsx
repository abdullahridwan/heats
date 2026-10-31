'use client'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import styles from './page.module.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type View = 'email' | 'sent' | 'noaccount'

export function SignInForm({ next, linkError }: { next: string; linkError: string | null }) {
  const [view, setView] = useState<View>('email')
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(linkError)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = window.setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => window.clearTimeout(t)
  }, [cooldown])

  const emailOk = EMAIL_RE.test(email.trim())

  async function sendCode(target: string): Promise<boolean> {
    const res = await fetch('/api/auth/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: target, next }),
    })
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
    if (data.error === 'handle_required') {
      setView('noaccount')
      return false
    }
    if (!res.ok || !data.ok) {
      setError(
        data.error === 'bad_email' ? "That email doesn't look right."
          : data.error === 'rate_limited' ? 'Too many tries. Wait a few minutes and try again.'
            : 'Something went wrong. Try again.',
      )
      return false
    }
    setCooldown(30)
    return true
  }

  async function onSendCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!emailOk || busy) return
    setBusy(true)
    setError(null)
    const target = email.trim()
    try {
      if (await sendCode(target)) {
        setSentTo(target)
        setView('sent')
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function resend() {
    setError(null)
    try {
      await sendCode(sentTo)
    } catch {
      setError('Something went wrong. Try again.')
    }
  }

  const topNav = (
    <nav className={styles.top} aria-label="Back">
      <Link href="/calendar" className={styles.back} aria-label="Back to calendar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </Link>
    </nav>
  )

  if (view === 'noaccount') {
    return (
      <main className={styles.page}>
        {topNav}
        <div className={styles.body}>
          <h1 className={styles.disp}>No account yet.</h1>
          <p className={styles.lead}>No Heats account for that email yet.</p>
          <div className={styles.grow} />
          <Link href="/calendar" className={styles.btn}>
            Back to calendar
          </Link>
        </div>
      </main>
    )
  }

  if (view === 'sent') {
    return (
      <main className={styles.page}>
        {topNav}
        <div className={styles.body}>
          <h1 className={styles.disp}>Check your email</h1>
          <p className={styles.lead}>
            We sent a link to <strong className={styles.strong}>{sentTo}</strong>. Tap it on this phone to sign in.
          </p>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <div className={styles.grow} />
          <div className={styles.linkRow}>
            <button type="button" className={styles.textBtn} onClick={resend} disabled={cooldown > 0 || busy}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend the link'}
            </button>
            <button
              type="button"
              className={styles.textBtn}
              onClick={() => {
                setView('email')
                setError(null)
              }}
            >
              Change it
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      {topNav}
      <form className={styles.body} onSubmit={onSendCode}>
        <h1 className={styles.disp}>Sign in</h1>
        <p className={styles.lead}>We&apos;ll email you a sign-in link. No password.</p>
        <div className={styles.field}>
          <label htmlFor="email" className={styles.mono}>Email</label>
          <input
            id="email"
            type="email"
            className={styles.input}
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            disabled={busy}
          />
        </div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.grow} />
        <button type="submit" className={styles.btn} disabled={!emailOk || busy}>
          {busy ? 'Sending...' : 'Email me a link'}
        </button>
      </form>
    </main>
  )
}
