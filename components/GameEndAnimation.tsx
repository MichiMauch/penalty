'use client';

import { useState, useEffect } from 'react';

interface GameEndAnimationProps {
  winner: 'player_a' | 'player_b' | 'draw';
  playerRole: 'player_a' | 'player_b';
  playerAName: string;
  playerBName: string;
  show: boolean;
  onComplete?: () => void;
}

export default function GameEndAnimation({
  winner,
  playerRole,
  playerAName,
  playerBName,
  show,
  onComplete
}: GameEndAnimationProps) {
  const [showFireworks, setShowFireworks] = useState(false);
  const [showDefeat, setShowDefeat] = useState(false);

  useEffect(() => {
    if (show) {
      const isWinner = winner === playerRole;
      const isDraw = winner === 'draw';

      if (isDraw) {
        // Unentschieden - neutral
        return;
      }

      if (isWinner) {
        // Spieler hat gewonnen - Feuerwerk
        setShowFireworks(true);
        setTimeout(() => setShowFireworks(false), 4000);
      } else {
        // Spieler hat verloren - traurige Animation
        setShowDefeat(true);
        setTimeout(() => setShowDefeat(false), 3000);
      }

      // Animation beenden
      setTimeout(() => {
        onComplete?.();
      }, 5000);
    }
  }, [show, winner, playerRole, onComplete]);

  if (!show) return null;

  const isWinner = winner === playerRole;
  const isDraw = winner === 'draw';
  const winnerName = winner === 'player_a' ? playerAName : playerBName;

  return (
    <div className="game-end-animation">
      {/* Feuerwerk für Gewinner */}
      {showFireworks && (
        <div className="fireworks-container">
          <div className="firework firework-1">🎆</div>
          <div className="firework firework-2">🎇</div>
          <div className="firework firework-3">🎆</div>
          <div className="firework firework-4">🎇</div>
          <div className="firework firework-5">🎆</div>
          <div className="victory-message">
            <div className="victory-text">🏆 GEWONNEN! 🏆</div>
            <div className="victory-subtitle">Gratulation zum Sieg!</div>
          </div>
        </div>
      )}

      {/* Niederlage Animation */}
      {showDefeat && (
        <div className="defeat-container">
          <div className="rain-cloud">☁️</div>
          <div className="rain-drops">
            <div className="drop">💧</div>
            <div className="drop">💧</div>
            <div className="drop">💧</div>
            <div className="drop">💧</div>
            <div className="drop">💧</div>
          </div>
          <div className="defeat-message">
            <div className="defeat-text">😔 VERLOREN</div>
            <div className="defeat-subtitle">{winnerName} hat gewonnen</div>
          </div>
        </div>
      )}

      {/* Unentschieden */}
      {isDraw && (
        <div className="draw-container">
          <div className="draw-message">
            <div className="draw-text">🤝 UNENTSCHIEDEN</div>
            <div className="draw-subtitle">Beide waren gleich stark!</div>
          </div>
        </div>
      )}

      <style jsx>{`
        .game-end-animation {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        /* Feuerwerk Styles */
        .fireworks-container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .firework {
          position: absolute;
          font-size: 4rem;
          animation: fireworkExplode 2s ease-out infinite;
        }

        .firework-1 {
          top: 20%;
          left: 20%;
          animation-delay: 0s;
        }

        .firework-2 {
          top: 30%;
          right: 25%;
          animation-delay: 0.5s;
        }

        .firework-3 {
          top: 15%;
          left: 60%;
          animation-delay: 1s;
        }

        .firework-4 {
          bottom: 30%;
          left: 30%;
          animation-delay: 1.5s;
        }

        .firework-5 {
          bottom: 25%;
          right: 20%;
          animation-delay: 2s;
        }

        @keyframes fireworkExplode {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            transform: scale(1.5) rotate(45deg);
            opacity: 1;
          }
          90% {
            transform: scale(1.5) rotate(405deg);
            opacity: 1;
          }
          100% {
            transform: scale(0) rotate(450deg);
            opacity: 0;
          }
        }

        .victory-message {
          text-align: center;
          background: linear-gradient(135deg, #FFD700, #FFA500);
          padding: 3rem 2rem;
          border-radius: 2rem;
          box-shadow: 0 20px 40px rgba(255, 215, 0, 0.3);
          animation: victoryPulse 1s ease-out infinite alternate;
        }

        .victory-text {
          font-size: 4rem;
          font-weight: 900;
          color: white;
          text-shadow: 3px 3px 6px rgba(0,0,0,0.5);
          margin-bottom: 1rem;
        }

        .victory-subtitle {
          font-size: 1.5rem;
          font-weight: 600;
          color: white;
        }

        @keyframes victoryPulse {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.05);
          }
        }

        /* Niederlage Styles */
        .defeat-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .rain-cloud {
          font-size: 6rem;
          margin-bottom: 2rem;
          animation: cloudFloat 3s ease-in-out infinite;
        }

        @keyframes cloudFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .rain-drops {
          position: absolute;
          top: 120px;
          width: 200px;
          height: 200px;
        }

        .drop {
          position: absolute;
          font-size: 2rem;
          animation: rainFall 1.5s linear infinite;
        }

        .drop:nth-child(1) {
          left: 20%;
          animation-delay: 0s;
        }

        .drop:nth-child(2) {
          left: 40%;
          animation-delay: 0.3s;
        }

        .drop:nth-child(3) {
          left: 60%;
          animation-delay: 0.6s;
        }

        .drop:nth-child(4) {
          left: 10%;
          animation-delay: 0.9s;
        }

        .drop:nth-child(5) {
          left: 80%;
          animation-delay: 1.2s;
        }

        @keyframes rainFall {
          0% {
            transform: translateY(-20px);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translateY(200px);
            opacity: 0;
          }
        }

        .defeat-message {
          text-align: center;
          background: linear-gradient(135deg, #6B7280, #4B5563);
          padding: 2rem;
          border-radius: 1rem;
          margin-top: 3rem;
        }

        .defeat-text {
          font-size: 3rem;
          font-weight: 900;
          color: white;
          margin-bottom: 1rem;
        }

        .defeat-subtitle {
          font-size: 1.2rem;
          color: #D1D5DB;
        }

        /* Unentschieden Styles */
        .draw-container {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .draw-message {
          text-align: center;
          background: linear-gradient(135deg, #3B82F6, #1E40AF);
          padding: 3rem 2rem;
          border-radius: 2rem;
          box-shadow: 0 20px 40px rgba(59, 130, 246, 0.3);
        }

        .draw-text {
          font-size: 3.5rem;
          font-weight: 900;
          color: white;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
          margin-bottom: 1rem;
        }

        .draw-subtitle {
          font-size: 1.3rem;
          font-weight: 600;
          color: #DBEAFE;
        }
      `}</style>
    </div>
  );
}