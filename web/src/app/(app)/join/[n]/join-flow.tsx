'use client'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Heat } from '@/lib/types'
import { normalizeHandle, validateHandle } from '@/lib/handles'
import { day, heatNo, shortDate, weekday } from '@/lib/time'
import styles from './page.module.css'

type Mode = 'onboard' | 'confirm' | 'joined'
type View = 'claim' | 'sent' | 'confirm' | 'joined'
type StartRes = { ok?: boolean; newRunner?: boolean; error?: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isEmail = (s: string) => EMAIL_RE.test(s.trim())
const wd = (iso: string) => weekday(iso).slice(0, 3)

// Local checks first (instant). The server check runs only once these pass.
function localHandleError(h: string): string | null {
  if (!h) return null
  if (h.length < 3) return 'At least 3 characters'
  if (h.length > 20) return '20 characters max'
  const v = validateHandle(h)
  if (!v.ok) return v.reason === 'format' ? 'Only letters, numbers, . and _' : "That handle isn't allowed"
  return null
}

function remoteHandleError(reason: string | undefined, h: string): string {
  if (reason === 'taken') return `@${h} is taken`
  if (reason === 'format') return 'Only letters, numbers, . and _'
  return "That handle isn't allowed"
}

function startError(code: string | undefined, h: string): string {
  switch (code) {
    case 'bad_email':
      return "That email doesn't look right."
    case 'handle_required':
      return 'Claim an @ to get started.'
    case 'handle_format':
      return 'Only letters, numbers, . and _'
    case 'handle_reserved':
    case 'handle_blocked':
      return "That handle isn't allowed"
    case 'handle_taken':
      return `@${h} is taken`
    case 'rate_limited':
      return 'Too many tries. Wait a few minutes and try again.'
    default:
      return 'Something went wrong. Try again.'
  }
}

async function postJson<T>(url: string, body: unknown): Promise<{ status: number; ok: boolean; data: T }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as T
  return { status: res.status, ok: res.ok, data }
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4B7A00" strokeWidth="2.5" aria-hidden="true">
      <path d="M5 12l5 5 9-10" />
    </svg>
  )
}

