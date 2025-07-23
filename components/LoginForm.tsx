'use client';

import { useState } from 'react';
import { LoginCredentials } from '@/lib/types';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ email, password });
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">⚽ Fußballpause</h1>
        <h2 className="text-xl font-semibold text-gray-600">Anmelden</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
            placeholder="Dein Passwort"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
            isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600 transform hover:scale-105'
          }`}
        >
          {isLoading ? '⏳ Anmelden...' : '🚀 Anmelden'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Noch kein Account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-blue-500 hover:text-blue-600 font-semibold"
            disabled={isLoading}
          >
            Jetzt registrieren
          </button>
        </p>
      </div>
    </div>
  );
}