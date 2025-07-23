'use client';

import UserAvatar from './UserAvatar';
import { AvatarId } from '@/lib/types';
import { calculateLevel } from '@/lib/levels';

interface PlayerStats {
  totalPoints: number;
  totalGames: number;
  wins: number;
  winRate: number;
  lastGame: string | null;
}

interface PlayerCardProps {
  username: string;
  avatar: AvatarId;
  stats: PlayerStats;
  joinedAt: string;
  onChallenge?: () => void;
}

export default function PlayerCard({ username, avatar, stats, joinedAt, onChallenge }: PlayerCardProps) {
  const getPlayerLevel = (points: number) => {
    return calculateLevel(points);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <UserAvatar 
          user={{ 
            id: username, 
            username, 
            avatar, 
            email: '', 
            created_at: joinedAt, 
            updated_at: joinedAt 
          }} 
          size="lg" 
          showName={false} 
        />
        <div className="text-right">
          <h3 className="font-bold text-lg text-gray-800">{username}</h3>
          <div className="flex items-center gap-2 justify-end">
            <span className="text-2xl">{getPlayerLevel(stats.totalPoints).icon}</span>
            <span className="text-sm font-semibold text-gray-700">
              {getPlayerLevel(stats.totalPoints).name}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 text-center">
          <p className="text-4xl font-bold text-orange-600">{stats.totalPoints}</p>
          <p className="text-sm text-gray-600">Punkte</p>
        </div>
      </div>

      {onChallenge && (
        <button
          onClick={onChallenge}
          className="w-full py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-colors duration-300"
        >
          ⚽ Herausfordern
        </button>
      )}
    </div>
  );
}