import Link from 'next/link'
import { Avatar } from '@/components/avatar'
import { getHeats, getResults } from '@/lib/data'
import { parkDot } from '@/components/art'
import { heatNo, longDate, formatTime } from '@/lib/time'

export const revalidate = 30
export const metadata = { title: 'Results' }

export default async function Results() {
  const heats = await getHeats()
  const heat = heats[0]
  const results = heat ? await getResults(heat.id) : []

  return (
    <main className="wrap">
      <section className="s first">
        <div className="head">
          <span className="eyebrow">Heat sheet</span>
          <h2>{heat ? `Heat ${heatNo(heat.number)} · ${heat.name}` : 'Results'}</h2>
          <p>{results.length ? `${results.length} stamped. Refreshes every 30 seconds.` : 'No stamped results yet. Be the first.'}</p>
        </div>

        <div className="sheet">
          <div className="sheet-head">
            <h3>Results</h3>
            <span className="eyebrow">{heat ? longDate(heat.opens_at) : ''}</span>
          </div>
          {results.length === 0 ? (
            <div className="empty">
              <b style={{ color: 'var(--ink)' }}>The heat sheet is empty.</b>
              <span>Run it, post a screenshot of your time, and you&apos;ll show up here.</span>
            </div>
          ) : results.map(r => (
            <Link key={`${r.heat_id}-${r.alias}`} href={`/p/${r.alias}`} className="rowr">
              <span className={`pl${r.place === 1 ? ' first' : ''}`}>{String(r.place).padStart(2, '0')}</span>
              <Avatar alias={r.alias} url={r.avatar_url} size={32} />
              <div className="who"><div className="nm">{r.alias}</div>{r.note && <div className="cm">{r.note}</div>}</div>
              <span className="tm">{formatTime(r.time_s)}</span>
            </Link>
          ))}
        </div>

        <div className="row-actions">
          <Link className="btn theme" href="/post">Post your time</Link>
          <span className="eyebrow"><span className="dot" style={{ background: parkDot() }} /> Every pace, no cutoff</span>
        </div>
      </section>
    </main>
  )
}
