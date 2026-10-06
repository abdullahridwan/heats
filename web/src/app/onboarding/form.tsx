'use client'
import { useActionState } from 'react'
import { createProfile, type FormState } from '@/app/actions'

const PARKS = ['Central Park', 'Prospect Park', 'Hudson River Greenway', 'Brooklyn Bridge Park', "Randall's Island", 'Van Cortlandt Park', 'Rockaway Beach', 'Somewhere else']

export function OnboardingForm({ next, suggestion }: { next: string; suggestion: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createProfile, {})
  return (
    <form className="form" action={action}>
      <input type="hidden" name="next" value={next} />
      <div className="field">
        <label htmlFor="alias">Alias</label>
        <input className="input" id="alias" name="alias" defaultValue={suggestion} placeholder="mile_kat" required minLength={3} maxLength={20} pattern="[a-zA-Z0-9._]{3,20}" autoCapitalize="none" autoComplete="username" />
        <span className="eyebrow">3–20 characters: letters, numbers, dots or underscores.</span>
      </div>
      <div className="field">
        <label htmlFor="home_park">Home park <span style={{ color: 'var(--text3)' }}>· optional</span></label>
        <select className="input" id="home_park" name="home_park" defaultValue="">
          <option value="">Choose one</option>
          {PARKS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      {state.error && <p className="error" role="alert">{state.error}</p>}
      <button className="btn volt block" type="submit" disabled={pending}>{pending ? 'Saving…' : 'Create my passport'}</button>
    </form>
  )
}
