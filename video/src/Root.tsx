import { Composition } from 'remotion'
import { FPS, H, TOTAL, TikTok, W } from './TikTok'

export const Root = () => (
  <Composition id="TikTok" component={TikTok} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
)
