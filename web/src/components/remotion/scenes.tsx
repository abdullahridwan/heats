'use client'
import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig, Easing } from 'remotion'
import { getLength, getPointAtLength } from '@remotion/paths'
import { Medal, Stamp } from '@/components/art'
import { COURSE } from '@/lib/themes'

// Every scene is drawn on an 800×600 canvas and scaled by the Player.
export const W = 800
export const H = 600
export const FPS = 30
export const SCENE = 105 // 3.5 s per scene
export const LOOP = SCENE * 3

const HEAT = { number: 1, name: 'Chilly Central Park 5K', opens_at: '2026-10-10T04:00:00Z', location_terms: ['Central Park'] }
const ink = '#0B0C0A'
const volt = '#CCFF00'

const fadeInOut = (f: number, len: number) =>
  interpolate(f, [0, 8, len - 8, len], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

function Backdrop({ tint }: { tint: string }) {
  return (
    <AbsoluteFill style={{ background: `radial-gradient(at 18% 12%, ${tint} 0, transparent 55%), radial-gradient(at 90% 85%, #E6EEFF 0, transparent 55%), #FBFCF8` }} />
  )
}

function Caption({ step, text }: { step: string; text: string }) {
  return (
    <div style={{ position: 'absolute', left: 40, top: 34, display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--f-ui), sans-serif' }}>
      <span style={{ fontFamily: 'var(--f-mono), monospace', fontSize: 18, color: '#5E625B' }}>{step}</span>
      <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-.02em', color: ink }}>{text}</span>
    </div>
  )
}

// ───────── 1 · Run: the loop draws itself, a runner follows, distance counts up
export function RunScene({ standalone = true }: { standalone?: boolean }) {
  const f = useCurrentFrame()
  const p = interpolate(f, [10, SCENE - 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) })
  const len = getLength(COURSE.d)
  const pt = getPointAtLength(COURSE.d, Math.max(0.01, p * len))
  const km = (p * 5.02).toFixed(2)
  return (
    <AbsoluteFill style={{ opacity: standalone ? 1 : fadeInOut(f, SCENE) }}>
      <Backdrop tint="#F2FFC4" />
      <Caption step="01" text="Start at Engineers' Gate" />
      <svg viewBox="0 0 200 200" style={{ position: 'absolute', left: 230, top: 90, width: 400, height: 400, overflow: 'visible' }}>
        <g transform={COURSE.t}>
          <path d={COURSE.d} fill="none" stroke="#DADDD3" strokeWidth={4} strokeLinejoin="round" />
          <path d={COURSE.d} fill="none" stroke={ink} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
          {pt && <circle cx={pt.x} cy={pt.y} r={8} fill={volt} stroke={ink} strokeWidth={3} />}
        </g>
      </svg>
      <div style={{ position: 'absolute', right: 44, bottom: 40, textAlign: 'right', fontFamily: 'var(--f-ui), sans-serif' }}>
        <div style={{ fontFamily: 'var(--f-mono), monospace', fontSize: 64, fontWeight: 500, letterSpacing: '-.04em', color: ink, fontVariantNumeric: 'tabular-nums' }}>{km}<span style={{ fontSize: 28, marginLeft: 8, color: '#5E625B' }}>km</span></div>
        <div style={{ fontSize: 18, color: '#5E625B' }}>Any time Saturday · 5th Ave & E 90th St</div>
      </div>
    </AbsoluteFill>
  )
}

// ───────── 2 · Post: a Strava card slides up, the numbers are read and checked off
function StravaCard() {
  return (
    <div style={{ width: 230, height: 409, borderRadius: 26, overflow: 'hidden', position: 'relative', background: 'linear-gradient(#E7EBE2 0 58%, #6B6E69 70%, #3E4439)', boxShadow: '0 30px 60px -20px rgba(11,12,10,.35)' }}>
      <svg viewBox="0 0 230 240" style={{ position: 'absolute', inset: 0, width: 230, height: 240 }}>
        <path d="M-10 70 L250 20 M-10 100 L250 50" stroke="#fff" strokeWidth={10} opacity={0.85} />
        <rect x="24" y="118" width="182" height="86" rx="12" fill="#B9DDB0" opacity={0.8} />
        <ellipse cx="115" cy="160" rx="78" ry="30" transform="rotate(-20 115 160)" fill="none" stroke="#FC4C02" strokeWidth={3} />
        <text x="58" y="146" fontSize="11" fill="#44503F" transform="rotate(-14 58 146)">Central Park</text>
      </svg>
      <div style={{ position: 'absolute', left: 18, right: 18, bottom: 18, color: '#fff', fontFamily: 'var(--f-ui), sans-serif', display: 'grid', gap: 6 }}>
        <b style={{ fontSize: 17 }}>Morning Run</b>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 10px' }}>
          <span style={{ fontSize: 10, opacity: 0.8 }}>Distance</span><span style={{ fontSize: 10, opacity: 0.8 }}>Time</span>
          <b style={{ fontSize: 19 }}>3.12 mi</b><b style={{ fontSize: 19 }}>24m 31s</b>
        </div>
      </div>
      <span style={{ position: 'absolute', right: 16, top: 252, color: '#fff', fontWeight: 800, fontSize: 12, letterSpacing: '.05em', fontFamily: 'var(--f-ui), sans-serif' }}>STRAVA</span>
    </div>
  )
}

function Check({ label, value, at }: { label: string; value: string; at: number }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = spring({ frame: f - at, fps, config: { damping: 14, stiffness: 160 } })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: s, transform: `translateX(${(1 - s) * 24}px)`, fontFamily: 'var(--f-ui), sans-serif' }}>
      <span style={{ width: 34, height: 34, borderRadius: '50%', background: ink, display: 'grid', placeItems: 'center' }}>
        <svg width="16" height="16" viewBox="0 0 12 12"><path d="M2.5 6.2 5 8.6l4.6-5" fill="none" stroke={volt} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      <div><div style={{ fontSize: 15, color: '#5E625B' }}>{label}</div><div style={{ fontFamily: 'var(--f-mono), monospace', fontSize: 30, fontWeight: 500, letterSpacing: '-.03em', color: ink }}>{value}</div></div>
    </div>
  )
}

