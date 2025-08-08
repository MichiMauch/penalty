'use client';

import { useEffect, useState } from 'react';

interface UserStats {
  totalPoints: number;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  goalsScored: number;
  savesMade: number;
  currentStreak: number;
  bestStreak: number;
  perfectGames: number;
  rank: number | null;
  pointsToPrevRank: number | null;
  pointsToNextRank: number | null;
}

interface Level {
  id: number;
  name: string;
  icon: string;
  minPoints: number;
  maxPoints: number;
}

interface LevelInfo {
  current: Level;
  next: Level | null;
  progress: number;
  pointsToNext: number;
}

interface UserStatsCardProps {
  userId: string;
  username: string;
  avatar: string;
}

export default function UserStatsCard({ userId, username, avatar }: UserStatsCardProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStats();
  }, [userId]);

  const fetchUserStats = async () => {
    try {
      const response = await fetch(`/api/stats/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setLevelInfo(data.level);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!stats || !levelInfo) {
    return null;
  }

  const getRankEmoji = (rank: number | null) => {
    if (!rank) return '-';
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="space-y-4">
      {/* Compact Header: Points + Rank + Level */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold text-green-400">
            {getRankEmoji(stats.rank)}
          </div>
          <div>
            <p className="text-3xl font-bold text-white">
              {stats.totalPoints} Punkte 
              {stats.rank && stats.pointsToNextRank && (
                <span className="text-sm text-white font-normal ml-3 hidden md:inline">Vorsprung zu #{stats.rank + 1}: {stats.pointsToNextRank} Punkte</span>
              )}
            </p>
            <p className="text-lg text-white">
              {stats.rank ? `Rang #${stats.rank}` : 'Kein Rang'}
            </p>
          </div>
        </div>
        
        {/* Compact Level Badge */}
        <div className="text-center">
          <div className="text-3xl mb-1">{levelInfo.current.icon}</div>
          <div className="text-sm font-bold text-white" style={{fontFamily: 'var(--font-notable)'}}>{levelInfo.current.name}</div>
        </div>
      </div>


      {/* Stats Table and Progress Bar Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stats Table - Takes 2/3 width */}
        <div className="md:col-span-2 bg-gray-900 bg-opacity-40 rounded-lg border border-green-600 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-green-900 bg-opacity-50">
                <th className="text-left py-2 px-3 text-green-400 font-semibold">Statistik</th>
                <th className="text-right py-2 px-3 text-green-400 font-semibold">Wert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 divide-opacity-50">
              <tr className="hover:bg-green-900 hover:bg-opacity-20 transition-colors">
                <td className="py-2 px-3 text-white">🏆 Siege</td>
                <td className="py-2 px-3 text-right font-bold text-white">{stats.gamesWon}</td>
              </tr>
              <tr className="hover:bg-green-900 hover:bg-opacity-20 transition-colors">
                <td className="py-2 px-3 text-white">📊 Gewinnrate</td>
                <td className="py-2 px-3 text-right font-bold text-white">{stats.winRate}%</td>
              </tr>
              <tr className="hover:bg-green-900 hover:bg-opacity-20 transition-colors">
                <td className="py-2 px-3 text-white">🔥 Aktuelle Serie</td>
                <td className="py-2 px-3 text-right font-bold text-white">{stats.currentStreak > 0 ? stats.currentStreak : '-'}</td>
              </tr>
              <tr className="hover:bg-green-900 hover:bg-opacity-20 transition-colors">
                <td className="py-2 px-3 text-white">⚽ Tore erzielt</td>
                <td className="py-2 px-3 text-right font-bold text-white">{stats.goalsScored}</td>
              </tr>
              <tr className="hover:bg-green-900 hover:bg-opacity-20 transition-colors">
                <td className="py-2 px-3 text-white">🥅 Paraden</td>
                <td className="py-2 px-3 text-right font-bold text-white">{stats.savesMade}</td>
              </tr>
              <tr className="hover:bg-green-900 hover:bg-opacity-20 transition-colors">
                <td className="py-2 px-3 text-white">💎 Perfekte Spiele</td>
                <td className="py-2 px-3 text-right font-bold text-white">{stats.perfectGames}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Progress Bar - Takes 1/3 width */}
        {levelInfo.next && (
          <div className="bg-gray-900 bg-opacity-40 rounded-lg border border-green-600 p-4 flex flex-col justify-between">
            <div>
              <div className="text-center mb-3">
                <div className="text-sm text-gray-400 mb-1">Nächstes Level</div>
                <div className="text-lg font-bold text-white">{levelInfo.next.name}</div>
                <div className="text-2xl mt-1">{levelInfo.next.icon}</div>
              </div>
              
              <div className="text-center mb-3">
                <span className="text-2xl font-bold text-green-400">{levelInfo.progress}%</span>
              </div>
              
              <div className="relative h-32 w-8 mx-auto bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="absolute bottom-0 w-full bg-gradient-to-t from-green-500 to-green-400 transition-all duration-500"
                  style={{ height: `${levelInfo.progress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-center mt-3">
              <div className="text-xs text-gray-400">Noch</div>
              <div className="text-sm font-bold text-white">{levelInfo.pointsToNext}</div>
              <div className="text-xs text-gray-400">Punkte</div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}