'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { RegisterData, AvatarId } from '@/lib/types';
import AvatarSelector from './AvatarSelector';
import { FaUserPlus } from 'react-icons/fa';

interface RegisterFormProps {
  onSubmit: (data: RegisterData) => Promise<void>;
  onSwitchToLogin: () => void;
  isLoading: boolean;
  error: string | null;
  defaultEmail?: string;
  isInvitation?: boolean;
}

export default function RegisterForm({ onSubmit, onSwitchToLogin, isLoading, error, defaultEmail, isInvitation = false }: RegisterFormProps) {
  const t = useTranslations();
  const [email, setEmail] = useState(defaultEmail || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarId>('player1');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Client-side validation
    if (password !== confirmPassword) {
      setValidationError(t('auth.register.passwordsDontMatch'));
      return;
    }

    if (password.length < 6) {
      setValidationError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    if (username.length < 2) {
      setValidationError('Benutzername muss mindestens 2 Zeichen lang sein');
      return;
    }

    await onSubmit({
      email,
      password,
      username,
      avatar: selectedAvatar
    });
  };

  const displayError = validationError || error;

  return (
    <div className="bg-black bg-opacity-80 backdrop-blur-lg rounded-lg border-2 border-green-500 border-opacity-60 shadow-xl p-8 max-w-lg w-full">
      <div className="text-center mb-6">
        {isInvitation && (
          <div className="mb-4 p-3 bg-green-900 bg-opacity-50 border border-green-600 rounded-lg">
            <p className="text-green-200 text-sm">🏆 You've been invited to a penalty duel! Complete registration to start playing.</p>
          </div>
        )}
        <h2 className="text-xl font-semibold text-white mb-3">{t('auth.register.title')}</h2>
        <h1 className="hero-title text-4xl md:text-6xl" style={{position: 'static', transform: 'none', top: 'auto', left: 'auto'}}>PENALTY</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="floating-label-container">
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="floating-input"
            placeholder={t('auth.register.username')}
            disabled={isLoading}
          />
          <label htmlFor="username" className="floating-label">
            {t('auth.register.username')}
          </label>
        </div>

        <div className="floating-label-container">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="floating-input"
            placeholder="E-Mail-Adresse"
            disabled={isLoading || (isInvitation && !!defaultEmail)}
          />
          <label htmlFor="email" className="floating-label">
            E-Mail-Adresse
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
            placeholder={t('auth.register.passwordMinLength')}
            disabled={isLoading}
          />
          <label htmlFor="password" className="floating-label">
            {t('auth.register.password')}
          </label>
        </div>

        <div className="floating-label-container">
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="floating-input"
            placeholder={t('auth.register.confirmPassword')}
            disabled={isLoading}
          />
          <label htmlFor="confirmPassword" className="floating-label">
            {t('auth.register.confirmPassword')}
          </label>
        </div>

        <AvatarSelector
          selectedAvatar={selectedAvatar}
          onSelectAvatar={setSelectedAvatar}
        />

        {displayError && (
          <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-3">
            <p className="text-red-300 text-sm">{displayError}</p>
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
              {t('auth.register.registering')}
            </>
          ) : (
            <>
              <FaUserPlus />
              {t('auth.register.registerButton')}
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-300">
          {t('auth.register.hasAccount')}{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-green-400 hover:text-green-300 font-semibold"
            disabled={isLoading}
          >
            {t('auth.register.loginNow')}
          </button>
        </p>
      </div>
    </div>
  );
}