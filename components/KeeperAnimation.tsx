'use client';

import { useState, useEffect } from 'react';
import { SaveDirection } from '@/lib/types';

interface KeeperAnimationProps {
  saveDirection: SaveDirection;
  isAnimating: boolean;
  onAnimationComplete?: () => void;
  saves?: SaveDirection[];
  onRemoveSave?: (index: number) => void;
  onAddSave?: (direction: SaveDirection) => void;
  disabled?: boolean;
}

export default function KeeperAnimation({ 
  saveDirection, 
  isAnimating, 
  onAnimationComplete,
  saves = [],
  onRemoveSave,
  onAddSave,
  disabled = false
}: KeeperAnimationProps) {
  const [keeperPosition, setKeeperPosition] = useState({ x: 50, y: 45 });
  const [showKeeper, setShowKeeper] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (isAnimating) {
      // Reset for new save
      setShowKeeper(true);
      setIsResetting(false);
      setKeeperPosition({ x: 50, y: 45 }); // Reset to center of goal
      
      // Start animation after a brief delay
      const animationTimer = setTimeout(() => {
        let targetX = 50; // Default center
        
        switch (saveDirection) {
          case 'links':
            targetX = 35; // Dive left (more movement)
            break;
          case 'rechts':
            targetX = 65; // Dive right (more movement)
            break;
          case 'mitte':
            targetX = 50; // Stay center
            break;
        }
        
        setKeeperPosition({ x: targetX, y: 45 }); // Move to save position
      }, 100);

      // Reset position after animation
      const resetTimer = setTimeout(() => {
        setIsResetting(true);
        setKeeperPosition({ x: 50, y: 45 }); // Reset back to center
      }, 1200);

      // Complete animation
      const completeTimer = setTimeout(() => {
        setIsResetting(false);
        onAnimationComplete?.();
      }, 1400);

      return () => {
        clearTimeout(animationTimer);
        clearTimeout(resetTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [isAnimating, saveDirection, onAnimationComplete]);

  const getDirectionIcon = (direction: SaveDirection) => {
    switch (direction) {
      case 'links': return '⬅️';
      case 'rechts': return '➡️';
      case 'mitte': return '🎯';
      default: return '🧤';
    }
  };

  return (
    <div className="keeper-animation-container">
      {/* Keeper figure */}
      {showKeeper && (
        <div 
          className={`keeper ${isAnimating && !isResetting ? 'animate-save' : ''} ${isResetting ? 'fade-in' : ''}`}
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

      {/* Save Controls - Bottom of image */}
      {onAddSave && (
        <div className="save-controls">
          <button
            onClick={() => onAddSave('links')}
            className="control-btn"
            disabled={disabled || saves.length >= 5}
            title="Links hechten"
          >
            ⬅️
          </button>
          <button
            onClick={() => onAddSave('mitte')}
            className="control-btn"
            disabled={disabled || saves.length >= 5}
            title="Mitte bleiben"
          >
            🎯
          </button>
          <button
            onClick={() => onAddSave('rechts')}
            className="control-btn"
            disabled={disabled || saves.length >= 5}
            title="Rechts hechten"
          >
            ➡️
          </button>
        </div>
      )}

      {/* Saves Series - Embedded in the goal image */}
      {saves.length > 0 && (
        <div className="saves-series">
          {saves.map((save, index) => (
            <div key={index} className="save-item">
              <span className="save-icon">{getDirectionIcon(save)}</span>
              {onRemoveSave && (
                <button
                  onClick={() => onRemoveSave(index)}
                  className="remove-save"
                  title={`Parade ${index + 1} löschen`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .keeper-animation-container {
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

        .keeper {
          position: absolute;
          transform: translate(-50%, -50%);
          z-index: 10;
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
          animation: keeperSave 0.8s ease-out forwards;
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

        @keyframes keeperSave {
          0% {
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
          }
        }


        .keeper.fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        /* Saves Series embedded in goal */
        .saves-series {
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

        .save-item {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
          transition: all 0.2s ease;
        }

        .save-item:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .save-icon {
          font-size: 14px;
          color: white;
          font-weight: bold;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .remove-save {
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

        .save-item:hover .remove-save {
          opacity: 1;
        }

        .remove-save:hover {
          background: #dc2626;
          transform: scale(1.1);
        }

        /* Save Controls at bottom */
        .save-controls {
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
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
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
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
        }

        .control-btn:hover:not(:disabled) {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
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