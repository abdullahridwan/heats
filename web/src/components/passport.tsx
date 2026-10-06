import Link from 'next/link'
import { Guilloche, Medal, Stamp } from '@/components/art'
import { Avatar } from '@/components/avatar'
import { MEDAL_INFO, type MedalState } from '@/lib/medals'
import { formatTime, heatNo, shortDate } from '@/lib/time'
import type { Finish, Heat, Profile } from '@/lib/types'

// Where stamps land on a passport page (percent of page), so pages look hand-stamped.
const SPOTS = [
  { x: 4, y: 7, r: -9, w: 50 }, { x: 48, y: 5, r: 8, w: 48 }, { x: 2, y: 36, r: 5, w: 54 },
  { x: 46, y: 33, r: -13, w: 50 }, { x: 10, y: 64, r: 10, w: 50 }, { x: 52, y: 64, r: -6, w: 44 },
]

type Props = { profile: Profile; finishes: Finish[]; medalsEarned: number; nextHeat?: Heat; salt?: string }

export function PassportBook({ profile, finishes, medalsEarned, nextHeat, salt = 'pp' }: Props) {
  const boroughs = new Set(finishes.map(f => f.heat.borough)).size
  const best = finishes.length ? Math.min(...finishes.map(f => f.time_seconds)) : null
  // Six stamps per page. Spread 1 is the ID page + first stamp page; later spreads hold two stamp pages.
  const stampPages: Finish[][] = []
  for (let i = 0; i < Math.max(1, finishes.length); i += 6) stampPages.push(finishes.slice(i, i + 6))
  const order: ('id' | number)[] = ['id', ...stampPages.map((_, i) => i)]
  const spreads: ('id' | number)[][] = []
  for (let i = 0; i < order.length; i += 2) spreads.push(order.slice(i, i + 2))
  const mrzName = profile.alias.toUpperCase().replace(/[^A-Z0-9]/g, '<')
  const no = String(Math.abs([...profile.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)) % 1e6).padStart(6, '0')
  const since = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' }).format(new Date(profile.created_at))

  return (
    <div className="passport" data-reveal="">
      <div className="pcover" aria-label="Passport cover">
        <Guilloche colors={['#CCFF00', '#7A9900']} cx={125} cy={175} />
        <div className="inner">
          <span className="l1">CITY OF NEW YORK</span>
          <svg width="64" height="64" viewBox="0 0 100 100" aria-hidden="true"><rect x="3" y="3" width="94" height="94" rx="24" fill="none" stroke="#CCFF00" strokeWidth="3" /><polygon points="32,22 46,22 38,78 24,78" fill="#CCFF00" /><polygon points="62,22 76,22 68,78 54,78" fill="#CCFF00" /><polygon points="37,43 67,43 65.4,55 35.4,55" fill="#CCFF00" /></svg>
          <span className="wm">Heats</span>
          <span className="l2">Run Passport</span>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 24 }}>
        {spreads.map((pair, si) => (
          <div className="spread" key={si} data-reveal="">
            {pair.map(pg => pg === 'id' ? (
              <div className="page idp" key="id">
                <Guilloche colors={['rgba(165,139,255,.28)', 'rgba(91,140,255,.22)']} cx={210} cy={300} />
                <div className="phdr"><span>RUNNER</span><span>NO. HT-{no}</span></div>
                <div className="idwho">
                  <Avatar alias={profile.alias} url={profile.avatar_url} size={160} className="photo" />
                  <div className="fields">
                    <div className="f"><small>Alias</small><b>{profile.alias}</b></div>
                    <div className="f"><small>Home park</small><b>{profile.home_park ?? 'All of NYC'}</b></div>
                    <div className="f"><small>Runner since</small><b>{since}</b></div>
                    <div className="f"><small>Best 5K</small><b className="mono">{best ? formatTime(best) : '—'}</b></div>
                  </div>
                </div>
                <div className="stats">
                  <div className="stat"><b>{finishes.length}</b><small>heats</small></div>
                  <div className="stat"><b>{boroughs}/5</b><small>boroughs</small></div>
                  <div className="stat"><b>{medalsEarned}</b><small>medals</small></div>
                </div>
                <div className="mrz">P&lt;NYC{mrzName}&lt;&lt;HEATS{'<'.repeat(Math.max(2, 22 - mrzName.length))}<br />HT{no}&lt;{finishes.length}NYC{best ? formatTime(best).replace(':', '') : '0000'}&lt;&lt;{(profile.home_park ?? 'NYC').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 10)}&lt;&lt;&lt;&lt;0{boroughs}</div>
              </div>
            ) : (
              <div className="page stp" key={pg}>
                <Guilloche colors={['rgba(204,255,0,.5)', 'rgba(255,122,92,.22)', 'rgba(46,211,198,.22)']} cx={pg % 2 ? 190 : 60} cy={pg % 2 ? 260 : 80} />
                <div className="phdr"><span>STAMPS</span><span>P.{pg + 2}</span></div>
                {stampPages[pg].map((f, i) => (
                  <Stamp key={f.heat.id} heat={f.heat} salt={`${salt}${pg}${i}`} style={{ left: `${SPOTS[i].x}%`, top: `${SPOTS[i].y}%`, width: `${SPOTS[i].w}%`, ['--r' as string]: `${SPOTS[i].r}deg`, ['--i' as string]: i }} />
                ))}
                {pg === stampPages.length - 1 && stampPages[pg].length < 6 && nextHeat && (
                  <Link className="slot" href={`/h/${heatNo(nextHeat.number)}`} style={{ left: `${SPOTS[stampPages[pg].length].x + 6}%`, top: `${SPOTS[stampPages[pg].length].y + 2}%`, width: '38%' }}>
                    <span><b>Heat {heatNo(nextHeat.number)}</b>{nextHeat.park}<br />{shortDate(nextHeat.starts_at)}</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Different cycle lengths so the medals spin at what looks like random moments
const SPIN = [5.3, 7.9, 6.1, 9.4, 4.7, 8.3, 6.7, 7.4]

// showcase: every medal in full color with how to earn it (landing page). Otherwise earned vs locked.
export function MedalGrid({ medals, salt = 'mg', showcase = false }: { medals: MedalState[]; salt?: string; showcase?: boolean }) {
  return (
    <div className="medals" data-reveal="">
      {medals.map((m, i) => {
        const info = MEDAL_INFO[m.kind]
        return (
          <div className={`medal${m.earned || showcase ? '' : ' locked'}`} key={m.kind} style={{ ['--i' as string]: i, ['--spin' as string]: `${SPIN[i % SPIN.length]}s` }}>
            <Medal kind={m.kind} salt={salt} />
            <span className="medal-shadow" aria-hidden="true" />
            <b>{info.name}</b>
            <i className="obj" style={{ fontStyle: 'normal' }}>{info.obj}</i>
            {!showcase && <span>{info.how}</span>}
            {showcase
              ? <span className="st" style={{ background: 'var(--volt-soft)', color: '#4B7A00' }}>{info.how}</span>
              : m.earned
              ? <span className="st" style={{ background: 'var(--volt-soft)', color: '#4B7A00' }}>Earned {m.on}</span>
              : <span className="st" style={{ border: '1px dashed #CDD0C7', color: 'var(--text2)' }}>{m.progress}</span>}
          </div>
        )
      })}
    </div>
  )
}
