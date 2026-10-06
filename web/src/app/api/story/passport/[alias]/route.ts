import { passportStory } from '@/lib/story'
import { pngResponse } from '@/lib/story-response'
import { getStampsForAlias, getUserByAlias } from '@/lib/data'
import { computeMedals } from '@/lib/medals'

export const runtime = 'nodejs'

export async function GET(req: Request, { params }: { params: Promise<{ alias: string }> }) {
  const user = await getUserByAlias((await params).alias)
  if (!user) return new Response('Not found', { status: 404 })
  const stamps = await getStampsForAlias(user)
  const svg = passportStory(user.alias, stamps, computeMedals(stamps))
  return pngResponse(svg, `${user.alias}-passport.png`, new URL(req.url).searchParams.has('download'))
}
