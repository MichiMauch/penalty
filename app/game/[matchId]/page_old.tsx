'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PenaltySelector from '@/components/PenaltySelector';
import GameResult from '@/components/GameResult';
import TribuneFlashes from '@/components/TribuneFlashes';
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
    console.log('=== FETCHING MATCH ===');
    console.log('matchId:', matchId);
    try {
      const response = await fetch(`/api/match?matchId=${matchId}`);
      const data = await response.json();
      console.log('Match API response status:', response.status);
      console.log('Match API response data:', data);
      
      if (response.ok) {
        setMatch(data.match);
        console.log('Match set successfully:', data.match);
        if (data.result) {
          setGameResult(data.result);
          console.log('Game result set:', data.result);
        }
      } else {
        console.log('Match API error:', data.error);
        setError(data.error || 'Match nicht gefunden');
      }
    } catch (err) {
      console.error('Error fetching match:', err);
      setError('Netzwerkfehler beim Laden des Matches');
    }
    console.log('=== END FETCHING MATCH ===');
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
    console.log('=== CHECKING PLAYER ROLE ===');
    console.log('match:', match);
    console.log('playerId:', playerId);
    console.log('match?.player_a:', match?.player_a);
    console.log('match?.player_b:', match?.player_b);
    console.log('playerId === match?.player_a:', playerId === match?.player_a);
    console.log('playerId === match?.player_b:', playerId === match?.player_b);
    
    if (match && playerId) {
      if (match.player_a === playerId) {
        console.log('✅ Player is A');
        setPlayerRole('player_a');
        setHasSubmittedMoves(!!match.player_a_moves);
      } else if (match.player_b === playerId) {
        console.log('✅ Player is B');
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
        console.log('❌ Player not recognized in match', {
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
    } else {
      console.log('❌ Missing match or playerId:', { 
        hasMatch: !!match, 
        hasPlayerId: !!playerId,
        match: match ? 'exists' : 'null',
        playerId: playerId || 'empty'
      });
    }
    console.log('=== END CHECKING PLAYER ROLE ===');
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
  
  // DEBUG: Add console logs
  console.log('=== GAME PAGE DEBUG ===');
  console.log('matchId:', matchId);
  console.log('user:', user ? { email: user.email, username: user.username } : null);
  console.log('match:', match);
  console.log('playerRole:', playerRole);
  console.log('playerId:', playerId);
  console.log('hasSubmittedMoves:', hasSubmittedMoves);
  console.log('loading:', loading);
  console.log('========================');
  
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
    console.log('=== NO USER - SHOWING AUTH PAGE ===');
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
    console.log('=== NO MATCH - LOADING ===');
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
      <Layout showHeader={true}>
        <div className="challenge-page">
          <TribuneFlashes />
          <div className="container section">
            <div className="max-w-4xl mx-auto">
              <div className="bg-grass-green-light bg-opacity-60 backdrop-blur-lg rounded-lg border-2 border-green-600 border-opacity-80 shadow-xl p-8">
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
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout showHeader={true}>
      <div className="challenge-page">
        <TribuneFlashes />
        <div className="container section">
          <div className="max-w-4xl mx-auto">
            
            {/* Centered Challenge Info - without frame - EXACTLY like challenge page */}
            {playerRole && (
              <div className="text-center mb-8">
                <p className="text-green-300 text-xl">
                  {playerRole === 'player_a' ? (
                    <>Du forderst <strong className="text-white">{match.player_b_username || match.player_b_email || 'Gegner'}</strong> heraus</>
                  ) : (
                    <>Du hältst gegen <strong className="text-white">{match.player_a_username || match.player_a_email || 'Gegner'}</strong></>
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

            {/* Penalty Selector - EXACTLY like challenge page when opponent is selected */}
            {!hasSubmittedMoves && playerRole && (
              <PenaltySelector
                matchId={matchId as string}
                onSubmit={playerRole === 'player_a' ? submitMovesAndInvite : submitMoves}
                disabled={isSubmitting}
                playerBEmail={playerRole === 'player_a' ? match.player_b_email : undefined}
                playerAEmail={match.player_a_email || ''}
                playerAUsername={match.player_a_username || ''}
                playerBUsername={match.player_b_username || ''}
                playerAAvatar={match.player_a_avatar || 'soccer'}
                playerBAvatar={match.player_b_avatar || 'soccer'}
                role={playerRole === 'player_a' ? 'shooter' : 'keeper'}
              />
            )}
          </div>
        </div>
      </div>

      {/* Success Modal - like Challenge page */}
      {hasSubmittedMoves && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-grass-green-light backdrop-blur-lg rounded-lg border-2 border-green-600 shadow-2xl max-w-md w-full">
            <div className="p-6 text-center">
              {/* Header */}
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">
                    {playerRole === 'player_a' ? '⚽' : '🧤'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  {playerRole === 'player_a' ? 'Schüsse gesetzt!' : 'Paraden gesetzt!'}
                </h2>
                <p className="text-gray-300 text-sm">
                  {!match.player_b 
                    ? `Warten auf ${match.player_b_email}...` 
                    : playerRole === 'player_a' 
                      ? 'Der Torwart macht seine Züge...'
                      : 'Warten auf Spielergebnis...'}
                </p>
              </div>

              {/* Info */}
              <div className="mb-6 p-4 bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg">
                <p className="text-blue-300 text-sm">
                  {!match.player_b 
                    ? 'Der Gegner hat bis zu 24 Stunden Zeit zu antworten.' 
                    : 'Das Spiel startet automatisch wenn beide Spieler fertig sind.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.href = '/garderobe'}
                  className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                >
                  Zurück zur Garderobe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}