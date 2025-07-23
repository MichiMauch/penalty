'use client';

import { useEffect, useState } from 'react';

interface ParticleEffectProps {
  show: boolean;
  type: 'hit' | 'block' | 'critical';
  x?: number;
  y?: number;
  duration?: number;
}

export default function ParticleEffect({ 
  show, 
  type, 
  x = 50, 
  y = 50, 
  duration = 1000 
}: ParticleEffectProps) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
  }>>([]);

  useEffect(() => {
    if (!show) {
      setParticles([]);
      return;
    }

    // Generate particles based on effect type
    const generateParticles = () => {
      const newParticles = [];
      const particleCount = type === 'critical' ? 20 : type === 'hit' ? 15 : 10;
      
      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: i,
          x: x + (Math.random() - 0.5) * 20,
          y: y + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8 - 2,
          life: duration,
          maxLife: duration,
          size: Math.random() * 8 + 4,
          color: getParticleColor(type, i)
        });
      }
      
      setParticles(newParticles);
    };

    generateParticles();

    // Animate particles
    const interval = setInterval(() => {
      setParticles(prevParticles => 
        prevParticles.map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.2, // gravity
          life: particle.life - 50
        })).filter(particle => particle.life > 0)
      );
    }, 50);

    // Clean up after duration
    const timeout = setTimeout(() => {
      setParticles([]);
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [show, type, x, y, duration]);

  const getParticleColor = (effectType: string, index: number): string => {
    switch (effectType) {
      case 'hit':
        return ['#ff4444', '#ff6666', '#ff8888', '#ffaa44'][index % 4];
      case 'block':
        return ['#4444ff', '#6666ff', '#8888ff', '#44aaff'][index % 4];
      case 'critical':
        return ['#ffff44', '#ffaa00', '#ff6600', '#ff0000'][index % 4];
      default:
        return '#ffffff';
    }
  };

  if (!show || particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-pulse"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            opacity: particle.life / particle.maxLife,
            transform: `scale(${1 - (particle.maxLife - particle.life) / particle.maxLife * 0.5})`,
            boxShadow: `0 0 ${particle.size}px ${particle.color}`,
            transition: 'all 0.05s ease-out'
          }}
        />
      ))}
      
      {/* Additional effects based on type */}
      {type === 'critical' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-4xl font-bold text-yellow-400 animate-ping">
            💥 CRITICAL! 💥
          </div>
        </div>
      )}
      
      {type === 'hit' && (
        <div 
          className="absolute rounded-full animate-ping"
          style={{
            left: `${x - 10}%`,
            top: `${y - 10}%`,
            width: '60px',
            height: '60px',
            border: '3px solid #ff4444',
            backgroundColor: 'rgba(255, 68, 68, 0.2)'
          }}
        />
      )}
      
      {type === 'block' && (
        <div 
          className="absolute rounded-full animate-pulse"
          style={{
            left: `${x - 15}%`,
            top: `${y - 15}%`,
            width: '80px',
            height: '80px',
            border: '4px solid #4444ff',
            backgroundColor: 'rgba(68, 68, 255, 0.1)'
          }}
        />
      )}
    </div>
  );
}