'use client'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { SCENES } from '@/lib/stamps'
import type { Heat } from '@/lib/types'
import styles from './page.module.css'

const NY = 'America/New_York'

// The UTC offset of New York at instant t, in ms (negative for EST/EDT, e.g. -4h in summer).
function nyOffsetMs(t: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: NY,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(new Date(t))
  const v = (type: string) => Number(parts.find(p => p.type === type)?.value)
  const wallAsUtc = Date.UTC(v('year'), v('month') - 1, v('day'), v('hour'), v('minute'), v('second'))
  return wallAsUtc - Math.floor(t / 1000) * 1000
}

// Converts a New York wall-clock time to a UTC instant, correct across EST/EDT.
function nyToUtc(y: number, m: number, d: number, h: number, mi: number, s: number): number {
  const guess = Date.UTC(y, m - 1, d, h, mi, s)
  const once = guess - nyOffsetMs(guess)
  return guess - nyOffsetMs(once)
}

// A heat's Saturday as YYYY-MM-DD in New York time (for prefilling the date input).
function nyDate(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: NY, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))
}

type Form = {
  number: string
  name: string
  park: string
  scene: string
  date: string
  location: string
  min_km: string
  max_km: string
}

const sceneKeys = Object.keys(SCENES)

function blankForm(nextNumber: number): Form {
  return {
    number: String(nextNumber),
    name: '',
    park: '',
    scene: sceneKeys[0] ?? '',
    date: '',
    location: '',
    min_km: '4.9',
    max_km: '5.6',
  }
}

function fromHeat(h: Heat): Form {
  return {
    number: String(h.number),
    name: h.name,
    park: h.park,
    scene: h.scene,
    date: nyDate(h.opens_at),
    location: h.location_terms.join(', '),
    min_km: String(h.min_km),
    max_km: String(h.max_km),
  }
}

export function HeatsEditor({ heats }: { heats: Heat[] }) {
  const router = useRouter()
  const [form, setForm] = useState<Form>(() => blankForm((heats.at(-1)?.number ?? 0) + 1))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function load(value: string) {
    setError(null)
    setSaved(null)
    const heat = heats.find(h => String(h.number) === value)
    setForm(heat ? fromHeat(heat) : blankForm((heats.at(-1)?.number ?? 0) + 1))
  }

  // Day-of-week of the entered date, or null if it is not a valid date.
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(form.date)
  const saturday = dateParts
    ? new Date(Date.UTC(Number(dateParts[1]), Number(dateParts[2]) - 1, Number(dateParts[3]))).getUTCDay() === 6
    : false

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSaved(null)

    const number = Number(form.number)
    const min_km = Number(form.min_km)
    const max_km = Number(form.max_km)
    if (!Number.isInteger(number) || number < 1) return setError('Heat number must be a whole number, 1 or higher.')
    if (!dateParts) return setError('Pick the Saturday date.')
    if (!saturday) return setError('Heat dates must be a Saturday.')
    if (!(min_km > 0) || !(max_km > min_km)) return setError('Max km must be greater than min km.')

    const y = Number(dateParts[1])
    const m = Number(dateParts[2])
    const d = Number(dateParts[3])
    const opens_at = new Date(nyToUtc(y, m, d, 0, 0, 0)).toISOString()
    const closes_at = new Date(nyToUtc(y, m, d + 1, 23, 59, 59)).toISOString()

    setBusy(true)
    try {
      const res = await fetch('/api/admin/heats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number,
          name: form.name.trim(),
          park: form.park.trim(),
          scene: form.scene,
          opens_at,
          closes_at,
          location_terms: form.location.split(',').map(s => s.trim()).filter(Boolean),
          min_km,
          max_km,
        }),
      })
      if (res.ok) {
        setSaved(`Saved heat ${String(number).padStart(3, '0')}.`)
        router.refresh()
      } else {
        const body = (await res.json().catch(() => null)) as { message?: string } | null
        setError(body?.message ?? 'Could not save the heat. Check the fields and try again.')
      }
    } catch {
      setError('Could not save the heat. Check the connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  const existing = heats.some(h => String(h.number) === form.number)

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={`${styles.full} ${styles.label}`}>
        <label>
          Edit an existing heat, or start a new one
          <select className={styles.select} defaultValue="" onChange={e => load(e.target.value)} aria-label="Load a heat">
            <option value="">New heat</option>
            {heats.map(h => (
              <option key={h.id} value={h.number}>
                {String(h.number).padStart(3, '0')} · {h.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={styles.label}>
        Number
        <input className={styles.input} type="number" min={1} step={1} value={form.number} onChange={e => set('number', e.target.value)} required />
      </label>
      <label className={styles.label}>
        Name
        <input className={styles.input} value={form.name} maxLength={80} onChange={e => set('name', e.target.value)} required />
      </label>
      <label className={styles.label}>
        Park
        <input className={styles.input} value={form.park} maxLength={60} onChange={e => set('park', e.target.value)} required />
      </label>
      <label className={styles.label}>
        Stamp scene
        <select className={styles.select} value={form.scene} onChange={e => set('scene', e.target.value)} required>
          {sceneKeys.map(k => (
            <option key={k} value={k}>
              {SCENES[k as keyof typeof SCENES].name} ({SCENES[k as keyof typeof SCENES].park})
            </option>
          ))}
        </select>
      </label>
      <label className={styles.label}>
        Saturday date
        <input className={styles.input} type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
      </label>
      <label className={styles.label}>
        Min km
        <input className={styles.input} type="number" min={0.1} step={0.1} value={form.min_km} onChange={e => set('min_km', e.target.value)} required />
      </label>
      <label className={styles.label}>
        Max km
        <input className={styles.input} type="number" min={0.1} step={0.1} value={form.max_km} onChange={e => set('max_km', e.target.value)} required />
      </label>
      <label className={`${styles.full} ${styles.label}`}>
        Location terms
        <input className={styles.input} value={form.location} onChange={e => set('location', e.target.value)} />
        <span className={styles.hint}>Comma separated. Used to check where a run was.</span>
      </label>

      <div className={styles.formActions}>
        <button className={styles.btn} type="submit" disabled={busy}>
          {existing ? 'Update heat' : 'Create heat'}
        </button>
        <span className={styles.hint}>
          Window: Saturday 00:00 to Sunday 23:59, New York time.
        </span>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {saved && <p className={styles.saved} role="status">{saved}</p>}
      </div>
    </form>
  )
}
