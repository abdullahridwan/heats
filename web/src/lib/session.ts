import 'server-only'
import { cache } from 'react'
import { db } from '@/lib/db'
import { supabaseServer } from '@/lib/supabase-server'
import type { Runner } from '@/lib/types'

// The signed-in Supabase Auth user, or null. Cached per request.
export const getAuthUser = cache(async (): Promise<{ id: string; email: string } | null> => {
  const supabase = await supabaseServer()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return { id: data.user.id, email: (data.user.email ?? '').toLowerCase() }
})

// The users row (the runner) for the signed-in auth user, or null. Cached per request.
export const getRunner = cache(async (): Promise<Runner | null> => {
  const user = await getAuthUser()
  if (!user) return null
  const { data } = await db()
    .from('users')
    .select('id, alias, email, created_at')
    .eq('id', user.id)
    .maybeSingle()
  return (data as Runner | null) ?? null
})
