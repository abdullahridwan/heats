import 'server-only'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

export const hasDb = Boolean(url && key)

// Acts as the signed-in Clerk user (RLS applies)
export async function supabaseServer() {
  const { getToken } = await auth()
  return createClient(url, key, {
    auth: { persistSession: false },
    async accessToken() { return (await getToken()) ?? null },
  })
}

// Anonymous reads of public data (heats, heat sheets, passports). Safe outside a request, e.g. OG images.
export function supabasePublic() {
  return createClient(url, key, { auth: { persistSession: false } })
}
