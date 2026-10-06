'use client'
import { useSyncExternalStore } from 'react'

const tick = (cb: () => void) => { const t = setInterval(cb, 1000); return () => clearInterval(t) }
const nowSecond = () => Math.floor(Date.now() / 1000) * 1000
const pad = (n: number) => String(n).padStart(2, '0')

export function Countdown({ iso, format = 'pill' }: { iso: string; format?: 'pill' | 'clock' }) {
  const now = useSyncExternalStore(tick, nowSecond, () => null)

  if (now === null) return <span className="mono">{format === 'pill' ? 'Gun in …' : '--d --:--:--'}</span>
  const ms = new Date(iso).getTime() - now
  if (ms <= 0) return <span>{ms > -2 * 3600e3 ? 'Running now' : 'The gun went off'}</span>
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  if (format === 'clock') return <span className="mono">{d}d {pad(h)}:{pad(m)}:{pad(sec)}</span>
  return <span className="mono">Gun in {d > 0 ? `${d}d ` : ''}{h}h {pad(m)}m{d === 0 ? ` ${pad(sec)}s` : ''}</span>
}
