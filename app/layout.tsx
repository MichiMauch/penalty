import type { Metadata } from 'next'
import { Notable, Varela_Round } from 'next/font/google'
import './globals.css'
import '@/styles/comicBattleAnimations.css'

const notable = Notable({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-notable'
})
const varelaRound = Varela_Round({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-varela'
})

export const metadata: Metadata = {
  title: 'PENALTY',
  description: 'Penalty-Duell für jedermann - 5 Penalty entscheiden!',
  manifest: '/manifest.json',
  themeColor: '#10b981',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html className={`${notable.variable} ${varelaRound.variable}`}>
      <body className={varelaRound.className}>
        {children}
      </body>
    </html>
  )
}