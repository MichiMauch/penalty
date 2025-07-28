'use client';

import { useState, useEffect } from 'react';
import { GiSoccerBall } from 'react-icons/gi';

export default function PenaltyAnimations() {
  const [ballAnimation, setBallAnimation] = useState<string | null>(null);
  const [glovesAnimation, setGlovesAnimation] = useState('gloves-idle');
  const [showBall, setShowBall] = useState(false);

  useEffect(() => {
    const startBallAnimation = () => {
      // Random animation type
      const animationType = Math.random() > 0.5 ? 'ball-bounce' : 'ball-roll';
      
      setShowBall(true);
      setBallAnimation(animationType);
      
      // Trigger gloves catch animation when ball is in the middle
      const catchDelay = animationType === 'ball-bounce' ? 3000 : 2000;
      setTimeout(() => {
        setGlovesAnimation('gloves-catch');
        setTimeout(() => {
          setGlovesAnimation('gloves-idle');
        }, 1500);
      }, catchDelay);
      
      // Hide ball after animation completes
      const animationDuration = animationType === 'ball-bounce' ? 6000 : 4000;
      setTimeout(() => {
        setShowBall(false);
        setBallAnimation(null);
      }, animationDuration);
    };

    // Start first animation after a delay
    const initialDelay = setTimeout(() => {
      startBallAnimation();
    }, 3000);

    // Set up recurring animations
    const interval = setInterval(() => {
      startBallAnimation();
    }, Math.random() * 20000 + 15000); // Random interval between 15-35 seconds

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {/* Animated Ball */}
      {showBall && (
        <div className={`animated-ball ${ballAnimation}`}>
          <GiSoccerBall />
        </div>
      )}
      
      {/* Goalkeeper Gloves */}
      <div className={`goalkeeper-gloves ${glovesAnimation}`}>
        🥅
      </div>
    </>
  );
}