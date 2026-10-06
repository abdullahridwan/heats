import { Medal, Stamp } from '@/components/art'
import { COURSES, park } from '@/lib/themes'
import { clock, heatNo, weekday } from '@/lib/time'
import type { Heat } from '@/lib/types'

// Four looping micro-scenes. Base styles are each scene's resting end state, so with
// prefers-reduced-motion (animations off) every card still reads as finished.
export function HowItWorks({ heat }: { heat: Heat }) {
  const p = park(heat)
  const cp = COURSES.cp.d
  return (
    <div className="how" style={{ ['--hb' as string]: p.b, ['--hs' as string]: p.s }}>
      <article className="step">
        <div className="stage" aria-hidden="true">
          <div className="mini">
            <div className="mini-top"><span className="mini-dot" />Heat {heatNo(heat.number)}</div>
            <b className="mini-ttl">{heat.name}</b>
            <span className="mini-sub">{weekday(heat.starts_at).slice(0, 3)} · {clock(heat.starts_at)}</span>
            <div className="mini-going">
              <span className="avs">
                <span className="av a1" /><span className="av a2" /><span className="av a3" /><span className="av a-new" />
              </span>
              <span className="cnt"><span className="c1">33</span><span className="c2">34</span></span>&nbsp;going
            </div>
            <div className="mini-btn"><span className="b1">Join heat</span><span className="b2">You&apos;re in ✓</span></div>
          </div>
          <svg className="cursor" width="22" height="22" viewBox="0 0 24 24"><path d="M4 2 L4 19 L8.5 14.8 L11.6 21.5 L14.4 20.2 L11.4 13.6 L17.5 13.6 Z" fill="#0B0C0A" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" /></svg>
        </div>
        <div className="txt"><span className="n">01</span><h3>Join a heat</h3><p>Pick a park and a Saturday. It&apos;s free and every pace is welcome.</p></div>
      </article>

      <article className="step">
        <div className="stage" aria-hidden="true">
          <div className="gunchip"><span className="g3">3</span><span className="g2">2</span><span className="g1">1</span><span className="go">GO</span></div>
          <div className="course-box">
            <svg width="200" height="200" viewBox="0 0 200 200">
              <path d={cp} fill="none" stroke="#E4E6DE" strokeWidth="3" strokeLinejoin="round" />
              <path className="trail" d={cp} pathLength={1} fill="none" stroke="#0B0C0A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="runner" style={{ offsetPath: `path('${cp}')` }} />
          </div>
          <span className="km mono"><span className="k0">0.0</span><span className="k5">5.0</span> km</span>
        </div>
        <div className="txt"><span className="n">02</span><h3>Show up at the gun</h3><p>Everyone starts together and runs the same loop. Track it with any app or watch.</p></div>
      </article>

      <article className="step">
        <div className="stage" aria-hidden="true">
          <div className="phone">
            <div className="shot">
              <div className="shot-map"><svg viewBox="0 0 60 40"><path d="M10 30 C 8 18, 14 8, 26 8 L 48 10 C 54 12, 54 22, 48 26 L 22 34 C 14 36, 11 34, 10 30 Z" fill="none" stroke="#0B0C0A" strokeWidth="1.6" /></svg></div>
              <span className="shot-ln k" /><span className="shot-ln" /><span className="shot-ln s" />
            </div>
          </div>
          <span className="timechip mono">22:48</span>
          <span className="verified"><span className="vchk"><svg width="11" height="11" viewBox="0 0 12 12"><path d="M2.5 6.2 5 8.6l4.6-5" fill="none" stroke="#CCFF00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>Verified</span>
        </div>
        <div className="txt"><span className="n">03</span><h3>Post a screenshot</h3><p>Add your time and a short note. We check the screenshot and put you on the heat sheet.</p></div>
      </article>

      <article className="step">
        <div className="stage" aria-hidden="true">
          <div className="ppage">
            <span className="ppage-h mono">STAMPS · P.2</span>
            <Stamp heat={heat} salt="how" className="slam" />
            <Medal kind="sun" salt="how" className="pop" />
          </div>
        </div>
        <div className="txt"><span className="n">04</span><h3>Get stamped</h3><p>Every finish adds that heat&apos;s stamp to your passport. Milestones earn medals.</p></div>
      </article>
    </div>
  )
}
