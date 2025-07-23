import { useEffect, useState } from 'react';
import { ShotDirection, SaveDirection } from '@/lib/types';

interface PenaltyShootoutProps {
  shooterMove: ShotDirection;
  keeperMove: SaveDirection;
  isAnimating: boolean;
  shooterPosition: 'left' | 'right';
}

interface DirectionEmoji {
  emoji: string;
  name: string;
  color: string;
}

const shotEmojis: Record<ShotDirection, DirectionEmoji> = {
  'links': { emoji: '⬅️', name: 'LINKS', color: '#10B981' },
  'mitte': { emoji: '🎯', name: 'MITTE', color: '#F59E0B' },
  'rechts': { emoji: '➡️', name: 'RECHTS', color: '#3B82F6' }
};

const saveEmojis: Record<SaveDirection, DirectionEmoji> = {
  'links': { emoji: '⬅️', name: 'LINKS', color: '#10B981' },
  'mitte': { emoji: '🎯', name: 'MITTE', color: '#F59E0B' },
  'rechts': { emoji: '➡️', name: 'RECHTS', color: '#3B82F6' }
};

export default function PenaltyShootout({ 
  shooterMove,
  keeperMove,
  isAnimating,
  shooterPosition
}: PenaltyShootoutProps) {
  
  const [showResult, setShowResult] = useState(false);
  const isGoal = shooterMove !== keeperMove; // Tor wenn verschiedene Richtungen
  
  useEffect(() => {
    if (isAnimating) {
      // Show result after penalty unfolds - delayed for better visibility
      const timer = setTimeout(() => setShowResult(true), 1500);
      return () => clearTimeout(timer);
    } else {
      setShowResult(false);
    }
  }, [isAnimating]);
  
  const shotEmoji = shotEmojis[shooterMove];
  const saveEmoji = saveEmojis[keeperMove];
  
  // Check if directions match (indicating a save)
  const directionsMatch = shooterMove === keeperMove;
  
  return (
    <div className="penalty-shootout-container">
      {/* Main penalty equation */}
      <div className={`penalty-equation ${isAnimating ? 'active' : ''}`}>
        {/* Shooter move */}
        <div 
          className={`move-display shooter ${isAnimating ? 'animate-slide-in' : ''}`}
          style={{ 
            '--slide-from': shooterPosition === 'left' ? '-100px' : '100px',
            borderColor: shotEmoji.color,
            backgroundColor: `${shotEmoji.color}20`
          } as React.CSSProperties}
        >
          <span className="emoji-large">⚽</span>
          <span className="direction-emoji">{shotEmoji.emoji}</span>
          <span className="move-name" style={{ color: shotEmoji.color }}>
            {shotEmoji.name}
          </span>
        </div>
        
        {/* VS indicator */}
        <div className={`vs-indicator ${isAnimating ? 'animate-pulse' : ''}`}>
          VS
        </div>
        
        {/* Keeper move */}
        <div 
          className={`move-display keeper ${isAnimating ? 'animate-slide-in' : ''}`}
          style={{ 
            '--slide-from': shooterPosition === 'left' ? '100px' : '-100px',
            borderColor: saveEmoji.color,
            backgroundColor: `${saveEmoji.color}20`,
            '--glow-color': directionsMatch ? saveEmoji.color : 'transparent'
          } as React.CSSProperties}
        >
          <span className="emoji-large">🧤</span>
          <span className="direction-emoji">{saveEmoji.emoji}</span>
          <span className="move-name" style={{ color: saveEmoji.color }}>
            {saveEmoji.name}
          </span>
        </div>
        
        {/* Result */}
        {showResult && (
          <div className={`result-display ${isGoal ? 'goal' : 'save'}`}>
            <div className="result-icon">
              {isGoal ? '⚽' : '🧤'}
            </div>
            <div className="result-text">
              {isGoal ? 'TOR!' : 'PARADE!'}
            </div>
            <div className="result-subtext">
              {isGoal ? 'GOAL!' : 'SAVED!'}
            </div>
          </div>
        )}
      </div>
      
      {/* Same direction indicator */}
      {isAnimating && directionsMatch && (
        <div className="direction-match-hint animate-fade-in">
          <span style={{ color: shotEmoji.color }}>
            Gleiche Richtung = Torwart hält den Ball!
          </span>
        </div>
      )}
      
      <style jsx>{`
        .penalty-shootout-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 2rem 0;
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          border-radius: 1rem;
        }
        
        .penalty-equation {
          display: flex;
          align-items: center;
          gap: 2rem;
          position: relative;
        }
        
        .penalty-equation.active {
          animation: penalty-focus 0.3s ease-out;
        }
        
        @keyframes penalty-focus {
          0% {
            transform: scale(0.9);
            opacity: 0.5;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .move-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem;
          border-radius: 1rem;
          border: 3px solid;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.95);
        }
        
        .move-display.keeper {
          box-shadow: 0 0 20px var(--glow-color);
        }
        
        .animate-slide-in {
          animation: slideIn 1.2s ease-out;
        }
        
        @keyframes slideIn {
          0% {
            transform: translateX(var(--slide-from)) scale(0.5);
            opacity: 0;
          }
          50% {
            transform: translateX(calc(var(--slide-from) * 0.3)) scale(1.1);
            opacity: 1;
          }
          100% {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }
        
        .emoji-large {
          font-size: 4rem;
          line-height: 1;
          filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.2));
        }
        
        .direction-emoji {
          font-size: 2rem;
          margin: 0.5rem 0;
        }
        
        .move-name {
          font-weight: 900;
          font-size: 1.2rem;
          margin-top: 0.5rem;
          letter-spacing: 1px;
        }
        
        .vs-indicator {
          font-size: 2rem;
          font-weight: 900;
          color: white;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        
        .animate-pulse {
          animation: pulse 1s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.8;
          }
        }
        
        .result-display {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 1.5rem 2rem;
          border-radius: 1rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          animation: resultPop 1.2s ease-out;
          z-index: 10;
        }
        
        @keyframes resultPop {
          0% {
            transform: translate(-50%, -50%) scale(0) rotate(-180deg);
            opacity: 0;
          }
          30% {
            transform: translate(-50%, -50%) scale(1.5) rotate(15deg);
            opacity: 0.8;
          }
          60% {
            transform: translate(-50%, -50%) scale(0.8) rotate(-5deg);
            opacity: 1;
          }
          80% {
            transform: translate(-50%, -50%) scale(1.1) rotate(2deg);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1) rotate(0);
            opacity: 1;
          }
        }
        
        .result-display.goal {
          border: 3px solid #10B981;
        }
        
        .result-display.save {
          border: 3px solid #3B82F6;
        }
        
        .result-icon {
          font-size: 4rem;
          text-align: center;
        }
        
        .result-text {
          font-weight: 900;
          font-size: 2rem;
          text-align: center;
          margin-top: 0.5rem;
        }
        
        .result-subtext {
          font-weight: 600;
          font-size: 1rem;
          text-align: center;
          margin-top: 0.25rem;
          opacity: 0.8;
        }
        
        .result-display.goal .result-text,
        .result-display.goal .result-subtext {
          color: #10B981;
        }
        
        .result-display.save .result-text,
        .result-display.save .result-subtext {
          color: #3B82F6;
        }
        
        .direction-match-hint {
          font-size: 0.875rem;
          font-weight: 600;
          text-align: center;
          padding: 0.5rem 1rem;
          background: rgba(255,255,255,0.9);
          border-radius: 0.5rem;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          color: white;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}