'use client'
import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { Stamp } from '@/components/stamp'
import type { Heat, SubmissionStatus } from '@/lib/types'
import { day, formatTime, heatNo, mon, ordinal } from '@/lib/time'
import styles from './page.module.css'

// idle → uploading → processing → stamped | review | error. The POST streams one line per check as
// the server finishes it, so the checklist fills in live (about 4 to 8 s end to end).

type Phase = 'idle' | 'uploading' | 'processing' | 'stamped' | 'review' | 'error'

type Props = {
  heat: Heat
  alias: string
  attempts: number
  initialNote: string
  initialStatus: SubmissionStatus | null
  initialReason: string | null
  initialTime: number | null
  initialStampedAt: string | null
}

type ApiResult = {
  status?: 'auto_verified' | 'needs_review'
  review_reason?: string | null
  distance_km?: number | null
  time_s?: number | null
  place?: number | null
  error?: string
}

const REASONS: Record<string, string> = {
  not_strava: "That doesn't look like a running-app card. Screenshot the activity, not just the map.",
  ocr_mismatch: 'We could not read the numbers cleanly. Make sure the distance, time and pace are visible and not cut off.',
  distance: 'The distance looks outside 5K. It should be roughly 4.9 to 5.6 km.',
  location: 'We could not match the map to the park. Make sure the route is inside the park.',
  duplicate: 'This looks like an image already posted for this heat.',
  vision_unavailable: 'Our check is temporarily unavailable, so a human will take a look.',
  runner_flagged: 'You flagged this one for review.',
}

type CheckId = 'upload' | 'numbers' | 'distance' | 'app' | 'park' | 'duplicate'
type CheckState = 'pending' | 'running' | 'ok' | 'fail' | 'skip'
type Checks = Record<CheckId, { state: CheckState; detail?: string }>
const CHECK_ORDER: CheckId[] = ['upload', 'numbers', 'distance', 'app', 'park', 'duplicate']
const freshChecks = (): Checks => ({
  upload: { state: 'pending' }, numbers: { state: 'pending' }, distance: { state: 'pending' },
  app: { state: 'pending' }, park: { state: 'pending' }, duplicate: { state: 'pending' },
})

const STAMPED_STATUSES: SubmissionStatus[] = ['auto_verified', 'verified']

async function compress(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  return new Promise((res, rej) => canvas.toBlob(b => (b ? res(b) : rej(new Error('encode'))), 'image/webp', 0.82))
}

