import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Medal } from '@/components/art'
import { Avatar } from '@/components/avatar'
import { getStampsForAlias, getUserByAlias } from '@/lib/data'
import { computeMedals, MEDAL_INFO, MEDAL_ORDER } from '@/lib/medals'
import { formatTime, heatNo, ordinal, shortDate } from '@/lib/time'

type Props = { params: Promise<{ alias: string }> }

export async function generateMetadata({ params }: Props) {
  const { alias } = await params
  return { title: `${alias}'s passport`, description: `${alias}'s Heats run passport.` }
}

export default async function Passport({ params }: Props) {
  const { alias } = await params
  const user = await getUserByAlias(alias)
  if (!user) notFound()
  const stamps = await getStampsForAlias(user)
  const medals = computeMedals(stamps)
  const earned = medals.filter(m => m.earned)
  const best = stamps.length ? Math.min(...stamps.map(s => s.time_s)) : null

  return (
    <>
      <div className="ambient" aria-hidden="true"><i /><i /><i /><i /></div>
      <main className="wrap">
        <section className="s first">
          <div className="head">
            <span className="eyebrow">Run passport</span>
            <h2>{user.alias}</h2>
            <p>{stamps.length ? `${stamps.length} ${stamps.length === 1 ? 'heat' : 'heats'} stamped, ${earned.length} of 3 medals.` : 'No stamps yet. The first heat is the best one to start with.'}</p>
            <div className="row-actions">
              <a className="btn ghost sm" href={`/api/story/passport/${user.alias}`}>Share passport</a>
            </div>
          </div>

          <div className="stats" style={{ maxWidth: 520 }}>
            <div className="stat"><b>{stamps.length}</b><small>heats</small></div>
            <div className="stat"><b>{earned.length}/3</b><small>medals</small></div>
            <div className="stat"><b>{best ? formatTime(best) : '—'}</b><small>best 5K</small></div>
          </div>

          <div className="medals" data-reveal="">
            {MEDAL_ORDER.map((k, i) => {
              const m = medals.find(x => x.kind === k)!
              return (
                <div className={`medal${m.earned ? '' : ' locked'}`} key={k} style={{ ['--i' as string]: String(i) }}>
                  <Medal kind={k} salt="pp" />
                  <span className="medal-shadow" aria-hidden="true" />
                  <b>{MEDAL_INFO[k].name}</b>
                  <i className="obj" style={{ fontStyle: 'normal' }}>{MEDAL_INFO[k].obj}</i>
                  {m.earned
                    ? <span className="st" style={{ background: 'var(--volt-soft)', color: '#4B7A00' }}>Earned</span>
                    : <span className="st" style={{ border: '1px dashed #CDD0C7', color: 'var(--text2)' }}>{MEDAL_INFO[k].how}</span>}
                </div>
              )
            })}
          </div>
        </section>

        {stamps.length > 0 ? (
          <section className="s">
            <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-.03em' }}>Stamps</h2>
            <div className="sheet">
              {[...stamps].reverse().map(s => (
                <div key={s.heat.id} className="rowr">
                  <span className="dot" style={{ width: 12, height: 12, background: 'var(--e-b)' }} />
                  <Avatar alias={s.alias} size={32} />
                  <div className="who">
                    <div className="nm">Heat {heatNo(s.heat.number)} · {s.heat.name}</div>
                    <div className="cm">{shortDate(s.heat.opens_at)} · {ordinal(s.place)} of {s.finishers}{s.note ? ` · ${s.note}` : ''}</div>
                  </div>
                  <span className="tm">{formatTime(s.time_s)}</span>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="s">
            <div className="sheet"><div className="empty"><b style={{ color: 'var(--ink)' }}>Nothing stamped yet.</b><span>Race it, post a screenshot, and your stamp lands here.</span></div></div>
            <div className="row-actions"><Link className="btn theme" href="/post">Post a time</Link></div>
          </section>
        )}
      </main>
    </>
  )
}
