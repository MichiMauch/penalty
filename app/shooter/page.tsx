'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import GameField from '@/components/GameField';
import GameControls from '@/components/GameControls';
import { ShotDirection } from '@/lib/types';
import { nanoid } from '@/lib/utils';

function ShooterPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [shots, setShots] = useState<ShotDirection[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [opponent, setOpponent] = useState<any>(null);
  const [match, setMatch] = useState<any>(null);
  const [showPulse, setShowPulse] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentShotDirection, setCurrentShotDirection] = useState<ShotDirection>('mitte');

  // Hide pulse after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Check if moves already submitted on page load
  useEffect(() => {
    const checkSubmittedStatus = async () => {
      const matchId = searchParams.get('match');
      if (!matchId) return;

      // Check localStorage first for quick redirect
      const isSubmitted = localStorage.getItem(`match_${matchId}_shooter_submitted`);
      if (isSubmitted === 'true') {
        router.push(`/game/${matchId}`);
        return;
      }

      // Also check server to be sure
      try {
        const response = await fetch(`/api/match?matchId=${matchId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.match && data.match.player_a_moves) {
            // Moves already submitted, redirect to result
            localStorage.setItem(`match_${matchId}_shooter_submitted`, 'true');
            router.push(`/game/${matchId}`);
          }
        }
      } catch (error) {
        console.error('Error checking match status:', error);
      }
    };

    checkSubmittedStatus();
  }, [searchParams, router]);

  // Load match info and opponent info from URL params
  useEffect(() => {
    const matchId = searchParams.get('match');
    const opponentId = searchParams.get('opponent');
    const opponentName = searchParams.get('name');
    const opponentEmail = searchParams.get('email');
    const opponentPoints = searchParams.get('points');
    
    if (matchId) {
      // This is a revenge match - load match details
      loadMatch(matchId);
    } else if (opponentId && opponentName) {
      // This is a new challenge - use URL params
      setOpponent({
        id: opponentId,
        username: opponentName,
        email: opponentEmail,
        totalPoints: parseInt(opponentPoints || '0')
      });
    }
  }, [searchParams]);

  const loadMatch = async (matchId: string) => {
    try {
      const response = await fetch(`/api/match?matchId=${matchId}`);
      const data = await response.json();
      
      if (response.ok) {
        setMatch(data.match);
        
        // Determine opponent based on user role in match
        const isPlayerA = user?.email === data.match.player_a_email;
        let opponentInfo;
        
        if (isPlayerA) {
          // User is player_a, opponent is player_b
          opponentInfo = {
            email: data.match.player_b_email,
            username: data.match.player_b_username || data.match.player_b_email || 'Gegner',
            totalPoints: 0 // Could be loaded from user search if needed
          };
        } else {
          // User is player_b, opponent is player_a
          opponentInfo = {
            email: data.match.player_a_email,
            username: data.match.player_a_username || data.match.player_a_email || 'Gegner',
            totalPoints: 0
          };
        }
        
        setOpponent(opponentInfo);
      } else {
        console.error('Error loading match:', data.error);
      }
    } catch (error) {
      console.error('Error loading match:', error);
    }
  };

  const handleShot = (direction: ShotDirection) => {
    if (shots.length < 5 && !isAnimating) {
      // Start animation
      setCurrentShotDirection(direction);
      setIsAnimating(true);
      
      // Add shot after animation completes
      setTimeout(() => {
        setShots(prev => [...prev, direction]);
        setIsAnimating(false);
      }, 800); // Animation duration
    }
  };

  const handleSubmit = async () => {
    if (shots.length !== 5 || !user || !opponent) return;

    setIsSubmitting(true);
    try {
      const existingMatchId = searchParams.get('match');
      
      if (existingMatchId) {
        // This is a revenge match - submit moves to existing match
        // Determine correct player ID from match data
        const isPlayerA = user.email === match?.player_a_email;
        const playerId = isPlayerA ? match?.player_a : match?.player_b;
        
        console.log('Revenge match submit:', {
          matchId: existingMatchId,
          userEmail: user.email,
          isPlayerA,
          playerId,
          matchPlayerA: match?.player_a,
          matchPlayerB: match?.player_b
        });
        
        if (!playerId) {
          throw new Error('Kann Player-ID für diesen Match nicht bestimmen');
        }
        
        const response = await fetch('/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'submit-moves',
            matchId: existingMatchId,
            playerId: playerId,
            moves: { moves: shots, role: 'shooter' }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        // Mark as submitted in localStorage
        localStorage.setItem(`match_${existingMatchId}_shooter_submitted`, 'true');

        // Redirect to waiting page or result
        const responseData = await response.json();
        if (responseData.status === 'finished') {
          router.push(`/game/${existingMatchId}?animate=true`);
        } else {
          router.push('/garderobe?success=moves-submitted');
        }
      } else {
        // Create new match (original flow)
        const playerId = nanoid();
        const response = await fetch('/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            playerId,
            email: user.email,
            username: user.username,
            avatar: user.avatar,
            moves: shots
          })
        });

        if (!response.ok) throw new Error('Fehler beim Erstellen des Matches');

        const { matchId } = await response.json();
        
        // Mark as submitted in localStorage
        localStorage.setItem(`match_${matchId}_shooter_submitted`, 'true');

        // Invite opponent
        const inviteResponse = await fetch('/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'invite-player',
            matchId,
            email: opponent.email
          })
        });

        if (!inviteResponse.ok) throw new Error('Fehler beim Einladen');

        // Redirect to success page or back to garderobe
        router.push('/garderobe?success=challenge-sent');
      }
      
    } catch (error) {
      console.error('Fehler:', error);
      alert('Fehler beim Senden der Herausforderung');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = shots.length === 5 && !isSubmitting && opponent;

  return (
    <Layout showHeader={false}>
      <GameField mode="shooter">
        {/* Header Info */}
        <div className="game-header">
          {opponent && (
            <div className="opponent-info">
              <h1 className="challenge-title">⚽ Du forderst heraus</h1>
              <div className="opponent-details">
                <span className="opponent-name">{opponent.username}</span>
                <span className="opponent-points">({opponent.totalPoints || 0} Punkte)</span>
              </div>
              <p className="challenge-subtitle">
                Schieße all deine Bälle ins Tor um das Penalty schiessen zu gewinnen.
              </p>
            </div>
          )}
        </div>

        {/* Game Area */}
        <div className="game-area">
          <div className="field-container">
            {/* Ball */}
            <div 
              className={`ball ${isAnimating ? 'ball-animate' : ''}`}
              style={{
                '--target-left': currentShotDirection === 'links' ? '38%' : 
                                currentShotDirection === 'rechts' ? '62%' : '50%'
              } as React.CSSProperties}
            >⚽</div>
            
            {/* Shots Display */}
            {shots.length > 0 && (
              <div className="shots-display">
                {shots.map((shot, index) => (
                  <div key={index} className="shot-indicator">
                    {shot === 'links' ? '⬅️' : shot === 'rechts' ? '➡️' : '🎯'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <GameControls
          onShot={handleShot}
          onSubmit={handleSubmit}
          disabled={false}
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
          shotsCount={shots.length}
          maxShots={5}
          mode="shooter"
          showPulse={showPulse}
        />
      </GameField>

      <style jsx>{`
        .game-header {
          grid-area: header;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2vh 0;
          z-index: 20;
        }

        .opponent-info {
          text-align: center;
          background: rgba(0, 0, 0, 0.7);
          padding: 2vh 3vw;
          border-radius: 1rem;
          backdrop-filter: blur(10px);
        }

        .challenge-title {
          color: #10b981;
          font-size: clamp(1.5rem, 4vw, 2rem);
          font-weight: bold;
          margin-bottom: 1vh;
        }

        .opponent-details {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1vh;
        }

        .opponent-name {
          color: white;
          font-size: clamp(1.2rem, 3vw, 1.5rem);
          font-weight: bold;
        }

        .opponent-points {
          color: #fbbf24;
          font-size: clamp(1rem, 2.5vw, 1.25rem);
        }

        .challenge-subtitle {
          color: #fbbf24;
          font-size: clamp(0.9rem, 2vw, 1.1rem);
          margin: 0;
        }

        .game-area {
          grid-area: field;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
        }

        .field-container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .ball {
          position: fixed;
          bottom: 20vh;
          left: 50%;
          transform: translateX(-50%);
          font-size: clamp(2rem, 6vw, 3rem);
          z-index: 10;
          filter: drop-shadow(3px 3px 6px rgba(0,0,0,0.5));
          transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .ball-animate {
          animation: ballShot 0.6s ease-out forwards;
        }

        @keyframes ballShot {
          0% {
            transform: translateX(-50%) scale(1) rotate(0deg);
            bottom: 20vh;
            left: 50%;
          }
          100% {
            transform: translateX(-50%) scale(0.7) rotate(360deg);
            bottom: 50vh;
            left: var(--target-left);
          }
        }

        .shots-display {
          position: fixed;
          top: 30vh;
          right: 25vw;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          background: rgba(0, 0, 0, 0.8);
          padding: 1rem;
          border-radius: 1rem;
          backdrop-filter: blur(10px);
          border: 2px solid rgba(16, 185, 129, 0.6);
        }

        .shot-indicator {
          font-size: 1.5rem;
          opacity: 0.8;
        }

        @media (max-width: 768px) {
          .opponent-info {
            padding: 1.5vh 4vw;
          }
          
          .opponent-details {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </Layout>
  );
}

export default function ShooterPage() {
  return (
    <Suspense fallback={
      <Layout showHeader={false}>
        <GameField mode="shooter">
          <div className="loading">⚽ Lade Shooter-Modus...</div>
        </GameField>
      </Layout>
    }>
      <ShooterPageContent />
    </Suspense>
  );
}