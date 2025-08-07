'use client';

import { useState, useCallback, useEffect } from 'react';
import { ShotDirection, PlayerMoves, SaveDirection, AvatarId } from '@/lib/types';
import GoalAnimation from './GoalAnimation';
import BruceDialog from './BruceDialog';
import UserAvatar from './UserAvatar';

interface PenaltySelectorProps {
  matchId: string;
  onSubmit: (moves: PlayerMoves, opponentEmail?: string) => Promise<void>;
  disabled?: boolean;
  playerAEmail?: string;
  playerBEmail?: string; // Falls bereits ein Gegner existiert
  playerAUsername?: string;
  playerBUsername?: string;
  playerAAvatar?: AvatarId;
  playerBAvatar?: AvatarId;
  opponentKeepermoves?: SaveDirection[]; // Für Bruce Analysis
  role?: 'shooter' | 'keeper'; // Neue Prop für Rolle
}

interface ShotOption {
  direction: ShotDirection;
  name: string;
  icon: string;
  description: string;
}

const shotOptions: ShotOption[] = [
  { direction: 'links' as ShotDirection, name: 'Links', icon: '⬅️', description: 'Schuss ins linke Eck' },
  { direction: 'mitte' as ShotDirection, name: 'Mitte', icon: '🎯', description: 'Schuss in die Mitte' },
  { direction: 'rechts' as ShotDirection, name: 'Rechts', icon: '➡️', description: 'Schuss ins rechte Eck' }
];

