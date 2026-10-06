import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// The one Supabase client. Server-only, service key, bypasses RLS.
// The browser never creates a Supabase client and never sees this key.
let client: SupabaseClient | null = null

export function db(): SupabaseClient {
  if (client) return client
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return client
}

export const hasDb = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)

// The proofs bucket is private; admin UI and our own pipeline read through short-lived
// signed URLs. The pipeline uses the service key directly (see lib/pipeline.ts).
export async function signedProofUrl(path: string, expiresIn = 3600) {
  const { data } = await db().storage.from('proofs').createSignedUrl(path, expiresIn)
  return data?.signedUrl ?? null
}
