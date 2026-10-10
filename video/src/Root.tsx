import { Composition } from 'remotion'
import { Explainer, EXPLAINER_TOTAL } from './Explainer'
import { TODAY_TOTAL, Today } from './TikTok'

const props = { fps: 30, width: 1080, height: 1920 }

export const Root = () => (
  <>
    <Composition id="Today" component={Today} durationInFrames={TODAY_TOTAL} {...props} />
    <Composition id="Explainer" component={Explainer} durationInFrames={EXPLAINER_TOTAL} {...props} />
  </>
)
