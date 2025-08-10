import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import { AuthProvider } from '@/contexts/AuthContext'
import PushNotificationManager from '@/components/PushNotificationManager'
import type { Metadata, Viewport } from 'next'
import { Notable, Varela_Round } from 'next/font/google'
import '../globals.css'
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
  title: 'PENALTY - Shootout',
  description: 'Spannende Penalty-Duelle mit Freunden. Zeig deine Schuss-Skills und werde zum Champion!',
}

export const viewport: Viewport = {
  themeColor: '#16a34a',
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages({locale});

  return (
    <html lang={locale} className={`${notable.variable} ${varelaRound.variable}`}>
      <body className={varelaRound.className}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <AuthProvider>
            <PushNotificationManager />
            {children}
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}