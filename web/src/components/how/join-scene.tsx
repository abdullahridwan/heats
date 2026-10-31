import type { CSSProperties, ReactNode } from 'react'
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

// Calendar screen: the live heat card, then COMING UP. A tap ring lands on Join
// for the second row and it flips to "You're in". 4 s loop at 30 fps.
export const JOIN_W = 272
export const JOIN_H = 351
export const JOIN_FRAMES = 120

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const navy = '#061236'

const pillBase: CSSProperties = {
  display: 'inline-block',
  padding: '6px 10px',
  borderRadius: 5,
  fontSize: 12,
  fontWeight: 500,
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
}
const pillNavy: CSSProperties = { ...pillBase, background: navy, color: '#fff' }
const pillSoft: CSSProperties = { ...pillBase, background: '#F2FFC4', color: '#4B7A00' }

function Row({ day, heat, park, action }: { day: string; heat: string; park: string; action: ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '36px minmax(0,1fr) auto', gap: 10, alignItems: 'center', padding: '10px 0', borderTop: '1px solid #f3f3f3' }}>
      <div style={{ textAlign: 'center', borderRadius: 6, background: '#f3f3f3', padding: '3px 0' }}>
        <div style={{ fontSize: 9, fontWeight: 600 }}>NOV</div>
        <div style={{ fontFamily: 'var(--f-serif), serif', fontSize: 16, lineHeight: 1.2 }}>{day}</div>
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{heat}</div>
        <div style={{ fontSize: 12, color: '#4c5265' }}>{park}</div>
      </div>
      {action}
    </div>
  )
}

export function JoinScene() {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Tap ring: appears at ~1.2 s, presses Join at ~1.9 s, gone by ~2.2 s.
  const ringOpacity = interpolate(f, [0, 36, 46, 58, 68, 120], [0, 0, 1, 1, 0, 0], clamp)
  const ringScale = interpolate(f, [0, 36, 46, 58, 68], [1.6, 1.6, 1, 0.8, 0.8], clamp)
  // Join fades out as "You're in" springs in.
  const joinOpacity = interpolate(f, [0, 55, 60, 113, 120], [1, 1, 0, 0, 1], clamp)
  const inOpacity = interpolate(f, [55, 62, 113, 120], [0, 1, 1, 0], clamp)
  const pop = spring({ frame: Math.max(0, f - 55), fps, config: { damping: 14, stiffness: 170 } })
  const inScale = 0.8 + 0.2 * pop

  return (
    <div style={{ position: 'relative', boxSizing: 'border-box', width: JOIN_W, height: JOIN_H, padding: '34px 16px 0', background: '#fff', overflow: 'hidden', color: navy, fontFamily: 'var(--f-sans), sans-serif' }}>
      <div style={{ fontFamily: 'var(--f-serif), serif', fontSize: 28, lineHeight: 1.1, letterSpacing: '-0.02em' }}>Calendar</div>

      <div style={{ background: '#CCFF00', borderRadius: 12, padding: 12, margin: '12px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em' }}>LIVE NOW</div>
        <div style={{ fontFamily: 'var(--f-serif), serif', fontSize: 22, lineHeight: 1.1 }}>Heat 002</div>
        <div style={{ fontSize: 12 }}>Central Park / Nov 8 to 9</div>
      </div>

      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', color: '#6b7180', margin: '4px 0' }}>COMING UP</div>

      <Row
        day="15"
        heat="Heat 003"
        park="Prospect Park"
        action={<span style={pillSoft}>You&apos;re in</span>}
      />
      <Row
        day="22"
        heat="Heat 004"
        park="Hudson River"
        action={
          <span style={{ position: 'relative', display: 'inline-block' }}>
            <span style={{ ...pillNavy, opacity: joinOpacity }}>Join</span>
            <span style={{ ...pillSoft, position: 'absolute', right: 0, top: 0, opacity: inOpacity, transform: `scale(${inScale})`, transformOrigin: 'right center' }}>
              You&apos;re in
            </span>
            <span
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 34,
                height: 34,
                marginLeft: -17,
                marginTop: -17,
                boxSizing: 'border-box',
                borderRadius: '50%',
                border: `2.5px solid ${navy}`,
                background: 'rgba(204,255,0,.35)',
                opacity: ringOpacity,
                transform: `scale(${ringScale})`,
                pointerEvents: 'none',
              }}
            />
          </span>
        }
      />
      <Row
        day="29"
        heat="Heat 005"
        park="Flushing Meadows"
        action={<span style={pillNavy}>Join</span>}
      />
    </div>
  )
}
