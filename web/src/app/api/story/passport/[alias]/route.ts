import { passportStory } from '@/lib/story'
import { pngResponse } from '@/lib/story-response'
import { getFinishes, getProfileByAlias } from '@/lib/data'
import { computeMedals } from '@/lib/medals'

export async function GET(req: Request, { params }: { params: Promise<{ alias: string }> }) {
  const profile = await getProfileByAlias((await params).alias)
  if (!profile) return new Response('Not found', { status: 404 })
  const finishes = await getFinishes(profile.id)
  const svg = passportStory(profile, finishes, computeMedals(finishes))
  return pngResponse(svg, `${profile.alias}-passport.png`, new URL(req.url).searchParams.has('download'))
}
