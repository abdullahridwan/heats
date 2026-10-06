import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { Archivo, Geist, Geist_Mono } from 'next/font/google'
import { ClerkProvider, Show, SignInButton, UserButton } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { InkFilter, Mark } from '@/components/art'
import { RevealObserver } from '@/components/reveal'
import { getMe } from '@/lib/data'
import './globals.css'

const wm = Archivo({ subsets: ['latin'], style: ['italic'], axes: ['wdth'], variable: '--f-wm' })
const ui = Geist({ subsets: ['latin'], variable: '--f-ui' })
const mono = Geist_Mono({ subsets: ['latin'], variable: '--f-mono' })

const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: 'Heats · Chilly Central Park 5K', template: '%s · Heats' },
  description: 'Free community 5Ks across New York. Show up, run, get stamped.',
  openGraph: { siteName: 'Heats', type: 'website' },
}

export const viewport: Viewport = { themeColor: '#FFFFFF' }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  const me = await getMe(userId)
  return (
    <ClerkProvider
      appearance={{ variables: { colorPrimary: '#0B0C0A', colorForeground: '#0B0C0A', borderRadius: '12px', fontFamily: 'var(--f-ui), sans-serif' } }}
    >
      <html lang="en" className={`${wm.variable} ${ui.variable} ${mono.variable}`} suppressHydrationWarning>
        <head>
          {/* Lets CSS hide entrance-animation start states only when JS will reveal them */}
          <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        </head>
        <body>
          <RevealObserver />
          <InkFilter />
          <div className="wrap">
            <nav className="top">
              <Link href="/" className="brand" aria-label="Heats home">
                <Mark />
                <span className="wm">Heats</span>
              </Link>
              <div className="navr">
                <Link className="chip-link hide-sm" href="/results">Results</Link>
                <Link className="chip-link" href="/post">Post a time</Link>
                <Show when="signed-out">
                  <SignInButton mode="modal"><button className="chip-link" type="button">Sign in</button></SignInButton>
                </Show>
                <Show when="signed-in">
                  {me
                    ? <Link className="chip-link" href={`/p/${me.alias}`}>Passport</Link>
                    : <Link className="chip-link" href="/onboarding">Get your passport</Link>}
                  <UserButton />
                </Show>
              </div>
            </nav>
          </div>
          {children}
          <div className="wrap">
            <footer className="foot">
              <span className="wm" style={{ fontSize: 22, color: 'var(--ink)' }}>Heats</span>
              <span>Free community 5Ks · New York · Every pace</span>
            </footer>
          </div>
        </body>
      </html>
    </ClerkProvider>
  )
}
