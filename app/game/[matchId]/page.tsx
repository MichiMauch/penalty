'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import AuthPage from '@/components/AuthPage';
import GameField from '@/components/GameField';
import GameResult from '@/components/GameResult';
import { GameResult as GameResultType } from '@/lib/types';

export default function GamePage() {
  const router = useRouter();
  const { matchId } = useParams();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [match, setMatch] = useState<any>(null);
  const [gameResult, setGameResult] = useState<GameResultType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    if (user && matchId) {
      loadMatch();
      // Mark this match as viewed when opening the game result page
      markMatchAsViewed();
    }
  }, [user, matchId]);

  const markMatchAsViewed = () => {
    if (typeof window !== 'undefined' && matchId) {
      const stored = localStorage.getItem('viewedFinishedMatches');
      const viewedMatches = stored ? JSON.parse(stored) : [];
      
      if (!viewedMatches.includes(matchId)) {
        viewedMatches.push(matchId);
        localStorage.setItem('viewedFinishedMatches', JSON.stringify(viewedMatches));
      }
    }
  };

  useEffect(() => {
    // Check if animation should be shown (default true, can be disabled with animate=false)
    const animate = searchParams.get('animate');
    if (animate === 'false') {
      setShowAnimation(false);
    }
  }, [searchParams]);

  const loadMatch = async () => {
    try {
      const response = await fetch(`/api/match?matchId=${matchId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Laden des Matches');
      }
      
      setMatch(data.match);
      setGameResult(data.result);
      
      // Check if user is part of this match - using same logic as keeper page
      let isPlayerA = user?.email === data.match.player_a_email;
      let isPlayerB = user?.email === data.match.player_b_email;
      
      // Fallback matching for email issues
      if (!isPlayerA && !isPlayerB) {
        if (user?.email?.includes('michi@mauch.ai') && data.match.player_b_email?.includes('michi@mauch.ai')) {
          isPlayerB = true;
          console.log('Matched user as Player B via email content');
        }
      }
      
      if (!isPlayerA && !isPlayerB) {
        setError('Du bist nicht Teil dieses Matches');
        return;
      }
      
      // If match is not finished, debug what's actually in the database
      if (data.match.status !== 'finished') {
        console.log('FULL MATCH DEBUG:', {
          status: data.match.status,
          player_a: data.match.player_a,
          player_b: data.match.player_b,
          player_a_moves: data.match.player_a_moves,
          player_b_moves: data.match.player_b_moves,
          player_a_moves_type: typeof data.match.player_a_moves,
          player_b_moves_type: typeof data.match.player_b_moves,
          isPlayerA,
          isPlayerB,
          fullMatch: data.match
        });
        
        // Since moves should always exist, just show a waiting/processing message
        setError(`Das Spiel wird verarbeitet... Status: ${data.match.status}`);
        
        // Try to reload every 3 seconds to see if it becomes finished
        setTimeout(() => {
          console.log('Reloading match data...');
          loadMatch();
        }, 3000);
        
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
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          background: '#0a0a0a',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 999999,
          margin: 0,
          padding: 0
        }}
      >
        <div 
          style={{
            color: 'white',
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            textAlign: 'center' as const,
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '2rem 3rem',
            borderRadius: '1rem',
            border: '2px solid #10b981',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)',
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            gap: '1.5rem'
          }}
        >
          <div 
            style={{
              fontSize: '3rem',
              animation: 'spin 1s linear infinite'
            }}
          >
            ⚽
          </div>
          <div>Lade Match...</div>
        </div>
      </div>
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
      <Layout showHeader={false}>
        <GameField mode="result">
          <div className="error-container">
            <div className="error-message">{error}</div>
            <button
              onClick={() => router.push('/garderobe')}
              className="error-button"
            >
              Zurück zur Garderobe
            </button>
          </div>
        </GameField>
      </Layout>
    );
  }

  if (!match || !gameResult) {
    return (
      <Layout showHeader={false}>
        <GameField mode="result">
          <div className="error-container">
            <div className="error-message">Match nicht gefunden</div>
          </div>
        </GameField>
      </Layout>
    );
  }

  const playerRole = user.email === match.player_a_email ? 'player_a' : 'player_b';

  return (
    <Layout showHeader={false}>
      <GameField mode="result">
        {/* Game Result Component with Animation */}
        <GameResult
          result={gameResult}
          playerRole={playerRole}
          playerAEmail={match.player_a_email}
          playerBEmail={match.player_b_email}
          playerAUsername={match.player_a_username}
          playerBUsername={match.player_b_username}
          playerAAvatar={match.player_a_avatar}
          playerBAvatar={match.player_b_avatar}
        />
      </GameField>

      <style jsx global>{`
        html {
          overflow: hidden !important;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        
        html::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        
        body {
          overflow: hidden !important;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        body::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        
        * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        
        *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-container {
          grid-area: field;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 2rem;
          text-align: center;
        }

        .error-message {
          color: #ef4444;
          font-size: clamp(1.2rem, 3vw, 1.5rem);
          background: rgba(0, 0, 0, 0.7);
          padding: 1.5rem 2rem;
          border-radius: 1rem;
          backdrop-filter: blur(10px);
          border: 2px solid #ef4444;
        }

        .error-button {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 0.75rem;
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .error-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }

        /* GameResult Header Styles */
        .game-result-container {
          grid-area: field;
          display: flex;
          flex-direction: column;
          padding: 2rem;
          gap: 2rem;
          overflow-y: auto;
          max-height: 100%;
        }

        .game-header {
          position: fixed;
          top: 10vh;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 20;
          width: 90%;
          max-width: 600px;
        }

        .pre-result-header,
        .final-result-header {
          text-align: center;
          background: rgba(0, 0, 0, 0.7);
          padding: 2vh 3vw;
          border-radius: 1rem;
          backdrop-filter: blur(10px);
        }

        .result-title {
          color: #10b981;
          font-size: clamp(1.5rem, 4vw, 2rem);
          font-weight: bold;
          margin-bottom: 1vh;
        }

        .result-subtitle {
          color: #fbbf24;
          font-size: clamp(0.9rem, 2vw, 1.1rem);
          margin: 0 0 1.5rem 0;
        }

        .skip-button {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          border: none;
          border-radius: 0.75rem;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }

        .skip-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
        }
      `}</style>
    </Layout>
  );
}