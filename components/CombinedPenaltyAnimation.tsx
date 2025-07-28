'use client';

import { useState, useEffect } from 'react';
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
  // Ball state - moved 8% down from previous position (66 + 8% = 71.3)
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 71 });
  const [showBall, setShowBall] = useState(true);
  const [isBallResetting, setIsBallResetting] = useState(false);
  
  // Keeper state - moved another 5% higher (30 - 5% = 28.5)
  const [keeperPosition, setKeeperPosition] = useState({ x: 50, y: 28 });
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
      setBallPosition({ x: 50, y: 71 }); // Ball start position adjusted
      setKeeperPosition({ x: 50, y: 28 }); // Keeper start position adjusted
      
      // Ball animation starts immediately (ball is shot first)
      const ballAnimationTimer = setTimeout(() => {
        let ballTargetX = 50;
        switch (shotDirection) {
          case 'links':
            ballTargetX = 20; // Moved 5% less extreme (15 + 5 = 20)
            break;
          case 'rechts':
            ballTargetX = 80; // Moved 5% less extreme (85 - 5 = 80)
            break;
          case 'mitte':
            ballTargetX = 50; // Center unchanged
            break;
        }
        setBallPosition({ x: ballTargetX, y: 23 }); // Moved 10% lower (13 + 10 = 23)
      }, 100);
      
      // Keeper animation starts with delay (realistic reaction time)
      const keeperAnimationTimer = setTimeout(() => {
        setIsKeeperAnimating(true);
        let keeperTargetX = 50;
        switch (saveDirection) {
          case 'links':
            keeperTargetX = 20; // Moved 10% further left (30 - 10 = 20)
            break;
          case 'rechts':
            keeperTargetX = 80; // Moved 10% further right (70 + 10 = 80)
            break;
          case 'mitte':
            keeperTargetX = 50; // Center unchanged
            break;
        }
        setKeeperPosition({ x: keeperTargetX, y: 28 }); // Moved another 5% higher (30 - 2 = 28)
      }, 250); // 150ms delay after ball starts moving

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

      // Reset positions back to center
      const resetTimer = setTimeout(() => {
        setIsBallResetting(true);
        setIsKeeperResetting(true);
        setIsKeeperAnimating(false);
        setBallPosition({ x: 50, y: 71 }); // Ball back to penalty spot - position adjusted
        setKeeperPosition({ x: 50, y: 28 }); // Keeper back to center - position adjusted
        setShowBall(true); // Show ball again
        setShowResult(false); // Hide TOR message
      }, 1800);

      // Animation complete - wait longer to ensure ball visually returns
      const completeTimer = setTimeout(() => {
        onAnimationComplete?.();
      }, 2500);

      return () => {
        clearTimeout(ballAnimationTimer);
        clearTimeout(keeperAnimationTimer);
        clearTimeout(resultTimer);
        clearTimeout(resetTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [isAnimating, shotDirection, saveDirection, onAnimationComplete]);

  return (
    <div className="combined-penalty-animation">
      {/* Keeper */}
      {showKeeper && (
        <div 
          className={`keeper ${isKeeperAnimating && !isKeeperResetting ? 'animate-save' : ''} ${isKeeperResetting ? 'fade-in' : ''}`}
          style={{
            left: `${keeperPosition.x}%`,
            top: `${keeperPosition.y}%`,
            '--target-x': `${keeperPosition.x}%`,
            '--save-direction': saveDirection
          } as React.CSSProperties}
        >
          <div className="keeper-body">
            <img src="/gloves.png" alt="Keeper gloves" className="keeper-gloves" />
          </div>
        </div>
      )}
      
      {/* Ball */}
      {showBall && (
        <div 
          className={`football ${isAnimating && !isBallResetting ? 'animate-shot' : ''} ${isBallResetting ? 'fade-in' : ''}`}
          style={{
            left: `${ballPosition.x}%`,
            top: `${ballPosition.y}%`,
            '--target-x': `${ballPosition.x}%`,
            '--target-y': `${ballPosition.y}%`
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

      <style jsx>{`
        .combined-penalty-animation {
          position: relative;
          width: 100%;
          height: 400px;
          background: transparent;
          border-radius: 12px;
          overflow: hidden;
          perspective: 1000px;
        }

        /* Keeper styles */
        .keeper {
          position: absolute;
          transform: translate(-50%, -50%);
          z-index: 9;
          filter: drop-shadow(3px 3px 6px rgba(0,0,0,0.5));
          /* Removed transition - only animate when class is added */
        }

        .keeper-body {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.8s ease-out;
        }

        .keeper-gloves {
          width: 60px;
          height: 60px;
          object-fit: contain;
          transition: transform 0.8s ease-out;
        }

        .keeper.animate-save {
          animation: keeperMove 0.8s ease-out forwards;
          transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .keeper.animate-save[style*="links"] .keeper-body {
          transform: rotate(-20deg);
        }

        .keeper.animate-save[style*="links"] .keeper-gloves {
          transform: rotate(-15deg) scale(1.2);
        }

        .keeper.animate-save[style*="rechts"] .keeper-body {
          transform: rotate(20deg);
        }

        .keeper.animate-save[style*="rechts"] .keeper-gloves {
          transform: rotate(15deg) scale(1.2);
        }

        .keeper.animate-save[style*="mitte"] .keeper-body {
          transform: scale(1.1);
        }

        .keeper.animate-save[style*="mitte"] .keeper-gloves {
          transform: translateY(-10px) scale(1.3);
        }

        @keyframes keeperMove {
          0% {
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.05);
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
          }
        }

        /* Ball styles */
        .football {
          position: absolute;
          font-size: 2.5rem;
          transform: translate(-50%, -50%);
          z-index: 10;
          filter: drop-shadow(3px 3px 6px rgba(0,0,0,0.5));
          transition: all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .football.animate-shot {
          animation: ballFlight 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        @keyframes ballFlight {
          0% {
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
            opacity: 1;
          }
          30% {
            transform: translate(-50%, -50%) scale(1.05) rotate(120deg);
            opacity: 1;
          }
          60% {
            transform: translate(-50%, -50%) scale(0.85) rotate(240deg);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(0.7) rotate(360deg);
            opacity: 1;
          }
        }

        /* Fade in animations */
        .keeper.fade-in {
          animation: fadeInKeeper 0.5s ease-out;
        }

        .football.fade-in {
          animation: fadeInBall 0.6s ease-out;
        }

        @keyframes fadeInKeeper {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @keyframes fadeInBall {
          0% {
            opacity: 0.3;
            transform: translate(-50%, -50%) scale(0.7) translateY(-20px);
          }
          50% {
            opacity: 0.7;
            transform: translate(-50%, -50%) scale(1.1) translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1) translateY(0px);
          }
        }

        /* Goal Result Styles */
        .goal-result-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
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
    </div>
  );
}