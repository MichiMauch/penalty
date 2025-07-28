import type { Metadata } from 'next'
import { Inter, Notable, Varela_Round } from 'next/font/google'
import './globals.css'
import '@/styles/comicBattleAnimations.css'
import { AuthProvider } from '@/contexts/AuthContext'
import PushNotificationManager from '@/components/PushNotificationManager'

const inter = Inter({ subsets: ['latin'] })
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
    <html lang="de" className={`${notable.variable} ${varelaRound.variable}`}>
      <body className={varelaRound.className}>
        <AuthProvider>
          <PushNotificationManager />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}