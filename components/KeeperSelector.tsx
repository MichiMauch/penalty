'use client';

import { useState, useCallback } from 'react';
import { SaveDirection, PlayerMoves, ShotDirection, AvatarId } from '@/lib/types';
import KeeperAnimation from './KeeperAnimation';
import BruceDialog from './BruceDialog';
import UserAvatar from './UserAvatar';

interface KeeperSelectorProps {
  onSubmit: (moves: PlayerMoves) => Promise<void>;
  disabled?: boolean;
  challengerEmail: string;
  playerBEmail?: string;
  challengerUsername?: string;
  playerBUsername?: string;
  challengerAvatar?: AvatarId;
  playerBAvatar?: AvatarId;
  opponentShooterMoves?: ShotDirection[]; // Für Bruce Analysis
}

interface SaveOption {
  direction: SaveDirection;
  name: string;
  icon: string;
  description: string;
  saves: string;
}

const saveOptions: SaveOption[] = [
  { 
    direction: 'links' as SaveDirection, 
    name: 'Links', 
    icon: '⬅️', 
    description: 'Hecht ins linke Eck', 
    saves: 'Hält ⬅️ Schüsse'
  },
  { 
    direction: 'mitte' as SaveDirection, 
    name: 'Mitte', 
    icon: '🎯', 
    description: 'Bleib in der Mitte', 
    saves: 'Hält 🎯 Schüsse'
  },
  { 
    direction: 'rechts' as SaveDirection, 
    name: 'Rechts', 
    icon: '➡️', 
    description: 'Hecht ins rechte Eck', 
    saves: 'Hält ➡️ Schüsse'
  }
];

export default function KeeperSelector({ 
  onSubmit, 
  disabled, 
  challengerEmail,
  playerBEmail,
  challengerUsername,
  playerBUsername,
  challengerAvatar,
  playerBAvatar,
  opponentShooterMoves = []
}: KeeperSelectorProps) {
  const [saves, setSaves] = useState<SaveDirection[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animatingDirection, setAnimatingDirection] = useState<SaveDirection | null>(null);
  const [showBruceDialog, setShowBruceDialog] = useState(false);

  // Create user objects for avatar display
  const challengerUser = challengerUsername && challengerAvatar ? {
    id: 'challenger',
    email: challengerEmail,
    username: challengerUsername,
    avatar: challengerAvatar,
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

  const challengerName = challengerUsername || challengerEmail || 'Ein Spieler';
  const playerBName = playerBUsername || playerBEmail || 'dich';
  
  const handleSaveSelect = useCallback((direction: SaveDirection) => {
    if (saves.length < 5) {
      // Show animation before adding save
      setAnimatingDirection(direction);
      setShowAnimation(true);
      
      // Add save after animation
      setTimeout(() => {
        setSaves(prev => [...prev, direction]);
        setShowAnimation(false);
        setAnimatingDirection(null);
      }, 1500);
    }
  }, [saves.length]);
  
  const handleRemoveSave = (index: number) => {
    setSaves(saves.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async () => {
    if (saves.length === 5) {
      setIsSubmitting(true);
      try {
        await onSubmit({ moves: saves, role: 'keeper' });
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  const canSubmit = saves.length === 5 && !disabled && !isSubmitting;
  
  return (
    <div className="relative">
      {/* Keeper Animation - Always visible */}
      <div className="mb-6">
        <KeeperAnimation 
          saveDirection={animatingDirection || 'mitte'}
          isAnimating={showAnimation}
          saves={saves}
          onRemoveSave={handleRemoveSave}
          onAddSave={handleSaveSelect}
          disabled={saves.length >= 5 || isSubmitting || showAnimation}
          onAnimationComplete={() => {
            setShowAnimation(false);
            setAnimatingDirection(null);
          }}
          onSubmit={handleSubmit}
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
        />
      </div>


      {/* Global Bruce Button - Fixed in screen corner */}
      <button
        onClick={() => setShowBruceDialog(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-white rounded-full shadow-2xl border-4 border-green-500 flex items-center justify-center hover:bg-gray-50 transition-all duration-200 transform hover:scale-110 z-40 animate-pulse"
      >
        <img src="/bruce.png" alt="Bruce" className="w-12 h-12 rounded-full object-cover"/>
      </button>

      {/* Bruce Dialog */}
      <BruceDialog
        isOpen={showBruceDialog}
        onClose={() => setShowBruceDialog(false)}
        opponentKeepermoves={[]}
        opponentShooterMoves={opponentShooterMoves}
        opponentName={challengerName}
        onContinueRevenge={() => setShowBruceDialog(false)}
      />

    </div>
  );
}