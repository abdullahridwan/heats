import { useEffect, useState } from 'react'
import { AbsoluteFill, Easing, Sequence, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { getLength, getPointAtLength } from '@remotion/paths'
import art from './art.json'

export const W = 1080
export const H = 1920
export const FPS = 30

export const ink = '#0B0C0A'
export const volt = '#CCFF00'
export const grey = '#5E625B'
// TikTok covers the top ~170px, the bottom ~420px and the right ~120px with its own UI.
export const X0 = 70, X1 = 960

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
export const wm: React.CSSProperties = { fontFamily: 'ArchivoWide, sans-serif', textTransform: 'uppercase', letterSpacing: '-.035em', lineHeight: 0.9 }
export const ui: React.CSSProperties = { fontFamily: 'Geist, sans-serif' }
export const mono: React.CSSProperties = { fontFamily: 'GeistMono, monospace', fontVariantNumeric: 'tabular-nums' }

export function useFonts() {
  const [handle] = useState(() => delayRender('fonts'))
  useEffect(() => {
    const faces = [
      new FontFace('ArchivoWide', `url(${staticFile('fonts/archivo-black-italic-wide.ttf')})`),
      new FontFace('Geist', `url(${staticFile('fonts/geist-400.ttf')})`, { weight: '400' }),
      new FontFace('Geist', `url(${staticFile('fonts/geist-600.ttf')})`, { weight: '600' }),
      new FontFace('GeistMono', `url(${staticFile('fonts/geist-mono-500.ttf')})`, { weight: '500' }),
      new FontFace('GeistMono', `url(${staticFile('fonts/geist-mono-600.ttf')})`, { weight: '600' }),
    ]
    Promise.all(faces.map(f => f.load())).then(l => { l.forEach(f => document.fonts.add(f)); continueRender(handle) })
  }, [handle])
}

export const Defs = () => (
  <>
    <style>{`.t-mono{font-family:GeistMono,monospace;font-weight:600}.t-wm{font-family:ArchivoWide,sans-serif}`}</style>
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <filter id="ink" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves={2} seed={4} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="d" />
        <feTurbulence type="fractalNoise" baseFrequency="1.8" numOctaves={1} seed={9} result="s" />
        <feColorMatrix in="s" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -4.2 0 0 0 3.05" result="m" />
        <feComposite in="d" in2="m" operator="in" />
      </filter>
    </svg>
  </>
)

export const Mark = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
    <rect width="100" height="100" rx="24" fill={volt} />
    <polygon points="32,22 46,22 38,78 24,78" fill={ink} /><polygon points="62,22 76,22 68,78 54,78" fill={ink} /><polygon points="37,43 67,43 65.4,55 35.4,55" fill={ink} />
  </svg>
)

// A line of display type that rises out of a mask.
export function Rise({ children, at, size, hl = false }: { children: string; at: number; size: number; hl?: boolean }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = spring({ frame: f - at, fps, config: { damping: 16, stiffness: 180 } })
  const bar = interpolate(f, [at + 8, at + 20], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) })
  return (
    <div style={{ overflow: 'hidden', paddingBottom: size * 0.06, marginBottom: -size * 0.06 }}>
      <div style={{ ...wm, fontSize: size, position: 'relative', display: 'inline-block', transform: `translateY(${(1 - s) * 110}%)`, color: ink }}>
        {hl && <span style={{ position: 'absolute', inset: `${size * 0.04}px -${size * 0.07}px ${size * 0.02}px -${size * 0.07}px`, background: volt, transformOrigin: 'left', transform: `scaleX(${bar})`, zIndex: -1, borderRadius: size * 0.05 }} />}
        {children}
      </div>
    </div>
  )
}

export const Brand = () => (
  <div style={{ position: 'absolute', left: X0, top: 178, display: 'flex', alignItems: 'center', gap: 18 }}>
    <Mark size={64} />
    <span style={{ ...wm, fontSize: 40, color: ink }}>Heats</span>
  </div>
)

