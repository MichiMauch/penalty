import createMiddleware from 'next-intl/middleware';
import {locales, defaultLocale} from './i18n';
 
export default createMiddleware({
  // A list of all locales that are supported
  locales,
 
  // Used when no locale matches
  defaultLocale,
  
  // Always use locale prefix for cleaner routing
  localePrefix: 'always'
});
 
export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',

    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    '/(de|en)/:path*',

    // Enable redirects that add missing locales
    // (e.g. `/pathnames` -> `/en/pathnames`)
    // Exclude API routes, static files, and Next.js internals
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};