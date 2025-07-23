'use client';

import { useState, useEffect } from 'react';
import { ShotDirection } from '@/lib/types';

interface GoalAnimationProps {
  shotDirection: ShotDirection;
  isAnimating: boolean;
  onAnimationComplete?: () => void;
  shots?: ShotDirection[];
  onRemoveShot?: (index: number) => void;
  onAddShot?: (direction: ShotDirection) => void;
  disabled?: boolean;
}

export default function GoalAnimation({ 
  shotDirection, 
  isAnimating, 
  onAnimationComplete,
  shots = [],
  onRemoveShot,
  onAddShot,
  disabled = false
}: GoalAnimationProps) {
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 78 });
  const [showBall, setShowBall] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (isAnimating) {
      // Reset for new shot
      setShowBall(true);
      setIsResetting(false);
      setBallPosition({ x: 50, y: 78 }); // Reset to penalty spot (further forward)
      
      // Start animation after a brief delay
      const animationTimer = setTimeout(() => {
        let targetX = 50; // Default center
        
        switch (shotDirection) {
          case 'links':
            targetX = 30; // Left side of goal (adjusted for perspective)
            break;
          case 'rechts':
            targetX = 70; // Right side of goal (adjusted for perspective)
            break;
          case 'mitte':
            targetX = 50; // Center of goal
            break;
        }
        
        setBallPosition({ x: targetX, y: 45 }); // Target position in goal (lower trajectory)
      }, 100);

      // Hide ball briefly then reset position
      const hideTimer = setTimeout(() => {
        setShowBall(false);
      }, 1200);

      // Show ball again at penalty spot
      const resetTimer = setTimeout(() => {
        setIsResetting(true);
        setBallPosition({ x: 50, y: 78 });
        setShowBall(true);
        onAnimationComplete?.();
      }, 1400);

      return () => {
        clearTimeout(animationTimer);
        clearTimeout(hideTimer);
        clearTimeout(resetTimer);
      };
    }
  }, [isAnimating, shotDirection, onAnimationComplete]);

  const getDirectionIcon = (direction: ShotDirection) => {
    switch (direction) {
      case 'links': return '⬅️';
      case 'rechts': return '➡️';
      case 'mitte': return '🎯';
      default: return '⚽';
    }
  };

  return (
    <div className="goal-animation-container">
      {/* Ball */}
      {showBall && (
        <div 
          className={`football ${isAnimating && !isResetting ? 'animate-shot' : ''} ${isResetting ? 'fade-in' : ''}`}
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

      {/* Shot Controls - Bottom of image */}
      {onAddShot && (
        <div className="shot-controls">
          <button
            onClick={() => onAddShot('links')}
            className="control-btn"
            disabled={disabled || shots.length >= 5}
            title="Links schießen"
          >
            ⬅️
          </button>
          <button
            onClick={() => onAddShot('mitte')}
            className="control-btn"
            disabled={disabled || shots.length >= 5}
            title="Mitte schießen"
          >
            🎯
          </button>
          <button
            onClick={() => onAddShot('rechts')}
            className="control-btn"
            disabled={disabled || shots.length >= 5}
            title="Rechts schießen"
          >
            ➡️
          </button>
        </div>
      )}

      {/* Shots Series - Embedded in the goal image */}
      {shots.length > 0 && (
        <div className="shots-series">
          {shots.map((shot, index) => (
            <div key={index} className="shot-item">
              <span className="shot-icon">{getDirectionIcon(shot)}</span>
              {onRemoveShot && (
                <button
                  onClick={() => onRemoveShot(index)}
                  className="remove-shot"
                  title={`Schuss ${index + 1} löschen`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .goal-animation-container {
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

        .football.fade-in {
          animation: fadeIn 0.3s ease-out;
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

        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        /* Shots Series embedded in goal */
        .shots-series {
          position: absolute;
          top: 15px;
          right: 15px;
          display: flex;
          gap: 8px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          padding: 8px 12px;
          border-radius: 25px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 20;
        }

        .shot-item {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
          transition: all 0.2s ease;
        }

        .shot-item:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }

        .shot-icon {
          font-size: 14px;
          color: white;
          font-weight: bold;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .remove-shot {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 18px;
          height: 18px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 50%;
          font-size: 12px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
          transition: all 0.15s ease;
          opacity: 0;
        }

        .shot-item:hover .remove-shot {
          opacity: 1;
        }

        .remove-shot:hover {
          background: #dc2626;
          transform: scale(1.1);
        }

        /* Shot Controls at bottom */
        .shot-controls {
          position: absolute;
          bottom: 15px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 12px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 8px 16px;
          border-radius: 30px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          z-index: 20;
        }

        .control-btn {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #10b981, #059669);
          border: none;
          border-radius: 50%;
          font-size: 18px;
          color: white;
          font-weight: bold;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
        }

        .control-btn:hover:not(:disabled) {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }

        .control-btn:disabled {
          background: #d1d5db;
          cursor: not-allowed;
          opacity: 0.6;
          box-shadow: none;
        }

      `}</style>
    </div>
  );
}