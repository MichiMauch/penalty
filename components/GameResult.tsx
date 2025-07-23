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
  const [showAnimation, setShowAnimation] = useState(true);
  
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

  const skipToResults = () => {
    setShowAnimation(false);
    setShowFinalResult(true);
  };
  
  return (
    <div className="space-y-8">
      {/* Immediate Result Header - Always Visible */}
      <div className="text-center bg-gradient-to-r from-green-500 to-blue-500 text-white p-8 rounded-xl shadow-2xl">
        <div className="text-6xl mb-4">
          {isDraw ? '🤝' : isWinner ? '🎉' : '😔'}
        </div>
        <h1 className="text-4xl font-bold mb-2">
          {isDraw ? 'UNENTSCHIEDEN!' : isWinner ? 'SIEG!' : 'NIEDERLAGE!'}
        </h1>
        <div className="text-2xl font-bold mb-4">
          {result.scoreA} : {result.scoreB}
        </div>
        <p className="text-lg opacity-90">
          {isDraw ? 'Beide waren gleich stark!' : isWinner ? 'Glückwunsch! Du warst besser!' : 'Beim nächsten Mal klappt es bestimmt!'}
        </p>
        
        {/* Skip Animation Button */}
        {showAnimation && !showFinalResult && (
          <button
            onClick={skipToResults}
            className="mt-4 px-6 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all duration-200"
          >
            ⏭️ Animation überspringen
          </button>
        )}
      </div>

      {/* Detailed Statistics - Show after animation or skip */}
      {showFinalResult && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Player Comparison */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-center">👥 Spieler Vergleich</h3>
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                {yourUser ? (
                  <UserAvatar user={yourUser} size="md" showName={true} />
                ) : (
                  <div className="font-bold">{yourName}</div>
                )}
                <div className="text-2xl font-bold text-green-600 mt-2">
                  {playerRole === 'player_a' ? result.scoreA : result.scoreB}
                </div>
                <div className="text-sm text-gray-500">Punkte</div>
              </div>
              
              <div className="text-2xl font-bold text-gray-400 mx-4">VS</div>
              
              <div className="text-center flex-1">
                {opponentUser ? (
                  <UserAvatar user={opponentUser} size="md" showName={true} />
                ) : (
                  <div className="font-bold">{opponentName}</div>
                )}
                <div className="text-2xl font-bold text-blue-600 mt-2">
                  {playerRole === 'player_a' ? result.scoreB : result.scoreA}
                </div>
                <div className="text-sm text-gray-500">Punkte</div>
              </div>
            </div>
          </div>

          {/* Round by Round Breakdown */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-center">📊 Runden-Übersicht</h3>
            <div className="space-y-2">
              {result.rounds.map((round, index) => {
                const isYourRound = round.shooter === playerRole;
                const youWonRound = (isYourRound && round.goal) || (!isYourRound && !round.goal);
                return (
                  <div key={index} className={`flex items-center justify-between p-2 rounded ${youWonRound ? 'bg-green-50' : 'bg-red-50'}`}>
                    <span className="font-medium">Runde {index + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {isYourRound ? 'Du schießt' : 'Du hältst'}
                      </span>
                      <span className="text-lg">
                        {round.goal ? '⚽' : '🧤'}
                      </span>
                      <span className={`font-bold ${youWonRound ? 'text-green-600' : 'text-red-600'}`}>
                        {youWonRound ? '+1' : '0'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Animated Replay - Only if not skipped */}
      {showAnimation && (
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
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Link
          href="/garderobe"
          className="px-8 py-4 bg-green-500 text-white text-lg font-bold rounded-lg hover:bg-green-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
        >
          🏠 Zurück zur Garderobe
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