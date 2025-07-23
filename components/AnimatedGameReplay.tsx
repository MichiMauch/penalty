'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import PenaltyShootout from './PenaltyShootout';
import GameRulesDisplay from './GameRulesDisplay';
import ParticleEffect from './ParticleEffect';
import CombinedPenaltyAnimation from './CombinedPenaltyAnimation';
import GameEndAnimation from './GameEndAnimation';
import UserAvatar from './UserAvatar';
import { GameResult as GameResultType, AvatarId } from '@/lib/types';

interface AnimatedGameReplayProps {
  result: GameResultType;
  playerRole: 'player_a' | 'player_b';
  playerAEmail?: string;
  playerBEmail?: string;
  playerAUsername?: string;
  playerBUsername?: string;
  playerAAvatar?: AvatarId;
  playerBAvatar?: AvatarId;
  onAnimationComplete?: () => void;
}

interface AnimationState {
  currentPenalty: number; // 0-4 für die 5 Elfmeter
  step: 'intro' | 'prepare' | 'shoot' | 'save' | 'result' | 'complete';
  isPlaying: boolean;
  playbackSpeed: number;
  scoreA: number;
  scoreB: number;
}

export default function AnimatedGameReplay({
  result,
  playerRole,
  playerAEmail,
  playerBEmail,
  playerAUsername,
  playerBUsername,
  playerAAvatar,
  playerBAvatar,
  onAnimationComplete
}: AnimatedGameReplayProps) {
  const [animationState, setAnimationState] = useState<AnimationState>({
    currentPenalty: 0,
    step: 'intro',
    isPlaying: false,
    playbackSpeed: 1,
    scoreA: 0,
    scoreB: 0
  });

  const [playerStates, setPlayerStates] = useState({
    playerA: { move: 'idle', isAnimating: false },
    playerB: { move: 'idle', isAnimating: false }
  });

  const [pointAnimation, setPointAnimation] = useState<{
    show: boolean;
    isGoal: boolean;
    playerName: string;
  }>({ show: false, isGoal: false, playerName: '' });

  const [particleEffect, setParticleEffect] = useState<{
    show: boolean;
    type: 'goal' | 'save' | 'celebration';
    x: number;
    y: number;
  }>({ show: false, type: 'goal', x: 50, y: 50 });

  const [screenShake, setScreenShake] = useState(false);
  const [showGameEndAnimation, setShowGameEndAnimation] = useState(false);

  const playerAName = playerAUsername || playerAEmail || 'Spieler A';
  const playerBName = playerBUsername || playerBEmail || 'Spieler B';

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
  
  const currentPenaltyData = result.rounds[animationState.currentPenalty];
  const isPlayerAShooting = currentPenaltyData?.shooter === 'player_a';

  // Animation timing (adjusted by playback speed) - Simplified for combined animation
  const timings = useMemo(() => ({
    intro: 1000,
    prepare: 500,   // Shorter preparation
    shoot: 100,     // Very short - just trigger combined animation
    save: 3000,     // Show combined animation
    result: 1500    // Show result
  }), []);

  const getAdjustedTiming = useCallback((timing: number) => timing / animationState.playbackSpeed, [animationState.playbackSpeed]);

  const nextStep = useCallback(() => {
    setAnimationState(prev => {
      const { currentPenalty, step } = prev;
      
      switch (step) {
        case 'intro':
          return { ...prev, step: 'prepare' };
          
        case 'prepare':
          return { ...prev, step: 'shoot' };
          
        case 'shoot':
          return { ...prev, step: 'save' };
          
        case 'save':
          return { ...prev, step: 'result' };
          
        case 'result':
          // Update scores based on current penalty result
          const currentPenaltyResult = result.rounds[currentPenalty];
          let newScoreA = prev.scoreA;
          let newScoreB = prev.scoreB;
          
          // Elfmeter-Punktesystem: Jeder Elfmeter gibt einen Punkt
          if (currentPenaltyResult?.goal) {
            // Tor erzielt - Schütze bekommt Punkt
            if (currentPenaltyResult.shooter === 'player_a') {
              newScoreA++;
            } else {
              newScoreB++;
            }
          } else {
            // Ball gehalten - Torwart bekommt Punkt
            if (currentPenaltyResult?.shooter === 'player_a') {
              newScoreB++;
            } else {
              newScoreA++;
            }
          }
          
          // Check if all penalties are complete
          if (currentPenalty >= 4) {
            return { 
              ...prev, 
              step: 'complete',
              scoreA: newScoreA,
              scoreB: newScoreB
            };
          } else {
            // Continue with next penalty
            return { 
              ...prev, 
              currentPenalty: currentPenalty + 1,
              step: 'prepare',
              scoreA: newScoreA,
              scoreB: newScoreB
            };
          }
          
        default:
          return prev;
      }
    });
  }, [result]);

  const playAnimation = useCallback(() => {
    if (!animationState.isPlaying || animationState.step === 'complete') return;

    const { step } = animationState;
    
    switch (step as AnimationState['step']) {
      case 'intro':
        // Show players entering the penalty area
        setPlayerStates({
          playerA: { move: 'idle', isAnimating: true },
          playerB: { move: 'idle', isAnimating: true }
        });
        setTimeout(() => nextStep(), getAdjustedTiming(timings.intro));
        break;

      case 'prepare':
        // Players get ready for this penalty
        setPlayerStates({
          playerA: { move: 'idle', isAnimating: false },
          playerB: { move: 'idle', isAnimating: false }
        });
        setTimeout(() => nextStep(), getAdjustedTiming(timings.prepare));
        break;

      case 'shoot':
        // Just move to save step quickly - combined animation handles everything
        setTimeout(() => nextStep(), getAdjustedTiming(timings.shoot));
        break;

      case 'save':
        // Combined animation is running - wait for it to complete
        setTimeout(() => nextStep(), getAdjustedTiming(timings.save));
        break;

      case 'result':
        // Just wait and move to next penalty
        setTimeout(() => nextStep(), getAdjustedTiming(timings.result));
        break;

      case 'complete':
        // Animation finished - show game end animation
        setPlayerStates({
          playerA: { move: 'idle', isAnimating: false },
          playerB: { move: 'idle', isAnimating: false }
        });
        // Show win/lose animation after short delay
        setTimeout(() => {
          setShowGameEndAnimation(true);
        }, 500);
        break;
    }
  }, [animationState, currentPenaltyData, nextStep, onAnimationComplete, getAdjustedTiming, timings]);

  useEffect(() => {
    if (animationState.isPlaying && animationState.step !== 'complete') {
      playAnimation();
    }
  }, [animationState.isPlaying, animationState.step, playAnimation]);

  const togglePlayPause = () => {
    setAnimationState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const skipAnimation = () => {
    // Restart animation from beginning
    setShowGameEndAnimation(false);
    setAnimationState({
      currentPenalty: 0,
      step: 'intro',
      isPlaying: true,
      playbackSpeed: 1,
      scoreA: 0,
      scoreB: 0
    });
  };

  const startAnimation = () => {
    setAnimationState(prev => ({ ...prev, isPlaying: true }));
  };

  // Auto-start after 1 second
  useEffect(() => {
    const timer = setTimeout(() => {
      if (animationState.step === 'intro' && !animationState.isPlaying) {
        startAnimation();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [animationState.step, animationState.isPlaying]);

  const getRoundDescription = () => {
    if (animationState.step === 'complete') {
      return `Elfmeterschießen beendet! ${result.winner === 'draw' ? 'Unentschieden' : 
        result.winner === 'player_a' ? `${playerAName} gewinnt` : `${playerBName} gewinnt`}`;
    }
    
    if (animationState.step === 'intro') {
      return 'Bereit zum Elfmeterschießen...';
    }
    
    if (!currentPenaltyData) return 'Lade Elfmeter...';
    
    const shooter = currentPenaltyData.shooter === 'player_a' ? playerAName : playerBName;
    const keeper = currentPenaltyData.shooter === 'player_a' ? playerBName : playerAName;
    
    return `⚽ ${shooter} vs 🧤 ${keeper}`;
  };

  return (
    <div className={`animated-game-replay ${screenShake ? 'animate-shake' : ''}`}>
      {/* Import Enhanced CSS */}
      <style jsx>{`
        @import url('/styles/fighterAnimations.css');
        @import url('/styles/enhancedFighterAnimations.css');
      `}</style>
      
      {/* Round Information */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">{getRoundDescription()}</h3>
        <div className="text-lg">
          <span className={`font-bold transition-all duration-300 ${
            pointAnimation.show && ((pointAnimation.isGoal && isPlayerAShooting) || (!pointAnimation.isGoal && !isPlayerAShooting))
              ? 'text-blue-800 text-2xl animate-pulse transform scale-110' 
              : 'text-blue-600'
          }`}>
            {playerAName}: {animationState.scoreA}
          </span>
          <span className="mx-4 text-gray-500">vs</span>
          <span className={`font-bold transition-all duration-300 ${
            pointAnimation.show && ((pointAnimation.isGoal && !isPlayerAShooting) || (!pointAnimation.isGoal && isPlayerAShooting))
              ? 'text-red-800 text-2xl animate-pulse transform scale-110' 
              : 'text-red-600'
          }`}>
            {playerBName}: {animationState.scoreB}
          </span>
        </div>
      </div>


      {/* Combined Penalty Animation */}
      <div className="mb-2 max-w-2xl mx-auto">
        <div className="relative">
          <CombinedPenaltyAnimation
            shotDirection={currentPenaltyData?.shooterMove || 'mitte'}
            saveDirection={currentPenaltyData?.keeperMove || 'mitte'}
            isAnimating={(animationState.step === 'shoot' || animationState.step === 'save') && !!currentPenaltyData}
            onAnimationComplete={() => {}}
          />
          
          {/* Schlussspielstand - nur nach Animation anzeigen */}
          {animationState.step === 'complete' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
              <div className="bg-white/95 backdrop-blur rounded-2xl px-12 py-8 shadow-2xl border-4 border-green-500">
                <div className="text-9xl font-bold text-center text-gray-800">
                  {result.scoreA} : {result.scoreB}
                </div>
                <div className="text-2xl text-center text-gray-600 mt-4 font-semibold">
                  Endstand
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Animation Controls - direkt unter dem Bild */}
        <div className="flex justify-center gap-3 mt-2">
          <button
            onClick={togglePlayPause}
            className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center text-xl transition-colors duration-200 shadow-lg"
            title={animationState.isPlaying ? "Pause" : "Starten"}
          >
            {animationState.isPlaying ? '⏸️' : '▶️'}
          </button>

          <button
            onClick={skipAnimation}
            className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center text-xl transition-colors duration-200 shadow-lg"
            title="Wiederholen"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Player Names and Roles - aligned with image edges */}
      <div className="flex justify-between mb-4 max-w-2xl mx-auto">
        <div className="text-left">
          <div className={`flex items-center gap-2 mb-2 ${
            isPlayerAShooting ? 'text-green-600' : 'text-blue-600'
          }`}>
            {playerAUser ? (
              <UserAvatar user={playerAUser} size="md" showName={true} />
            ) : (
              <div className="font-bold text-lg">{playerAName}</div>
            )}
          </div>
          <div className={`px-4 py-2 rounded-full text-lg font-semibold inline-block ${
            isPlayerAShooting 
              ? 'bg-green-200 text-green-800' 
              : 'bg-blue-200 text-blue-800'
          }`}>
            {isPlayerAShooting ? '⚽ SCHÜTZE' : '🧤 TORWART'}
          </div>
        </div>
        
        <div className="text-right">
          <div className={`flex items-center gap-2 mb-2 justify-end ${
            !isPlayerAShooting ? 'text-green-600' : 'text-blue-600'
          }`}>
            {playerBUser ? (
              <UserAvatar user={playerBUser} size="md" showName={true} />
            ) : (
              <div className="font-bold text-lg">{playerBName}</div>
            )}
          </div>
          <div className={`px-4 py-2 rounded-full text-lg font-semibold inline-block ${
            !isPlayerAShooting 
              ? 'bg-green-200 text-green-800' 
              : 'bg-blue-200 text-blue-800'
          }`}>
            {!isPlayerAShooting ? '⚽ SCHÜTZE' : '🧤 TORWART'}
          </div>
        </div>
      </div>



      {/* Game End Animation */}
      <GameEndAnimation
        winner={result.winner}
        playerRole={playerRole}
        playerAName={playerAName}
        playerBName={playerBName}
        show={showGameEndAnimation}
        onComplete={() => {
          setShowGameEndAnimation(false);
          onAnimationComplete?.();
        }}
      />

    </div>
  );
}