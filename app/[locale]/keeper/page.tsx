'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import GameField from '@/components/GameField';
import GameControls from '@/components/GameControls';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ShotDirection } from '@/lib/types';

function KeeperPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [saves, setSaves] = useState<ShotDirection[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [match, setMatch] = useState<any>(null);
  const [opponent, setOpponent] = useState<any>(null);
  const [showPulse, setShowPulse] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentSaveDirection, setCurrentSaveDirection] = useState<ShotDirection>('mitte');
  const [showSubmitModal, setShowSubmitModal] = useState(false);

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
      const isSubmitted = localStorage.getItem(`match_${matchId}_keeper_submitted`);
      if (isSubmitted === 'true') {
        router.push(`/game/${matchId}`);
        return;
      }

      // Also check server to be sure
      try {
        const response = await fetch(`/api/match?matchId=${matchId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.match && data.match.player_b_moves) {
            // Moves already submitted, redirect to result
            localStorage.setItem(`match_${matchId}_keeper_submitted`, 'true');
            router.push(`/game/${matchId}`);
          }
        }
      } catch (error) {
        console.error('Error checking match status:', error);
      }
    };

    checkSubmittedStatus();
  }, [searchParams, router]);

  // Load match info from URL params
  useEffect(() => {
    const matchId = searchParams.get('match');
    
    if (matchId) {
      loadMatch(matchId);
    }
  }, [searchParams]);

  const loadMatch = async (matchId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/match?matchId=${matchId}`);
      const data = await response.json();
      
      if (response.ok) {
        setMatch(data.match);
        
        // Determine opponent (the one who challenged - player A)
        const opponentEmail = data.match.player_a_email;
        const opponentUsername = data.match.player_a_username || data.match.player_a_email || 'Gegner';
        
        // Try to load opponent's points from user search
        try {
          const userResponse = await fetch(`/api/users/search?q=${encodeURIComponent(opponentEmail)}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            const foundUser = userData.users?.find((u: any) => u.email === opponentEmail);
            
            setOpponent({
              username: opponentUsername,
              email: opponentEmail,
              totalPoints: foundUser?.totalPoints || 0
            });
          } else {
            setOpponent({
              username: opponentUsername,
              email: opponentEmail,
              totalPoints: 0
            });
          }
        } catch (err) {
          console.error('Error loading opponent points:', err);
          setOpponent({
            username: opponentUsername,
            email: opponentEmail,
            totalPoints: 0
          });
        }
      }
    } catch (error) {
      console.error('Error loading match:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = (direction: ShotDirection) => {
    if (saves.length < 5 && !isAnimating) {
      // Start animation
      setCurrentSaveDirection(direction);
      setIsAnimating(true);
      
      // Add save after animation completes
      setTimeout(() => {
        setSaves(prev => [...prev, direction]);
        setIsAnimating(false);
      }, 800); // Animation duration
    }
  };

  const handleSubmit = async () => {
    if (saves.length !== 5 || !user || !match) {
      console.log('Submit validation failed:', { saves: saves.length, user: !!user, match: !!match });
      return;
    }

    // Show loading modal
    setShowSubmitModal(true);
    setIsSubmitting(true);
    
    try {
      console.log('Match data:', {
        matchId: match.id,
        player_a_email: match.player_a_email,
        player_b_email: match.player_b_email,
        player_a: match.player_a,
        player_b: match.player_b,
        userEmail: user.email,
        userEmailType: typeof user.email
      });

      // Debug the exact values
      console.log('Email comparison debug:', {
        userEmail: `"${user.email}"`,
        playerAEmail: `"${match.player_a_email}"`,
        playerBEmail: `"${match.player_b_email}"`,
        userEmailLength: user.email?.length,
        playerBEmailLength: match.player_b_email?.length,
        directComparison: match.player_b_email === user.email,
        stringComparison: String(match.player_b_email) === String(user.email)
      });

      // Determine the correct player ID from the match
      const isPlayerA = match.player_a_email === user.email;
      const isPlayerB = match.player_b_email === user.email;
      
      console.log('Player matching:', {
        isPlayerA,
        isPlayerB,
        playerBId: match.player_b,
        hasPlayerB: !!match.player_b
      });
      
      // Determine player ID - for revenge matches, both players are already set
      // For regular challenges, player_b might be null and needs to join first
      let playerId = match.player_b;
      
      if (!playerId) {
        console.log('Player B is null, need to join match first (regular challenge)');
        
        // First join the match as player B (only for regular challenges)
        const joinResponse = await fetch('/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'join',
            matchId: match.id,
            playerId: user.id,
            email: user.email,
            username: user.username,
            avatar: user.avatar
          })
        });
        
        if (!joinResponse.ok) {
          const joinError = await joinResponse.text();
          throw new Error(`Fehler beim Beitreten: ${joinError}`);
        }
        
        const joinData = await joinResponse.json();
        playerId = joinData.playerId;
        console.log('Joined match as Player B:', playerId);
      } else {
        console.log('Player B already set (revenge match):', playerId);
      }
      
      if (!playerId) {
        throw new Error(`Kein Spieler gefunden in diesem Match. Match data: ${JSON.stringify(match)}`);
      }
      
      console.log('Using player ID:', playerId);

      console.log('Using playerId:', playerId);

      // Submit saves
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit-moves',
          matchId: match.id,
          playerId: playerId,
          moves: { moves: saves, role: 'keeper' }
        })
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();
      console.log('Success response:', responseData);

      // Mark as submitted in localStorage
      localStorage.setItem(`match_${match.id}_keeper_submitted`, 'true');

      // Wait a bit to show success message
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check response status to determine redirect
      if (responseData.status === 'finished') {
        // Game is finished, redirect to result page
        const redirectUrl = `/game/${match.id}?animate=true`;
        console.log('Game finished, redirecting to result page:', redirectUrl);
        
        try {
          await router.push(redirectUrl);
          console.log('Router.push completed');
        } catch (redirectError) {
          console.error('Router.push failed:', redirectError);
          // Fallback: use window.location
          window.location.href = redirectUrl;
        }
      } else {
        // Game still waiting, redirect to garderobe
        console.log('Game still waiting, redirecting to garderobe');
        router.push('/garderobe?success=moves-submitted&refreshLeaderboard=true');
      }
      
    } catch (error) {
      console.error('Submit error:', error);
      setShowSubmitModal(false);
      setIsSubmitting(false);
      alert('Fehler beim Senden der Paraden: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };

  const canSubmit = saves.length === 5 && !isSubmitting && match;

  // Show initial loading spinner
  if (isLoading) {
    return <LoadingSpinner text="Lade Abwehr..." />;
  }

  // Show submit loading spinner
  if (isSubmitting) {
    return <LoadingSpinner text="Sende Paraden..." />;
  }

  return (
    <Layout showHeader={false}>
      <GameField mode="keeper">
        {/* Header Info */}
        <div className="game-header">
          {opponent && (
            <div className="opponent-info">
              <h1 className="challenge-title">🧤 Du wurdest herausgefordert</h1>
              <div className="opponent-details">
                <span className="opponent-name">{opponent.username}</span>
                <span className="opponent-points">({opponent.totalPoints || 0} Punkte)</span>
              </div>
              <p className="challenge-subtitle">
                Wehre all seine Schüsse ab um das Penalty schießen zu gewinnen.
              </p>
            </div>
          )}
        </div>

        {/* Game Area */}
        <div className="game-area">
          <div className="field-container">
            {/* Keeper Gloves */}
            <div 
              className={`keeper ${isAnimating ? (currentSaveDirection === 'mitte' ? 'keeper-animate-center' : 'keeper-animate') : ''}`}
              style={{
                '--target-left': currentSaveDirection === 'links' ? '30%' : 
                                currentSaveDirection === 'rechts' ? '70%' : '50%',
                '--target-left-notebook': currentSaveDirection === 'links' ? '35%' : 
                                         currentSaveDirection === 'rechts' ? '65%' : '50%',
                '--target-left-mobile': currentSaveDirection === 'links' ? '20%' : 
                                        currentSaveDirection === 'rechts' ? '80%' : '50%',
                '--keeper-rotation': currentSaveDirection === 'links' ? '-40deg' : 
                                   currentSaveDirection === 'rechts' ? '40deg' : '0deg'
              } as React.CSSProperties}
            >
              <img src="/gloves.png" alt="Keeper Gloves" className="keeper-gloves" />
            </div>
            
            {/* Saves Display */}
            {saves.length > 0 && (
              <div className="saves-display">
                {saves.map((save, index) => (
                  <div key={index} className="save-indicator">
                    {save === 'links' ? '⬅️' : save === 'rechts' ? '➡️' : '🎯'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <GameControls
          onShot={handleSave}
          onSubmit={handleSubmit}
          disabled={false}
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
          shotsCount={saves.length}
          maxShots={5}
          mode="keeper"
          showPulse={showPulse}
        />

        {/* Submit Loading Modal */}
        {showSubmitModal && (
          <div className="submit-modal-overlay">
            <div className="submit-modal">
              <div className="modal-content">
                <div className="modal-icon">🧤</div>
                <h2 className="modal-title">
                  {isSubmitting ? 'Paraden werden übertragen...' : 'Erfolgreich gespeichert!'}
                </h2>
                <p className="modal-subtitle">
                  {isSubmitting ? 'Einen Moment bitte' : 'Zum Spielergebnis...'}
                </p>
                <div className="modal-spinner">
                  {isSubmitting && <div className="spinner"></div>}
                  {!isSubmitting && <div className="checkmark">✅</div>}
                </div>
              </div>
            </div>
          </div>
        )}
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

        .keeper {
          position: fixed;
          bottom: clamp(48vh, 53vh, 58vh);
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          filter: drop-shadow(3px 3px 6px rgba(0,0,0,0.5));
          transition: all 0.8s ease-out;
        }

        .keeper-animate {
          animation: keeperSave 0.8s ease-out forwards;
        }

        .keeper-animate-center {
          animation: keeperSaveCenter 0.8s ease-out forwards;
        }

        @keyframes keeperSave {
          0% {
            transform: translateX(-50%) rotate(0deg);
            bottom: clamp(48vh, 53vh, 58vh);
            left: 50%;
          }
          100% {
            transform: translateX(-50%) rotate(var(--keeper-rotation));
            bottom: clamp(48vh, 53vh, 58vh);
            left: var(--target-left);
          }
        }

        @keyframes keeperSaveCenter {
          0% {
            transform: translateX(-50%) rotate(0deg);
            bottom: clamp(48vh, 53vh, 58vh);
            left: 50%;
          }
          50% {
            transform: translateX(-50%) rotate(0deg);
            bottom: clamp(53vh, 58vh, 63vh);
            left: 50%;
          }
          100% {
            transform: translateX(-50%) rotate(0deg);
            bottom: clamp(48vh, 53vh, 58vh);
            left: 50%;
          }
        }

        .keeper-gloves {
          width: clamp(2.8rem, 7vw, 3.5rem);
          height: clamp(2.8rem, 7vw, 3.5rem);
          object-fit: contain;
        }

        /* Notebook adjustments - moderate positions */
        @media (min-width: 769px) and (max-width: 1600px) {
          .keeper {
            bottom: clamp(48vh, 53vh, 58vh);
          }

          .keeper-gloves {
            width: clamp(2.8rem, 7vw, 3.5rem);
            height: clamp(2.8rem, 7vw, 3.5rem);
          }

          @keyframes keeperSave {
            0% {
              transform: translateX(-50%) rotate(0deg);
              bottom: clamp(48vh, 53vh, 58vh);
              left: 50%;
            }
            100% {
              transform: translateX(-50%) rotate(var(--keeper-rotation));
              bottom: clamp(48vh, 53vh, 58vh);
              left: var(--target-left-notebook);
            }
          }
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          .keeper {
            bottom: clamp(32vh, 37vh, 42vh);
          }

          .keeper-gloves {
            width: clamp(2.5rem, 6vw, 3rem);
            height: clamp(2.5rem, 6vw, 3rem);
          }

          @keyframes keeperSave {
            0% {
              transform: translateX(-50%) rotate(0deg);
              bottom: clamp(32vh, 37vh, 42vh);
              left: 50%;
            }
            100% {
              transform: translateX(-50%) rotate(var(--keeper-rotation));
              bottom: clamp(32vh, 37vh, 42vh);
              left: var(--target-left-mobile, var(--target-left));
            }
          }

          @keyframes keeperSaveCenter {
            0% {
              transform: translateX(-50%) rotate(0deg);
              bottom: clamp(32vh, 37vh, 42vh);
              left: 50%;
            }
            50% {
              transform: translateX(-50%) rotate(0deg);
              bottom: clamp(37vh, 42vh, 47vh);
              left: 50%;
            }
            100% {
              transform: translateX(-50%) rotate(0deg);
              bottom: clamp(32vh, 37vh, 42vh);
              left: 50%;
            }
          }
        }

        .saves-display {
          position: fixed;
          top: 30vh;
          right: 20vw;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          background: rgba(0, 0, 0, 0.8);
          padding: 1rem;
          border-radius: 1rem;
          backdrop-filter: blur(10px);
          border: 2px solid rgba(16, 185, 129, 0.6);
        }

        .save-indicator {
          font-size: 1.5rem;
          opacity: 0.8;
        }

        /* Mobile positioning for saves display */
        @media (max-width: 768px) {
          .saves-display {
            top: 33vh;
            left: 50%;
            right: auto;
            transform: translateX(-50%);
            flex-direction: row;
            padding: 0.5rem 1rem;
            gap: 0.8rem;
            background: rgba(0, 0, 0, 0.9);
          }

          .save-indicator {
            font-size: 1.2rem;
          }
        }

        /* Submit Modal Styles */
        .submit-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(5px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 50;
        }

        .submit-modal {
          background: rgba(0, 0, 0, 0.9);
          border: 2px solid #10b981;
          border-radius: 1.5rem;
          padding: 2rem;
          backdrop-filter: blur(10px);
          max-width: 400px;
          width: 90%;
          animation: modalSlideIn 0.3s ease-out;
        }

        .modal-content {
          text-align: center;
        }

        .modal-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .modal-title {
          color: #10b981;
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }

        .modal-subtitle {
          color: #fbbf24;
          font-size: 1rem;
          margin-bottom: 1.5rem;
        }

        .modal-spinner {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 3rem;
        }

        .spinner {
          width: 2rem;
          height: 2rem;
          border: 3px solid #10b981;
          border-top: 3px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .checkmark {
          font-size: 2rem;
          animation: checkmarkPop 0.5s ease-out;
        }

        @keyframes modalSlideIn {
          0% {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes checkmarkPop {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </Layout>
  );
}

export default function KeeperPage() {
  return (
    <Suspense fallback={
      <Layout showHeader={false}>
        <GameField mode="keeper">
          <div className="loading">🧤 Lade Keeper-Modus...</div>
        </GameField>
      </Layout>
    }>
      <KeeperPageContent />
    </Suspense>
  );
}