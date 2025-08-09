import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import { AuthProvider } from '@/contexts/AuthContext'
import PushNotificationManager from '@/components/PushNotificationManager'
import {Locale} from '@/i18n';

export default async function LocaleLayout({
  children,
  params: {locale}
}: {
  children: React.ReactNode;
  params: {locale: Locale};
}) {
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <PushNotificationManager />
            {children}
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}