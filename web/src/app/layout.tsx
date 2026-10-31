import type { Metadata, Viewport } from 'next'
import { Archivo, DM_Mono, DM_Sans, Instrument_Serif } from 'next/font/google'
import { unstable_rethrow } from 'next/navigation'
import { connection } from 'next/server'
import { Footer } from '@/components/site/footer'
import { LaneFrame } from '@/components/site/lane-frame'
import { Nav, stampCaseHref } from '@/components/site/nav'
import { TabBar } from '@/components/site/tab-bar'
import { getCalendar } from '@/lib/data'
import { getRunner } from '@/lib/session'
import type { ReactNode } from 'react'
import './globals.css'

const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--f-serif' })
const sans = DM_Sans({ subsets: ['latin'], variable: '--f-sans' })
const mono = DM_Mono({ subsets: ['latin'], weight: '500', variable: '--f-mono' })
// Variable weight so the wdth axis can load too; the stamps draw at 900 with font-stretch 125%.
const wm = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--f-wm' })

const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: 'Heats · Run New York, one stamp at a time', template: '%s · Heats' },
  description: 'Free 5Ks every weekend across New York. Run it, post your Strava screenshot, get that park\'s stamp.',
  openGraph: { siteName: 'Heats', type: 'website' },
}

export const viewport: Viewport = { themeColor: '#CCFF00' }

// A missing env var or unreachable DB must never take down the whole shell.
async function safely<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load()
  } catch (e) {
    unstable_rethrow(e)
    return null
  }
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Every page shows who is signed in, so render per request.
  await connection()
  const [runner, calendar] = await Promise.all([safely(getRunner), safely(getCalendar)])
  const nextHeat = calendar ? (calendar.live ?? calendar.upcoming[0] ?? null) : null
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable} ${wm.variable}`}>
      <body>
        <LaneFrame footer={<Footer nextHeat={nextHeat} runner={runner} />}>
          <Nav runner={runner} />
          {children}
        </LaneFrame>
        <TabBar stampHref={stampCaseHref(runner)} />
      </body>
    </html>
  )
}
