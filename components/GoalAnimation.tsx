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
  onSubmit?: () => void;
  canSubmit?: boolean;
  isSubmitting?: boolean;
  role?: 'shooter' | 'keeper';
  showControlsPulse?: boolean;
}

export default function GoalAnimation({ 
  shotDirection, 
  isAnimating, 
  onAnimationComplete,
  shots = [],
  onRemoveShot,
  onAddShot,
  disabled = false,
  onSubmit,
  canSubmit = false,
  isSubmitting = false,
  role = 'shooter',
  showControlsPulse = false
}: GoalAnimationProps) {
  const [ballPosition, setBallPosition] = useState({ 
    x: 50, 
    y: role === 'keeper' ? 47 : 79  // Keeper moved 15% lower (32 + 15 = 47), shooter at penalty spot
  });
  const [showBall, setShowBall] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (isAnimating) {
      // Reset for new shot
      setShowBall(true);
      setIsResetting(false);
      setBallPosition({ 
        x: 50, 
        y: role === 'keeper' ? 47 : 79  // Keeper moved 15% lower, shooter at penalty spot
      });
      
      // Start animation after a brief delay
      const animationTimer = setTimeout(() => {
        if (role === 'keeper') {
          // Keeper animation: stay at same height, only move horizontally with rotation
          let targetX = 50;
          switch (shotDirection) {
            case 'links':
              targetX = 30; // Move left but not too far
              break;
            case 'rechts':
              targetX = 70; // Move right but not too far
              break;
            case 'mitte':
              targetX = 50; // Stay center
              break;
          }
          setBallPosition({ x: targetX, y: 47 }); // Keep same height (y: 47)
        } else {
          // Shooter animation: ball flies to goal
          let targetX = 50;
          let targetY = 15;
          
          switch (shotDirection) {
            case 'links':
              targetX = 25;
              targetY = 30;
              break;
            case 'rechts':
              targetX = 75;
              targetY = 30;
              break;
            case 'mitte':
              targetX = 50;
              targetY = 25;
              break;
          }
          setBallPosition({ x: targetX, y: targetY });
        }
      }, 100);

      // Hide ball briefly then reset position
      const hideTimer = setTimeout(() => {
        setShowBall(false);
      }, 1200);

      // Show ball again at correct position
      const resetTimer = setTimeout(() => {
        setIsResetting(true);
        setBallPosition({ 
          x: 50, 
          y: role === 'keeper' ? 47 : 79  // Reset to keeper or shooter position
        });
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
          className={`football ${isAnimating && !isResetting ? (
            role === 'keeper' ? 
              (shotDirection === 'mitte' ? 'animate-keeper-center' : 'animate-keeper-dive') : 
              'animate-shot'
          ) : ''} ${isResetting ? 'fade-in' : ''}`}
          style={{
            left: `${ballPosition.x}%`,
            top: `${ballPosition.y}%`,
            '--target-x': `${ballPosition.x}%`,
            '--target-y': `${ballPosition.y}%`,
            '--keeper-rotation': role === 'keeper' ? (
              shotDirection === 'links' ? '-40deg' : 
              shotDirection === 'rechts' ? '40deg' : '0deg'
            ) : '0deg'
          } as React.CSSProperties}
        >
          {role === 'keeper' ? (
            <img 
              src="/gloves.png" 
              alt="Handschuhe" 
              style={{ width: '55px', height: '55px', objectFit: 'contain' }}
            />
          ) : (
            '⚽'
          )}
        </div>
      )}

      {/* Shot Controls - Bottom of image */}
      {onAddShot && (
        <div 
          className={`shot-controls ${role === 'keeper' ? 'shot-controls-keeper' : ''}`}
          style={{ 
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '30px',
            background: 'transparent',
            padding: 0,
            zIndex: 30
          }}
        >
          <button
            onClick={() => onAddShot('links')}
            className={`control-btn ${showControlsPulse ? 'control-btn-pulse' : ''}`}
            disabled={disabled || shots.length >= 5}
            title={role === 'keeper' ? "Links hechten" : "Links schießen"}
          >
            ⬅️
          </button>
          <button
            onClick={() => onAddShot('mitte')}
            className={`control-btn ${showControlsPulse ? 'control-btn-pulse' : ''}`}
            disabled={disabled || shots.length >= 5}
            title={role === 'keeper' ? "Mitte bleiben" : "Mitte schießen"}
          >
            🎯
          </button>
          <button
            onClick={() => onAddShot('rechts')}
            className={`control-btn ${showControlsPulse ? 'control-btn-pulse' : ''}`}
            disabled={disabled || shots.length >= 5}
            title={role === 'keeper' ? "Rechts hechten" : "Rechts schießen"}
          >
            ➡️
          </button>
          
          {/* Submit Button - Round button next to controls */}
          {onSubmit && (
            <button
              onClick={onSubmit}
              disabled={!canSubmit}
              className="submit-btn"
              title={canSubmit ? (role === 'keeper' ? "Paraden senden!" : "Schießen!") : `Noch ${5 - shots.length} ${role === 'keeper' ? 'Paraden' : 'Schüsse'} wählen`}
            >
              {isSubmitting ? '⏳' : 
               canSubmit ? 'GO' : 
               5 - shots.length}
            </button>
          )}
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
          background: transparent;
          border-radius: 12px;
          overflow: visible;
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

        .football.animate-keeper-dive {
          animation: keeperDive 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        .football.animate-keeper-center {
          animation: keeperCenter 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
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

        @keyframes keeperDive {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(var(--keeper-rotation, 0deg));
            opacity: 1;
          }
        }

        @keyframes keeperCenter {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) translateY(0px);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) rotate(0deg) translateY(-15px);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(0deg) translateY(0px);
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
          flex-direction: column;
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

        /* Shot Controls at bottom - slightly below viewport */
        .shot-controls {
          position: absolute;
          bottom: -18%;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 30px;
          background: transparent;
          padding: 0;
          z-index: 30;
        }

        /* Keeper controls positioned lower - absolute position */
        .shot-controls.shot-controls-keeper {
          bottom: -35% !important;
        }

        .control-btn {
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #10b981, #059669);
          border: 4px solid rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          font-size: 28px;
          color: white;
          font-weight: bold;
          text-shadow: 0 3px 6px rgba(0, 0, 0, 0.7);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          box-shadow: 
            0 6px 20px rgba(0, 0, 0, 0.4),
            0 0 30px rgba(16, 185, 129, 0.6),
            inset 0 3px 6px rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(3px);
        }

        .control-btn:hover:not(:disabled) {
          transform: scale(1.15) translateY(-2px);
          box-shadow: 
            0 6px 20px rgba(0, 0, 0, 0.4),
            0 0 30px rgba(16, 185, 129, 0.8),
            inset 0 2px 6px rgba(255, 255, 255, 0.3);
        }

        .control-btn:disabled {
          background: linear-gradient(135deg, #9ca3af, #6b7280);
          border: 3px solid rgba(255, 255, 255, 0.3);
          cursor: not-allowed;
          opacity: 0.7;
          box-shadow: 
            0 2px 6px rgba(0, 0, 0, 0.2),
            inset 0 1px 2px rgba(255, 255, 255, 0.1);
        }

        .control-btn-pulse {
          animation: controlPulse 2s ease-in-out 2;
        }

        @keyframes controlPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 
              0 6px 20px rgba(0, 0, 0, 0.4),
              0 0 30px rgba(16, 185, 129, 0.6),
              inset 0 3px 6px rgba(255, 255, 255, 0.3);
          }
          50% {
            transform: scale(1.1);
            box-shadow: 
              0 8px 25px rgba(0, 0, 0, 0.5),
              0 0 40px rgba(16, 185, 129, 1),
              inset 0 3px 8px rgba(255, 255, 255, 0.4);
          }
        }

        /* Submit Button - Round button next to shot controls */
        .submit-btn {
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          border: 4px solid rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          font-size: 18px;
          font-weight: bold;
          color: white;
          text-shadow: 0 3px 6px rgba(0, 0, 0, 0.7);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          box-shadow: 
            0 6px 20px rgba(0, 0, 0, 0.4),
            0 0 30px rgba(245, 158, 11, 0.6),
            inset 0 3px 6px rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(3px);
        }

        .submit-btn:hover:not(:disabled) {
          transform: scale(1.15) translateY(-2px);
          box-shadow: 
            0 8px 25px rgba(0, 0, 0, 0.5),
            0 0 40px rgba(245, 158, 11, 0.8),
            inset 0 3px 8px rgba(255, 255, 255, 0.4);
        }

        .submit-btn:disabled {
          background: linear-gradient(135deg, #9ca3af, #6b7280);
          border: 3px solid rgba(255, 255, 255, 0.3);
          cursor: not-allowed;
          opacity: 0.7;
          box-shadow: 
            0 2px 6px rgba(0, 0, 0, 0.2),
            inset 0 1px 2px rgba(255, 255, 255, 0.1);
        }

      `}</style>
    </div>
  );
}