export function PostForm({
  heat,
  alias,
  attempts,
  initialNote,
  initialStatus,
  initialReason,
  initialTime,
  initialStampedAt,
}: Props) {
  // Only used for the signed upload: the one-time token from /api/submissions/upload-url is the
  // authorisation, so the client needs just the public URL and publishable key. No Clerk token.
  const supabase = useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  ), [])

  const initialPhase: Phase =
    initialStatus && STAMPED_STATUSES.includes(initialStatus) ? 'stamped'
      : initialStatus === 'needs_review' ? 'review'
        : 'idle'

  const [phase, setPhase] = useState<Phase>(initialPhase)
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [note, setNote] = useState(initialNote)
  const [result, setResult] = useState<ApiResult | null>({
    status: initialPhase === 'stamped' ? 'auto_verified' : initialPhase === 'review' ? 'needs_review' : undefined,
    review_reason: initialReason,
    time_s: initialTime,
  })
  const [stampedAt, setStampedAt] = useState<string>(initialStampedAt ?? new Date().toISOString())
  const fileRef = useRef<File | null>(null)
  const [checks, setChecks] = useState<Checks>(freshChecks)
  const mark = (id: CheckId, state: CheckState, detail?: string) =>
    setChecks(c => ({ ...c, [id]: { state, detail: detail ?? c[id].detail } }))

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const file = fileRef.current
    if (!file) { setPhase('error'); setMessage('Add a screenshot of your run.'); return }
    setPhase('uploading'); setMessage('')
    setChecks({ ...freshChecks(), upload: { state: 'running' } })

    try {
      // 1. Signed upload URL, then upload straight to Supabase (avoids the ~4.5 MB API body limit).
      const urlRes = await fetch('/api/submissions/upload-url', { method: 'POST' })
      const { path, token, error: urlErr } = await urlRes.json()
      if (urlErr || !path) throw new Error('upload_url_failed')

      const blob = await compress(file)
      const { error: upErr } = await supabase.storage.from('proofs').uploadToSignedUrl(path, token, blob, { contentType: 'image/webp' })
      if (upErr) throw new Error('upload_failed')
      mark('upload', 'ok')

      // 2. Run the pipeline and read its checks as they stream in.
      setPhase('processing')
      setChecks(c => ({ ...c, numbers: { state: 'running' }, distance: { state: 'running' }, app: { state: 'running' }, park: { state: 'running' } }))
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, note, heat: heat.number }),
      })
      if (!res.ok || !res.body) {
        const data: ApiResult = await res.json().catch(() => ({}))
        setChecks(freshChecks())
        setPhase('error')
        setMessage(data.error === 'window_closed' ? 'The submission window is closed.'
          : data.error === 'too_many_attempts' ? "You've hit the resubmit limit. Email us and we'll sort it."
            : data.error === 'already_stamped' ? "You're already stamped for this heat."
              : 'Something went wrong. Try again.')
        return
      }

      const final = await readStream(res.body, line => {
        if (line.type === 'step' && line.id) {
          mark(line.id as CheckId, line.state as CheckState, line.detail)
          if (line.id === 'distance') mark('duplicate', 'running')
        }
      })
      if (!final || final.type === 'error') {
        setPhase('error')
        setMessage('Something went wrong. Try again.')
        return
      }
      setResult(final)
      // Let the finished checklist land for a beat before the result screen.
      await new Promise(r => setTimeout(r, final.status === 'auto_verified' ? 900 : 1400))
      if (final.status === 'auto_verified') setStampedAt(new Date().toISOString())
      setPhase(final.status === 'auto_verified' ? 'stamped' : 'review')
    } catch {
      setPhase('error')
      setMessage('Upload failed. Check your connection and try again.')
    }
  }

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 15 * 1024 * 1024) { setPhase('error'); setMessage('That image is over 15 MB. Try a regular screenshot.'); return }
    fileRef.current = file
    setPreview(URL.createObjectURL(file))
    setPhase('idle'); setMessage('')
  }

  function tryAnother() {
    fileRef.current = null
    setPreview(null)
    setResult(null)
    setChecks(freshChecks())
    setPhase('idle')
  }

  if (phase === 'stamped') {
    const postmark = `${mon(stampedAt)} ${day(stampedAt)}`
    return (
      <main className={styles.stampedScreen}>
        <div className={styles.grow} />
        <div className={styles.stampShadow}>
          <Stamp scene={heat.scene} heatNo={heatNo(heat.number)} postmark={postmark} width={210} tilt={-4} />
        </div>
        <h1 className={styles.stampedTitle}>Stamped.</h1>
        {result?.time_s ? <div className={styles.stampedTime}>{formatTime(result.time_s)}</div> : null}
        {result?.place ? <p className={styles.stampedPlace}>{ordinal(result.place)} place</p> : null}
        <div className={styles.grow} />
        <Link href={`/p/${alias}`} className={styles.voltBtn}>
          See my stamp case
        </Link>
      </main>
    )
  }

  if (phase === 'review') {
    return (
      <main className={styles.page}>
        <div className={styles.reviewBox}>
          <h1 className={styles.disp}>In review.</h1>
          <p className={styles.lead}>{REASONS[result?.review_reason ?? ''] ?? 'A human will check this one.'}</p>
          {checks.upload.state !== 'pending' && <Checklist checks={checks} park={heat.park} minKm={heat.min_km} maxKm={heat.max_km} />}
          <button type="button" className={styles.btnGhost} onClick={tryAnother}>
            Try another screenshot
          </button>
        </div>
      </main>
    )
  }

  const busy = phase === 'uploading' || phase === 'processing'
  const park = heat.park

  return (
    <main className={styles.page}>
      <nav className={styles.top} aria-label="Back">
        <Link href="/calendar" className={styles.back} aria-label="Back to calendar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
      </nav>

      <form className={styles.form} onSubmit={submit}>
        <div className={styles.head}>
          <h1 className={styles.disp}>Post your run</h1>
          <p className={styles.mono}>{park} / Heat {heatNo(heat.number)}</p>
        </div>

        <label className={styles.drop}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview ? <img className={styles.dropPreview} src={preview} alt="Your screenshot" /> : null}
          <span className={styles.dropTitle}>{preview ? 'Screenshot added' : 'Add your Strava screenshot'}</span>
          <span className={styles.dropHint}>{preview ? 'Tap to replace it.' : 'Any running app. Show the map, distance and time.'}</span>
          <input
            type="file"
            accept="image/*"
            onChange={onFile}
            aria-label="Screenshot of your run"
            disabled={busy}
            className={styles.fileInput}
          />
        </label>

        <div className={styles.field}>
          <label htmlFor="note" className={styles.mono}>Note, shows next to your time</label>
          <input
            id="note"
            name="note"
            className={styles.input}
            maxLength={100}
            placeholder="that hill was evil"
            value={note}
            onChange={e => setNote(e.target.value)}
            disabled={busy}
          />
          <span className={styles.counter}>{note.length} / 100</span>
        </div>

        <Checklist checks={checks} park={park} minKm={heat.min_km} maxKm={heat.max_km} />

        {attempts > 0 && (
          <p className={styles.mono}>
            Attempt {attempts + 1} of 5.{' '}
            {initialStatus === 'rejected' ? 'Your last one was rejected.' : initialStatus === 'needs_review' ? 'Your last one is still in review.' : ''}
          </p>
        )}
        {phase === 'error' && <p className={styles.error} role="alert">{message}</p>}

        <button type="submit" className={styles.btn} disabled={busy || !preview}>
          {busy ? 'Working...' : 'Stamp it'}
        </button>
      </form>
    </main>
  )
}