export function JoinFlow({ heat, mode }: { heat: Heat; mode: Mode }) {
  const router = useRouter()
  const [view, setView] = useState<View>(mode === 'onboard' ? 'claim' : mode === 'confirm' ? 'confirm' : 'joined')
  const [emailOnly, setEmailOnly] = useState(false)
  const [raw, setRaw] = useState('')
  const [email, setEmail] = useState('')
  const [check, setCheck] = useState<{ h: string; available: boolean; reason?: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [returning, setReturning] = useState(false)
  const [sentTo, setSentTo] = useState('')
  const [sentHandle, setSentHandle] = useState<string | undefined>(undefined)
  const [cooldown, setCooldown] = useState(0)

  const handle = normalizeHandle(raw)
  const localErr = emailOnly ? null : localHandleError(handle)

  // Debounced availability check (350ms). Stale responses are ignored via the cancel flag.
  useEffect(() => {
    if (emailOnly || !handle || localErr) return
    let cancelled = false
    const t = window.setTimeout(() => {
      fetch(`/api/handles/check?h=${encodeURIComponent(handle)}`)
        .then(r => r.json())
        .then((d: { available: boolean; reason?: string }) => {
          if (!cancelled) setCheck({ h: handle, available: d.available, reason: d.reason })
        })
        .catch(() => {
          if (!cancelled) setCheck(null)
        })
    }, 350)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [handle, localErr, emailOnly])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = window.setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => window.clearTimeout(t)
  }, [cooldown])

  const checked = check && check.h === handle ? check : null
  const handleState: 'idle' | 'checking' | 'ok' | 'bad' =
    emailOnly || !handle ? 'idle'
      : localErr ? 'bad'
        : !checked ? 'checking'
          : checked.available ? 'ok' : 'bad'
  const handleMsg =
    handleState === 'idle' ? ''
      : handleState === 'checking' ? 'Checking...'
        : handleState === 'ok' ? `@${handle} is yours`
          : localErr ?? remoteHandleError(checked?.reason, handle)
  const msgClass = handleState === 'ok' ? styles.msgOk : handleState === 'bad' ? styles.msgBad : styles.msg
  const handleBoxClass = [
    styles.handleBox,
    handleState === 'ok' ? styles.handleOk : '',
    handleState === 'bad' ? styles.handleBad : '',
  ].join(' ')

  const emailOk = isEmail(email)
  const canSend = !busy && emailOk && (emailOnly || handleState === 'ok')

  const topNav = (
    <nav className={styles.top} aria-label="Heat">
      <Link href="/calendar" className={styles.back} aria-label="Back to calendar">
        <BackIcon />
      </Link>
      <span className={styles.mono}>
        Heat {heatNo(heat.number)} / {heat.park} / {shortDate(heat.opens_at)} to {day(heat.closes_at)}
      </span>
    </nav>
  )

  async function onSendCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canSend) return
    setBusy(true)
    setError(null)
    const cleanEmail = email.trim()
    try {
      const { ok, data } = await postJson<StartRes>(
        '/api/auth/start',
        emailOnly ? { email: cleanEmail, heat: heat.number } : { email: cleanEmail, handle, heat: heat.number },
      )
      if (!ok || !data.ok) {
        setError(startError(data.error, handle))
        return
      }
      const existing = data.newRunner === false
      setReturning(existing)
      setSentTo(cleanEmail)
      setSentHandle(emailOnly || existing ? undefined : handle)
      setCooldown(30)
      setView('sent')
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function resend() {
    setError(null)
    try {
      const { ok, data } = await postJson<StartRes>(
        '/api/auth/start',
        sentHandle ? { email: sentTo, handle: sentHandle, heat: heat.number } : { email: sentTo, heat: heat.number },
      )
      if (!ok || !data.ok) {
        setError(startError(data.error, sentHandle ?? ''))
        return
      }
      setCooldown(30)
    } catch {
      setError('Something went wrong. Try again.')
    }
  }

  async function confirmSignup() {
    setBusy(true)
    setError(null)
    try {
      const { status, ok } = await postJson<unknown>('/api/signups', { heat: heat.number })
      if (!ok) {
        setError(
          status === 401 ? 'Your session expired. Sign in again.'
            : status === 409 ? 'This heat is over.'
              : 'Something went wrong. Try again.',
        )
        return
      }
      setView('joined')
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  function backToCalendar() {
    router.push('/calendar')
    router.refresh()
  }

  if (view === 'joined') {
    return (
      <main className={styles.joined}>
        <div className={styles.grow} />
        <svg width="72" height="72" viewBox="0 0 200 200" aria-hidden="true">
          <g fill="none" stroke="#061236" strokeWidth="14">
            <rect x="22" y="48" width="156" height="104" rx="52" />
            <rect x="46" y="72" width="108" height="56" rx="28" />
          </g>
        </svg>
        <h1 className={styles.joinedTitle}>You&apos;re in.</h1>
        <p className={styles.joinedLead}>
          Heat {heatNo(heat.number)}, {heat.park}.
          <br />
          Run 5K any time {wd(heat.opens_at)} {shortDate(heat.opens_at)} or {wd(heat.closes_at)} {shortDate(heat.closes_at)},
          then post your screenshot.
        </p>
        <div className={styles.grow} />
        <button type="button" className={styles.btn} onClick={backToCalendar}>
          Back to calendar
        </button>
      </main>
    )
  }

  if (view === 'confirm') {
    return (
      <main className={styles.page}>
        {topNav}
        <div className={styles.body}>
          <h1 className={styles.disp}>Join Heat {heatNo(heat.number)}?</h1>
          <p className={styles.lead}>
            {heat.park}, {wd(heat.opens_at)} {shortDate(heat.opens_at)} or Sunday
          </p>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <div className={styles.grow} />
          <button type="button" className={styles.btn} onClick={confirmSignup} disabled={busy}>
            {busy ? 'Joining...' : "Confirm, I'm in"}
          </button>
        </div>
      </main>
    )
  }

  if (view === 'sent') {
    return (
      <main className={styles.page}>
        <nav className={styles.top} aria-label="Back">
          <button
            type="button"
            className={styles.back}
            aria-label="Back"
            onClick={() => {
              setView('claim')
              setError(null)
            }}
          >
            <BackIcon />
          </button>
          <span className={styles.mono}>Step 2 of 2</span>
        </nav>
        <div className={styles.body}>
          {returning && <p className={styles.kicker}>Welcome back</p>}
          <h1 className={styles.disp}>Check your email</h1>
          <p className={styles.lead}>
            We sent a link to <strong className={styles.strong}>{sentTo}</strong>. Tap it on this phone to finish joining
            Heat {heatNo(heat.number)}.
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
                setView('claim')
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

  // view === 'claim'
  return (
    <main className={styles.page}>
      {topNav}
      <form className={styles.body} onSubmit={onSendCode}>
        <p className={styles.kicker}>{emailOnly ? 'Welcome back' : 'Welcome to Heats / One time only'}</p>
        <h1 className={styles.disp}>{emailOnly ? 'Sign in' : 'Claim your @'}</h1>

        {!emailOnly && (
          <div className={styles.field}>
            <label htmlFor="handle" className={styles.mono}>Your handle</label>
            <div className={handleBoxClass}>
              <span className={styles.at} aria-hidden="true">@</span>
              <input
                id="handle"
                className={styles.handleInput}
                value={raw}
                onChange={e => setRaw(e.target.value.toLowerCase().replace(/@/g, ''))}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={handleState === 'bad'}
                aria-describedby="handle-msg"
                disabled={busy}
              />
              {handleState === 'ok' && <CheckIcon />}
            </div>
            <div id="handle-msg" className={msgClass} role="status">{handleMsg}</div>
          </div>
        )}

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
        <button type="submit" className={styles.btn} disabled={!canSend}>
          {busy ? 'Sending...' : 'Email me a link'}
        </button>
        <button
          type="button"
          className={styles.textBtnCenter}
          onClick={() => {
            setEmailOnly(v => !v)
            setError(null)
          }}
        >
          {emailOnly ? 'New here? Claim your @' : 'Already have an @? Sign in with your email'}
        </button>
      </form>
    </main>
  )
}
