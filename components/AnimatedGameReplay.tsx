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
    save: 2600,     // Wait for combined animation + ball reset
    result: 1500    // Show result
  }), []);

  const getAdjustedTiming = useCallback((timing: number) => timing / animationState.playbackSpeed, [animationState.playbackSpeed]);

  const nextStep = useCallback(() => {
    setAnimationState(prev => {
      const { currentPenalty, step } = prev;
      console.log(`nextStep: currentPenalty=${currentPenalty}, step=${step}`);
      
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
          console.log(`Checking completion: currentPenalty=${currentPenalty}, total rounds=${result.rounds.length}`);
          if (currentPenalty >= 4) {
            console.log('All penalties complete, setting to complete state');
            return { 
              ...prev, 
              step: 'complete',
              scoreA: newScoreA,
              scoreB: newScoreB
            };
          } else {
            console.log(`Moving to next penalty: ${currentPenalty + 1}`);
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

    }
  }, [animationState, nextStep, getAdjustedTiming, timings]);

  useEffect(() => {
    if (animationState.isPlaying && animationState.step !== 'complete') {
      playAnimation();
    }
  }, [animationState.isPlaying, animationState.step, playAnimation]);

  // Handle complete state separately
  useEffect(() => {
    if (animationState.step === 'complete') {
      console.log('Animation reached complete state - directly showing scoreboard');
      // Reset all states completely
      setPlayerStates({
        playerA: { move: 'idle', isAnimating: false },
        playerB: { move: 'idle', isAnimating: false }
      });
      setPointAnimation({ show: false, isGoal: false, playerName: '' });
      setParticleEffect({ show: false, type: 'goal', x: 50, y: 50 });
      setScreenShake(false);
      setShowGameEndAnimation(false);
      
      // Skip game end animation and go directly to scoreboard
      const timer = setTimeout(() => {
        console.log('Calling onAnimationComplete directly');
        onAnimationComplete?.();
      }, 250);
      
      return () => clearTimeout(timer);
    }
  }, [animationState.step, onAnimationComplete]);



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


  return (
    <div className={`animated-game-replay ${screenShake ? 'animate-shake' : ''}`}>
      {/* Import Enhanced CSS */}
      <style jsx>{`
        @import url('/styles/fighterAnimations.css');
        @import url('/styles/enhancedFighterAnimations.css');
      `}</style>
      


      {/* Combined Penalty Animation */}
      <CombinedPenaltyAnimation
        shotDirection={currentPenaltyData?.shooterMove || 'mitte'}
        saveDirection={currentPenaltyData?.keeperMove || 'mitte'}
        isAnimating={(animationState.step === 'shoot' || animationState.step === 'save') && !!currentPenaltyData}
        onAnimationComplete={() => {}}
        playerRole={
          (playerRole === 'player_a' && currentPenaltyData?.shooter === 'player_a') ||
          (playerRole === 'player_b' && currentPenaltyData?.shooter === 'player_b')
            ? 'shooter' : 'keeper'
        }
      />




      {/* Game End Animation */}
      <GameEndAnimation
        winner={result.winner}
        playerRole={playerRole}
        playerAName={playerAName}
        playerBName={playerBName}
        show={showGameEndAnimation}
        onComplete={() => {
          console.log('Game end animation completed, calling onAnimationComplete');
          setShowGameEndAnimation(false);
          // Automatically show scoreboard after game end animation
          onAnimationComplete?.();
        }}
      />

    </div>
  );
}