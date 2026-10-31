'use client'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import styles from './page.module.css'

export function LoginForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        router.refresh()
        return
      }
      setError(res.status === 401 ? 'Wrong password' : 'Something went wrong. Try again.')
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className={styles.loginCard} onSubmit={submit}>
      <div>
        <p className={styles.eyebrow}>Heats</p>
        <h1 className={styles.title}>Admin</h1>
      </div>
      <label className={styles.label}>
        Password
        <input
          className={styles.input}
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </label>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button className={styles.btn} type="submit" disabled={busy}>Sign in</button>
    </form>
  )
}

export function SignOutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function signOut() {
    setBusy(true)
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
    } finally {
      router.refresh()
      setBusy(false)
    }
  }

  return (
    <button className={`${styles.btn} ${styles.btnGhost}`} type="button" disabled={busy} onClick={signOut}>
      Sign out
    </button>
  )
}
