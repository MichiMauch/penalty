'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from '@/lib/utils';
import { SaveDirection, ShotDirection, AvatarId } from '@/lib/types';

interface RevengeButtonProps {
  playerAEmail?: string;
  playerBEmail?: string;
  playerAUsername?: string;
  playerBUsername?: string;
  playerAAvatar?: AvatarId;
  playerBAvatar?: AvatarId;
  currentPlayerRole: 'player_a' | 'player_b';
  opponentKeepermoves?: SaveDirection[];
  opponentShooterMoves?: ShotDirection[];
}

export default function RevengeButton({ 
  playerAEmail, 
  playerBEmail, 
  playerAUsername,
  playerBUsername,
  playerAAvatar,
  playerBAvatar,
  currentPlayerRole,
  opponentKeepermoves = [],
  opponentShooterMoves = []
}: RevengeButtonProps) {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleRevenge = async () => {
    if (!playerAEmail || !playerBEmail) {
      alert('E-Mail-Adressen fehlen für Revanche');
      return;
    }

    setIsCreating(true);

    try {
      // Erstelle neues Match mit getauschten Rollen
      const newMatchId = nanoid();
      
      // Bei Revanche: Rollen werden getauscht
      // Wer vorher Verteidiger (Player B) war, wird jetzt Angreifer (Player A)
      // Wer vorher Angreifer (Player A) war, wird jetzt Verteidiger (Player B)
      
      // Meine aktuellen Daten
      const myEmail = currentPlayerRole === 'player_a' ? playerAEmail : playerBEmail;
      const myUsername = currentPlayerRole === 'player_a' ? playerAUsername : playerBUsername;
      const myAvatar = currentPlayerRole === 'player_a' ? playerAAvatar : playerBAvatar;
      
      // Gegner Daten
      const opponentEmail = currentPlayerRole === 'player_a' ? playerBEmail : playerAEmail;
      const opponentUsername = currentPlayerRole === 'player_a' ? playerBUsername : playerAUsername;
      const opponentAvatar = currentPlayerRole === 'player_a' ? playerBAvatar : playerAAvatar;
      
      let newPlayerAEmail, newPlayerBEmail, newPlayerAUsername, newPlayerBUsername, newPlayerAAvatar, newPlayerBAvatar;
      if (currentPlayerRole === 'player_b') {
        // Ich war Verteidiger, werde jetzt Angreifer
        newPlayerAEmail = myEmail;
        newPlayerBEmail = opponentEmail;
        newPlayerAUsername = myUsername;
        newPlayerBUsername = opponentUsername;
        newPlayerAAvatar = myAvatar;
        newPlayerBAvatar = opponentAvatar;
      } else {
        // Ich war Angreifer, werde jetzt Verteidiger
        newPlayerAEmail = opponentEmail;
        newPlayerBEmail = myEmail;
        newPlayerAUsername = opponentUsername;
        newPlayerBUsername = myUsername;
        newPlayerAAvatar = opponentAvatar;
        newPlayerBAvatar = myAvatar;
      }

      const response = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-revenge',
          matchId: newMatchId,
          playerAEmail: newPlayerAEmail,
          playerBEmail: newPlayerBEmail,
          playerAUsername: newPlayerAUsername,
          playerBUsername: newPlayerBUsername,
          playerAAvatar: newPlayerAAvatar,
          playerBAvatar: newPlayerBAvatar
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Speichere die neue Player ID für das neue Match
        localStorage.setItem('playerId', data.playerId);
        
        // Navigiere zum neuen Match
        router.push(`/game/${newMatchId}`);
      } else {
        const error = await response.json();
        alert('Fehler beim Erstellen der Revanche: ' + (error.error || 'Unbekannter Fehler'));
      }
    } catch (err) {
      console.error('Error creating revenge match:', err);
      alert('Netzwerkfehler beim Erstellen der Revanche');
    } finally {
      setIsCreating(false);
    }
  };


  return (
    <>
      <button
        onClick={handleRevenge}
        disabled={isCreating || !playerAEmail || !playerBEmail}
        className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
          isCreating || !playerAEmail || !playerBEmail
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transform hover:scale-105'
        }`}
      >
        {isCreating ? '⏳ Erstelle Revanche...' : '🔄 REVANCHE!'}
      </button>
    </>
  );
}