import Link from 'next/link';
import { useState } from 'react';
import { GameResult as GameResultType, AvatarId } from '@/lib/types';
import { useTranslations } from 'next-intl';
import AnimatedGameReplay from './AnimatedGameReplay';
import RevengeButton from './RevengeButton';
import UserAvatar from './UserAvatar';

interface GameResultProps {
  result: GameResultType;
  playerRole: 'player_a' | 'player_b';
  playerAEmail?: string;
  playerBEmail?: string;
  playerAUsername?: string;
  playerBUsername?: string;
  playerAAvatar?: AvatarId;
  playerBAvatar?: AvatarId;
}


export default function GameResult({ 
  result, 
  playerRole, 
  playerAEmail, 
  playerBEmail, 
  playerAUsername, 
  playerBUsername, 
  playerAAvatar, 
  playerBAvatar 
}: GameResultProps) {
  const [showFinalResult, setShowFinalResult] = useState(false);
  const [showAnimation, setShowAnimation] = useState(true);
  const t = useTranslations('game');
  
  const isWinner = result.winner === playerRole;
  const isDraw = result.winner === 'draw';
  
  // Extract display names (lastname priority)
  const extractDisplayName = (fullName: string): string => {
    if (!fullName) return t('result.defaultPlayerName');
    
    // Check if it's an email
    if (fullName.includes('@')) {
      return fullName.split('@')[0].toUpperCase();
    }
    
    // Split by spaces and get last part (lastname)
    const parts = fullName.trim().split(' ');
    if (parts.length > 1) {
      return parts[parts.length - 1].toUpperCase(); // Last name
    }
    
    return fullName.toUpperCase(); // First name only
  };

  const playerAName = playerAUsername || playerAEmail || t('result.playerA');
  const playerBName = playerBUsername || playerBEmail || t('result.playerB');
  const playerADisplayName = extractDisplayName(playerAName);
  const playerBDisplayName = extractDisplayName(playerBName);
  
  const yourName = playerRole === 'player_a' ? playerAName : playerBName;
  const opponentName = playerRole === 'player_a' ? playerBName : playerAName;

  // Create user objects for avatar display
  const playerAUser = playerAUsername && playerAAvatar ? {
    id: 'player_a',
    email: playerAEmail || '',
    username: playerAUsername,
    avatar: playerAAvatar,
    created_at: '',
    updated_at: ''
  } : null;

  const playerBUser = playerBUsername && playerBAvatar ? {
    id: 'player_b', 
    email: playerBEmail || '',
    username: playerBUsername,
    avatar: playerBAvatar,
    created_at: '',
    updated_at: ''
  } : null;

  const yourUser = playerRole === 'player_a' ? playerAUser : playerBUser;
  const opponentUser = playerRole === 'player_a' ? playerBUser : playerAUser;

  const handleAnimationComplete = () => {
    setShowFinalResult(true);
  };

  const skipToResults = () => {
    setShowAnimation(false);
    setShowFinalResult(true);
  };
  
  return (
    <div className="game-result-container">
      {/* Animated Replay - Only if not skipped */}
      {showAnimation && (
        <>
          {/* Header only during animation */}
          <div className="game-header">
            <div className="pre-result-header">
              <h1 className="result-title">🏆 {t('result.penaltyInProgress')}</h1>
              
              {/* Skip to Results Button */}
              <button
                onClick={skipToResults}
                className="skip-button"
              >
                📊 {t('result.skipToResult')}
              </button>
            </div>
          </div>
          
          <AnimatedGameReplay
            result={result}
            playerRole={playerRole}
            playerAEmail={playerAEmail}
            playerBEmail={playerBEmail}
            playerAUsername={playerAUsername}
            playerBUsername={playerBUsername}
            playerAAvatar={playerAAvatar}
            playerBAvatar={playerBAvatar}
            onAnimationComplete={handleAnimationComplete}
          />
        </>
      )}

      {/* Authentic LED Scoreboard - Centered */}
      {showFinalResult && (
        <div className="led-scoreboard-wrapper">
          {/* Cable attachment points */}
          <div className="cable-attachment-left"></div>
          <div className="cable-attachment-right"></div>
          
          <div className="authentic-led-scoreboard">
          {/* Stadium Header */}
          <div className="led-header led-header-notable">
            PENALTY
          </div>
          
          {/* Main Scoreboard */}
          <div className="led-main-board">
            {/* Player A */}
            <div className="led-player-section">
              <div className="led-player-name">{playerADisplayName}</div>
              <div className="led-score-number">{result.scoreA}</div>
            </div>
            
            {/* VS Separator */}
            <div className="led-vs-separator">VS</div>
            
            {/* Player B */}
            <div className="led-player-section">
              <div className="led-player-name">{playerBDisplayName}</div>
              <div className="led-score-number">{result.scoreB}</div>
            </div>
          </div>
          
          {/* Winner Display */}
          <div className="led-winner-section">
            <div className="led-winner-text">
              {t('result.winner')}: {result.winner === 'player_a' ? playerADisplayName : playerBDisplayName}
            </div>
          </div>
          </div>
          
          {/* Action Buttons - Appear after scoreboard animation */}
          <div className={`led-action-buttons ${isWinner ? 'single-button' : ''}`}>
            <Link
              href="/garderobe"
              className={`btn btn-primary ${isWinner ? 'btn-pill' : 'btn-rounded-left'} led-action-btn`}
            >
              {t('result.toLocker')}
            </Link>
            
            {/* Revenge button only for loser */}
            {!isWinner && (
              <RevengeButton
                playerAEmail={playerAEmail}
                playerBEmail={playerBEmail}
                playerAUsername={playerAUsername}
                playerBUsername={playerBUsername}
                playerAAvatar={playerAAvatar}
                playerBAvatar={playerBAvatar}
                currentPlayerRole={playerRole}
                opponentKeepermoves={result.rounds.map(round => round.keeperMove)}
                opponentShooterMoves={result.rounds.map(round => round.shooterMove)}
                className="btn btn-primary btn-rounded-right led-action-btn"
                buttonText={t('result.revenge')}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}