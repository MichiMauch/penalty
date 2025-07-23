'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PenaltySelector from '@/components/PenaltySelector';
import KeeperSelector from '@/components/KeeperSelector';
import GameResult from '@/components/GameResult';
import { PlayerMoves, Match, GameResult as GameResultType } from '@/lib/types';
import { nanoid } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import AuthPage from '@/components/AuthPage';
import Layout from '@/components/Layout';

export default function GamePage() {
  const { matchId } = useParams();
  const { user, loading } = useAuth();
  const [match, setMatch] = useState<Match | null>(null);
  const [gameResult, setGameResult] = useState<GameResultType | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [playerRole, setPlayerRole] = useState<'player_a' | 'player_b' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [hasSubmittedMoves, setHasSubmittedMoves] = useState(false);

  // All hooks must be called before any conditional returns
  const fetchMatch = useCallback(async () => {
    console.log('Fetching match:', matchId);
    try {
      const response = await fetch(`/api/match?matchId=${matchId}`);
      const data = await response.json();
      console.log('Match data:', data);
      
      if (response.ok) {
        setMatch(data.match);
        if (data.result) {
          setGameResult(data.result);
        }
      } else {
        setError(data.error || 'Match nicht gefunden');
      }
    } catch (err) {
      console.error('Error fetching match:', err);
      setError('Netzwerkfehler beim Laden des Matches');
    }
  }, [matchId]);

  const joinAsPlayerB = useCallback(async () => {
    if (!user) return;
    
    console.log('Attempting to join as player B:', { matchId, playerId });
    try {
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          matchId,
          playerId,
          email: user.email,
          username: user.username,
          avatar: user.avatar
        })
      });

      const data = await response.json();
      console.log('Join response:', response.status, data);

      if (response.ok) {
        await fetchMatch(); // Refresh match data
      } else {
        console.error('Failed to join match:', data);
      }
    } catch (err) {
      console.error('Error joining match:', err);
    }
  }, [matchId, playerId, user, fetchMatch]);

  const takeOverPlayerB = useCallback(async () => {
    if (!user) return;
    
    console.log('Taking over player B slot:', { matchId, playerId });
    try {
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'takeover-player-b',
          matchId,
          playerId,
          email: user.email,
          username: user.username,
          avatar: user.avatar
        })
      });

      const data = await response.json();
      console.log('Takeover response:', response.status, data);

      if (response.ok) {
        await fetchMatch(); // Refresh match data
      } else {
        console.error('Failed to take over player B:', data);
      }
    } catch (err) {
      console.error('Error taking over player B:', err);
    }
  }, [matchId, playerId, user, fetchMatch]);

  useEffect(() => {
    let storedPlayerId = localStorage.getItem('playerId');
    if (!storedPlayerId) {
      // Generate new player ID for players joining via link
      storedPlayerId = nanoid();
      localStorage.setItem('playerId', storedPlayerId);
    }
    setPlayerId(storedPlayerId);
    
    fetchMatch();
  }, [matchId, fetchMatch]);
  
  useEffect(() => {
    console.log('Checking player role:', { match, playerId });
    if (match && playerId) {
      if (match.player_a === playerId) {
        console.log('Player is A');
        setPlayerRole('player_a');
        setHasSubmittedMoves(!!match.player_a_moves);
      } else if (match.player_b === playerId) {
        console.log('Player is B');
        setPlayerRole('player_b');
        setHasSubmittedMoves(!!match.player_b_moves);
      } else if (!match.player_b) {
        console.log('Auto-joining as player B - no player B exists');
        // Auto-join as player B if no player B exists
        joinAsPlayerB();
      } else if (match.player_b && !match.player_b_moves && user && match.player_b_email === user.email) {
        console.log('Player B exists but has no moves, and this is the invited player - allowing takeover');
        // Allow taking over player B slot if they haven't submitted moves yet AND this is the invited player
        takeOverPlayerB();
      } else if (user && match.player_a_email === user.email && match.player_a) {
        console.log('Player recognized as A by email (finished game or localStorage cleared)');
        // For finished games or when localStorage is cleared, recognize player by email
        setPlayerRole('player_a');
        setHasSubmittedMoves(!!match.player_a_moves);
        // Update localStorage with the correct player ID for future visits
        localStorage.setItem('playerId', match.player_a);
        setPlayerId(match.player_a);
      } else if (user && match.player_b_email === user.email && match.player_b) {
        console.log('Player recognized as B by email (finished game or localStorage cleared)');
        // For finished games or when localStorage is cleared, recognize player by email
        setPlayerRole('player_b');
        setHasSubmittedMoves(!!match.player_b_moves);
        // Update localStorage with the correct player ID for future visits
        localStorage.setItem('playerId', match.player_b);
        setPlayerId(match.player_b);
      } else {
        console.log('Player not recognized in match', {
          playerA: match.player_a,
          playerB: match.player_b,
          currentPlayerId: playerId,
          userEmail: user?.email,
          playerAEmail: match.player_a_email,
          playerBEmail: match.player_b_email
        });
        // Player is not in this match, but match is full
        setError('Du bist nicht Teil dieses Matches. Bitte verwende den korrekten Link oder erstelle ein neues Match.');
      }
    }
  }, [match, playerId, user, joinAsPlayerB, takeOverPlayerB]);

  // Auto-polling when waiting for opponent to join
  useEffect(() => {
    if (!match || !hasSubmittedMoves || playerRole !== 'player_a' || match.player_b) return;
    
    console.log('Starting auto-polling for opponent...');
    const pollInterval = setInterval(() => {
      console.log('Polling for opponent...');
      fetchMatch();
    }, 8000); // Poll every 8 seconds
    
    return () => {
      console.log('Stopping auto-polling');
      clearInterval(pollInterval);
    };
  }, [match, hasSubmittedMoves, playerRole, fetchMatch]);
  
  // Show auth page if not logged in
  if (loading) {
    return (
      <Layout showHeader={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-xl">⚽ Lade Spiel...</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout showHeader={false}>
        <AuthPage 
          matchId={matchId as string}
          match={match || undefined}
          invitationMode={true}
          invitedEmail={match?.player_b_email || undefined}
        />
      </Layout>
    );
  }
  
  const submitMoves = async (moves: PlayerMoves) => {
    console.log('Submitting moves (Player B):', { matchId, playerId, moves });
    setIsSubmitting(true);
    setError('');
    
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
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok) {
        setHasSubmittedMoves(true);
        if (data.status === 'finished' && data.result) {
          setGameResult(data.result);
        }
        await fetchMatch(); // Refresh match state
      } else {
        setError(data.error || 'Fehler beim Übermitteln der Züge');
      }
    } catch (err) {
      console.error('Error submitting moves:', err);
      setError('Netzwerkfehler: ' + (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitMovesAndInvite = async (moves: PlayerMoves, opponentEmail: string) => {
    console.log('Submitting moves and inviting:', { matchId, playerId, moves, opponentEmail });
    setIsSubmitting(true);
    setError('');
    
    try {
      // First submit the moves
      const moveResponse = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit-moves',
          matchId,
          playerId,
          moves
        })
      });
      
      console.log('Move response status:', moveResponse.status);
      const moveData = await moveResponse.json();
      console.log('Move response data:', moveData);
      
      if (!moveResponse.ok) {
        setError(moveData.error || 'Fehler beim Übermitteln der Züge');
        return;
      }
      
      // Then send the invitation if player A
      if (playerRole === 'player_a' && !match?.player_b) {
        const inviteResponse = await fetch('/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'invite-player',
            matchId,
            email: opponentEmail
          })
        });
        
        const inviteData = await inviteResponse.json();
        
        if (!inviteResponse.ok) {
          console.error('Failed to send invitation:', inviteData);
          // Don't fail the whole process if invitation fails
        }
      }
      
      setHasSubmittedMoves(true);
      if (moveData.status === 'finished' && moveData.result) {
        setGameResult(moveData.result);
      }
      await fetchMatch(); // Refresh match state
    } catch (err) {
      console.error('Error submitting moves:', err);
      setError('Netzwerkfehler: ' + (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (error) {
    return (
      <Layout showHeader={false}>
        <div className="min-h-screen bg-gradient-to-br from-red-400 to-orange-600 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Fehler</h1>
            <p className="text-gray-700 mb-4">{error}</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Zur Startseite
            </Link>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!match) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-xl">Lade Match...</div>
        </div>
      </Layout>
    );
  }
  
  // Show result if game is finished
  if (gameResult && playerRole) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-600 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-4xl w-full">
            <GameResult 
              result={gameResult} 
              playerRole={playerRole}
              playerAEmail={match?.player_a_email || undefined}
              playerBEmail={match?.player_b_email || undefined}
              playerAUsername={match?.player_a_username || undefined}
              playerBUsername={match?.player_b_username || undefined}
              playerAAvatar={match?.player_a_avatar || undefined}
              playerBAvatar={match?.player_b_avatar || undefined}
            />
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-center mb-4">⚽ Fußballpause</h1>
          <p className="text-center text-lg font-semibold text-gray-700 mb-2">
            Du bist {playerRole === 'player_a' ? '⚽ Schütze' : '🧤 Torwart'}
          </p>
        </div>
        
        {hasSubmittedMoves ? (
          <div className="text-center py-8 max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="text-6xl mb-4">✅</div>
              <h1 className="text-3xl font-bold text-green-600 mb-2">Herausforderung versendet!</h1>
              <p className="text-lg text-gray-600">
                {!match.player_b 
                  ? `Warten auf ${match.player_b_email}...` 
                  : 'Der Gegner macht seine Züge...'}
              </p>
            </div>

            {/* Status with animation */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-blue-600">⏳</span>
                <span className="text-blue-800 font-medium">
                  {!match.player_b ? 'Einladung versendet' : 'Spiel läuft'}
                </span>
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse delay-75"></div>
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse delay-150"></div>
                </div>
              </div>
              <p className="text-sm text-blue-600">
                {!match.player_b 
                  ? 'Der Gegner hat bis zu 24 Stunden Zeit zu antworten.' 
                  : 'Das Spiel startet automatisch wenn beide Spieler fertig sind.'}
              </p>
            </div>

            {/* Primary Action */}
            <div className="mb-8">
              <button
                onClick={() => window.location.href = '/garderobe'}
                className="w-full sm:w-auto px-8 py-4 bg-green-500 text-white text-lg font-bold rounded-lg hover:bg-green-600 transform hover:scale-105 transition-all duration-200 shadow-lg mb-4"
              >
                🏠 Zurück zur Garderobe
              </button>
              <p className="text-sm text-gray-500">Du kannst andere Herausforderungen annehmen oder neue erstellen</p>
            </div>

            {/* Secondary Actions - Sharing */}
            <details className="bg-gray-50 rounded-lg p-4">
              <summary className="cursor-pointer text-gray-700 font-medium mb-2">🔗 Gegner erreichen</summary>
              <div className="space-y-3">
                <p className="text-xs text-gray-500">Falls die Email nicht ankommt, teile den Link manuell:</p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => {
                      const text = `Ich fordere dich zum Elfmeterschießen heraus! 🥅⚽ ${window.location.origin}/game/${matchId}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 flex items-center gap-1"
                  >
                    📱 WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/game/${matchId}`);
                      alert('Link kopiert! 📋');
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 flex items-center gap-1"
                  >
                    📋 Kopieren
                  </button>
                </div>
              </div>
            </details>
          </div>
        ) : (
          playerRole === 'player_a' ? (
            <PenaltySelector 
              matchId={matchId as string}
              onSubmit={submitMovesAndInvite} 
              disabled={isSubmitting}
              playerAEmail={match.player_a_email || undefined}
              playerBEmail={match.player_b_email || undefined}
              playerAUsername={match.player_a_username || undefined}
              playerBUsername={match.player_b_username || undefined}
              playerAAvatar={match.player_a_avatar || undefined}
              playerBAvatar={match.player_b_avatar || undefined}
            />
          ) : (
            <KeeperSelector
              onSubmit={submitMoves}
              disabled={isSubmitting}
              challengerEmail={match.player_a_email || 'Ein Spieler'}
              playerBEmail={match.player_b_email || undefined}
              challengerUsername={match.player_a_username || undefined}
              playerBUsername={match.player_b_username || undefined}
              challengerAvatar={match.player_a_avatar || undefined}
              playerBAvatar={match.player_b_avatar || undefined}
            />
          )
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        </div>
      </div>
    </Layout>
  );
}