'use client';

import { useState } from 'react';

interface EmailInviteProps {
  matchId: string;
  playerAEmail?: string;
  onInviteSent?: () => void;
}

export default function EmailInvite({ matchId, playerAEmail, onInviteSent }: EmailInviteProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInvited, setIsInvited] = useState(false);
  const [error, setError] = useState('');

  const sendInvite = async () => {
    if (!email.trim()) {
      setError('Bitte gib eine E-Mail-Adresse ein');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Bitte gib eine gültige E-Mail-Adresse ein');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'invite-player',
          matchId,
          email: email.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        setIsInvited(true);
        onInviteSent?.();
      } else {
        setError(data.error || 'Fehler beim Senden der Einladung');
      }
    } catch (err) {
      setError('Netzwerkfehler');
    } finally {
      setIsLoading(false);
    }
  };

  const gameUrl = typeof window !== 'undefined' ? 
    `${window.location.origin}/game/${matchId}` : '';

  if (isInvited) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <div className="flex items-center mb-3">
          <div className="text-green-500 mr-2">✅</div>
          <h3 className="text-lg font-semibold text-green-800">Einladung verschickt!</h3>
        </div>
        <p className="text-green-700 mb-3">
          Eine Einladung wurde an <strong>{email}</strong> gesendet.
        </p>
        <div className="bg-white border rounded p-3 text-sm">
          <p className="text-gray-600 mb-2">Spiellink zum Teilen:</p>
          <code className="bg-gray-100 p-1 rounded text-xs break-all">
            {gameUrl}
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-blue-800 mb-3">
        Gegner einladen
      </h3>
      {playerAEmail && (
        <p className="text-sm text-blue-600 mb-2">
          Du spielst als: <strong>{playerAEmail}</strong>
        </p>
      )}
      <p className="text-blue-700 mb-4">
        Lade einen Freund ein, gegen dich zu kämpfen!
      </p>
      
      <div className="space-y-4">
        <div>
          <input
            type="email"
            placeholder="E-Mail-Adresse des Gegners"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>
        
        <button
          onClick={sendInvite}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
        >
          {isLoading ? 'Einladung wird verschickt...' : 'Einladung senden'}
        </button>
        
        <div className="text-center text-gray-500 text-sm">
          oder teile den Spiellink direkt:
        </div>
        
        <div className="bg-white border rounded p-3 text-sm">
          <code className="bg-gray-100 p-1 rounded text-xs break-all">
            {gameUrl}
          </code>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
}