export function PostScene({ standalone = true }: { standalone?: boolean }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const up = spring({ frame: f - 4, fps, config: { damping: 16, stiffness: 110 } })
  const scan = interpolate(f, [26, 52], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ opacity: standalone ? 1 : fadeInOut(f, SCENE) }}>
      <Backdrop tint="#FFE9D6" />
      <Caption step="02" text="Post your Strava screenshot" />
      <div style={{ position: 'absolute', left: 120, top: 120, transform: `translateY(${(1 - up) * 460}px) rotate(${(1 - up) * -6}deg)` }}>
        <StravaCard />
        <div style={{ position: 'absolute', left: 0, right: 0, top: `${scan * 100}%`, height: 3, background: volt, boxShadow: `0 0 18px ${volt}`, opacity: scan > 0 && scan < 1 ? 1 : 0 }} />
      </div>
      <div style={{ position: 'absolute', left: 440, top: 190, display: 'grid', gap: 26 }}>
        <Check label="Distance" value="5.02 km" at={40} />
        <Check label="Time" value="24:31" at={52} />
        <Check label="Location" value="Central Park" at={64} />
      </div>
    </AbsoluteFill>
  )
}

// ───────── 3 · Stamped: the stamp slams onto a passport page, the medal pops in
export function StampScene({ standalone = true }: { standalone?: boolean }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const hit = 22
  const drop = interpolate(f, [8, hit], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic) })
  const settle = spring({ frame: f - hit, fps, config: { damping: 9, stiffness: 220 } })
  const scale = f < hit ? interpolate(drop, [0, 1], [2.3, 1]) : 1 + (1 - settle) * 0.06
  const shake = f >= hit && f < hit + 10 ? Math.sin((f - hit) * 2.4) * (hit + 10 - f) * 0.7 : 0
  const medal = spring({ frame: f - 46, fps, config: { damping: 10, stiffness: 140 } })
  const word = spring({ frame: f - 60, fps, config: { damping: 18 } })
  return (
    <AbsoluteFill style={{ opacity: standalone ? 1 : fadeInOut(f, SCENE) }}>
      <Backdrop tint="#F2FFC4" />
      <Caption step="03" text="Get stamped" />
      <div style={{ position: 'absolute', left: 200, top: 100, width: 300, height: 420, borderRadius: '10px 22px 22px 10px', background: '#fff', boxShadow: '0 30px 70px -24px rgba(11,12,10,.3)', transform: `translateY(${shake}px)`, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 20, top: 16, right: 20, display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--f-mono), monospace', fontSize: 12, letterSpacing: '.14em', color: '#5E625B' }}><span>STAMPS</span><span>FALL 2026</span></div>
        <div style={{ position: 'absolute', left: 36, top: 70, width: 228, opacity: drop > 0 ? 1 : 0, transform: `scale(${scale}) rotate(${interpolate(drop, [0, 1], [-22, -8])}deg)`, transformOrigin: 'center' }}>
          <Stamp heat={HEAT} salt="rm" />
        </div>
        <div style={{ position: 'absolute', left: 60, bottom: 40, width: 180, height: 120, borderRadius: '50%', border: '2px dashed #DADDD3' }} />
      </div>
      <div style={{ position: 'absolute', left: 440, top: 300, width: 150, transform: `scale(${medal}) rotate(${(1 - medal) * -40 + 8}deg)`, filter: 'drop-shadow(0 16px 18px rgba(11,12,10,.22))' }}>
        <Medal kind="founding" salt="rm" />
      </div>
      <div style={{ position: 'absolute', left: 560, top: 190, opacity: word, transform: `translateY(${(1 - word) * 16}px)`, fontFamily: 'var(--f-ui), sans-serif' }}>
        <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: '-.04em', color: ink }}>Stamped.</div>
        <div style={{ fontSize: 17, color: '#5E625B', maxWidth: 200 }}>Heat 001 is in your run passport.</div>
      </div>
    </AbsoluteFill>
  )
}

// ───────── the whole loop, for the hero
export function LoopScene() {
  return (
    <AbsoluteFill style={{ background: '#FBFCF8' }}>
      <Sequence durationInFrames={SCENE}><RunScene standalone={false} /></Sequence>
      <Sequence from={SCENE} durationInFrames={SCENE}><PostScene standalone={false} /></Sequence>
      <Sequence from={SCENE * 2} durationInFrames={SCENE}><StampScene standalone={false} /></Sequence>
    </AbsoluteFill>
  )
}

