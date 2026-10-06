'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Cover, Stamp } from '@/components/art'
import { Avatar, AvatarStack } from '@/components/avatar'
import { Countdown } from '@/components/countdown'
import { park, themeVars, coverBG } from '@/lib/themes'
import { clock, day, heatNo, longDate, mon } from '@/lib/time'
import type { Heat } from '@/lib/types'

type Going = { count: number; runners: { alias: string; avatar_url: string | null }[] }

// Example rows that show what a finished heat sheet looks like. Labelled as an example in the UI.
const EXAMPLE = [
  { alias: 'lowkey_sprinter', t: '17:52', c: 'went out way too fast. held on.' },
  { alias: 'mile_kat', t: '18:31', c: 'PR!!!', pr: true },
  { alias: 'jt.runs', t: '19:07', c: 'that hill was evil' },
  { alias: 'you', t: '20:44', c: 'running for the bagels after', me: true },
  { alias: 'ada.o', t: '22:48', c: 'first race ever, will be back' },
]

const Check = () => (
  <span className="chk"><svg width="9" height="9" viewBox="0 0 12 12"><path d="M2.5 6.2 5 8.6l4.6-5" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
)

export function RacePreview({ heats, going }: { heats: Heat[]; going: Record<string, Going> }) {
  const [id, setId] = useState(heats[0]?.id)
  const heat = heats.find(h => h.id === id) ?? heats[0]
  if (!heat) return null
  const p = park(heat)
  const n = heatNo(heat.number)
  const g = going[heat.id] ?? { count: 0, runners: [] }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="chips" role="group" aria-label="Choose a heat">
        {heats.map(h => (
          <button key={h.id} type="button" className="chipbtn" aria-pressed={h.id === heat.id} onClick={() => setId(h.id)}>
            <span className="dot" style={{ width: 10, height: 10, background: park(h).b }} />{heatNo(h.number)} · {h.park.replace(' Greenway', '')}
          </button>
        ))}
      </div>

      <div className="race" key={heat.id} style={themeVars(heat)}>
        <div className="race-top">
          <Cover heat={heat} />
          <div className="race-side">
            <div style={{ display: 'grid', gap: 12 }}>
              <span className="pill"><span className="dot" /><Countdown iso={heat.starts_at} /></span>
              <h3 className="big-h">{heat.name}</h3>
              <div className="host"><span className="dot" style={{ width: 22, height: 22, background: p.b }} />Hosted by Heats NYC · {heat.borough}</div>
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              <div className="meta-row">
                <div className="calt"><b>{mon(heat.starts_at)}</b><span>{day(heat.starts_at)}</span></div>
                <div><div className="a">{longDate(heat.starts_at)}</div><div className="b">{clock(heat.starts_at)} sharp{heat.note ? ` · ${heat.note}` : ''}</div></div>
              </div>
              <div className="meta-row">
                <div className="pinbox"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B0C0A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg></div>
                <div><div className="a">{heat.meet_point}</div><div className="b">{heat.address ?? heat.park}</div></div>
              </div>
            </div>
            <div className="join">
              <div className="join-top">
                <div className="going"><AvatarStack runners={g.runners.slice(0, 5)} />{g.count ? <span><b>{g.count}</b> going</span> : <span>Be the first to join</span>}</div>
                <span className="eyebrow">Free · every pace</span>
              </div>
              <div className="earn">
                <Stamp heat={heat} salt="rp" />
                <div style={{ display: 'grid', gap: 2 }}><b>Finish to earn this stamp</b><span>Heat {n} goes into your passport in {p.name}.</span></div>
              </div>
              <Link className="btn theme block" href={`/h/${n}`}>Join heat {n}</Link>
            </div>
          </div>
        </div>

        <div className="race-bottom">
          <div className="sheet">
            <div className="sheet-head"><h3>Heat sheet · {n}</h3><span className="eyebrow">Example · screenshot proof</span></div>
            {EXAMPLE.map((r, i) => (
              <div key={r.alias} className={`rowr${r.me ? ' me' : ''}`}>
                <span className={`pl${i === 0 ? ' first' : ''}`}>0{i + 1}</span>
                <Avatar alias={r.alias} size={32} />
                <div className="who"><div className="nm">{r.alias}{r.pr && <span className="pr">PR</span>}{r.me && <span className="you">You</span>}</div><div className="cm">{r.c}</div></div>
                <span className="tm">{r.t}<Check /></span>
              </div>
            ))}
          </div>
          <div className="story" style={{ background: coverBG(heat) }}>
            <div className="top"><span>Heat {n}</span><span>{heat.park.replace(' Greenway', '')}</span></div>
            <Stamp heat={heat} salt="story" className="st" />
            <div><div className="bigt">20:44</div><div className="sub">4th of {Math.max(g.count, 34)} · Stamped</div><div className="q">&ldquo;running for the bagels after&rdquo;</div></div>
            <div className="foot"><span className="wm">Heats</span><span className="mono" style={{ fontSize: 11, opacity: 0.6 }}>heats.run</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
