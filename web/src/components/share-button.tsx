'use client'
import { useState } from 'react'

export function ShareButton({ url, title, className = 'btn ghost' }: { url: string; title: string; className?: string }) {
  const [label, setLabel] = useState('Share')
  async function share() {
    try {
      if (navigator.share) { await navigator.share({ title, url }); return }
      await navigator.clipboard.writeText(url)
      setLabel('Link copied')
      setTimeout(() => setLabel('Share'), 1600)
    } catch { /* user closed the share sheet */ }
  }
  return <button type="button" className={className} onClick={share}>{label}</button>
}
