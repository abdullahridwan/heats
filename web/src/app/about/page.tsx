import Link from 'next/link'
import { StepPlayer } from '@/components/remotion/players'

export const metadata = { title: 'How it works' }

const STEPS = [
  { scene: 'rsvp', title: 'RSVP on Luma', body: 'Free and takes ten seconds. You make your Heats account after the run, when you claim your stamp.' },
  { scene: 'run', title: "Start at Engineers' Gate", body: 'Run 5K in Central Park any time on race day, from 12:00 AM to 11:59 PM, at your own pace. Track it on Strava.' },
  { scene: 'post', title: 'Post your screenshot', body: 'Upload the Strava share card. We read your distance, time and location.' },
  { scene: 'stamp', title: 'Get stamped', body: 'The Chilly Central Park stamp lands in your run passport, and you earn the Founding Runner medal.' },
] as const

export default function About() {
  return (
    <main className="wrap">
      <section className="lp-sec first">
        <div className="lp-head">
          <span className="eyebrow">How it works</span>
          <h2>Run 5K. Post it. Get stamped.</h2>
          <p>Run the Chilly Central Park 5K whenever suits you on race day. Post your run and the stamp goes in your passport.</p>
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
        <Link className="btn volt lg" href="/">RSVP or submit your run</Link>
      </section>
    </main>
  )
}
