import { getHeat } from '@/lib/data'
import { heatNo } from '@/lib/time'

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const icsText = (s: string) => s.replace(/[\\;,]/g, m => `\\${m}`)

export async function GET(_: Request, { params }: { params: Promise<{ number: string }> }) {
  const heat = await getHeat(parseInt((await params).number, 10))
  if (!heat) return new Response('Not found', { status: 404 })
  const start = new Date(heat.starts_at)
  const end = new Date(start.getTime() + 75 * 60e3)
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://heats.run'
  const n = heatNo(heat.number)
  const body = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Heats//Heats NYC//EN', 'BEGIN:VEVENT',
    `UID:heat-${n}@heats.run`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:${icsText(`Heat ${n} · ${heat.name}`)}`,
    `LOCATION:${icsText(`${heat.meet_point}, ${heat.address ?? heat.park}, New York`)}`,
    `DESCRIPTION:${icsText(`Arrive 10 minutes early. The gun goes on time. ${site}/h/${n}`)}`,
    `URL:${site}/h/${n}`,
    'BEGIN:VALARM', 'TRIGGER:-PT12H', 'ACTION:DISPLAY', `DESCRIPTION:${icsText(`Heat ${n} is tomorrow`)}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  return new Response(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': `attachment; filename="heat-${n}.ics"` } })
}
