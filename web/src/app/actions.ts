'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth, currentUser } from '@clerk/nextjs/server'
import { hasDb, supabaseServer } from '@/lib/supabase/server'
import { isAdmin, supabaseAdmin } from '@/lib/supabase/admin'
import { getHeat, getMyProfile } from '@/lib/data'
import { heatNo, parseTime } from '@/lib/time'

export type FormState = { error?: string; ok?: boolean }

const NO_DB = 'Heats is still being set up. Try again in a little while.'

async function requireUser() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  return userId
}

// ───────── profile

export async function createProfile(_: FormState, form: FormData): Promise<FormState> {
  const userId = await requireUser()
  if (!hasDb) return { error: NO_DB }
  const alias = String(form.get('alias') ?? '').trim().toLowerCase()
  const homePark = String(form.get('home_park') ?? '').trim() || null
  const next = String(form.get('next') ?? '/')
  if (!/^[a-z0-9._]{3,20}$/.test(alias)) return { error: 'Use 3–20 lowercase letters, numbers, dots or underscores.' }
  const user = await currentUser()
  const sb = await supabaseServer()
  const { error } = await sb.from('profiles').insert({ alias, home_park: homePark, avatar_url: user?.hasImage ? user.imageUrl : null })
  if (error) {
    if (error.code === '23505') {
      const existing = await getMyProfile(userId)
      if (existing) redirect(next.startsWith('/') ? next : '/')
      return { error: `${alias} is taken. Try another.` }
    }
    return { error: 'Could not save your passport. Try again.' }
  }
  revalidatePath('/', 'layout')
  redirect(next.startsWith('/') && !next.startsWith('//') ? next : '/')
}

// ───────── registrations

export async function joinHeat(form: FormData) {
  const userId = await requireUser()
  const number = Number(form.get('number'))
  const heat = await getHeat(number)
  if (!heat || !hasDb) return
  const path = `/h/${heatNo(number)}`
  if (!(await getMyProfile(userId))) redirect(`/onboarding?next=${encodeURIComponent(path)}`)
  const sb = await supabaseServer()
  const { error } = await sb.from('registrations').insert({ heat_id: heat.id })
  if (error && error.code !== '23505') throw new Error('Could not join this heat.')
  revalidatePath(path)
  redirect(`${path}?joined=1`) // opens the share-to-story sheet
}

export async function leaveHeat(form: FormData) {
  const userId = await requireUser()
  const number = Number(form.get('number'))
  const heat = await getHeat(number)
  if (!heat || !hasDb) return
  const sb = await supabaseServer()
  await sb.from('registrations').delete().eq('heat_id', heat.id).eq('user_id', userId)
  revalidatePath(`/h/${heatNo(number)}`)
}

// ───────── results

export async function submitResult(_: FormState, form: FormData): Promise<FormState> {
  const userId = await requireUser()
  if (!hasDb) return { error: NO_DB }
  const number = Number(form.get('number'))
  const heat = await getHeat(number)
  if (!heat) return { error: 'That heat does not exist.' }
  if (Date.now() < new Date(heat.starts_at).getTime()) return { error: 'You can post your time after the gun.' }

  const time = parseTime(String(form.get('time') ?? ''))
  if (time === null) return { error: 'Enter your time as mm:ss, like 24:31.' }
  if (time < 600 || time > 7200) return { error: 'That time looks off. Check it matches your screenshot.' }
  const note = String(form.get('note') ?? '').trim().slice(0, 100) || null
  const path = String(form.get('screenshot_path') ?? '')
  if (!path.startsWith(`${userId}/`)) return { error: 'Add a screenshot of your run.' }

  const sb = await supabaseServer()
  const { data: existing } = await sb.from('results').select('id, status').eq('heat_id', heat.id).eq('user_id', userId).maybeSingle()
  const fields = { time_seconds: time, note, screenshot_path: path }

  if (existing?.status === 'verified') return { error: 'You are already stamped for this heat.' }
  if (existing?.status === 'pending') {
    const { error } = await sb.from('results').update(fields).eq('id', existing.id)
    if (error) return { error: 'Could not update your time. Try again.' }
  } else if (existing?.status === 'rejected') {
    // Runners can't edit a rejected row under RLS, so re-open it after the ownership check above.
    const { error } = await supabaseAdmin().from('results').update({ ...fields, status: 'pending', reject_reason: null, reviewed_at: null }).eq('id', existing.id).eq('user_id', userId)
    if (error) return { error: 'Could not re-post your time. Try again.' }
  } else {
    const { error } = await sb.from('results').insert({ heat_id: heat.id, ...fields })
    if (error) return { error: error.code === '42501' ? 'Join the heat before posting a time.' : 'Could not post your time. Try again.' }
  }
  revalidatePath(`/h/${heatNo(number)}`)
  redirect(`/h/${heatNo(number)}?posted=1`)
}

// ───────── admin

async function requireAdmin() {
  const { userId } = await auth()
  if (!isAdmin(userId)) throw new Error('Not allowed')
}

export async function reviewResult(form: FormData) {
  await requireAdmin()
  const id = String(form.get('id'))
  const decision = String(form.get('decision'))
  const reason = String(form.get('reason') ?? '').trim()
  const db = supabaseAdmin()
  const update = decision === 'verify'
    ? { status: 'verified', reject_reason: null, reviewed_at: new Date().toISOString() }
    : { status: 'rejected', reject_reason: reason || 'We could not match the screenshot to this heat.', reviewed_at: new Date().toISOString() }
  const { data } = await db.from('results').update(update).eq('id', id).select('heats(number), profiles(alias)').single()
  revalidatePath('/admin')
  const row = data as unknown as { heats: { number: number }; profiles: { alias: string } } | null
  if (row) {
    revalidatePath(`/h/${heatNo(row.heats.number)}`)
    revalidatePath(`/p/${row.profiles.alias}`)
  }
}

export async function setHeatStatus(form: FormData) {
  await requireAdmin()
  const id = String(form.get('id'))
  const status = String(form.get('status'))
  if (!['draft', 'open', 'results', 'closed'].includes(status)) return
  await supabaseAdmin().from('heats').update({ status }).eq('id', id)
  revalidatePath('/', 'layout')
}
