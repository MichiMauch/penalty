'use client';

import { useState, useEffect } from 'react';
import GameField from './GameField';
import { ShotDirection, SaveDirection } from '@/lib/types';

interface CombinedPenaltyAnimationProps {
  shotDirection: ShotDirection;
  saveDirection: SaveDirection;
  isAnimating: boolean;
  onAnimationComplete?: () => void;
  playerRole?: 'shooter' | 'keeper'; // Rolle des aktuellen Spielers
}

export default function CombinedPenaltyAnimation({ 
  shotDirection, 
  saveDirection, 
  isAnimating, 
  onAnimationComplete,
  playerRole = 'shooter'
}: CombinedPenaltyAnimationProps) {
  // Ball state - moved much higher up (penalty spot)
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 });
  const [showBall, setShowBall] = useState(true);
  const [isBallResetting, setIsBallResetting] = useState(false);
  
  // Keeper state - moved much higher up (goal line) 
  const [keeperPosition, setKeeperPosition] = useState({ x: 50, y: 15 });
  const [showKeeper, setShowKeeper] = useState(true);
  const [isKeeperResetting, setIsKeeperResetting] = useState(false);
  const [isKeeperAnimating, setIsKeeperAnimating] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (isAnimating) {
      // Reset for new animation
      setShowBall(true);
      setShowKeeper(true);
      setIsBallResetting(false);
      setIsKeeperResetting(false);
      setIsKeeperAnimating(false);
      setShowResult(false);
      setBallPosition({ x: 50, y: 50 }); // Ball start position - penalty spot
      setKeeperPosition({ x: 50, y: 50 }); // Keeper start position - same as keeper page
      
      // Set target positions - more extreme for better corner coverage
      let ballTargetX = 50;
      switch (shotDirection) {
        case 'links':
          ballTargetX = 25; // More extreme to reach corner
          break;
        case 'rechts':
          ballTargetX = 75; // More extreme to reach corner
          break;
        case 'mitte':
          ballTargetX = 50; // Center unchanged
          break;
      }
      setBallPosition({ x: ballTargetX, y: 50 }); // Set target immediately
      
      // Keeper animation starts immediately with ball
      setIsKeeperAnimating(true);
      let keeperTargetX = 50;
      switch (saveDirection) {
        case 'links':
          keeperTargetX = 25; // More extreme to match ball positions
          break;
        case 'rechts':
          keeperTargetX = 75; // More extreme to match ball positions
          break;
        case 'mitte':
          keeperTargetX = 50; // Center unchanged
          break;
      }
      setKeeperPosition({ x: keeperTargetX, y: 50 }); // Keep keeper at same level

      // Show result and handle ball visibility
      const resultTimer = setTimeout(() => {
        const isGoal = shotDirection !== saveDirection;
        
        // Always show result message - TOR or PARADE
        setShowResult(true);
        
        if (!isGoal) {
          // Ball was saved - hide it
          setShowBall(false);
        }
      }, 1200);

      // Reset positions back to center smoothly
      const resetTimer = setTimeout(() => {
        setShowResult(false); // Hide TOR message first
        
        // Set resetting flags to enable smooth transitions
        setIsBallResetting(true);
        setIsKeeperResetting(true);
        setIsKeeperAnimating(false);
        
        // Smoothly move back to start positions with CSS transitions
        setBallPosition({ x: 50, y: 50 }); // Ball back to penalty spot
        setKeeperPosition({ x: 50, y: 50 }); // Keeper back to center
        setShowBall(true); // Show ball again if it was hidden
      }, 1800);

      // Animation complete - wait for smooth reset to finish
      const completeTimer = setTimeout(() => {
        // Clear reset flags for next animation
        setIsBallResetting(false);
        setIsKeeperResetting(false);
        onAnimationComplete?.();
      }, 2600);

      return () => {
        clearTimeout(resultTimer);
        clearTimeout(resetTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [isAnimating, shotDirection, saveDirection, onAnimationComplete]);

  return (
    <GameField mode="result">
      {/* Animation Info Header */}
      <div className="game-header">
        <div className="animation-info">
          <h1 className="animation-title">
            {shotDirection !== saveDirection ? '⚽ TOR!' : '🧤 PARADE!'}
          </h1>
        </div>
      </div>

      {/* Game Area */}
      <div className="game-area">
        <div className="field-container">
          {/* Keeper */}
          {showKeeper && (
            <div 
              className={`keeper ${isKeeperAnimating && !isKeeperResetting ? 'keeper-animate' : ''} ${isKeeperResetting ? 'fade-in' : ''}`}
              style={{
                '--target-left': saveDirection === 'links' ? '30%' : 
                                saveDirection === 'rechts' ? '70%' : '50%',
                '--target-left-notebook': saveDirection === 'links' ? '35%' : 
                                         saveDirection === 'rechts' ? '65%' : '50%',
                '--target-left-mobile': saveDirection === 'links' ? '20%' : 
                                        saveDirection === 'rechts' ? '80%' : '50%',
                '--keeper-rotation': saveDirection === 'links' ? '-40deg' : 
                                   saveDirection === 'rechts' ? '40deg' : '0deg'
              } as React.CSSProperties}
            >
              <img src="/gloves.png" alt="Keeper Gloves" className="keeper-gloves" />
            </div>
          )}
          
          {/* Ball */}
          {showBall && (
            <div 
              className={`ball ${isAnimating && !isBallResetting ? 'ball-animate' : ''} ${isBallResetting ? 'fade-in' : ''}`}
              style={{
                '--target-left': shotDirection === 'links' ? '30%' : 
                                shotDirection === 'rechts' ? '70%' : '50%',
                '--target-left-notebook': shotDirection === 'links' ? '35%' : 
                                         shotDirection === 'rechts' ? '65%' : '50%',
                '--target-left-mobile': shotDirection === 'links' ? '20%' : 
                                        shotDirection === 'rechts' ? '80%' : '50%'
              } as React.CSSProperties}
            >
              ⚽
            </div>
          )}
          
          {/* Goal/Save Result */}
          {showResult && (
            <div className="goal-result-overlay">
              <div className={`goal-result-message ${(() => {
                const isGoal = shotDirection !== saveDirection;
                if (isGoal) {
                  // Tor: Gut für Schütze, schlecht für Keeper
                  return playerRole === 'shooter' ? 'success' : 'failure';
                } else {
                  // Parade: Gut für Keeper, schlecht für Schütze
                  return playerRole === 'keeper' ? 'success' : 'failure';
                }
              })()}`}>
                <div className="goal-text">
                  {shotDirection !== saveDirection ? '⚽ TOR!' : '🧤 PARADE!'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .game-header {
          grid-area: header;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2vh 0;
          z-index: 20;
        }

        .animation-info {
          text-align: center;
          background: rgba(0, 0, 0, 0.7);
          padding: 2vh 3vw;
          border-radius: 1rem;
          backdrop-filter: blur(10px);
        }

        .animation-title {
          color: #10b981;
          font-size: clamp(1.5rem, 4vw, 2rem);
          font-weight: bold;
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

        /* Keeper styles - kopiert aus keeper/page.tsx */
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

        .keeper-gloves {
          width: clamp(2.8rem, 7vw, 3.5rem);
          height: clamp(2.8rem, 7vw, 3.5rem);
          object-fit: contain;
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

        /* Ball styles - kopiert aus shooter/page.tsx */
        .ball {
          position: fixed;
          bottom: clamp(19vh, 24vh, 29vh);
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
            bottom: clamp(19vh, 24vh, 29vh);
            left: 50%;
          }
          100% {
            transform: translateX(-50%) scale(0.7) rotate(360deg);
            bottom: clamp(48vh, 53vh, 58vh);
            left: var(--target-left);
          }
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

          .ball {
            bottom: clamp(19vh, 24vh, 29vh);
            font-size: clamp(2rem, 6vw, 3rem);
          }

          @keyframes ballShot {
            0% {
              transform: translateX(-50%) scale(1) rotate(0deg);
              bottom: clamp(19vh, 24vh, 29vh);
              left: 50%;
            }
            100% {
              transform: translateX(-50%) scale(0.7) rotate(360deg);
              bottom: clamp(48vh, 53vh, 58vh);
              left: var(--target-left-notebook);
            }
          }
        }

        /* Mobile adjustments - kopiert aus keeper/shooter */
        @media (max-width: 768px) {
          .keeper {
            bottom: clamp(35vh, 40vh, 45vh);
          }

          .keeper-gloves {
            width: clamp(2.5rem, 6vw, 3rem);
            height: clamp(2.5rem, 6vw, 3rem);
          }

          @keyframes keeperSave {
            0% {
              transform: translateX(-50%) rotate(0deg);
              bottom: clamp(35vh, 40vh, 45vh);
              left: 50%;
            }
            100% {
              transform: translateX(-50%) rotate(var(--keeper-rotation));
              bottom: clamp(35vh, 40vh, 45vh);
              left: var(--target-left-mobile);
            }
          }

          .ball {
            bottom: clamp(16vh, 21vh, 26vh);
            font-size: clamp(1.8rem, 5vw, 2.5rem);
          }

          @keyframes ballShot {
            0% {
              transform: translateX(-50%) scale(1) rotate(0deg);
              bottom: clamp(16vh, 21vh, 26vh);
              left: 50%;
            }
            100% {
              transform: translateX(-50%) scale(0.6) rotate(360deg);
              bottom: clamp(33vh, 38vh, 43vh);
              left: var(--target-left-mobile);
            }
          }
        }

        /* Fade in animations */
        .fade-in {
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          0% {
            opacity: 0.7;
            transform: translateX(-50%) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
        }

        /* Goal Result Styles */
        .goal-result-overlay {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 20;
        }

        .goal-result-message {
          color: white;
          padding: 1.5rem 2rem;
          border-radius: 1rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          animation: goalPop 0.6s ease-out;
        }

        .goal-result-message.success {
          background: rgba(34, 197, 94, 0.95);
          border: 3px solid #22c55e;
        }

        .goal-result-message.failure {
          background: rgba(239, 68, 68, 0.95);
          border: 3px solid #ef4444;
        }

        .goal-text {
          font-size: 3rem;
          font-weight: 900;
          text-align: center;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        
        /* Mobile adjustments for goal/save cards */
        @media (max-width: 768px) {
          .goal-result-message {
            padding: 1rem 1.5rem;
            max-width: 80vw;
          }
          
          .goal-text {
            font-size: 2.5rem;
          }
        }

        @keyframes goalPop {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          30% {
            transform: scale(1.3) rotate(15deg);
            opacity: 0.8;
          }
          60% {
            transform: scale(0.9) rotate(-5deg);
            opacity: 1;
          }
          80% {
            transform: scale(1.1) rotate(2deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0);
            opacity: 1;
          }
        }

      `}</style>
    </GameField>
  );
}