export default function PenaltySelector({ 
  matchId, 
  onSubmit, 
  disabled, 
  playerAEmail, 
  playerBEmail, 
  playerAUsername,
  playerBUsername,
  playerAAvatar,
  playerBAvatar,
  opponentKeepermoves = [],
  role = 'shooter'
}: PenaltySelectorProps) {
  const [shots, setShots] = useState<ShotDirection[]>([]);
  const [opponentEmail, setOpponentEmail] = useState(playerBEmail || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animatingDirection, setAnimatingDirection] = useState<ShotDirection | null>(null);
  const [showBruceDialog, setShowBruceDialog] = useState(false);
  const [showControlsPulse, setShowControlsPulse] = useState(true);
  
  // Wenn bereits ein Gegner existiert, keine E-Mail-Eingabe nötig
  // Für Keeper-Rolle nie Opponent-Selection anzeigen
  const hasOpponent = !!playerBEmail || role === 'keeper';

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

  const playerAName = playerAUsername || playerAEmail || 'Du';
  const playerBName = playerBUsername || playerBEmail || 'Gegner';
  
  const gameUrl = typeof window !== 'undefined' ? 
    `${window.location.origin}/game/${matchId}` : '';

  // Start pulse animation when component loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowControlsPulse(false);
    }, 4000); // Show pulse for 4 seconds (2 pulses at 2s each)

    return () => clearTimeout(timer);
  }, []);
  
  const handleShotSelect = useCallback((direction: ShotDirection) => {
    if (shots.length < 5) {
      // Show animation before adding shot
      setAnimatingDirection(direction);
      setShowAnimation(true);
      
      // Add shot after animation completes
      setTimeout(() => {
        setShots(prev => [...prev, direction]);
        setShowAnimation(false);
        setAnimatingDirection(null);
      }, 1500);
    }
  }, [shots.length]);
  
  const handleRemoveShot = (index: number) => {
    setShots(shots.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async () => {
    if (shots.length === 5) {
      // For keeper role, we don't need opponent email (already set)
      if (role === 'keeper' || hasOpponent || opponentEmail.trim()) {
        setIsSubmitting(true);
        try {
          await onSubmit(
            { moves: shots, role: role === 'keeper' ? 'keeper' : 'shooter' }, 
            role === 'keeper' ? undefined : opponentEmail.trim()
          );
        } finally {
          setIsSubmitting(false);
        }
      }
    }
  };
  
  const canSubmit = shots.length === 5 && (role === 'keeper' || hasOpponent || !!opponentEmail.trim()) && !disabled && !isSubmitting;
  
  const shareViaWhatsApp = () => {
    const text = `Lass uns Fußballpause spielen! ⚽ Elfmeterschießen - wer gewinnt? Klicke hier: ${gameUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  const shareViaSlack = () => {
    const text = `Lass uns Fußballpause spielen! ⚽ Elfmeterschießen - wer gewinnt? Klicke hier: ${gameUrl}`;
    navigator.clipboard.writeText(text);
    alert('Link wurde in die Zwischenablage kopiert! Füge ihn in Slack ein.');
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(gameUrl);
    alert('Link kopiert!');
  };
  
  return (
    <div className="space-y-6">
      {/* Opponent Email Input - nur zeigen wenn kein Gegner existiert */}
      {!hasOpponent && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-800 mb-3">
          ⚽ Wen willst du zum Elfmeterschießen herausfordern?
        </h3>
        {(playerAUser || playerAEmail) && (
          <div className="mb-3">
            <p className="text-sm text-green-600 mb-2">Du spielst als:</p>
            {playerAUser ? (
              <UserAvatar user={playerAUser} size="sm" showName={true} />
            ) : (
              <strong className="text-green-800">{playerAEmail}</strong>
            )}
          </div>
        )}
        <div className="space-y-3">
          <input
            type="email"
            placeholder="E-Mail-Adresse deines Gegners"
            value={opponentEmail}
            onChange={(e) => setOpponentEmail(e.target.value)}
            className="w-full px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={isSubmitting}
          />
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">oder teile den Link direkt:</span>
            <button
              onClick={() => setShowShareOptions(!showShareOptions)}
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              {showShareOptions ? 'Schließen' : 'Link teilen →'}
            </button>
          </div>
          
          {showShareOptions && (
            <div className="bg-white border border-green-200 rounded-lg p-3 space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={shareViaWhatsApp}
                  className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-medium"
                >
                  📱 WhatsApp
                </button>
                <button
                  onClick={shareViaSlack}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                >
                  💬 Slack
                </button>
                <button
                  onClick={copyToClipboard}
                  className="flex-1 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium"
                >
                  📋 Kopieren
                </button>
              </div>
              <div className="bg-gray-50 p-2 rounded text-xs break-all">
                {gameUrl}
              </div>
            </div>
          )}
        </div>
        </div>
      )}


      {/* Shot Selection */}
      <div className="relative">
        {/* Goal Animation - Always visible */}
        <div className="mb-6">
          <GoalAnimation 
            shotDirection={animatingDirection || 'mitte'}
            isAnimating={showAnimation}
            shots={shots}
            onRemoveShot={handleRemoveShot}
            onAddShot={handleShotSelect}
            disabled={shots.length >= 5 || isSubmitting || showAnimation}
            onAnimationComplete={() => {
              setShowAnimation(false);
              setAnimatingDirection(null);
            }}
            onSubmit={handleSubmit}
            canSubmit={canSubmit}
            isSubmitting={isSubmitting}
            role={role}
            showControlsPulse={showControlsPulse}
          />
        </div>


        {/* Bruce Button completely disabled */}

        <style jsx>{`
          @keyframes pulse-bruce {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
            }
            50% {
              transform: scale(1.05);
              box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
            }
          }
          
          .fixed.animate-pulse {
            animation: pulse-bruce 2s ease-in-out infinite;
          }
        `}</style>
      </div>

      {/* Bruce Dialog */}
      <BruceDialog
        isOpen={showBruceDialog}
        onClose={() => setShowBruceDialog(false)}
        opponentKeepermoves={opponentKeepermoves}
        opponentShooterMoves={[]}
        opponentName={playerBName}
        onContinueRevenge={() => setShowBruceDialog(false)}
        context="shooting"
      />

    </div>
  );
}