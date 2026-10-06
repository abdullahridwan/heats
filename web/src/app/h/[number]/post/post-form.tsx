'use client'
import { useActionState, useState } from 'react'
import { submitResult, type FormState } from '@/app/actions'
import { useSupabase } from '@/lib/supabase/client'

// Resize to 1600px on the long side and re-encode as WebP. Also converts iPhone HEIC photos.
async function compress(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  return new Promise((res, rej) => canvas.toBlob(b => (b ? res(b) : rej(new Error('encode'))), 'image/webp', 0.82))
}

const Tick = () => (
  <span className="c"><svg width="10" height="10" viewBox="0 0 12 12"><path d="M2.5 6.2 5 8.6l4.6-5" fill="none" stroke="#0B0C0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
)

type Props = { number: number; heatId: string; userId: string; distanceKm: number; date: string; initialTime: string; initialNote: string }

export function PostForm({ number, heatId, userId, distanceKm, date, initialTime, initialNote }: Props) {
  const supabase = useSupabase()
  const [state, action, pending] = useActionState<FormState, FormData>(submitResult, {})
  const [preview, setPreview] = useState<string | null>(null)
  const [path, setPath] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [note, setNote] = useState(initialNote)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    if (file.size > 15 * 1024 * 1024) { setUploadError('That image is over 15 MB. Try a regular screenshot.'); return }
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const blob = await compress(file)
      const key = `${userId}/${heatId}-${Date.now()}.webp`
      const { error } = await supabase.storage.from('proofs').upload(key, blob, { contentType: 'image/webp' })
      if (error) throw error
      setPath(key)
    } catch {
      setUploadError('Upload failed. Check your connection and try again.')
      setPath('')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form className="form" action={action}>
      <input type="hidden" name="number" value={number} />
      <input type="hidden" name="screenshot_path" value={path} />
      <label className="drop">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {preview ? <img className="prev" src={preview} alt="Your screenshot" /> : <span className="prev" aria-hidden="true" />}
        <span style={{ display: 'grid', gap: 4 }}>
          <b style={{ fontSize: 15 }}>{uploading ? 'Uploading…' : path ? 'Screenshot added' : 'Add your screenshot'}</b>
          <span className="muted" style={{ fontSize: 14 }}>{path ? 'Tap to replace it.' : 'Any running app. Show the date, distance and time.'}</span>
          {uploadError && <span className="error">{uploadError}</span>}
        </span>
        <input id="shot" type="file" accept="image/*" onChange={onFile} aria-label="Screenshot of your run" />
      </label>
      <div className="field">
        <label htmlFor="time">Finish time</label>
        <input className="input mono" id="time" name="time" placeholder="24:31" inputMode="numeric" defaultValue={initialTime} required autoComplete="off" />
      </div>
      <div className="field">
        <label htmlFor="note">Note <span style={{ color: 'var(--text3)' }}>· shows next to your time</span></label>
        <input className="input" id="note" name="note" maxLength={100} placeholder="that hill was evil" value={note} onChange={e => setNote(e.target.value)} />
        <span className="counter">{note.length} / 100</span>
      </div>
      <div className="checks">
        <div><Tick />Dated {date}, started near the gun</div>
        <div><Tick />Distance {distanceKm.toFixed(1)} km or more</div>
        <div><Tick />Time matches what you entered</div>
      </div>
      {state.error && <p className="error" role="alert">{state.error}</p>}
      <button className="btn theme block" type="submit" disabled={!path || uploading || pending}>{pending ? 'Posting…' : 'Post time'}</button>
    </form>
  )
}
