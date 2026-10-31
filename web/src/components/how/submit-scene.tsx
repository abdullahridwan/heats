import type { CSSProperties } from 'react'
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { stampSVG } from '@/lib/stamps'

// "Post your run": a Strava screenshot slides into the drop zone, a tap ring presses
// Stamp it, and the postmarked Heat 002 stamp drops onto it. 6 s loop at 30 fps.
export const SUBMIT_W = 272
export const SUBMIT_H = 351
export const SUBMIT_FRAMES = 180

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const navy = '#061236'
const STAMP = stampSVG({ scene: 'central_dusk', heatNo: '002', uid: 'how-submit', postmark: 'NOV 08' })

const ringStyle = (opacity: number, scale: number): CSSProperties => ({
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
  opacity,
  transform: `scale(${scale})`,
  pointerEvents: 'none',
})

export function SubmitScene() {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Hint text fades as the screenshot card slides in.
  const hintOpacity = interpolate(f, [0, 26, 36], [1, 1, 0], clamp)
  const shot = spring({ frame: Math.max(0, f - 18), fps, config: { damping: 16, stiffness: 110 } })
  const shotOpacity = interpolate(f, [18, 24], [0, 1], clamp)
  const shotX = (1 - shot) * 120
  const shotY = (1 - shot) * -40
  const shotRot = (1 - shot) * 12

  // Tap ring presses Stamp it, the button dips, then the stamp drops on the card.
  const ringOpacity = interpolate(f, [0, 79, 94, 108, 119, 180], [0, 0, 1, 1, 0, 0], clamp)
  const ringScale = interpolate(f, [0, 79, 94, 108, 119], [1.6, 1.6, 1, 0.8, 0.8], clamp)
  const pressScale = interpolate(f, [94, 100, 108], [1, 0.97, 1], clamp)
  const drop = spring({ frame: Math.max(0, f - 111), fps, config: { damping: 12, stiffness: 140 } })
  const stampOpacity = interpolate(f, [111, 130, 169, 180], [0, 1, 1, 0], clamp)
  const stampScale = interpolate(drop, [0, 1], [1.8, 1])
  const stampRot = interpolate(drop, [0, 1], [-20, -6])

  return (
    <div style={{ position: 'relative', boxSizing: 'border-box', width: SUBMIT_W, height: SUBMIT_H, padding: '34px 16px 0', background: '#fff', overflow: 'hidden', color: navy, fontFamily: 'var(--f-sans), sans-serif' }}>
      <div style={{ fontFamily: 'var(--f-serif), serif', fontSize: 28, lineHeight: 1.1, letterSpacing: '-0.02em' }}>Post your run</div>

      <div style={{ position: 'relative', boxSizing: 'border-box', height: 150, marginTop: 12, border: '2px dashed #cfd3dc', borderRadius: 10, background: '#FBFBFB' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13, opacity: hintOpacity }}>
          Add your Strava screenshot
        </div>

        <div
          style={{
            position: 'absolute',
            left: 14,
            right: 14,
            top: 14,
            bottom: 14,
            boxSizing: 'border-box',
            padding: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            background: '#fff',
            borderRadius: 8,
            boxShadow: '0 6px 14px rgba(6,18,54,.18)',
            opacity: shotOpacity,
            transform: `translate(${shotX}px, ${shotY}px) rotate(${shotRot}deg)`,
          }}
        >
          <div style={{ height: 74, borderRadius: 5, background: '#ebeff7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="110" height="54" viewBox="0 0 120 70" aria-hidden="true">
              <path d="M10 50 C 30 10, 60 60, 80 25 S 110 30, 112 12" fill="none" stroke="#FC5200" strokeWidth="3" />
            </svg>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--f-mono), monospace', fontSize: 11 }}>
            <span>5.02 km</span>
            <span>19:42</span>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            right: -6,
            bottom: -14,
            width: 70,
            zIndex: 2,
            opacity: stampOpacity,
            transform: `rotate(${stampRot}deg) scale(${stampScale})`,
          }}
          dangerouslySetInnerHTML={{ __html: STAMP }}
        />
      </div>

      <div style={{ position: 'relative', marginTop: 14, height: 42, boxSizing: 'border-box', borderRadius: 5, background: navy, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, transform: `scale(${pressScale})` }}>
        Stamp it
        <span style={ringStyle(ringOpacity, ringScale)} />
      </div>
    </div>
  )
}
