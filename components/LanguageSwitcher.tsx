'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Locale } from '@/i18n';
import { FaGlobe, FaChevronDown } from 'react-icons/fa';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'dropdown' | 'flags';
}

export default function LanguageSwitcher({ className = '', variant = 'dropdown' }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'de' as const, name: 'Deutsch', flag: '🇩🇪' },
    { code: 'en' as const, name: 'English', flag: '🇺🇸' }
  ];

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];
  const otherLanguages = languages.filter(lang => lang.code !== locale);

  const handleLanguageChange = async (newLocale: Locale) => {
    setIsOpen(false);
    
    // Save preference to database if user is logged in
    if (user) {
      try {
        await fetch('/api/user/language', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: newLocale })
        });
      } catch (error) {
        console.error('Failed to save language preference:', error);
      }
    }
    
    startTransition(() => {
      // Replace the locale in the pathname
      const segments = pathname.split('/');
      if (segments[1] === locale) {
        segments[1] = newLocale;
      } else {
        segments.splice(1, 0, newLocale);
      }
      const newPath = segments.join('/');
      router.replace(newPath);
    });
  };

  if (variant === 'flags') {
    return (
      <div className={`flex gap-2 ${className}`}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`p-2 rounded-lg transition-all duration-200 text-2xl hover:bg-gray-800 ${
              lang.code === locale ? 'bg-gray-700 ring-2 ring-green-400' : ''
            } ${isPending ? 'opacity-50' : ''}`}
            disabled={isPending || lang.code === locale}
            title={lang.name}
          >
            {lang.flag}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-white ${
          isPending ? 'opacity-50' : ''
        }`}
        disabled={isPending}
      >
        <FaGlobe size={16} />
        <span className="hidden sm:inline">{currentLanguage.name}</span>
        <span className="sm:hidden">{currentLanguage.flag}</span>
        <FaChevronDown 
          size={12} 
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full right-0 mt-2 bg-gray-800 rounded-lg border border-gray-600 shadow-xl z-50 min-w-[120px]">
            {otherLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-700 transition-colors text-white first:rounded-t-lg last:rounded-b-lg"
                disabled={isPending}
              >
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}