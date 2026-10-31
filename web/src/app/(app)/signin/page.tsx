import { SignInForm } from './signin-form'

export const metadata = { title: 'Sign in' }

const LINK_ERRORS: Record<string, string> = {
  link_invalid: 'That link did not work. Send a new one.',
  link_expired: 'That link expired or was opened in a different browser. Send a new one here.',
  handle_taken: 'Someone claimed that @ first. Join a heat again to pick another.',
  handle_required: 'No Heats account for that email yet. Join a heat to claim your @.',
}

// Only same-site paths are allowed as the post-sign-in destination.
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; error?: string | string[] }>
}) {
  const { next, error } = await searchParams
  const target = typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/calendar'
  return <SignInForm next={target} linkError={typeof error === 'string' ? LINK_ERRORS[error] ?? LINK_ERRORS.link_invalid : null} />
}
