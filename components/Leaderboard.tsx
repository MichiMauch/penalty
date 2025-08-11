'use client';

import { useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AvatarId } from '@/lib/types';
import { FaSync } from 'react-icons/fa';

interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  avatar: AvatarId;
  email?: string;
  stats: {
    totalPoints: number;
    gamesPlayed: number;
    gamesWon: number;
    winRate: number;
    goalsScored: number;
    savesMade: number;
  };
  level: {
    id: number;
    name: string;
    icon: string;
  };
}

interface LeaderboardProps {
  currentUserId?: string;
  onChallengeUser?: (user: {id: string; username: string; email: string; avatar: string}) => void;
  checkingUserId?: string | null;
}

export interface LeaderboardRef {
  fetchLeaderboard: () => void;
}

const Leaderboard = forwardRef<LeaderboardRef, LeaderboardProps>(({ currentUserId, onChallengeUser, checkingUserId }, ref) => {
  const t = useTranslations('leaderboard');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const router = useRouter();

  const fetchLeaderboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const response = await fetch('/api/stats/leaderboard');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard);
        
        // Find current user's rank
        if (currentUserId) {
          const userEntry = data.leaderboard.find((entry: LeaderboardEntry) => entry.id === currentUserId);
          if (userEntry) {
            setCurrentUserRank(userEntry.rank);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Expose fetchLeaderboard to parent component
  useImperativeHandle(ref, () => ({
    fetchLeaderboard: () => fetchLeaderboard(true)
  }));

  const handleRefresh = () => {
    fetchLeaderboard(true);
  };

  // Get emoji from avatar
  const getAvatarEmoji = (avatar: AvatarId): string => {
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
  };

  // Get 10 entries to display
  const getDisplayedEntries = () => {
    if (!currentUserRank || currentUserRank <= 10) {
      // Show top 10
      return leaderboard.slice(0, 10);
    } else {
      // Show 5 before and 4 after current user
      const startIndex = Math.max(0, currentUserRank - 6); // -6 because rank is 1-based
      const endIndex = Math.min(leaderboard.length, currentUserRank + 4);
      
      // If we can't get 10 entries, adjust
      if (endIndex - startIndex < 10) {
        if (startIndex === 0) {
          return leaderboard.slice(0, 10);
        } else {
          return leaderboard.slice(Math.max(0, leaderboard.length - 10), leaderboard.length);
        }
      }
      
      return leaderboard.slice(startIndex, endIndex);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">{t('title')}</h2>
          <button
            onClick={handleRefresh}
            disabled={true}
            className="text-gray-500 cursor-not-allowed p-2"
            title={t('loadingTooltip')}
          >
            <FaSync className="animate-spin" />
          </button>
        </div>
        <div className="bg-gray-900 bg-opacity-40 rounded border border-green-600 border-opacity-60">
          <div className="h-80 flex items-center justify-center">
            <div className="text-white">{t('loading')}</div>
          </div>
        </div>
      </div>
    );
  }

  const displayedEntries = getDisplayedEntries();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">{t('title')}</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={`p-2 rounded transition-colors ${
            refreshing 
              ? 'text-green-400 cursor-not-allowed' 
              : 'text-gray-400 hover:text-green-400'
          }`}
          title={t('refreshTooltip')}
        >
          <FaSync className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>
      
      <div className="bg-gray-900 bg-opacity-40 rounded overflow-hidden border border-green-600 border-opacity-60">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-green-900 bg-opacity-50 text-green-400">
              <th className="text-left py-2 px-3 font-semibold">{t('rank')}</th>
              <th className="text-left py-2 px-3 font-semibold">{t('player')}</th>
              <th className="text-center py-2 px-3 font-semibold">{t('gamesPlayed')}</th>
              <th className="text-center py-2 px-3 font-semibold hidden md:table-cell">{t('wins')}</th>
              <th className="text-center py-2 px-3 font-semibold hidden md:table-cell">{t('losses')}</th>
              <th className="text-right py-2 px-3 font-semibold">{t('points')}</th>
            </tr>
          </thead>
          <tbody className="text-white">
            {displayedEntries.map((player, index) => {
              const isCurrentUser = currentUserId === player.id;
              const isEvenRow = index % 2 === 0;
              
              return (
                <tr 
                  key={player.id}
                  className={`
                    ${isEvenRow ? 'bg-gray-800 bg-opacity-20' : ''}
                    ${isCurrentUser ? 'bg-green-600 bg-opacity-80 border-2 border-green-400' : ''}
                    hover:bg-green-900 hover:bg-opacity-20 transition-colors
                  `}
                >
                  <td className={`py-2 px-3 ${isCurrentUser ? 'text-white' : ''}`} style={isCurrentUser ? { fontWeight: 900, fontSize: '14px' } : {}}>
                    {player.rank}
                  </td>
                  <td className={`py-2 px-3 ${isCurrentUser ? 'text-white' : ''}`} style={isCurrentUser ? { fontWeight: 900, fontSize: '14px' } : {}}>
                    {isCurrentUser ? (
                      <span>
                        {player.username.length > 12 
                          ? player.username.substring(0, 10) + '.' 
                          : player.username}
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          if (onChallengeUser) {
                            onChallengeUser({
                              id: player.id,
                              username: player.username,
                              email: player.email || '',
                              avatar: player.avatar
                            });
                          } else {
                            router.push(`/challenge?user=${player.id}`);
                          }
                        }}
                        disabled={checkingUserId === player.id}
                        className="hover:text-green-400 hover:underline transition-colors cursor-pointer text-left disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                        title={checkingUserId === player.id ? t('checkingChallenge') : `${player.username} ${t('challengeTooltip')}`}
                      >
                        {checkingUserId === player.id && (
                          <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent"></div>
                        )}
                        {player.username.length > 12 
                          ? player.username.substring(0, 10) + '.' 
                          : player.username}
                      </button>
                    )}
                  </td>
                  <td className={`text-center py-2 px-3 ${isCurrentUser ? 'text-white' : ''}`} style={isCurrentUser ? { fontWeight: 900, fontSize: '14px' } : {}}>{player.stats.gamesPlayed}</td>
                  <td className={`text-center py-2 px-3 hidden md:table-cell ${isCurrentUser ? 'text-white' : ''}`} style={isCurrentUser ? { fontWeight: 900, fontSize: '14px' } : {}}>{player.stats.gamesWon}</td>
                  <td className={`text-center py-2 px-3 hidden md:table-cell ${isCurrentUser ? 'text-white' : ''}`} style={isCurrentUser ? { fontWeight: 900, fontSize: '14px' } : {}}>{player.stats.gamesPlayed - player.stats.gamesWon}</td>
                  <td className={`text-right py-2 px-3 ${isCurrentUser ? 'text-white' : ''}`} style={isCurrentUser ? { fontWeight: 900, fontSize: '14px' } : { fontWeight: 600 }}>
                    {player.stats.totalPoints}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {leaderboard.length === 0 && (
        <div className="text-center py-8 text-gray-300">
          <p>{t('noEntries')}</p>
          <p className="text-sm mt-2">{t('playFirstMatch')}</p>
        </div>
      )}
    </div>
  );
});

Leaderboard.displayName = 'Leaderboard';

export default Leaderboard;