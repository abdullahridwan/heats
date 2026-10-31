import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { emptySlotSVG, stampSVG } from '@/lib/stamps'

// Stamp case row: four postmarked stamps and two empty slots. The newest stamp
// (Heat 004) drops in. 5 s loop at 30 fps. Header and card chrome live in CSS.
export const CASE_W = 660
export const CASE_H = 150
export const CASE_FRAMES = 150

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const CELL_W = 95
const GAP = 18
const TOP = 12

const SLOTS = [
  { scene: 'central_fall', heat: '001', postmark: 'OCT 10', tilt: -3 },
  { scene: 'central_dusk', heat: '002', postmark: 'NOV 08', tilt: 2 },
  { scene: 'prospect', heat: '003', postmark: 'NOV 15', tilt: -1.5 },
  { scene: 'hudson', heat: '004', postmark: 'NOV 22', tilt: 2 },
].map(s => ({ ...s, html: stampSVG({ scene: s.scene, heatNo: s.heat, uid: `how-case-${s.heat}`, postmark: s.postmark }) }))

const EMPTY = ['005', '006'].map(n => emptySlotSVG(n))

const cellX = (i: number) => i * (CELL_W + GAP)

export function CaseScene() {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Newest stamp: appears at 1 s, springs down to rest at 2 deg.
  const opacity = interpolate(f, [30, 51], [0, 1], clamp)
  const p = spring({ frame: Math.max(0, f - 30), fps, config: { damping: 14, stiffness: 120 } })
  const scale = interpolate(p, [0, 1], [1.6, 1])
  const rot = interpolate(p, [0, 1], [-14, 2])

  return (
    <div style={{ position: 'relative', width: CASE_W, height: CASE_H, background: '#fff' }}>
      {SLOTS.map((s, i) => {
        const newest = i === SLOTS.length - 1
        return (
          <div
            key={s.heat}
            style={{
              position: 'absolute',
              left: cellX(i),
              top: TOP,
              width: CELL_W,
              filter: 'drop-shadow(0 8px 12px rgba(6,18,54,.16))',
              opacity: newest ? opacity : 1,
              transform: newest ? `rotate(${rot}deg) scale(${scale})` : `rotate(${s.tilt}deg)`,
            }}
            dangerouslySetInnerHTML={{ __html: s.html }}
          />
        )
      })}
      {EMPTY.map((html, i) => (
        <div
          key={i}
          style={{ position: 'absolute', left: cellX(SLOTS.length + i), top: TOP, width: CELL_W }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ))}
    </div>
  )
}
