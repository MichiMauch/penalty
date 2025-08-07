'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';

interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  totalPoints?: number;
}

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedUser?: User | null;
  redirectToChallengePage?: boolean;
}

export default function ChallengeModal({ isOpen, onClose, preSelectedUser, redirectToChallengePage = false }: ChallengeModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(preSelectedUser || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Pre-fill search if user is pre-selected
  useEffect(() => {
    if (preSelectedUser) {
      setSelectedUser(preSelectedUser);
      setSearchQuery(preSelectedUser.username);
    }
  }, [preSelectedUser]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300) as any;
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const searchUsers = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users.filter((u: User) => u.id !== user?.id)); // Don't show current user
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectUser = (selectedUser: User) => {
    setSelectedUser(selectedUser);
    setSearchQuery(selectedUser.username);
    setSearchResults([]);
  };

  const sendChallenge = async () => {
    if (!selectedUser) {
      setError('Bitte wähle einen Spieler aus');
      return;
    }

    if (selectedUser.id === user?.id) {
      setError('Du kannst dich nicht selbst herausfordern');
      return;
    }

    if (redirectToChallengePage) {
      // Check for existing challenge before redirecting
      try {
        const checkResponse = await fetch(`/api/matches/check-existing?playerA=${encodeURIComponent(user?.email || '')}&playerB=${encodeURIComponent(selectedUser.email)}`);
        
        if (checkResponse.ok) {
          const { hasPendingChallenge } = await checkResponse.json();
          if (hasPendingChallenge) {
            setError('Es existiert bereits eine offene Herausforderung zwischen euch. Bitte warte, bis diese abgeschlossen ist.');
            return;
          }
        }
      } catch (err) {
        console.error('Error checking existing challenge:', err);
      }
      
      // Just redirect to challenge page with selected user
      onClose();
      resetModal();
      router.push(`/challenge-new?user=${selectedUser.id}`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // First check for existing challenge
      const checkResponse = await fetch(`/api/matches/check-existing?playerA=${encodeURIComponent(user?.email || '')}&playerB=${encodeURIComponent(selectedUser.email)}`);
      
      if (checkResponse.ok) {
        const { hasPendingChallenge } = await checkResponse.json();
        if (hasPendingChallenge) {
          throw new Error('Es existiert bereits eine offene Herausforderung zwischen euch. Bitte warte, bis diese abgeschlossen ist.');
        }
      }

      // First create a match
      const playerId = nanoid();
      const createResponse = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          playerId,
          email: user?.email,
          username: user?.username,
          avatar: user?.avatar
        })
      });

      if (!createResponse.ok) {
        throw new Error('Fehler beim Erstellen des Matches');
      }

      const { matchId } = await createResponse.json();

      // Then invite the player
      const inviteResponse = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'invite-player',
          matchId,
          email: selectedUser.email
        })
      });

      if (!inviteResponse.ok) {
        const errorData = await inviteResponse.json();
        if (errorData.existingChallenge) {
          // Delete the just created match since we can't proceed
          await fetch('/api/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'cancel-challenge',
              matchId,
              email: user?.email
            })
          });
        }
        throw new Error(errorData.error || 'Fehler beim Senden der Herausforderung');
      }

      setSuccess(`Herausforderung an ${selectedUser.username} gesendet!`);
      setTimeout(() => {
        onClose();
        resetModal();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    onClose();
    resetModal();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 bg-opacity-95 backdrop-blur-md rounded-lg border-2 border-green-600 shadow-2xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <GiCrossedSwords className="text-green-400 text-2xl" />
              <h2 className="text-xl font-bold text-white">Spieler herausfordern</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <FaTimes size={20} />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative mb-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Spielername oder E-Mail eingeben..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
              {isSearching && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-400 border-t-transparent"></div>
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => selectUser(user)}
                    className="w-full p-3 hover:bg-gray-700 text-left flex items-center gap-3 transition-colors"
                  >
                    <span className="text-2xl">{getAvatarEmoji(user.avatar)}</span>
                    <div>
                      <div className="text-white font-medium">{user.username}</div>
                      <div className="text-gray-400 text-sm">{user.totalPoints || 0} Punkte</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected User */}
          {selectedUser && (
            <div className="mb-6 p-3 bg-green-900 bg-opacity-30 border border-green-600 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getAvatarEmoji(selectedUser.avatar)}</span>
                <div>
                  <div className="text-white font-medium">{selectedUser.username}</div>
                  <div className="text-gray-300 text-sm">{selectedUser.totalPoints || 0} Punkte</div>
                </div>
              </div>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-900 bg-opacity-50 border border-red-500 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-900 bg-opacity-50 border border-green-500 rounded-lg">
              <p className="text-green-300 text-sm">{success}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-3 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={sendChallenge}
              disabled={!selectedUser || isLoading}
              className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Sende...' : 'Herausfordern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get avatar emoji
function getAvatarEmoji(avatar: string): string {
  const avatarMap: { [key: string]: string } = {
    'fire': '🔥',
    'lightning': '⚡',
    'star': '🌟',
    'rocket': '🚀',
    'crown': '👑',
    'target': '🎯',
    'trophy': '🏆',
    'soccer': '⚽',
    'muscle': '💪',
    'sunglasses': '😎',
    'heart': '❤️',
    'diamond': '💎',
    'rainbow': '🌈',
    'ghost': '👻',
    'alien': '👽',
    'robot': '🤖',
    'unicorn': '🦄',
    'dragon': '🐉',
    'ninja': '🥷',
    'wizard': '🧙'
  };
  return avatarMap[avatar] || '⚽';
}