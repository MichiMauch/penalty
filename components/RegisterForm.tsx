'use client';

import { useState } from 'react';
import { RegisterData, AvatarId } from '@/lib/types';
import AvatarSelector from './AvatarSelector';

interface RegisterFormProps {
  onSubmit: (data: RegisterData) => Promise<void>;
  onSwitchToLogin: () => void;
  isLoading: boolean;
  error: string | null;
  defaultEmail?: string;
}

export default function RegisterForm({ onSubmit, onSwitchToLogin, isLoading, error, defaultEmail }: RegisterFormProps) {
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
      setValidationError('Passwörter stimmen nicht überein');
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
    <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">⚽ Fußballpause</h1>
        <h2 className="text-xl font-semibold text-gray-600">Registrieren</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Benutzername
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Dein Spielername"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            E-Mail-Adresse
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="deine@email.com"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Passwort
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Mindestens 6 Zeichen"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Passwort bestätigen
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Passwort wiederholen"
            disabled={isLoading}
          />
        </div>

        <AvatarSelector
          selectedAvatar={selectedAvatar}
          onSelectAvatar={setSelectedAvatar}
        />

        {displayError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{displayError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
            isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-500 text-white hover:bg-green-600 transform hover:scale-105'
          }`}
        >
          {isLoading ? '⏳ Registriere...' : '🎯 Account erstellen'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Bereits ein Account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-blue-500 hover:text-blue-600 font-semibold"
            disabled={isLoading}
          >
            Jetzt anmelden
          </button>
        </p>
      </div>
    </div>
  );
}