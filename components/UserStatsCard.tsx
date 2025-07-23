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
  rank: number;
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
      <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!stats || !levelInfo) {
    return null;
  }

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold text-gray-800">
            {getRankEmoji(stats.rank)}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{username}</h3>
            <p className="text-sm text-gray-600">{stats.totalPoints} Punkte</p>
          </div>
        </div>
        
        {/* Current Level Badge */}
        <div className="text-center">
          <div className="text-4xl mb-1">{levelInfo.current.icon}</div>
          <div className="text-sm font-semibold text-gray-800">{levelInfo.current.name}</div>
        </div>
      </div>

      {/* Level Progress */}
      {levelInfo.next && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Fortschritt zu {levelInfo.next.name} {levelInfo.next.icon}
            </span>
            <span className="text-sm font-semibold text-gray-800">
              {levelInfo.progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${levelInfo.progress}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Noch {levelInfo.pointsToNext} Punkte bis zum nächsten Level
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{stats.gamesWon}</p>
          <p className="text-xs text-gray-600">Siege</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.winRate}%</p>
          <p className="text-xs text-gray-600">Gewinnrate</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">{stats.goalsScored}</p>
          <p className="text-xs text-gray-600">Tore</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-600">{stats.savesMade}</p>
          <p className="text-xs text-gray-600">Paraden</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
          <span className="text-sm text-gray-600">Aktuelle Serie</span>
          <span className="font-semibold">
            {stats.currentStreak > 0 ? `🔥 ${stats.currentStreak} Siege` : '-'}
          </span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
          <span className="text-sm text-gray-600">Beste Serie</span>
          <span className="font-semibold">{stats.bestStreak} Siege</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
          <span className="text-sm text-gray-600">Perfekte Spiele</span>
          <span className="font-semibold">{stats.perfectGames}</span>
        </div>
      </div>
    </div>
  );
}