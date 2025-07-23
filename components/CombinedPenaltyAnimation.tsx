'use client';

import { useState, useEffect } from 'react';
import { ShotDirection, SaveDirection } from '@/lib/types';

interface CombinedPenaltyAnimationProps {
  shotDirection: ShotDirection;
  saveDirection: SaveDirection;
  isAnimating: boolean;
  onAnimationComplete?: () => void;
}

export default function CombinedPenaltyAnimation({ 
  shotDirection, 
  saveDirection, 
  isAnimating, 
  onAnimationComplete 
}: CombinedPenaltyAnimationProps) {
  // Ball state - same as GoalAnimation
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 78 });
  const [showBall, setShowBall] = useState(true);
  const [isBallResetting, setIsBallResetting] = useState(false);
  
  // Keeper state - same as KeeperAnimation
  const [keeperPosition, setKeeperPosition] = useState({ x: 50, y: 45 });
  const [showKeeper, setShowKeeper] = useState(true);
  const [isKeeperResetting, setIsKeeperResetting] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (isAnimating) {
      // Reset for new animation
      setShowBall(true);
      setShowKeeper(true);
      setIsBallResetting(false);
      setIsKeeperResetting(false);
      setShowResult(false);
      setBallPosition({ x: 50, y: 78 }); // Same as GoalAnimation
      setKeeperPosition({ x: 50, y: 45 }); // Same as KeeperAnimation
      
      // Start animations after a brief delay
      const animationTimer = setTimeout(() => {
        // Ball animation - adjusted positions to avoid goal posts
        let ballTargetX = 50;
        switch (shotDirection) {
          case 'links':
            ballTargetX = 35; // Less extreme to avoid post
            break;
          case 'rechts':
            ballTargetX = 65; // Less extreme to avoid post
            break;
          case 'mitte':
            ballTargetX = 50; // Center unchanged
            break;
        }
        setBallPosition({ x: ballTargetX, y: 45 }); // Same target Y as GoalAnimation
        
        // Keeper animation - same positions as KeeperAnimation
        let keeperTargetX = 50;
        switch (saveDirection) {
          case 'links':
            keeperTargetX = 35; // Same as KeeperAnimation
            break;
          case 'rechts':
            keeperTargetX = 65; // Same as KeeperAnimation
            break;
          case 'mitte':
            keeperTargetX = 50; // Same as KeeperAnimation
            break;
        }
        setKeeperPosition({ x: keeperTargetX, y: 45 });
      }, 100);

      // Show result and handle ball visibility
      const resultTimer = setTimeout(() => {
        const isGoal = shotDirection !== saveDirection;
        
        if (isGoal) {
          // Goal scored - show TOR! message
          setShowResult(true);
        } else {
          // Ball was saved - hide it
          setShowBall(false);
        }
      }, 1200);

      // Reset positions back to center
      const resetTimer = setTimeout(() => {
        setIsBallResetting(true);
        setIsKeeperResetting(true);
        setBallPosition({ x: 50, y: 78 }); // Ball back to penalty spot
        setKeeperPosition({ x: 50, y: 45 }); // Keeper back to center
        setShowBall(true); // Show ball again
        setShowResult(false); // Hide TOR message
      }, 2000);

      // Animation complete
      const completeTimer = setTimeout(() => {
        onAnimationComplete?.();
      }, 2300);

      return () => {
        clearTimeout(animationTimer);
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
          className={`keeper ${isAnimating && !isKeeperResetting ? 'animate-save' : ''} ${isKeeperResetting ? 'fade-in' : ''}`}
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
      
      {/* Goal Result */}
      {showResult && (
        <div className="goal-result-overlay">
          <div className="goal-result-message">
            <div className="goal-text">⚽ TOR!</div>
          </div>
        </div>
      )}

      <style jsx>{`
        .combined-penalty-animation {
          position: relative;
          width: 100%;
          height: 400px;
          background-image: url('/stadium-background.jpg');
          background-size: cover;
          background-position: center bottom;
          background-repeat: no-repeat;
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
          transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
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
          animation: fadeInKeeper 0.3s ease-out;
        }

        .football.fade-in {
          animation: fadeInBall 0.3s ease-out;
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
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
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
          background: rgba(34, 197, 94, 0.95);
          color: white;
          padding: 1.5rem 2rem;
          border-radius: 1rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          animation: goalPop 0.6s ease-out;
          border: 3px solid #22c55e;
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