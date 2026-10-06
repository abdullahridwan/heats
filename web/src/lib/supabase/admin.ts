import 'server-only'
import { createClient } from '@supabase/supabase-js'

// Service client: bypasses RLS. Only call after isAdmin() or an explicit ownership check.
export const supabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } },
)

export const isAdmin = (userId: string | null | undefined) =>
  !!userId && (process.env.ADMIN_USER_IDS ?? '').split(',').map(s => s.trim()).includes(userId)
