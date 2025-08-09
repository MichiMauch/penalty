import {createLocalizedPathnamesNavigation} from 'next-intl/navigation';
import {locales} from '../i18n';

export const {Link, redirect, usePathname, useRouter, getPathname} =
  createLocalizedPathnamesNavigation({
    locales,
    pathnames: {
      '/': '/',
      '/login': '/login',
      '/register': '/register',
      '/garderobe': '/garderobe',
      '/admin': '/admin',
      '/challenge': '/challenge',
      '/challenge-new': '/challenge-new',
      '/shooter': '/shooter',
      '/keeper': '/keeper',
      '/game/[matchId]': '/game/[matchId]',
      '/match/[matchId]': '/match/[matchId]',
      '/forgot-password': '/forgot-password',
      '/reset-password/[token]': '/reset-password/[token]'
    }
  });