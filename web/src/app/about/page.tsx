import Link from 'next/link'
import { StepPlayer } from '@/components/remotion/players'

export const metadata = { title: 'How it works' }

const STEPS = [
  { scene: 'rsvp', title: 'RSVP on Luma', body: 'Free, takes ten seconds. You make your Heats account after the run, when you claim your stamp.' },
  { scene: 'run', title: "Start at Engineers' Gate", body: 'Run 5K in Central Park any time on race day, at your own pace. Track it on Strava.' },
  { scene: 'post', title: 'Post your screenshot', body: 'Upload the Strava share card. We read your distance, time and location.' },
  { scene: 'stamp', title: 'Get stamped', body: "The heat's stamp lands in your run passport. Every heat has its own." },
] as const

export default function About() {
  return (
    <main className="wrap">
      <section className="lp-sec first">
        <div className="lp-head">
          <span className="eyebrow">How it works</span>
          <h2>Free community 5Ks across New York. Run it, get stamped.</h2>
          <p>Every heat is one place on one day. Run it whenever suits you that day, post your run, and the stamp goes in your passport.</p>
        </div>
        <div className="lp-steps">
          {STEPS.map((s, i) => (
            <article className="lp-step" key={s.scene}>
              <div className="lp-clip"><StepPlayer scene={s.scene} /></div>
              <div className="lp-step-txt">
                <span className="lp-n">0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-close">
        <h2>Chilly Central Park 5K is on now.</h2>
        <Link className="btn volt lg" href="/">Run Heat 001</Link>
      </section>
    </main>
  )
}
