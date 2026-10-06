'use client'
import { useEffect, useRef, useState } from 'react'

type Props = {
  src: string           // story PNG route
  filename: string
  url: string           // page link to pass along
  title: string
  caption: string       // text that rides along in the share sheet
  heading?: string
  label?: string
  className?: string
  autoOpen?: boolean    // open right after a moment worth sharing (e.g. joining a heat)
}

// One tap from moment → Instagram story. The image is fetched when the sheet opens so the
// Share button can hand a real file to the phone's share sheet (Stories, Messages, AirDrop…).
export function ShareStory({ src, filename, url, title, caption, heading = 'Share to your story', label = 'Share to your story', className = 'btn theme', autoOpen = false }: Props) {
  const [open, setOpen] = useState(autoOpen)
  const [ready, setReady] = useState(false)
  const [note, setNote] = useState('')
  const file = useRef<File | null>(null)

  useEffect(() => {
    if (!open) return
    let alive = true
    fetch(src).then(r => r.blob()).then(b => {
      if (!alive) return
      file.current = new File([b], filename, { type: 'image/png' })
      setReady(true)
    }).catch(() => alive && setReady(true))
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    if (autoOpen) {
      const u = new URL(window.location.href)
      if (u.searchParams.has('joined')) { u.searchParams.delete('joined'); window.history.replaceState(null, '', u) }
    }
    return () => { alive = false; window.removeEventListener('keydown', onKey) }
  }, [open, src, filename, autoOpen])

  async function share() {
    const f = file.current
    try {
      if (f && navigator.canShare?.({ files: [f] })) { await navigator.share({ files: [f], title, text: `${caption} ${url}` }); return }
      if (navigator.share) { await navigator.share({ title, text: caption, url }); return }
      await navigator.clipboard.writeText(url)
      setNote('Link copied. Save the image and post it to your story.')
    } catch { /* closed the share sheet */ }
  }

  async function copy() {
    try { await navigator.clipboard.writeText(url); setNote('Link copied') } catch { setNote(url) }
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12" /><path d="m7 8 5-5 5 5" /><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></svg>
        {label}
      </button>
      {open && (
        <div className="share-modal" role="dialog" aria-modal="true" aria-label={heading} onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className="share-panel">
            <div className="share-head">
              <b>{heading}</b>
              <button type="button" className="share-x" onClick={() => setOpen(false)} aria-label="Close">×</button>
            </div>
            <div className="share-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={title} width={1080} height={1920} />
            </div>
            <p className="share-tip">Post it to your story and add a link sticker to <span className="mono">{url.replace(/^https?:\/\//, '')}</span></p>
            <div className="share-actions">
              <button type="button" className="btn theme block" onClick={share} disabled={!ready}>{ready ? 'Share' : 'Preparing…'}</button>
              <div className="share-row">
                <a className="btn ghost" href={`${src}${src.includes('?') ? '&' : '?'}download=1`} download={filename}>Save image</a>
                <button type="button" className="btn ghost" onClick={copy}>Copy link</button>
              </div>
              {note && <p className="share-tip" role="status">{note}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
