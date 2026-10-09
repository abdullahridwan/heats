'use client'
import { useSyncExternalStore, type ComponentType } from 'react'
import { Player } from '@remotion/player'
import { FPS, H, LOOP, LoopScene, PostScene, RunScene, SCENE, StampScene, W } from './scenes'

// prefers-reduced-motion: show the finished frame, don't play.
const mq = () => window.matchMedia('(prefers-reduced-motion: reduce)')
const subscribe = (cb: () => void) => { const m = mq(); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb) }
const useReducedMotion = () => useSyncExternalStore(subscribe, () => mq().matches, () => false)

function Clip({ component, frames, label, start = 0 }: { component: ComponentType; frames: number; label: string; start?: number }) {
  const reduced = useReducedMotion()
  return (
    <div role="img" aria-label={label} style={{ width: '100%', aspectRatio: `${W} / ${H}`, borderRadius: 'inherit', overflow: 'hidden' }}>
      <Player
        component={component}
        durationInFrames={frames}
        fps={FPS}
        compositionWidth={W}
        compositionHeight={H}
        autoPlay={!reduced}
        loop
        initialFrame={reduced ? frames - 12 : start}
        controls={false}
        clickToPlay={false}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}

const SCENES = { run: RunScene, post: PostScene, stamp: StampScene }
const LABELS = {
  run: 'A runner traces the Central Park loop as the distance counts up to 5.02 km.',
  post: 'A Strava screenshot slides in and its distance, time and location are checked off.',
  stamp: 'The Heat 001 stamp lands on a passport page and the Founding Runner medal appears.',
}

export function HeroPlayer() {
  return <Clip component={LoopScene} frames={LOOP} label="How Heats works: run 5K in Central Park, post your Strava screenshot, get stamped." start={12} />
}

export function StepPlayer({ scene }: { scene: keyof typeof SCENES }) {
  return <Clip component={SCENES[scene] as ComponentType} frames={SCENE} label={LABELS[scene]} />
}
