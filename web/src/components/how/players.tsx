'use client'
import { useSyncExternalStore, type ComponentType } from 'react'
import { Player } from '@remotion/player'
import { CASE_FRAMES, CASE_H, CASE_W, CaseScene } from './case-scene'
import { JOIN_FRAMES, JOIN_H, JOIN_W, JoinScene } from './join-scene'
import { SUBMIT_FRAMES, SUBMIT_H, SUBMIT_W, SubmitScene } from './submit-scene'

const FPS = 30

// prefers-reduced-motion: show a settled frame instead of playing.
const mq = () => window.matchMedia('(prefers-reduced-motion: reduce)')
const subscribe = (cb: () => void) => {
  const m = mq()
  m.addEventListener('change', cb)
  return () => m.removeEventListener('change', cb)
}
const useReducedMotion = () => useSyncExternalStore(subscribe, () => mq().matches, () => false)

type ClipProps = {
  component: ComponentType
  frames: number
  width: number
  height: number
  still: number
  label: string
}

function Clip({ component, frames, width, height, still, label }: ClipProps) {
  const reduced = useReducedMotion()
  return (
    <div role="img" aria-label={label} style={{ width: '100%', height: '100%' }}>
      <Player
        component={component}
        durationInFrames={frames}
        fps={FPS}
        compositionWidth={width}
        compositionHeight={height}
        autoPlay={!reduced}
        loop
        initialFrame={reduced ? still : 0}
        controls={false}
        clickToPlay={false}
        acknowledgeRemotionLicense
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}

export function JoinPlayer() {
  return (
    <Clip
      component={JoinScene}
      frames={JOIN_FRAMES}
      width={JOIN_W}
      height={JOIN_H}
      still={90}
      label="A runner taps Join on the Calendar screen and the second heat turns into You're in."
    />
  )
}

export function SubmitPlayer() {
  return (
    <Clip
      component={SubmitScene}
      frames={SUBMIT_FRAMES}
      width={SUBMIT_W}
      height={SUBMIT_H}
      still={150}
      label="A Strava screenshot slides into the drop zone, Stamp it is pressed, and the Heat 002 postmarked stamp lands on it."
    />
  )
}

export function CasePlayer() {
  return (
    <Clip
      component={CaseScene}
      frames={CASE_FRAMES}
      width={CASE_W}
      height={CASE_H}
      still={120}
      label="The stamp case: four postmarked stamps and two empty slots. The newest, Heat 004 Hudson River, drops in."
    />
  )
}
