import { AVATAR_COLORS } from '@/lib/themes'

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

export function Avatar({ alias, url, size = 30, className = '' }: { alias: string; url?: string | null; size?: number; className?: string }) {
  const c = AVATAR_COLORS[hash(alias) % AVATAR_COLORS.length]
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={`av ${className}`} src={url} alt="" width={size} height={size} style={{ width: size, height: size }} />
  ) : (
    <span className={`av ${className}`} style={{ width: size, height: size, background: `radial-gradient(circle at 32% 30%, #fff, ${c} 55%, ${c})` }} aria-hidden="true" />
  )
}

export function AvatarStack({ runners, size = 30 }: { runners: { alias: string; avatar_url: string | null }[]; size?: number }) {
  if (!runners.length) return null
  return <span className="avs">{runners.map(r => <Avatar key={r.alias} alias={r.alias} url={r.avatar_url} size={size} />)}</span>
}