// ───────── 1 · Hook
function Hook() {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const hit = 60
  const slam = spring({ frame: f - hit, fps, config: { damping: 9, stiffness: 220, mass: 0.7 } })
  const scale = interpolate(slam, [0, 1], [1.9, 1])
  const op = interpolate(f, [hit, hit + 3], [0, 1], clamp)
  const shake = f >= hit && f < hit + 8 ? Math.sin((f - hit) * 5) * (8 - (f - hit)) * 1.4 : 0
  return (
    <AbsoluteFill style={{ background: '#fff', transform: `translate(${shake}px, ${shake * 0.6}px)` }}>
      <Brand />
      <div style={{ position: 'absolute', left: X0, top: 390, whiteSpace: 'nowrap' }}>
        <Rise at={4} size={150}>Free</Rise>
        <Rise at={9} size={150}>5K in</Rise>
        <Rise at={14} size={150}>Central</Rise>
        <Rise at={19} size={150}>Park.</Rise>
        <Rise at={26} size={150} hl>Today.</Rise>
      </div>
      <div style={{ position: 'absolute', left: X0, top: 1200, width: 520, ...ui, fontSize: 44, color: grey, lineHeight: 1.3, opacity: interpolate(f, [36, 48], [0, 1], clamp) }}>
        Chilly Central Park 5K<br />Saturday, Oct 10<br />Any time, all day
      </div>
      <div style={{ position: 'absolute', left: 590, top: 1060, width: 420, transform: `rotate(-11deg) scale(${scale})`, opacity: op, mixBlendMode: 'multiply' }} dangerouslySetInnerHTML={{ __html: art.stamp }} />
    </AbsoluteFill>
  )
}

// ───────── 2 · The run
export function Course({ title, sub, to = 5 }: { title: React.ReactNode; sub: string; to?: number }) {
  const f = useCurrentFrame()
  const p = interpolate(f, [14, 76], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) })
  const len = getLength(art.course.d)
  const pt = getPointAtLength(art.course.d, Math.max(0.01, p * len))!
  const start = getPointAtLength(art.course.d, 0.01)!
  const head = interpolate(f, [0, 12], [0, 1], clamp)
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      <Brand />
      <div style={{ position: 'absolute', left: X0, top: 340, ...ui, fontWeight: 600, fontSize: 92, letterSpacing: '-.04em', lineHeight: 1.02, color: ink, opacity: head, transform: `translateY(${(1 - head) * 30}px)`, width: 880 }}>
        {title}
      </div>
      <svg viewBox="0 0 200 200" style={{ position: 'absolute', left: 90, top: 600, width: 900, height: 900, overflow: 'visible' }}>
        <g transform={art.course.t}>
          <path d={art.course.d} fill="none" stroke="#E3E5DC" strokeWidth={5} strokeLinejoin="round" />
          <path d={art.course.d} fill="none" stroke={ink} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
          <circle cx={start.x} cy={start.y} r={6} fill="#fff" stroke={ink} strokeWidth={3} />
          <circle cx={pt.x} cy={pt.y} r={9} fill={volt} stroke={ink} strokeWidth={3.5} />
        </g>
      </svg>
      <div style={{ position: 'absolute', left: X0, top: 1400, display: 'flex', alignItems: 'baseline', gap: 16 }}>
        <span style={{ ...ui, fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: 170, letterSpacing: '-.05em', color: ink }}>{(p * to).toFixed(2)}</span>
        <span style={{ ...ui, fontSize: 52, color: grey }}>km</span>
      </div>
      <div style={{ position: 'absolute', left: X0, top: 1600, ...ui, fontSize: 40, color: grey, width: 880, opacity: interpolate(f, [30, 44], [0, 1], clamp) }}>
        {sub}
      </div>
    </AbsoluteFill>
  )
}

