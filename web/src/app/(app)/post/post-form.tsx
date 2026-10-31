'use client'
import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { Stamp } from '@/components/stamp'
import type { Heat, SubmissionStatus } from '@/lib/types'
import { day, formatTime, heatNo, mon, ordinal } from '@/lib/time'
import styles from './page.module.css'

// idle → uploading → processing → stamped | review | error. One pass, no polling: the POST
// returns the decision synchronously (expect about 4 to 8 s).

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

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const file = fileRef.current
    if (!file) { setPhase('error'); setMessage('Add a screenshot of your run.'); return }
    setPhase('uploading'); setMessage('')

    try {
      // 1. Signed upload URL, then upload straight to Supabase (avoids the ~4.5 MB API body limit).
      const urlRes = await fetch('/api/submissions/upload-url', { method: 'POST' })
      const { path, token, error: urlErr } = await urlRes.json()
      if (urlErr || !path) throw new Error('upload_url_failed')

      const blob = await compress(file)
      const { error: upErr } = await supabase.storage.from('proofs').uploadToSignedUrl(path, token, blob, { contentType: 'image/webp' })
      if (upErr) throw new Error('upload_failed')

      // 2. Run the pipeline.
      setPhase('processing')
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, note, heat: heat.number }),
      })
      const data: ApiResult = await res.json()

      setResult(data)
      if (!res.ok) {
        setPhase('error')
        setMessage(data.error === 'window_closed' ? 'The submission window is closed.'
          : data.error === 'too_many_attempts' ? "You've hit the resubmit limit. Email us and we'll sort it."
            : data.error === 'already_stamped' ? "You're already stamped for this heat."
              : 'Something went wrong. Try again.')
        return
      }
      if (data.status === 'auto_verified') setStampedAt(new Date().toISOString())
      setPhase(data.status === 'auto_verified' ? 'stamped' : 'review')
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

        <ul className={styles.checks}>
          <li>Dated today, in {park}</li>
          <li>Distance {heat.min_km.toFixed(1)} to {heat.max_km.toFixed(1)} km</li>
          <li>Time, distance and pace line up</li>
        </ul>

        {attempts > 0 && (
          <p className={styles.mono}>
            Attempt {attempts + 1} of 5.{' '}
            {initialStatus === 'rejected' ? 'Your last one was rejected.' : initialStatus === 'needs_review' ? 'Your last one is still in review.' : ''}
          </p>
        )}
        {phase === 'error' && <p className={styles.error} role="alert">{message}</p>}
        {busy && (
          <p className={styles.status} role="status">
            {phase === 'uploading' ? 'Uploading...' : 'Reading your screenshot...'}
          </p>
        )}

        <button type="submit" className={styles.btn} disabled={busy || !preview}>
          {busy ? 'Working...' : 'Stamp it'}
        </button>
      </form>
    </main>
  )
}
