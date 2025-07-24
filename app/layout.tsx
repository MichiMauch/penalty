import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '@/styles/comicBattleAnimations.css'
import { AuthProvider } from '@/contexts/AuthContext'
import PushNotificationManager from '@/components/PushNotificationManager'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Fußballpause',
  description: 'Elfmeter-Duell für jedermann - 5 Elfmeter entscheiden!',
  manifest: '/manifest.json',
  themeColor: '#10b981',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <AuthProvider>
          <PushNotificationManager />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}