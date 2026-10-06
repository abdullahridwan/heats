'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { useSession } from '@clerk/nextjs'
import { formatTime } from '@/lib/time'

// idle → uploading → processing → stamped | review | error. One pass, no polling: the POST
// returns the decision synchronously (expect ~4–8 s).

type Phase = 'idle' | 'uploading' | 'processing' | 'stamped' | 'review' | 'error'

type Props = {
  heatNumber: number
  minKm: number
  maxKm: number
  attempts: number
  initialNote: string
  previousStatus: string | null
  previousReason: string | null
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
  not_strava: 'That doesn’t look like a running-app card. Screenshot the activity, not just the map.',
  ocr_mismatch: 'We couldn’t read the numbers cleanly. Make sure the distance, time and pace are visible and not cut off.',
  distance: 'The distance looks outside 5K. It should be roughly 4.9–5.6 km.',
  location: 'We couldn’t match the map to Central Park. Make sure the route is in the park.',
  duplicate: 'This looks like an image already posted for this heat.',
  vision_unavailable: 'Our check is temporarily unavailable, so a human will take a look.',
  runner_flagged: 'You flagged this one for review.',
}

async function compress(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  return new Promise((res, rej) => canvas.toBlob(b => (b ? res(b) : rej(new Error('encode'))), 'image/webp', 0.82))
}

export function PostForm({ heatNumber, minKm, maxKm, attempts, initialNote, previousStatus }: Props) {
  const { session } = useSession()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false }, async accessToken() { return (await session?.getToken()) ?? null } },
  )
  const [phase, setPhase] = useState<Phase>('idle')
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [note, setNote] = useState(initialNote)
  const [result, setResult] = useState<ApiResult | null>(null)
  const fileRef = useRef<File | null>(null)

  async function submit(e: React.FormEvent) {
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
        body: JSON.stringify({ path, note, heat: heatNumber }),
      })
      const data: ApiResult = await res.json()

      setResult(data)
      if (!res.ok) {
        setPhase('error')
        setMessage(data.error === 'window_closed' ? 'The submission window is closed.'
          : data.error === 'too_many_attempts' ? 'You’ve hit the resubmit limit. Email us and we’ll sort it.'
          : data.error === 'already_stamped' ? 'You’re already stamped for this heat.'
          : 'Something went wrong. Try again.')
        return
      }
      setPhase(data.status === 'auto_verified' ? 'stamped' : 'review')
    } catch {
      setPhase('error')
      setMessage('Upload failed. Check your connection and try again.')
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 15 * 1024 * 1024) { setPhase('error'); setMessage('That image is over 15 MB. Try a regular screenshot.'); return }
    fileRef.current = file
    setPreview(URL.createObjectURL(file))
    setPhase('idle'); setMessage('')
  }

  if (phase === 'stamped') {
    return (
      <div className="state">
        <b>Stamped. {result?.time_s ? formatTime(result.time_s) : ''}{result?.place ? ` · ${result.place} place` : ''}</b>
        <span className="muted" style={{ fontSize: 14 }}>Heat {heatNumber} is in your passport.</span>
        <div className="row-actions">
          <a className="btn theme sm" href={`/api/story/result?alias=&heat=${heatNumber}&download=1`}>Save your stamp</a>
          <Link className="btn ghost sm" href="/results">See the heat sheet</Link>
        </div>
      </div>
    )
  }

  if (phase === 'review') {
    return (
      <div className="state" style={{ background: 'var(--e-s)' }}>
        <b>In review.</b>
        <span className="muted" style={{ fontSize: 14 }}>{REASONS[result?.review_reason ?? ''] ?? 'A human will check this one.'}</span>
        <div className="row-actions">
          <button className="btn ghost sm" type="button" onClick={() => { setPhase('idle'); setResult(null) }}>Try another screenshot</button>
        </div>
      </div>
    )
  }

  const busy = phase === 'uploading' || phase === 'processing'

  return (
    <form className="form" onSubmit={submit}>
      <label className="drop">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {preview ? <img className="prev" src={preview} alt="Your screenshot" /> : <span className="prev" aria-hidden="true" />}
        <span style={{ display: 'grid', gap: 4 }}>
          <b style={{ fontSize: 15 }}>{preview ? 'Screenshot added' : 'Add your screenshot'}</b>
          <span className="muted" style={{ fontSize: 14 }}>{preview ? 'Tap to replace it.' : 'Any running app. Show the map, distance and time.'}</span>
        </span>
        <input type="file" accept="image/*" onChange={onFile} aria-label="Screenshot of your run" disabled={busy} />
      </label>

      <div className="field">
        <label htmlFor="note">Note <span style={{ color: 'var(--text3)' }}>· shows next to your time</span></label>
        <input className="input" id="note" name="note" maxLength={100} placeholder="that hill was evil" value={note} onChange={e => setNote(e.target.value)} disabled={busy} />
        <span className="counter">{note.length} / 100</span>
      </div>

      <div className="checks">
        <div><span className="c">✓</span>Dated today, in Central Park</div>
        <div><span className="c">✓</span>Distance {minKm.toFixed(1)}–{maxKm.toFixed(1)} km</div>
        <div><span className="c">✓</span>Time, distance and pace line up</div>
      </div>

      {attempts > 0 && <p className="eyebrow">Attempt {attempts + 1} of 5. {previousStatus === 'rejected' ? 'Your last one was rejected.' : previousStatus === 'needs_review' ? 'Your last one is still in review.' : ''}</p>}
      {phase === 'error' && <p className="error" role="alert">{message}</p>}
      {busy && <p className="eyebrow" role="status">{phase === 'uploading' ? 'Uploading…' : 'Reading your card… this takes a few seconds.'}</p>}

      <button className="btn theme block" type="submit" disabled={busy || !preview}>{busy ? 'Working…' : 'Post my time'}</button>
    </form>
  )
}
