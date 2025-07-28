'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthPage from '@/components/AuthPage';
import PenaltySelector from '@/components/PenaltySelector';
import TribuneFlashes from '@/components/TribuneFlashes';
import Header from '@/components/Header';
import { PlayerMoves, Match } from '@/lib/types';
import { nanoid } from '@/lib/utils';

export default function GamePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { matchId } = useParams();
  
  const [match, setMatch] = useState<Match | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [playerRole, setPlayerRole] = useState<'player_a' | 'player_b' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [hasSubmittedMoves, setHasSubmittedMoves] = useState(false);

  const fetchMatch = useCallback(async () => {
    try {
      const response = await fetch(`/api/match?matchId=${matchId}`);
      const data = await response.json();
      
      if (response.ok) {
        setMatch(data.match);
      } else {
        setError(data.error || 'Match nicht gefunden');
      }
    } catch (err) {
      console.error('Error fetching match:', err);
      setError('Netzwerkfehler beim Laden des Matches');
    }
  }, [matchId]);

  useEffect(() => {
    let storedPlayerId = localStorage.getItem('playerId');
    if (!storedPlayerId) {
      storedPlayerId = nanoid();
      localStorage.setItem('playerId', storedPlayerId);
    }
    setPlayerId(storedPlayerId);
    fetchMatch();
  }, [matchId, fetchMatch]);
  
  useEffect(() => {
    if (match && playerId) {
      if (match.player_a === playerId) {
        setPlayerRole('player_a');
        setHasSubmittedMoves(!!match.player_a_moves);
      } else if (match.player_b === playerId) {
        setPlayerRole('player_b');
        setHasSubmittedMoves(!!match.player_b_moves);
      } else if (user && match.player_a_email === user.email && match.player_a) {
        setPlayerRole('player_a');
        setHasSubmittedMoves(!!match.player_a_moves);
        localStorage.setItem('playerId', match.player_a);
        setPlayerId(match.player_a);
      } else if (user && match.player_b_email === user.email && match.player_b) {
        setPlayerRole('player_b');
        setHasSubmittedMoves(!!match.player_b_moves);
        localStorage.setItem('playerId', match.player_b);
        setPlayerId(match.player_b);
      }
    }
  }, [match, playerId, user]);

  const handleShotsSubmitted = async (moves: PlayerMoves) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit-moves',
          matchId,
          playerId,
          moves
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setHasSubmittedMoves(true);
        await fetchMatch();
      } else {
        setError(data.error || 'Fehler beim Übermitteln der Züge');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen der Herausforderung');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBackToGarderobe = () => {
    router.push('/garderobe');
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-white text-xl">⚽ Lade PENALTY...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <Header />
        <main>
          <AuthPage />
        </main>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen">
        <Header />
        <main>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-white text-xl">Lade Match...</div>
          </div>
        </main>
      </div>
    );
  }

  // EXACT COPY FROM CHALLENGE PAGE - when opponent is selected
  const selectedUser = playerRole === 'player_a' 
    ? { 
        username: match.player_b_username || match.player_b_email || 'Gegner',
        email: match.player_b_email || '',
        avatar: match.player_b_avatar || 'soccer'
      }
    : { 
        username: match.player_a_username || match.player_a_email || 'Gegner',
        email: match.player_a_email || '',
        avatar: match.player_a_avatar || 'soccer'
      };

  // EXACT COPY of challenge page structure - NO Layout component
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <div className="challenge-page">
          <TribuneFlashes />
          <div className="container section">
            <div className="max-w-4xl mx-auto">
              
              {/* Centered Challenge Info - without frame - EXACT COPY */}
              {selectedUser && (
                <div className="text-center mb-8">
                  <p className="text-green-300 text-xl">
                    {playerRole === 'player_a' ? (
                      <>Du forderst <strong className="text-white">{selectedUser.username}</strong> heraus</>
                    ) : (
                      <>Du hältst gegen <strong className="text-white">{selectedUser.username}</strong></>
                    )}
                  </p>
                </div>
              )}

              {error && (
                <div className="mb-6 mx-auto max-w-md">
                  <div className="p-3 bg-red-900 bg-opacity-50 border border-red-500 rounded-lg">
                    <p className="text-red-300 text-sm text-center">{error}</p>
                  </div>
                </div>
              )}

              {/* Penalty Selector - Only show when opponent is selected - EXACT COPY */}
              {selectedUser && !hasSubmittedMoves && (
                <PenaltySelector
                  matchId={matchId as string}
                  onSubmit={handleShotsSubmitted}
                  disabled={isSubmitting}
                  playerBEmail={selectedUser.email}
                  playerAEmail={user?.email || ''}
                  playerAUsername={user?.username || ''}
                  playerBUsername={selectedUser.username}
                  playerAAvatar={user?.avatar || 'soccer'}
                  playerBAvatar={selectedUser.avatar}
                  role={playerRole === 'player_a' ? 'shooter' : 'keeper'}
                />
              )}
            </div>
          </div>
        </div>

        {/* Loading Modal with Ball Spinner - EXACT COPY */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-grass-green-light backdrop-blur-lg rounded-lg border-2 border-green-600 shadow-2xl max-w-md w-full">
              <div className="p-8 text-center">
                {/* Spinning Ball */}
                <div className="mb-6">
                  <div className="mx-auto w-20 h-20 flex items-center justify-center mb-4">
                    <span className="text-6xl animate-spin">⚽</span>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    {playerRole === 'player_a' ? 'Herausforderung wird gesendet...' : 'Paraden werden gesendet...'}
                  </h2>
                  <p className="text-gray-300 text-sm">
                    Einen Moment bitte...
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal - EXACT COPY */}
        {hasSubmittedMoves && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-grass-green-light backdrop-blur-lg rounded-lg border-2 border-green-600 shadow-2xl max-w-md w-full">
              <div className="p-6 text-center">
                {/* Header */}
                <div className="mb-6">
                  <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">{playerRole === 'player_a' ? '⚽' : '🧤'}</span>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    {playerRole === 'player_a' ? 'Herausforderung gesendet!' : 'Paraden gesetzt!'}
                  </h2>
                  <p className="text-gray-300 text-sm">
                    {playerRole === 'player_a' 
                      ? `Deine Herausforderung wurde erfolgreich an ${selectedUser?.username} gesendet.`
                      : 'Warten auf Spielergebnis...'
                    }
                  </p>
                </div>

                {/* Info */}
                <div className="mb-6 p-4 bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg">
                  <p className="text-blue-300 text-sm">
                    {playerRole === 'player_a' ? (
                      <><strong>{selectedUser?.username}</strong> hat bis zu <strong>24 Stunden</strong> Zeit, 
                      um deine Herausforderung anzunehmen und seine Schüsse zu platzieren.</>
                    ) : (
                      'Das Spiel startet automatisch wenn beide Spieler fertig sind.'
                    )}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={goBackToGarderobe}
                    className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                  >
                    Zurück zur Garderobe
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}