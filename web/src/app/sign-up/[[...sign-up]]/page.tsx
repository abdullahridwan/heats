import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return <main className="wrap" style={{ display: 'grid', placeItems: 'center', paddingBlock: 48 }}><SignUp forceRedirectUrl="/onboarding" /></main>
}
