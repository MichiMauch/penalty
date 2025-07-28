'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import AuthPage from '@/components/AuthPage';
import TribuneFlashes from '@/components/TribuneFlashes';
import { GameResult as GameResultType } from '@/lib/types';

export default function GamePage() {
  const router = useRouter();
  const { matchId } = useParams();
  const { user, loading } = useAuth();
  const [match, setMatch] = useState<any>(null);
  const [gameResult, setGameResult] = useState<GameResultType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && matchId) {
      loadMatch();
    }
  }, [user, matchId]);

  const loadMatch = async () => {
    try {
      const response = await fetch(`/api/match?matchId=${matchId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Laden des Matches');
      }
      
      setMatch(data.match);
      setGameResult(data.result);
      
      // Check if user is part of this match
      const isPlayerA = user?.email === data.match.player_a_email;
      const isPlayerB = user?.email === data.match.player_b_email;
      
      if (!isPlayerA && !isPlayerB) {
        setError('Du bist nicht Teil dieses Matches');
        return;
      }
      
      // If match is not finished, redirect to challenge page
      if (data.match.status !== 'finished') {
        if (isPlayerB && !data.match.player_b_moves) {
          // Player B needs to set their moves
          console.log('Player B needs to set moves, redirecting to challenge page');
          router.replace(`/challenge?match=${matchId}`);
        } else {
          setError('Das Match ist noch nicht beendet');
        }
        return;
      }
      
      // Double check that we have a result for finished matches
      if (!data.result) {
        console.error('Match is finished but no result found');
        setError('Spielergebnis konnte nicht geladen werden');
        return;
      }
      
    } catch (err) {
      console.error('Error loading match:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Laden des Matches');
    } finally {
      setIsLoading(false);
    }
  };

  const getAvatarEmoji = (avatar: string): string => {
    const avatarMap: { [key: string]: string } = {
      'fire': '🔥', 'lightning': '⚡', 'star': '🌟', 'rocket': '🚀', 'crown': '👑',
      'target': '🎯', 'trophy': '🏆', 'soccer': '⚽', 'muscle': '💪', 'sunglasses': '😎',
      'heart': '❤️', 'diamond': '💎', 'rainbow': '🌈', 'ghost': '👻', 'alien': '👽',
      'robot': '🤖', 'unicorn': '🦄', 'dragon': '🐉', 'ninja': '🥷', 'wizard': '🧙',
      'player1': '⚽', 'player2': '⚽', 'player3': '⚽', 'player4': '⚽', 'player5': '⚽',
      'player6': '⚽', 'player7': '⚽', 'player8': '⚽'
    };
    return avatarMap[avatar] || '⚽';
  };

  if (loading || isLoading) {
    return (
      <Layout showHeader={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-xl">⚽ Lade Match...</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout showHeader={false}>
        <AuthPage />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout showHeader={true}>
        <div className="game-page">
          <TribuneFlashes />
          <div className="container section">
            <div className="max-w-4xl mx-auto">
              <div className="bg-grass-green-light bg-opacity-60 backdrop-blur-lg rounded-lg border-2 border-green-600 border-opacity-80 shadow-xl p-8 text-center">
                <div className="text-red-400 text-xl mb-4">{error}</div>
                <button
                  onClick={() => router.push('/garderobe')}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                >
                  Zurück zur Garderobe
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!match || !gameResult) {
    return (
      <Layout showHeader={true}>
        <div className="game-page">
          <TribuneFlashes />
          <div className="container section">
            <div className="max-w-4xl mx-auto">
              <div className="bg-grass-green-light bg-opacity-60 backdrop-blur-lg rounded-lg border-2 border-green-600 border-opacity-80 shadow-xl p-8 text-center">
                <div className="text-white text-xl">Match nicht gefunden</div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const playerRole = user.email === match.player_a_email ? 'player_a' : 'player_b';
  const isWinner = gameResult.winner === playerRole;
  const isDraw = gameResult.winner === 'draw';

  const playerAName = match.player_a_username || match.player_a_email || 'Spieler A';
  const playerBName = match.player_b_username || match.player_b_email || 'Spieler B';
  const yourName = playerRole === 'player_a' ? playerAName : playerBName;
  const opponentName = playerRole === 'player_a' ? playerBName : playerAName;

  return (
    <Layout showHeader={true}>
      <div className="game-page">
        <TribuneFlashes />
        <div className="container section">
          <div className="max-w-4xl mx-auto">
            
            {/* Match Result Header */}
            <div className="text-center mb-8">
              <p className="text-green-300 text-xl">
                Elfmeterschießen: <strong className="text-white">{yourName}</strong> vs <strong className="text-white">{opponentName}</strong>
              </p>
            </div>

            {/* Result Card */}
            <div className="mb-8">
              <div className="bg-grass-green-light bg-opacity-60 backdrop-blur-lg rounded-lg border-2 border-green-600 border-opacity-80 shadow-xl p-8">
                
                {/* Main Result */}
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4">
                    {isDraw ? '🤝' : isWinner ? '🏆' : '😞'}
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {isDraw ? 'Unentschieden!' : isWinner ? 'Du hast gewonnen!' : 'Niederlage'}
                  </h2>
                  <div className="text-4xl font-bold text-green-300 mb-4">
                    {gameResult.scoreA} : {gameResult.scoreB}
                  </div>
                  <p className="text-gray-300">
                    {isDraw ? 'Beide gleich stark!' : isWinner ? 'Glückwunsch zum Sieg!' : 'Nächstes Mal besser!'}
                  </p>
                </div>

                {/* Players */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-4xl mb-2">{getAvatarEmoji(match.player_a_avatar)}</div>
                    <div className="text-white font-bold">{playerAName}</div>
                    <div className="text-green-300">{gameResult.scoreA} Punkte</div>
                    <div className="text-sm text-gray-400">Schütze</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl mb-2">{getAvatarEmoji(match.player_b_avatar)}</div>
                    <div className="text-white font-bold">{playerBName}</div>
                    <div className="text-green-300">{gameResult.scoreB} Punkte</div>
                    <div className="text-sm text-gray-400">Keeper</div>
                  </div>
                </div>

                {/* Round by Round */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-white mb-4 text-center">Spielverlauf</h3>
                  <div className="space-y-2">
                    {gameResult.rounds.map((round, index) => (
                      <div key={index} className="flex items-center justify-between bg-black bg-opacity-20 rounded-lg p-3">
                        <div className="text-white">Schuss {index + 1}</div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-sm text-gray-400">Schuss</div>
                            <div className="text-white">{round.shooterMove}</div>
                          </div>
                          <div className="text-2xl">
                            {round.goal ? '⚽' : '🧤'}
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-400">Parade</div>
                            <div className="text-white">{round.keeperMove}</div>
                          </div>
                        </div>
                        <div className="text-green-300 font-bold">
                          {round.goal ? 'TOR!' : 'PARADE!'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => router.push('/garderobe')}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                  >
                    Zurück zur Garderobe
                  </button>
                  {/* TODO: Add Revanche button if needed */}
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}