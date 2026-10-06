'use client'
import { useMemo } from 'react'
import { useSession } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'

export function useSupabase() {
  const { session } = useSession()
  return useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false }, async accessToken() { return (await session?.getToken()) ?? null } },
  ), [session])
}
