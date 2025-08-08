'use client';

import { ReactNode } from 'react';
import TribuneFlashes from './TribuneFlashes';

interface GameFieldProps {
  children: ReactNode;
  mode: 'shooter' | 'keeper' | 'result';
  className?: string;
}

export default function GameField({ children, mode, className = '' }: GameFieldProps) {
  return (
    <div className={`game-field game-field-${mode} ${className}`}>
      <TribuneFlashes />
      
      {/* Game Content Container */}
      <div className="game-content">
        {children}
      </div>

      <style jsx global>{`
        .game-field {
          min-height: 100vh;
          width: 100vw;
          position: relative;
          display: flex;
          flex-direction: column;
          background-size: cover;
          background-position: center center;
          background-repeat: no-repeat;
          background-attachment: fixed;
          overflow: hidden;
        }

        .game-field-shooter {
          background-image: url('/stadium-background.jpg');
        }

        .game-field-keeper {
          background-image: url('/stadium-background.jpg'); 
        }

        .game-field-result {
          background-image: url('/stadium-background.jpg');
        }

        .game-field::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.05);
          z-index: 1;
        }

        .game-content {
          position: relative;
          z-index: 10;
          height: 100vh;
          display: grid;
          grid-template-rows: auto 1fr auto;
          grid-template-areas: 
            "header"
            "field" 
            "controls";
          padding: 2vh 2vw;
        }

        /* Tribune Flash Effects */
        .camera-flash {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, 
            rgba(255, 255, 255, 0.9) 0%, 
            rgba(255, 255, 255, 0.6) 30%,
            rgba(255, 255, 255, 0.2) 60%,
            transparent 100%
          );
          pointer-events: none;
          z-index: 4;
          opacity: 0;
        }

        .flash-small {
          width: 8px;
          height: 8px;
        }

        .flash-medium {
          width: 12px;
          height: 12px;
        }

        .flash-large {
          width: 16px;
          height: 16px;
        }

        /* Flash trigger animations */
        .flash-trigger {
          animation: flashTrigger 0.3s ease-out forwards;
        }

        .flash-trigger-intense {
          animation: flashTriggerIntense 0.5s ease-out forwards;
        }

        @keyframes flashTrigger {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
          100% {
            opacity: 0;
            transform: scale(1);
          }
        }

        @keyframes flashTriggerIntense {
          0% {
            opacity: 0;
            transform: scale(0.2);
            box-shadow: 0 0 0 rgba(255, 255, 255, 0);
          }
          30% {
            opacity: 1;
            transform: scale(1.5);
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
          }
          70% {
            opacity: 0.8;
            transform: scale(1.2);
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.6);
          }
          100% {
            opacity: 0;
            transform: scale(1);
            box-shadow: 0 0 0 rgba(255, 255, 255, 0);
          }
        }

        /* Tribune flash positions */
        .tribune-flash-1 { top: 8%; left: 12%; }
        .tribune-flash-2 { top: 6%; left: 25%; }
        .tribune-flash-3 { top: 10%; left: 38%; }
        .tribune-flash-4 { top: 7%; left: 51%; }
        .tribune-flash-5 { top: 9%; left: 64%; }
        .tribune-flash-6 { top: 5%; left: 77%; }
        .tribune-flash-7 { top: 11%; left: 88%; }
        .tribune-flash-8 { top: 12%; left: 5%; }
        .tribune-flash-9 { top: 14%; left: 18%; }
        .tribune-flash-10 { top: 13%; left: 31%; }
        .tribune-flash-11 { top: 15%; left: 44%; }
        .tribune-flash-12 { top: 12%; left: 57%; }
        .tribune-flash-13 { top: 16%; left: 70%; }
        .tribune-flash-14 { top: 14%; left: 83%; }
        .tribune-flash-15 { top: 18%; left: 95%; }
        .tribune-flash-16 { top: 20%; left: 8%; }
        .tribune-flash-17 { top: 19%; left: 21%; }
        .tribune-flash-18 { top: 21%; left: 34%; }
        .tribune-flash-19 { top: 18%; left: 47%; }
        .tribune-flash-20 { top: 22%; left: 60%; }
        .tribune-flash-21 { top: 20%; left: 73%; }
        .tribune-flash-22 { top: 24%; left: 86%; }
        .tribune-flash-23 { top: 26%; left: 15%; }
        .tribune-flash-24 { top: 25%; left: 28%; }
        .tribune-flash-25 { top: 27%; left: 41%; }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .game-field {
            background-size: 240% auto !important;
            background-position: center 75% !important;
          }
          
          .game-field-shooter {
            background-size: 240% auto !important;
            background-position: center 75% !important;
          }
          
          .game-field-keeper {
            background-size: 240% auto !important;
            background-position: center 75% !important;
          }
          
          .game-field-result {
            background-size: 240% auto !important;
            background-position: center 75% !important;
          }
          
          .game-content {
            padding: 0.5vh 0.5vw;
            height: 100vh;
            height: 100dvh;
          }
        }
      `}</style>
    </div>
  );
}