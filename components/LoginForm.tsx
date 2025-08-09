'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { LoginCredentials } from '@/lib/types';
import { FaSignInAlt } from 'react-icons/fa';

interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  onSwitchToRegister: () => void;
  isLoading: boolean;
  error: string | null;
  defaultEmail?: string;
}

export default function LoginForm({ onSubmit, onSwitchToRegister, isLoading, error, defaultEmail }: LoginFormProps) {
  const [email, setEmail] = useState(defaultEmail || '');
  const [password, setPassword] = useState('');
  const t = useTranslations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ email, password });
  };

  return (
    <div className="bg-black bg-opacity-80 backdrop-blur-lg rounded-lg border-2 border-green-500 border-opacity-60 shadow-xl p-8 max-w-md w-full">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-white mb-3">{t('auth.login.title')}</h2>
        <h1 className="hero-title text-4xl md:text-6xl" style={{position: 'static', transform: 'none', top: 'auto', left: 'auto'}}>{t('common.penalty')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="floating-label-container">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="floating-input"
            placeholder={t('auth.login.email')}
            disabled={isLoading}
          />
          <label htmlFor="email" className="floating-label">
            {t('auth.login.email')}
          </label>
        </div>

        <div className="floating-label-container">
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="floating-input"
            placeholder="Passwort"
            disabled={isLoading}
          />
          <label htmlFor="password" className="floating-label">
            Passwort
          </label>
        </div>

        {error && (
          <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-3">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            isLoading
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-500 transform hover:scale-105 border border-green-500'
          }`}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Anmelden...
            </>
          ) : (
            <>
              <FaSignInAlt />
              Anmelden
            </>
          )}
        </button>
      </form>

      {/* Forgot Password Link */}
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => window.location.href = '/forgot-password'}
          className="text-yellow-400 hover:text-yellow-300 text-sm underline bg-transparent border-none cursor-pointer"
        >
          {t('auth.login.forgotPassword')}
        </button>
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-300">
          {t('auth.login.noAccount')}{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-green-400 hover:text-green-300 font-semibold"
            disabled={isLoading}
          >
            {t('auth.login.registerNow')}
          </button>
        </p>
      </div>
    </div>
  );
}