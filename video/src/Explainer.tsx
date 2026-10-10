import { AbsoluteFill, Easing, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import art from './art.json'
import { Brand, Card, Check, Course, Cta, Defs, Mark, Rise, Stamped, clamp, grey, ink, mono, ui, useFonts, volt, X0 } from './TikTok'

const T = { hook: 105, rsvp: 90, run: 90, post: 105, stamp: 105, cta: 90 }
export const EXPLAINER_TOTAL = T.hook + T.rsvp + T.run + T.post + T.stamp + T.cta

const Head = ({ children, f }: { children: React.ReactNode; f: number }) => {
  const h = interpolate(f, [0, 12], [0, 1], clamp)
  return (
    <div style={{ position: 'absolute', left: X0, top: 340, ...ui, fontWeight: 600, fontSize: 92, letterSpacing: '-.04em', lineHeight: 1.02, color: ink, opacity: h, transform: `translateY(${(1 - h) * 30}px)`, width: 880 }}>
      {children}
    </div>
  )
}

function Hook() {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const hit = 62
  const slam = spring({ frame: f - hit, fps, config: { damping: 9, stiffness: 220, mass: 0.7 } })
  const shake = f >= hit && f < hit + 8 ? Math.sin((f - hit) * 5) * (8 - (f - hit)) * 1.4 : 0
  return (
    <AbsoluteFill style={{ background: '#fff', transform: `translate(${shake}px, ${shake * 0.6}px)` }}>
      <Brand />
      <div style={{ position: 'absolute', left: X0, top: 390, whiteSpace: 'nowrap' }}>
        <Rise at={4} size={132}>Run</Rise>
        <Rise at={9} size={132}>New</Rise>
        <Rise at={14} size={132}>York.</Rise>
        <Rise at={24} size={132}>Get</Rise>
        <Rise at={29} size={132} hl>stamped.</Rise>
      </div>
      <div style={{ position: 'absolute', left: X0, top: 1180, ...ui, fontSize: 48, color: grey, lineHeight: 1.3, width: 520, opacity: interpolate(f, [40, 52], [0, 1], clamp) }}>
        Free community 5Ks across the city.
      </div>
      <div style={{ position: 'absolute', left: 590, top: 1030, width: 420, transform: `rotate(-11deg) scale(${interpolate(slam, [0, 1], [1.9, 1])})`, opacity: interpolate(f, [hit, hit + 3], [0, 1], clamp), mixBlendMode: 'multiply' }} dangerouslySetInnerHTML={{ __html: art.stamp }} />
    </AbsoluteFill>
  )
}

function Rsvp() {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const rise = spring({ frame: f - 6, fps, config: { damping: 15, stiffness: 110 } })
  const click = 52
  const t = interpolate(f, [20, 50], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) })
  const done = f >= click
  const pop = spring({ frame: f - click, fps, config: { damping: 11, stiffness: 180 } })
  const cx = 800 + (610 - 800) * t, cy = 1330 + (1100 - 1330) * t
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      <Brand />
      <Head f={f}>Pick a race.<br />RSVP free.</Head>
      <div style={{ position: 'absolute', left: 120, top: 640, width: 840, height: 640, borderRadius: 48, background: '#fff', border: '2px solid #ECEDE7', boxShadow: '0 50px 90px -34px rgba(11,12,10,.35)', padding: 48, opacity: rise, transform: `translateY(${(1 - rise) * 120}px)` }}>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          <Mark size={150} />
          <div style={ui}>
            <div style={{ fontSize: 52, fontWeight: 600, letterSpacing: '-.035em', lineHeight: 1.05, color: ink }}>Chilly Central<br />Park 5K</div>
            <div style={{ fontSize: 30, color: grey, marginTop: 10 }}>Free · every pace</div>
          </div>
        </div>
        <div style={{ ...ui, marginTop: 36, fontSize: 36, color: '#33362F', lineHeight: 1.5 }}>
          <b>Any time on race day</b><br />Engineers&apos; Gate · Central Park
        </div>
        <div style={{ position: 'absolute', left: 48, right: 48, bottom: 48, height: 110, borderRadius: 28, background: done ? volt : ink, color: done ? ink : '#fff', display: 'grid', placeItems: 'center', ...ui, fontSize: 42, fontWeight: 600, transform: `scale(${f >= click && f < click + 4 ? 0.95 : 1})` }}>
          {done ? "You're in ✓" : 'Register'}
        </div>
      </div>
      <svg width="64" height="64" viewBox="0 0 24 24" style={{ position: 'absolute', left: cx, top: cy, opacity: f > 16 ? 1 : 0, filter: 'drop-shadow(0 6px 8px rgba(0,0,0,.25))' }}><path d="M4 2 L4 19 L8.5 14.8 L11.6 21.5 L14.4 20.2 L11.4 13.6 L17.5 13.6 Z" fill={ink} stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" /></svg>
      <div style={{ position: 'absolute', left: X0, top: 1400, ...ui, fontSize: 44, color: grey, opacity: pop }}>Then show up and run.</div>
    </AbsoluteFill>
  )
}

function Post() {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const rise = spring({ frame: f - 6, fps, config: { damping: 15, stiffness: 110 } })
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      <Brand />
      <Head f={f}>Post your Strava<br />screenshot.</Head>
      <div style={{ position: 'absolute', left: X0, top: 640, transform: `translateY(${(1 - rise) * 700}px) rotate(-3deg)` }}><Card /></div>
      <div style={{ position: 'absolute', left: 560, top: 760, display: 'grid', gap: 54 }}>
        <Check label="Distance" value="5.02 km" at={42} />
        <Check label="Time" value="25:04" at={54} />
        <Check label="Location" value="Right park" at={66} />
      </div>
      <div style={{ position: 'absolute', left: X0, top: 1520, ...ui, fontSize: 42, color: grey, width: 880, opacity: interpolate(f, [70, 84], [0, 1], clamp) }}>
        We read it for you. No forms.
      </div>
    </AbsoluteFill>
  )
}

export function Explainer() {
  useFonts()
  let at = 0
  const seq = (d: number) => { const from = at; at += d; return { from, durationInFrames: d } }
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      <Defs />
      <Sequence {...seq(T.hook)}><Hook /></Sequence>
      <Sequence {...seq(T.rsvp)}><Rsvp /></Sequence>
      <Sequence {...seq(T.run)}><Course title={<>Run it your way.<br />Any pace.</>} sub="Any time on race day" /></Sequence>
      <Sequence {...seq(T.post)}><Post /></Sequence>
      <Sequence {...seq(T.stamp)}><Stamped title={<>Get stamped.<br />Collect them.</>} foot="Every race has its own stamp." slots /></Sequence>
      <Sequence {...seq(T.cta)}><Cta lines={<>Free 5Ks in New York<br />Run it. Get stamped.</>} sub="Free · every pace · link in bio" /></Sequence>
    </AbsoluteFill>
  )
}
