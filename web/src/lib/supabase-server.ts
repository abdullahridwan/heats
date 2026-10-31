import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Supabase Auth client bound to the current request's cookies (the publishable key, never the service key).
// Server components cannot write cookies, so setAll swallows that error; the proxy refreshes the session.
export async function supabaseServer() {
  // Read cookies first: it marks the route dynamic before any env check can throw at build time.
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set')

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options)
        } catch {
          // Called from a server component: cookies are read-only there.
        }
      },
    },
  })
}
