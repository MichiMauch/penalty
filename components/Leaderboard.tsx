'use client';

import { useEffect, useState } from 'react';
import UserAvatar from './UserAvatar';
import { AvatarId } from '@/lib/types';

interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  avatar: AvatarId;
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

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/stats/leaderboard');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return { emoji: '🥇', color: 'from-yellow-400 to-yellow-600' };
    if (rank === 2) return { emoji: '🥈', color: 'from-gray-300 to-gray-500' };
    if (rank === 3) return { emoji: '🥉', color: 'from-orange-400 to-orange-600' };
    return { emoji: `#${rank}`, color: 'from-gray-200 to-gray-400' };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">🏆 Bestenliste</h2>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">🏆 Bestenliste</h2>
      
      <div className="space-y-3">
        {leaderboard.map((player) => {
          const rankDisplay = getRankDisplay(player.rank);
          
          return (
            <div
              key={player.id}
              className={`
                flex items-center gap-4 p-4 rounded-lg
                ${player.rank <= 3 
                  ? `bg-gradient-to-r ${rankDisplay.color} text-white` 
                  : 'bg-gray-50 hover:bg-gray-100'
                }
                transition-all duration-200
              `}
            >
              <div className="text-2xl font-bold w-12 text-center">
                {rankDisplay.emoji}
              </div>
              
              <UserAvatar
                user={{
                  id: player.id,
                  username: player.username,
                  avatar: player.avatar,
                  email: '',
                  created_at: '',
                  updated_at: ''
                }}
                size="sm"
                showName={false}
              />
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${player.rank <= 3 ? '' : 'text-gray-800'}`}>
                    {player.username}
                  </span>
                  <span className="text-xl" title={player.level.name}>
                    {player.level.icon}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${player.rank <= 3 ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {player.level.name}
                  </span>
                </div>
                <div className={`text-sm ${player.rank <= 3 ? 'text-white/80' : 'text-gray-600'}`}>
                  {player.stats.totalPoints} Punkte • {player.stats.winRate}% Gewinnrate
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-sm ${player.rank <= 3 ? 'text-white/80' : 'text-gray-600'}`}>
                  ⚽ {player.stats.goalsScored} 🧤 {player.stats.savesMade}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {leaderboard.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Noch keine Einträge in der Bestenliste</p>
          <p className="text-sm mt-2">Spiele dein erstes Match!</p>
        </div>
      )}
    </div>
  );
}