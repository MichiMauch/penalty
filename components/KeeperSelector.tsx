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
    <div className="space-y-6">
      {/* Challenge Received Header */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6 text-center">
        <h2 className="text-2xl font-bold text-blue-800 mb-4">
          ⚽ Du wurdest zum Elfmeterschießen herausgefordert! 🧤
        </h2>
        <div className="flex items-center justify-center gap-4 mb-4">
          {/* Challenger */}
          <div className="flex flex-col items-center">
            <p className="text-sm text-gray-600 mb-2">Herausforderer:</p>
            {challengerUser ? (
              <UserAvatar user={challengerUser} size="md" showName={true} />
            ) : (
              <div className="font-semibold text-green-600">{challengerName}</div>
            )}
          </div>
          
          <div className="text-2xl mx-4">VS</div>
          
          {/* You */}
          <div className="flex flex-col items-center">
            <p className="text-sm text-gray-600 mb-2">Du:</p>
            {playerBUser ? (
              <UserAvatar user={playerBUser} size="md" showName={true} />
            ) : (
              <div className="font-semibold text-blue-600">{playerBName}</div>
            )}
          </div>
        </div>
        <p className="text-blue-700 font-medium">
          Wähle deine 5 Parade-Richtungen strategisch!
        </p>
      </div>

      {/* Save Selection */}
      <div>
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
          />
        </div>
      </div>


      {/* Bruce Button - immer anzeigen */}
      <div className="mb-4">
        <button
          onClick={() => setShowBruceDialog(true)}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 font-semibold transition-all duration-300 transform hover:scale-105"
        >
          🧠 Frag Bruce vor dem Halten  
        </button>
      </div>

      {/* Accept Challenge Button */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`w-full px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 ${
          canSubmit
            ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white hover:from-blue-600 hover:to-green-600 transform hover:scale-105 shadow-lg'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isSubmitting ? '⏳ Paraden werden gesendet...' : 
         canSubmit ? '🧤 HERAUSFORDERUNG ANNEHMEN! 🧤' : 
         `Wähle noch ${5 - saves.length} Paraden`}
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