const TZ = 'America/New_York'

export function parseTime(input: string): number | null {
  const parts = input.trim().split(':').map(Number)
  if (parts.length < 2 || parts.some(n => !Number.isInteger(n) || n < 0)) return null
  if (parts.length === 2 && parts[1] < 60) return parts[0] * 60 + parts[1]
  if (parts.length === 3 && parts[1] < 60 && parts[2] < 60) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return null
}

export const formatTime = (s: number) =>
  s >= 3600
    ? `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
    : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export const heatNo = (n: number) => String(n).padStart(3, '0')

function part(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', { timeZone: TZ, ...opts }).format(new Date(iso))
}

export const mon = (iso: string) => part(iso, { month: 'short' }).toUpperCase()
export const day = (iso: string) => part(iso, { day: 'numeric' })
export const weekday = (iso: string) => part(iso, { weekday: 'long' })
export const longDate = (iso: string) => part(iso, { weekday: 'long', month: 'long', day: 'numeric' })
export const shortDate = (iso: string) => part(iso, { month: 'short', day: 'numeric' })
export const clock = (iso: string) => part(iso, { hour: 'numeric', minute: '2-digit' })
export const stampDate = (iso: string) => `${mon(iso)} ${day(iso)} ${part(iso, { year: 'numeric' })}`

export const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

// Request-time clock checks for server components
export const hasStarted = (iso: string) => Date.now() >= new Date(iso).getTime()
export const isUpcoming = (iso: string) => !hasStarted(iso)
