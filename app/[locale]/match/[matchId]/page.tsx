'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import Layout from '@/components/Layout';
import AuthPage from '@/components/AuthPage';
import GameField from '@/components/GameField';
import GameResult from '@/components/GameResult';
import AnimatedGameReplay from '@/components/AnimatedGameReplay';
import { GameResult as GameResultType } from '@/lib/types';

function MatchPageContent() {
  const router = useRouter();
  const { matchId } = useParams();
  const { user, loading } = useAuth();
  const t = useTranslations('game');
  const [match, setMatch] = useState<any>(null);
  const [gameResult, setGameResult] = useState<GameResultType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    if (user && matchId) {
      loadMatch();
    }
  }, [user, matchId]);

  const loadMatch = useCallback(async () => {
    try {
      const response = await fetch(`/api/match?matchId=${matchId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || t('errors.matchLoadFailed'));
      }
      
      setMatch(data.match);
      setGameResult(data.result);
      
      // Check if user is part of this match
      const isPlayerA = user?.email === data.match.player_a_email;
      const isPlayerB = user?.email === data.match.player_b_email;
      
      if (!isPlayerA && !isPlayerB) {
        setError(t('match.notPartOfMatch'));
        return;
      }
      
      // If match is not finished, redirect to appropriate page
      if (data.match.status !== 'finished') {
        if (isPlayerB && !data.match.player_b_moves) {
          // Player B needs to set their moves
          router.replace(`/keeper?match=${matchId}`);
        } else {
          setError(t('match.notFinished'));
        }
        return;
      }
      
      // Double check that we have a result for finished matches
      if (!data.result) {
        console.error('Match is finished but no result found');
        setError(t('match.resultNotLoaded'));
        return;
      }
      
    } catch (err) {
      console.error('Error loading match:', err);
      setError(err instanceof Error ? err.message : t('errors.matchLoadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [matchId, user?.email, router]);

  const handleAnimationComplete = () => {
    setShowAnimation(false);
  };

  if (loading || isLoading) {
    return (
      <Layout showHeader={false}>
        <GameField mode="result">
          <div className="loading">⚽ {t('loading.match')}</div>
        </GameField>
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
      <Layout showHeader={false}>
        <GameField mode="result">
          <div className="error-container">
            <div className="error-message">{error}</div>
            <button
              onClick={() => router.push('/garderobe?refreshLeaderboard=true')}
              className="back-button"
            >
              {t('match.backToLocker')}
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
            <div className="error-message">{t('match.notFound')}</div>
          </div>
        </GameField>
      </Layout>
    );
  }

  return (
    <Layout showHeader={false}>
      <GameField mode="result">
        {showAnimation ? (
          <AnimatedGameReplay
            result={gameResult}
            playerRole={match?.player_a_email === user?.email ? 'player_a' : 'player_b'}
            playerAEmail={match?.player_a_email}
            playerBEmail={match?.player_b_email}
            playerAUsername={match?.player_a_username}
            playerBUsername={match?.player_b_username}
            playerAAvatar={match?.player_a_avatar}
            playerBAvatar={match?.player_b_avatar}
            onAnimationComplete={handleAnimationComplete}
          />
        ) : (
          <GameResult
            result={gameResult}
            playerRole={match?.player_a_email === user?.email ? 'player_a' : 'player_b'}
            playerAEmail={match?.player_a_email}
            playerBEmail={match?.player_b_email}
            playerAUsername={match?.player_a_username}
            playerBUsername={match?.player_b_username}
            playerAAvatar={match?.player_a_avatar}
            playerBAvatar={match?.player_b_avatar}
          />
        )}
      </GameField>

      <style jsx>{`
        .loading {
          grid-area: field;
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
          font-size: clamp(1.5rem, 4vw, 2rem);
          text-align: center;
        }

        .error-container {
          grid-area: field;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 2rem;
          text-align: center;
        }

        .error-message {
          color: #ef4444;
          font-size: clamp(1.2rem, 3vw, 1.5rem);
          margin-bottom: 2rem;
          background: rgba(0, 0, 0, 0.7);
          padding: 1.5rem;
          border-radius: 1rem;
          backdrop-filter: blur(10px);
        }

        .back-button {
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 1.1rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .back-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }
      `}</style>
    </Layout>
  );
}

export default function MatchPage() {
  return (
    <Suspense fallback={
      <Layout showHeader={false}>
        <GameField mode="result">
          <div className="loading">⚽ Loading Match...</div>
        </GameField>
      </Layout>
    }>
      <MatchPageContent />
    </Suspense>
  );
}