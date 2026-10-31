'use client'

import { useState } from 'react'
import styles from './page.module.css'

export function ShareButton({ alias, title }: { alias: string; title: string }) {
  const [copied, setCopied] = useState(false)

  async function share() {
    const url = `${window.location.origin}/p/${alias}`
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // The share sheet was dismissed or the clipboard is blocked: nothing to report.
    }
  }

  return (
    <button type="button" className={styles.primary} onClick={share}>
      {copied ? 'Copied' : 'Share my stamp case'}
    </button>
  )
}
