import { fetchAvatar, heatStory } from '@/lib/story'
import { pngResponse } from '@/lib/story-response'
import { getGoing, getHeat, getProfileByAlias } from '@/lib/data'
import { hasDb, supabasePublic } from '@/lib/supabase/server'
import { heatNo } from '@/lib/time'

// "I'm running Heat 001" story. ?alias=x adds "x is in" when that runner joined the heat.
export async function GET(req: Request, { params }: { params: Promise<{ number: string }> }) {
  const heat = await getHeat(parseInt((await params).number, 10))
  if (!heat) return new Response('Not found', { status: 404 })
  const q = new URL(req.url).searchParams
  const profile = q.get('alias') ? await getProfileByAlias(q.get('alias')!) : null
  let joined = false
  if (profile && hasDb) {
    const { data } = await supabasePublic().from('registrations').select('heat_id').eq('heat_id', heat.id).eq('user_id', profile.id).maybeSingle()
    joined = !!data
  }
  const going = await getGoing(heat.id)
  const svg = heatStory(heat, { alias: joined ? profile!.alias : undefined, avatar: joined ? await fetchAvatar(profile!.avatar_url) : null, going: going.count })
  return pngResponse(svg, `heat-${heatNo(heat.number)}.png`, q.has('download'))
}
