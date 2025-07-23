import Link from 'next/link';
import { useState } from 'react';
import { GameResult as GameResultType, AvatarId } from '@/lib/types';
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
  
  const isWinner = result.winner === playerRole;
  const isDraw = result.winner === 'draw';
  
  const playerAName = playerAUsername || playerAEmail || 'Spieler A';
  const playerBName = playerBUsername || playerBEmail || 'Spieler B';
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
  
  return (
    <div className="space-y-8">

      {/* Header mit Ergebnis - nur nach Animation anzeigen */}
      {showFinalResult && (
        <div className="text-center bg-gray-50 p-6 rounded-lg">
          <h2 className="text-3xl font-bold mb-4">
            {isDraw ? '🤝 Unentschieden!' : isWinner ? '🎉 Du hast gewonnen!' : '😔 Du hast verloren'}
          </h2>
          
          {/* Player vs Player with Avatars */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex flex-col items-center">
              {playerAUser ? (
                <UserAvatar user={playerAUser} size="lg" showName={true} />
              ) : (
                <div className="text-lg font-bold">{playerAName}</div>
              )}
            </div>
            
            <div className="text-2xl font-bold mx-4">VS</div>
            
            <div className="flex flex-col items-center">
              {playerBUser ? (
                <UserAvatar user={playerBUser} size="lg" showName={true} />
              ) : (
                <div className="text-lg font-bold">{playerBName}</div>
              )}
            </div>
          </div>
          
          <div className="text-3xl font-bold mb-2">
            {result.scoreA} : {result.scoreB}
          </div>
          
          <div className="text-lg text-gray-600">
            Du ({yourName}): <span className="font-bold">{playerRole === 'player_a' ? result.scoreA : result.scoreB} Punkte</span> • 
            Gegner ({opponentName}): <span className="font-bold">{playerRole === 'player_a' ? result.scoreB : result.scoreA} Punkte</span>
          </div>
        </div>
      )}

      {/* Animated Replay */}
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

      {/* Buttons - immer anzeigen */}
      <div className="flex gap-4 justify-center">
        <Link
          href="/"
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold"
        >
          🏠 Neues Spiel
        </Link>
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
        />
      </div>
    </div>
  );
}