type StreamLine = ApiResult & { type: 'step' | 'done' | 'error'; id?: string; state?: string; detail?: string }

// Reads the newline-delimited JSON stream, calling onLine for each step, and returns the last line.
async function readStream(body: ReadableStream<Uint8Array>, onLine: (l: StreamLine) => void): Promise<StreamLine | null> {
  const reader = body.getReader()
  const dec = new TextDecoder()
  let buf = ''
  let last: StreamLine | null = null
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    let nl
    while ((nl = buf.indexOf('\n')) >= 0) {
      const raw = buf.slice(0, nl).trim()
      buf = buf.slice(nl + 1)
      if (!raw) continue
      const line = JSON.parse(raw) as StreamLine
      if (line.type === 'step') onLine(line)
      else last = line
    }
  }
  return last
}

const LABELS = (park: string, minKm: number, maxKm: number): Record<CheckId, string> => ({
  upload: 'Screenshot uploaded',
  numbers: 'Read your time and distance',
  distance: `5K distance, ${minKm.toFixed(1)} to ${maxKm.toFixed(1)} km`,
  app: 'A running app screenshot',
  park: `Run in ${park}`,
  duplicate: 'Not posted before',
})

function Checklist({ checks, park, minKm, maxKm }: { checks: Checks; park: string; minKm: number; maxKm: number }) {
  const labels = LABELS(park, minKm, maxKm)
  return (
    <ul className={styles.live} aria-live="polite">
      {CHECK_ORDER.map(id => {
        const c = checks[id]
        return (
          <li key={id} className={`${styles.liveItem} ${styles[`is_${c.state}`] ?? ''}`}>
            <span className={styles.liveIcon} aria-hidden="true">
              {c.state === 'ok' ? '\u2713' : c.state === 'fail' ? '\u2715' : c.state === 'skip' ? '\u2013' : ''}
            </span>
            <span className={styles.liveLabel}>
              {labels[id]}
              {c.detail ? <span className={styles.liveDetail}> {c.detail}</span> : null}
              {c.state === 'skip' ? <span className={styles.liveDetail}> (a person will check)</span> : null}
            </span>
            <span className="sr-only">{c.state === 'ok' ? 'passed' : c.state === 'fail' ? 'did not pass' : c.state === 'running' ? 'checking' : c.state === 'skip' ? 'needs a person' : 'waiting'}</span>
          </li>
        )
      })}
    </ul>
  )
}