// ───────── 3 · Post the screenshot
export function Card() {
  return (
    <div style={{ width: 440, height: 782, borderRadius: 44, overflow: 'hidden', position: 'relative', background: '#EEF0E9', boxShadow: '0 40px 80px -30px rgba(11,12,10,.4)' }}>
      <svg viewBox="0 0 440 470" style={{ position: 'absolute', inset: 0, width: 440, height: 470 }}>
        <path d="M-20 130 L470 40 M-20 190 L470 100" stroke="#fff" strokeWidth={22} />
        <rect x="46" y="226" width="348" height="170" rx="20" fill="#CFE6C6" />
        <ellipse cx="220" cy="312" rx="150" ry="58" transform="rotate(-24 220 312)" fill="none" stroke="#FC4C02" strokeWidth={6} />
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 360, bottom: 0, background: '#3B4038' }} />
      <div style={{ position: 'absolute', left: 36, right: 36, bottom: 40, color: '#fff', ...ui }}>
        <b style={{ fontSize: 38 }}>Morning Run</b>
        <div style={{ display: 'grid', gridTemplateColumns: "1fr 1.3fr", gap: "4px 14px", marginTop: 12 }}>
          <span style={{ fontSize: 22, opacity: 0.75 }}>Distance</span><span style={{ fontSize: 22, opacity: 0.75 }}>Time</span>
          <b style={{ fontSize: 40, whiteSpace: 'nowrap' }}>3.12 mi</b><b style={{ fontSize: 40, whiteSpace: 'nowrap' }}>25m 04s</b>
        </div>
      </div>
      <span style={{ position: 'absolute', right: 34, top: 392, color: '#fff', fontWeight: 600, fontSize: 26, letterSpacing: '.06em', ...ui }}>STRAVA</span>
    </div>
  )
}

export function Check({ label, value, at }: { label: string; value: string; at: number }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = spring({ frame: f - at, fps, config: { damping: 14, stiffness: 170 } })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, opacity: s, transform: `translateX(${(1 - s) * 50}px)` }}>
      <span style={{ width: 64, height: 64, borderRadius: '50%', background: ink, display: 'grid', placeItems: 'center', flex: 'none' }}>
        <svg width="30" height="30" viewBox="0 0 12 12"><path d="M2.5 6.2 5 8.6l4.6-5" fill="none" stroke={volt} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      <div style={ui}><div style={{ fontSize: 30, color: grey }}>{label}</div><div style={{ fontSize: 50, fontWeight: 600, letterSpacing: '-.03em', color: ink }}>{value}</div></div>
    </div>
  )
}

function Post() {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const rise = spring({ frame: f - 6, fps, config: { damping: 15, stiffness: 110 } })
  const head = interpolate(f, [0, 12], [0, 1], clamp)
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      <Brand />
      <div style={{ position: 'absolute', left: X0, top: 340, ...ui, fontWeight: 600, fontSize: 92, letterSpacing: '-.04em', lineHeight: 1.02, color: ink, opacity: head, transform: `translateY(${(1 - head) * 30}px)`, width: 880 }}>
        Post your Strava<br />screenshot.
      </div>
      <div style={{ position: 'absolute', left: X0, top: 640, transform: `translateY(${(1 - rise) * 700}px) rotate(-3deg)` }}><Card /></div>
      <div style={{ position: 'absolute', left: 560, top: 760, display: 'grid', gap: 54 }}>
        <Check label="Distance" value="5.02 km" at={42} />
        <Check label="Time" value="25:04" at={54} />
        <Check label="Location" value="Central Park" at={66} />
      </div>
    </AbsoluteFill>
  )
}

