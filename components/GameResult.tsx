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
      {/* Suspense Header - No spoilers */}
      {!showFinalResult && (
        <div className="text-center bg-gradient-to-r from-gray-500 to-gray-600 text-white p-8 rounded-xl shadow-2xl">
          <div className="text-6xl mb-4">⚽</div>
          <h1 className="text-3xl font-bold mb-2">
            Elfmeterschießen läuft...
          </h1>
          <p className="text-lg opacity-90 mb-4">
            Schau dir die spannende Animation an!
          </p>
          
          {/* Skip to Results Button */}
          <button
            onClick={skipToResults}
            className="px-6 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all duration-200"
          >
            📊 Direkt zum Ergebnis
          </button>
        </div>
      )}

      {/* Modern Scoreboard Result */}
      {showFinalResult && (
        <div className="scoreboard max-w-4xl mx-auto">
          <h1 className={`score-result ${
            isDraw ? '' : isWinner ? 'victory' : 'defeat'
          }`}>
            {isDraw ? 'Unentschieden' : isWinner ? 'Sieg' : 'Niederlage'}
          </h1>
          
          <div className="score-display">
            {result.scoreA} : {result.scoreB}
          </div>
          
          <p className="body-lg">
            {isDraw ? 'Beide gleich stark!' : isWinner ? 'Glückwunsch!' : 'Nächstes Mal besser!'}
          </p>
        </div>
      )}

      {/* Modern Statistics Display */}
      {showFinalResult && (
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Player Stats */}
          <div className="modern-card">
            <h3 className="heading-sm text-center mb-4">Spieler</h3>
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                {yourUser ? (
                  <UserAvatar user={yourUser} size="md" showName={true} />
                ) : (
                  <div className="body-sm mb-2">{yourName}</div>
                )}
                <div className="stat-value text-3xl mt-2">
                  {playerRole === 'player_a' ? result.scoreA : result.scoreB}
                </div>
                <div className="stat-label">Punkte</div>
              </div>
              
              <div className="body-lg mx-4">vs</div>
              
              <div className="text-center flex-1">
                {opponentUser ? (
                  <UserAvatar user={opponentUser} size="md" showName={true} />
                ) : (
                  <div className="body-sm mb-2">{opponentName}</div>
                )}
                <div className="stat-value text-3xl mt-2">
                  {playerRole === 'player_a' ? result.scoreB : result.scoreA}
                </div>
                <div className="stat-label">Punkte</div>
              </div>
            </div>
          </div>

          {/* Round Details */}
          <div className="modern-card">
            <h3 className="heading-sm text-center mb-4">Runden</h3>
            <div className="space-y-3">
              {result.rounds.map((round, index) => {
                const isYourRound = round.shooter === playerRole;
                const youWonRound = (isYourRound && round.goal) || (!isYourRound && !round.goal);
                return (
                  <div key={index} className="match-card">
                    <div className="match-info">
                      <div className={`match-status ${youWonRound ? 'active' : 'finished'}`}></div>
                      <div className="match-details">
                        <div className="match-opponent">
                          Runde {index + 1}
                        </div>
                        <div className="match-type">
                          {isYourRound ? 'Schuss' : 'Parade'}
                        </div>
                      </div>
                    </div>
                    <div className="body-sm">
                      {round.goal ? 'Tor' : 'Gehalten'}
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

      {/* Modern Action Panel */}
      <div className="modern-card max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/garderobe"
            className="btn btn-secondary text-center"
          >
            Zurück zur Garderobe
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
    </div>
  );
}