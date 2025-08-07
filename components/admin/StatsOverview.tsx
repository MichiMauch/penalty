'use client';

import { useState, useEffect } from 'react';
import { FaUsers, FaGamepad, FaTrophy, FaClock, FaChartLine, FaCalendarAlt } from 'react-icons/fa';

interface AdminStats {
  system: {
    total_users: number;
    total_matches: number;
    finished_matches: number;
    completed_matches: number;
  };
  matchStatus: Array<{
    status: string;
    count: number;
  }>;
  topPlayers: Array<{
    username: string;
    avatar: string;
    total_points: number;
    games_won: number;
    games_played: number;
    win_rate: number;
  }>;
  recentMatches: Array<{
    id: string;
    player_a_username: string;
    player_b_username: string;
    status: string;
    winner: string;
    created_at: string;
  }>;
  dailyActivity: Array<{
    date: string;
    matches_played: number;
  }>;
  avatarDistribution: Array<{
    avatar: string;
    count: number;
  }>;
}

export default function StatsOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setError('Fehler beim Laden der Statistiken');
      }
    } catch (err) {
      setError('Netzwerkfehler');
      console.error('Error fetching admin stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)} Min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finished': return 'text-green-400';
      case 'waiting': return 'text-yellow-400';
      case 'ready': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case 'finished': return 'Beendet';
      case 'waiting': return 'Wartend';
      case 'ready': return 'Bereit';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-400">Lade Statistiken...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
        {error}
        <button 
          onClick={fetchStats}
          className="ml-4 text-red-300 hover:text-red-100 underline"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* System Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FaUsers className="text-blue-400" />
            <span className="text-sm text-gray-400">Total Users</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.system.total_users}</div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FaTrophy className="text-green-400" />
            <span className="text-sm text-gray-400">Beendet</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.system.finished_matches}</div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FaGamepad className="text-purple-400" />
            <span className="text-sm text-gray-400">Total Matches</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.system.total_matches}</div>
        </div>



      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Match Status Distribution */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-white mb-4">Match Status Verteilung</h3>
          <div className="space-y-3">
            {stats.matchStatus.map((status) => {
              const percentage = stats.system.total_matches > 0 
                ? (status.count / stats.system.total_matches * 100).toFixed(1)
                : '0';
              
              return (
                <div key={status.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`font-medium ${getStatusColor(status.status)}`}>
                      {getStatusName(status.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${status.status === 'finished' ? 'bg-green-400' : status.status === 'waiting' ? 'bg-yellow-400' : 'bg-blue-400'}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-white font-bold w-12 text-right">{status.count}</span>
                    <span className="text-gray-400 text-sm w-12 text-right">{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Players */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-white mb-4">Top Spieler (nach Punkten)</h3>
          <div className="space-y-3">
            {stats.topPlayers.slice(0, 8).map((player, index) => (
              <div key={player.username} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-yellow-400 font-bold w-6">#{index + 1}</span>
                  <div>
                    <div className="text-white font-medium">{player.username}</div>
                    <div className="text-gray-400 text-xs">{player.win_rate}% Gewinnrate</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">{player.total_points}</div>
                  <div className="text-gray-400 text-xs">Punkte</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Avatar Distribution */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-white mb-4">Avatar Verteilung</h3>
          <div className="space-y-3">
            {stats.avatarDistribution.slice(0, 8).map((avatar) => {
              const percentage = stats.system.total_users > 0 
                ? (avatar.count / stats.system.total_users * 100).toFixed(1)
                : '0';
              
              return (
                <div key={avatar.avatar} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400">{avatar.avatar}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-blue-400"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-white font-bold w-12 text-right">{avatar.count}</span>
                    <span className="text-gray-400 text-sm w-12 text-right">{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Activity */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-white mb-4">Tägliche Aktivität (7 Tage)</h3>
          <div className="space-y-3">
            {stats.dailyActivity.length > 0 ? (
              stats.dailyActivity.map((day) => (
                <div key={day.date} className="flex items-center justify-between">
                  <span className="text-gray-400">{formatDate(day.date)}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-16 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-400 h-2 rounded-full"
                        style={{ 
                          width: `${Math.max(10, (day.matches_played / Math.max(...stats.dailyActivity.map(d => d.matches_played))) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-white font-bold w-8 text-right">{day.matches_played}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-center py-4">Keine Daten verfügbar</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Matches */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-bold text-white mb-4">Letzte Matches</h3>
        <div className="space-y-2">
          {stats.recentMatches.map((match) => (
            <div key={match.id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
              <div className="flex items-center gap-3">
                <FaGamepad className={getStatusColor(match.status)} />
                <div>
                  <span className="text-white font-medium">{match.player_a_username}</span>
                  <span className="text-gray-400 mx-2">vs</span>
                  <span className="text-white font-medium">{match.player_b_username || '(wartet)'}</span>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${getStatusColor(match.status)}`}>
                  {getStatusName(match.status)}
                </div>
                <div className="text-gray-400 text-xs">{formatDateTime(match.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}