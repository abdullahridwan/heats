import { SignInForm } from './signin-form'

export const metadata = { title: 'Sign in' }

// Only same-site paths are allowed as the post-sign-in destination.
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  const { next } = await searchParams
  const target = typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/calendar'
  return <SignInForm next={target} />
}
