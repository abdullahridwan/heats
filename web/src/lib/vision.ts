import 'server-only'
import { z } from 'zod'

// OpenRouter vision check. It only ever contributes booleans and strings, so text hidden
// inside an image cannot do anything beyond influencing those fields. A model outage never
// blocks a runner: callers treat null as vision_unavailable and send the row to review.

const MODEL = 'anthropic/claude-haiku-4.5'
const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'
const TIMEOUT_MS = 12_000

const VisionSchema = z.object({
  is_strava_card: z.boolean(),
  location_ok: z.boolean(),
  // Place names the model could actually read on the map. Shown to the admin as evidence.
  place_labels: z.array(z.string()).default([]),
})

export type VisionResult = z.infer<typeof VisionSchema>

export function visionPrompt(locationTerms: string[], locationNote: string) {
  return [
    'You are checking a single screenshot a runner submitted as proof for a free community 5K.',
    'The event location is described by: ' + locationTerms.join(', ') + '.',
    `Additional location context: ${locationNote || 'none'}.`,
    '',
    'The image is only the top part of the card: the map area, not the stats. Answer strictly as JSON, nothing else:',
    '{"is_strava_card": boolean, "location_ok": boolean, "place_labels": string[]}',
    '',
    '- is_strava_card: true if this looks like the map area of a running-app activity card (Strava, Garmin, Apple Fitness, Nike, Coros): a street map with a coloured GPS route line drawn on it, possibly with an app logo or title. False for photos, plain screenshots and anything that is not a map with a route. Do not require stats; they are not in the image.',
    '- location_ok: true if the map or any place name overlaps the event location above. Text anywhere on the card naming a different, clearly distant place means false. Prefer true only when you can read a matching place name or the route clearly follows that location; do not guess from a generic green area.',
    '- place_labels: the street, park or landmark names you can actually read on the map (empty if none are legible).',
  ].join('\n')
}

// image is a data URL: "data:image/webp;base64,…"
export async function checkCard(image: string, locationTerms: string[], locationNote = ''): Promise<VisionResult | null> {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) { console.warn('[vision] OPENROUTER_API_KEY is not set; every submission will go to review'); return null }
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL ?? 'https://heats.run',
        'X-Title': 'Heats',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        max_tokens: 150,
        messages: [
          { role: 'user', content: [
            { type: 'text', text: visionPrompt(locationTerms, locationNote) },
            { type: 'image_url', image_url: { url: image } },
          ] },
        ],
      }),
    })
    if (!res.ok) return null
    const json = await res.json() as { choices?: { message?: { content?: string } }[] }
    const text = json.choices?.[0]?.message?.content ?? ''
    return parseVision(text)
  } catch {
    return null // timeout, network, or bad JSON → vision unavailable
  }
}

// Exported for the fixture harness and tests.
export function parseVision(text: string): VisionResult | null {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) return null
  try {
    const parsed = VisionSchema.safeParse(JSON.parse(text.slice(start, end + 1)))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}
