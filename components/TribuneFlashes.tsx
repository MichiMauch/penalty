'use client';

import { useState, useEffect } from 'react';

export default function TribuneFlashes() {
  const [flashes, setFlashes] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    const flashPositions = [
      'tribune-flash-1', 'tribune-flash-2', 'tribune-flash-3', 
      'tribune-flash-4', 'tribune-flash-5', 'tribune-flash-6',
      'tribune-flash-7', 'tribune-flash-8', 'tribune-flash-9', 
      'tribune-flash-10', 'tribune-flash-11', 'tribune-flash-12',
      'tribune-flash-13', 'tribune-flash-14', 'tribune-flash-15',
      'tribune-flash-16', 'tribune-flash-17', 'tribune-flash-18',
      'tribune-flash-19', 'tribune-flash-20', 'tribune-flash-21',
      'tribune-flash-22', 'tribune-flash-23', 'tribune-flash-24',
      'tribune-flash-25'
    ];

    const triggerRandomFlash = () => {
      // Select 3-8 random flash positions (even more flashes)
      const numberOfFlashes = Math.floor(Math.random() * 6) + 3;
      const selectedFlashes: string[] = [];
      
      for (let i = 0; i < numberOfFlashes; i++) {
        const randomIndex = Math.floor(Math.random() * flashPositions.length);
        const flashId = flashPositions[randomIndex];
        if (!selectedFlashes.includes(flashId)) {
          selectedFlashes.push(flashId);
        }
      }

      // Trigger flashes
      selectedFlashes.forEach((flashId, index) => {
        setTimeout(() => {
          setFlashes(prev => ({ ...prev, [flashId]: true }));
          
          // Remove flash after animation duration
          setTimeout(() => {
            setFlashes(prev => ({ ...prev, [flashId]: false }));
          }, Math.random() > 0.5 ? 500 : 300); // More variety in flash duration
        }, index * (Math.random() * 100)); // Faster succession between flashes
      });
    };

    // Start first flash after a short delay
    const initialDelay = setTimeout(() => {
      triggerRandomFlash();
    }, Math.random() * 2000 + 500); // 0.5-2.5 seconds

    // Set up very frequent flashes
    const interval = setInterval(() => {
      triggerRandomFlash();
    }, Math.random() * 2000 + 800); // Every 0.8-2.8 seconds

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  const getFlashSize = () => {
    const sizes = ['flash-small', 'flash-medium', 'flash-large'];
    return sizes[Math.floor(Math.random() * sizes.length)];
  };

  const getFlashIntensity = () => {
    return Math.random() > 0.4 ? 'flash-trigger-intense' : 'flash-trigger'; // More intense flashes
  };

  return (
    <>
      {Array.from({length: 25}, (_, i) => {
        const flashId = `tribune-flash-${i + 1}`;
        const isActive = flashes[flashId];
        
        return (
          <div
            key={flashId}
            className={`camera-flash ${flashId} ${getFlashSize()} ${
              isActive ? getFlashIntensity() : ''
            }`}
            style={{
              animationDelay: `${Math.random() * 0.1}s` // Small random delay
            }}
          />
        );
      })}
    </>
  );
}