import 'server-only'
import { db } from '@/lib/db'
import { normalizeHandle, validateHandle } from '@/lib/handles'

export type EnsureRunnerResult =
  | { ok: true; runnerId: string; alias: string }
  | { ok: false; error: 'handle_required' | 'handle_format' | 'handle_reserved' | 'handle_blocked' | 'handle_taken' | 'save_failed' }

// The users row for a freshly signed-in auth user. Creates it from the handle on first sign in.
export async function ensureRunner(authId: string, email: string, rawHandle?: string | null): Promise<EnsureRunnerResult> {
  const { data: byId } = await db().from('users').select('id, alias').eq('id', authId).maybeSingle()
  if (byId) return { ok: true, runnerId: byId.id as string, alias: byId.alias as string }

  const { data: byEmail } = await db().from('users').select('id, alias').eq('email', email).maybeSingle()
  if (byEmail) {
    // A row from before email sign in (the old Clerk ids). Move it onto this auth id so getRunner()
    // finds it from now on. If other rows already point at it, keep the old id.
    const { error: moveErr } = await db().from('users').update({ id: authId }).eq('id', byEmail.id)
    return { ok: true, runnerId: moveErr ? (byEmail.id as string) : authId, alias: byEmail.alias as string }
  }

  if (!rawHandle) return { ok: false, error: 'handle_required' }
  const handle = normalizeHandle(rawHandle)
  const check = validateHandle(handle)
  if (!check.ok) return { ok: false, error: `handle_${check.reason}` }

  const { error } = await db().from('users').insert({ id: authId, alias: handle, email })
  if (error) return { ok: false, error: error.code === '23505' ? 'handle_taken' : 'save_failed' }
  return { ok: true, runnerId: authId, alias: handle }
}

// Sign a runner up for a heat that has not closed yet. Quietly does nothing for a past or unknown heat.
export async function joinHeat(runnerId: string, heatNumber: number): Promise<boolean> {
  const { data: heat } = await db().from('heats').select('id, closes_at').eq('number', heatNumber).maybeSingle()
  if (!heat || new Date(heat.closes_at as string).getTime() <= Date.now()) return false
  await db().from('signups').upsert(
    { user_id: runnerId, heat_id: heat.id },
    { onConflict: 'user_id,heat_id', ignoreDuplicates: true },
  )
  return true
}
