import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MedalGrid, PassportBook } from '@/components/passport'
import { getFinishes, getHeats, getProfileByAlias } from '@/lib/data'
import { computeMedals } from '@/lib/medals'
import { park } from '@/lib/themes'
import { formatTime, heatNo, isUpcoming, ordinal, shortDate } from '@/lib/time'

type Props = { params: Promise<{ alias: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { alias } = await params
  return { title: `${alias}'s passport`, description: `${alias}'s Heats run passport: stamps and medals from community 5Ks across New York.` }
}

export default async function Passport({ params }: Props) {
  const { alias } = await params
  const profile = await getProfileByAlias(alias)
  if (!profile) notFound()
  const [finishes, heats] = await Promise.all([getFinishes(profile.id), getHeats()])
  const medals = computeMedals(finishes)
  const earned = medals.filter(m => m.earned).length
  const boroughs = new Set(finishes.map(f => f.heat.borough)).size
  const nextHeat = heats.find(h => h.status === 'open' && isUpcoming(h.starts_at) && !finishes.some(f => f.heat.id === h.id))

  return (
    <>
      <div className="ambient" aria-hidden="true"><i /><i /><i /><i /></div>
      <main className="wrap">
        <section className="s first">
          <div className="head">
            <span className="eyebrow">Run passport</span>
            <h2>{profile.alias}</h2>
            <p>{finishes.length ? `${finishes.length} ${finishes.length === 1 ? 'heat' : 'heats'} stamped across ${boroughs} ${boroughs === 1 ? 'borough' : 'boroughs'}.` : 'No stamps yet. The first heat is the best one to start with.'}</p>
          </div>

          <PassportBook profile={profile} finishes={finishes} medalsEarned={earned} nextHeat={nextHeat} />
        </section>

        <section className="s">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-.03em' }}>Medals</h2>
            <span className="eyebrow">{earned} of 8 earned</span>
          </div>
          <MedalGrid medals={medals} />
        </section>

        {finishes.length > 0 && (
          <section className="s">
            <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-.03em' }}>Heats</h2>
            <div className="sheet">
              {[...finishes].reverse().map(f => (
                <Link key={f.heat.id} href={`/h/${heatNo(f.heat.number)}`} className="rowr" style={{ gridTemplateColumns: '14px minmax(0,1fr) auto' }}>
                  <span className="dot" style={{ width: 12, height: 12, background: park(f.heat).b }} />
                  <div className="who"><div className="nm">Heat {heatNo(f.heat.number)} · {f.heat.name}</div><div className="cm">{shortDate(f.heat.starts_at)} · {ordinal(f.place)} of {f.finishers}{f.note ? ` · ${f.note}` : ''}</div></div>
                  <span className="tm">{formatTime(f.time_seconds)}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
