'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import styles from './page.module.css'

export function SignOutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function signOut() {
    setBusy(true)
    try {
      const res = await fetch('/api/auth/signout', { method: 'POST' })
      if (res.ok) router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <button type="button" className={styles.signout} onClick={signOut} disabled={busy}>
      Sign out
    </button>
  )
}