// ───────── 4 · Stamped
export function Stamped({ title, foot, slots = false }: { title: React.ReactNode; foot: string; slots?: boolean }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const head = interpolate(f, [0, 12], [0, 1], clamp)
  const hit = 22
  const slam = spring({ frame: f - hit, fps, config: { damping: 9, stiffness: 220, mass: 0.7 } })
  const scale = interpolate(slam, [0, 1], [1.8, 1])
  const op = interpolate(f, [hit, hit + 3], [0, 1], clamp)
  const pop = spring({ frame: f - 46, fps, config: { damping: 10, stiffness: 190 } })
  const shake = f >= hit && f < hit + 8 ? Math.sin((f - hit) * 5) * (8 - (f - hit)) * 1.2 : 0
  return (
    <AbsoluteFill style={{ background: '#fff', transform: `translate(${shake}px, ${shake * 0.6}px)` }}>
      <Brand />
      <div style={{ position: 'absolute', left: X0, top: 340, ...ui, fontWeight: 600, fontSize: 92, letterSpacing: '-.04em', lineHeight: 1.02, color: ink, opacity: head, transform: `translateY(${(1 - head) * 30}px)` }}>
        {title}
      </div>
      <div style={{ position: 'absolute', left: 120, top: 560, width: 760, height: 900, borderRadius: '14px 34px 34px 14px', background: '#fff', border: '2px solid #ECEDE7', boxShadow: '0 50px 90px -34px rgba(11,12,10,.35)', backgroundImage: 'repeating-linear-gradient(#fff 0 55px, #F1F2EC 55px 57px)', transform: 'rotate(2deg)' }}>
        <span style={{ position: 'absolute', left: 40, top: 32, ...mono, fontWeight: 500, fontSize: 24, letterSpacing: '.14em', color: '#9A9D95' }}>STAMPS</span>
        {slots && [[60, 725], [250, 745]].map(([x, y], i) => (
          <div key={i} style={{ position: 'absolute', left: x, top: y, width: 160, height: 160, borderRadius: "50%", border: '4px dashed #CDD0C7', opacity: interpolate(f, [34 + i * 6, 46 + i * 6], [0, 1], clamp) }} />
        ))}
        <div style={{ position: 'absolute', left: 90, top: 190, width: 560, transform: `rotate(-9deg) scale(${scale})`, opacity: op, mixBlendMode: 'multiply' }} dangerouslySetInnerHTML={{ __html: art.stamp }} />
      </div>
      <div style={{ position: 'absolute', left: 640, top: 1130, width: 270, transform: `rotate(10deg) scale(${pop})`, filter: 'drop-shadow(0 22px 26px rgba(11,12,10,.28))' }} dangerouslySetInnerHTML={{ __html: art.medal }} />
      <div style={{ position: 'absolute', left: X0, top: 1500, ...ui, fontSize: 42, color: grey, opacity: interpolate(f, [50, 62], [0, 1], clamp), width: 880 }}>
        {foot}
      </div>
    </AbsoluteFill>
  )
}

// ───────── 5 · Call to action
export function Cta({ lines, sub }: { lines: React.ReactNode; sub: string }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = spring({ frame: f - 4, fps, config: { damping: 14, stiffness: 140 } })
  const btn = spring({ frame: f - 20, fps, config: { damping: 11, stiffness: 170 } })
  const pulse = 1 + Math.sin(Math.max(0, f - 36) / 5) * 0.018 * interpolate(f, [36, 44], [0, 1], clamp)
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 380, display: 'grid', justifyItems: 'center', gap: 44, opacity: s, transform: `translateY(${(1 - s) * 40}px)` }}>
        <Mark size={200} />
        <div style={{ ...wm, fontSize: 210, color: ink }}>Heats</div>
        <div style={{ ...ui, fontSize: 56, color: grey, textAlign: 'center', lineHeight: 1.25 }}>{lines}</div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1130, display: 'grid', justifyItems: 'center', gap: 34 }}>
        <div style={{ background: volt, color: ink, ...ui, fontWeight: 600, fontSize: 84, letterSpacing: '-.03em', padding: '40px 84px', borderRadius: 40, transform: `scale(${btn * pulse})`, opacity: Math.min(1, btn) }}>heats.run</div>
        <div style={{ ...ui, fontSize: 46, color: grey, opacity: interpolate(f, [34, 46], [0, 1], clamp) }}>{sub}</div>
      </div>
    </AbsoluteFill>
  )
}

// The race-day video: hook, where and when, the reward, call to action.
const T = { hook: 105, run: 90, stamp: 105, cta: 90 }
export const TODAY_TOTAL = T.hook + T.run + T.stamp + T.cta

export function Today() {
  useFonts()
  let at = 0
  const seq = (d: number) => { const from = at; at += d; return { from, durationInFrames: d } }
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      <Defs />
      <Sequence {...seq(T.hook)}><Hook /></Sequence>
      <Sequence {...seq(T.run)}><Course title={<>Run it any time<br />until 11:59 PM.</>} sub="Start at Engineers' Gate · 5th Ave & E 90th St" /></Sequence>
      <Sequence {...seq(T.stamp)}><Stamped title={<>Post your run.<br />Get stamped.</>} foot="Send your Strava screenshot at heats.run" /></Sequence>
      <Sequence {...seq(T.cta)}><Cta lines={<>Free 5K · Central Park · Today<br />Run it any time until 11:59 PM</>} sub="RSVP free · link in bio" /></Sequence>
    </AbsoluteFill>
  )
}
