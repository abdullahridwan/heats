import { ImageResponse } from 'next/og'
import { getHeat } from '@/lib/data'
import { park } from '@/lib/themes'
import { clock, heatNo, longDate } from '@/lib/time'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Heats race'

export default async function Image({ params }: { params: Promise<{ number: string }> }) {
  const heat = await getHeat(parseInt((await params).number, 10))
  const p = park(heat ?? { color_key: 'volt' })
  const bg = `radial-gradient(circle at 15% 15%, ${p.b} 0%, transparent 55%), radial-gradient(circle at 90% 20%, ${p.g} 0%, transparent 50%), radial-gradient(circle at 60% 100%, ${p.s} 0%, transparent 60%)`
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 64, backgroundColor: p.s, backgroundImage: bg, color: '#0B0C0A', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28 }}>
          <span style={{ fontWeight: 800, fontStyle: 'italic', letterSpacing: -1 }}>HEATS</span>
          <span>{heat ? `${Number(heat.distance_km).toFixed(1)} KM · FREE` : ''}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 34 }}>{heat ? `Heat ${heatNo(heat.number)} · ${heat.borough}` : 'Heats'}</span>
          <span style={{ fontSize: 96, fontWeight: 700, letterSpacing: -4, lineHeight: 1 }}>{heat?.name ?? 'Free community 5Ks'}</span>
          <span style={{ fontSize: 34, color: '#3a3d37' }}>{heat ? `${longDate(heat.starts_at)} · ${clock(heat.starts_at)} · ${heat.meet_point}` : 'New York'}</span>
        </div>
      </div>
    ),
    size,
  )
}
