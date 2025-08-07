'use client';

import { useState, useEffect } from 'react';
import { ShotDirection } from '@/lib/types';

interface GameControlsProps {
  onShot: (direction: ShotDirection) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  canSubmit?: boolean;
  isSubmitting?: boolean;
  shotsCount?: number;
  maxShots?: number;
  mode: 'shooter' | 'keeper';
  showPulse?: boolean;
}

export default function GameControls({
  onShot,
  onSubmit,
  disabled = false,
  canSubmit = false,
  isSubmitting = false,
  shotsCount = 0,
  maxShots = 5,
  mode,
  showPulse = false
}: GameControlsProps) {
  
  const getButtonTitle = (direction: ShotDirection) => {
    if (mode === 'keeper') {
      switch (direction) {
        case 'links': return 'Links hechten';
        case 'rechts': return 'Rechts hechten';
        case 'mitte': return 'Mitte bleiben';
      }
    } else {
      switch (direction) {
        case 'links': return 'Links schießen';
        case 'rechts': return 'Rechts schießen';
        case 'mitte': return 'Mitte schießen';
      }
    }
  };
  
  const getSubmitText = () => {
    if (isSubmitting) return '⏳';
    if (canSubmit) return 'GO';
    return maxShots - shotsCount;
  };
  
  const getSubmitTitle = () => {
    if (canSubmit) {
      return mode === 'keeper' ? 'Paraden senden!' : 'Schießen!';
    }
    const remaining = maxShots - shotsCount;
    return `Noch ${remaining} ${mode === 'keeper' ? 'Paraden' : 'Schüsse'} wählen`;
  };

  return (
    <div className="game-controls">
      <div className="controls-wrapper">
        {/* Direction Controls */}
        <button
          onClick={() => onShot('links')}
          className={`control-btn ${showPulse ? 'control-btn-pulse' : ''}`}
          disabled={disabled || shotsCount >= maxShots}
          title={getButtonTitle('links')}
        >
          ⬅️
        </button>
        
        <button
          onClick={() => onShot('mitte')}
          className={`control-btn ${showPulse ? 'control-btn-pulse' : ''}`}
          disabled={disabled || shotsCount >= maxShots}
          title={getButtonTitle('mitte')}
        >
          🎯
        </button>
        
        <button
          onClick={() => onShot('rechts')}
          className={`control-btn ${showPulse ? 'control-btn-pulse' : ''}`}
          disabled={disabled || shotsCount >= maxShots}
          title={getButtonTitle('rechts')}
        >
          ➡️
        </button>
        
        {/* Submit Button */}
        {onSubmit && (
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="submit-btn"
            title={getSubmitTitle()}
          >
            {getSubmitText()}
          </button>
        )}
      </div>
      
      <style jsx>{`
        .game-controls {
          grid-area: controls;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          padding-bottom: 0vh;
          z-index: 30;
        }
        
        .controls-wrapper {
          display: flex;
          gap: 2vw;
          align-items: center;
          max-width: 90vw;
        }
        
        .control-btn {
          width: 15vw;
          height: 15vw;
          max-width: 80px;
          max-height: 80px;
          min-width: 60px;
          min-height: 60px;
          background: linear-gradient(135deg, #10b981, #059669);
          border: 4px solid rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          font-size: min(8vw, 28px);
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
        
        .submit-btn {
          width: 15vw;
          height: 15vw;
          max-width: 80px;
          max-height: 80px;
          min-width: 60px;
          min-height: 60px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          border: 4px solid rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          font-size: min(5vw, 18px);
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

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .controls-wrapper {
            gap: 6vw;
          }
          
          .control-btn, .submit-btn {
            width: 18vw;
            height: 18vw;
            font-size: min(10vw, 32px);
          }
          
          .submit-btn {
            font-size: min(6vw, 20px);
          }
        }
      `}</style>
    </div>
  );
}