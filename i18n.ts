import {getRequestConfig} from 'next-intl/server';
 
export const locales = ['de', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'de';
 
export default getRequestConfig(async ({locale}) => {
  // Fallback to default locale if undefined  
  const safeLocale = locale || defaultLocale;
  
  return {
    locale: safeLocale,
    messages: (await import(`./messages/${safeLocale}.json`)).default
  };
});