'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function OnboardingForm({ next, suggestion }: { next: string; suggestion: string }) {
  const router = useRouter()
  const [alias, setAlias] = useState(suggestion)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true); setError('')
    try {
      const res = await fetch('/api/me/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error === 'alias_taken' ? `${alias} is taken. Try another.` : 'Could not save your passport. Try again.')
        setPending(false)
        return
      }
      router.push(next)
      router.refresh()
    } catch {
      setError('Could not save your passport. Try again.')
      setPending(false)
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="alias">Alias</label>
        <input className="input" id="alias" value={alias} onChange={e => setAlias(e.target.value)} placeholder="mile_kat" required minLength={3} maxLength={20} pattern="[a-zA-Z0-9._]{3,20}" autoCapitalize="none" autoComplete="username" />
        <span className="eyebrow">3–20 characters: letters, numbers, dots or underscores.</span>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn volt block" type="submit" disabled={pending}>{pending ? 'Saving…' : 'Create my passport'}</button>
    </form>
  )
}
