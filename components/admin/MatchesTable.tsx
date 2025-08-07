'use client';

import { useState, useEffect } from 'react';
import { FaTrash, FaSync, FaFilter } from 'react-icons/fa';

interface Match {
  id: string;
  player_a: string;
  player_a_email: string;
  player_a_username: string;
  player_a_moves: string;
  player_b: string;
  player_b_email: string;
  player_b_username: string;
  player_b_moves: string;
  status: string;
  created_at: string;
}

interface Stats {
  total: number;
  waiting: number;
  ready: number;
  oldest_match: string;
}

export default function MatchesTable() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/matches');
      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches);
        setStats(data.stats);
      } else {
        setError('Fehler beim Laden der Matches');
      }
    } catch (err) {
      setError('Netzwerkfehler');
      console.error('Error fetching admin matches:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMatch = async (matchId: string) => {
    if (!confirm(`Wirklich Match ${matchId} löschen?`)) {
      return;
    }

    setDeletingId(matchId);
    try {
      const response = await fetch(`/api/admin/matches/${matchId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Remove from local state
        setMatches(matches.filter(m => m.id !== matchId));
        // Update stats
        if (stats) {
          setStats({
            ...stats,
            total: stats.total - 1
          });
        }
      } else {
        alert('Fehler beim Löschen des Matches');
      }
    } catch (err) {
      console.error('Error deleting match:', err);
      alert('Netzwerkfehler beim Löschen');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter and search matches
  const filteredMatches = matches.filter(match => {
    // Status filter
    if (filter !== 'all' && match.status !== filter) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        match.id.toLowerCase().includes(search) ||
        match.player_a_email?.toLowerCase().includes(search) ||
        match.player_b_email?.toLowerCase().includes(search) ||
        match.player_a_username?.toLowerCase().includes(search) ||
        match.player_b_username?.toLowerCase().includes(search)
      );
    }
    
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <span className="px-2 py-1 bg-yellow-500 text-black text-xs rounded">WAITING</span>;
      case 'ready':
        return <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">READY</span>;
      default:
        return <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded">{status}</span>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Offene Matches</h2>
        <button
          onClick={fetchMatches}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <FaSync className={isLoading ? 'animate-spin' : ''} />
          Aktualisieren
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded">
            <div className="text-3xl font-bold text-white">{stats.total}</div>
            <div className="text-gray-400 text-sm">Offene Matches</div>
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <div className="text-3xl font-bold text-yellow-500">{stats.waiting}</div>
            <div className="text-gray-400 text-sm">Wartend</div>
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <div className="text-3xl font-bold text-green-500">{stats.ready}</div>
            <div className="text-gray-400 text-sm">Bereit</div>
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <div className="text-sm text-white">
              {stats.oldest_match ? formatDate(stats.oldest_match) : 'N/A'}
            </div>
            <div className="text-gray-400 text-sm">Ältestes Match</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-800 text-white rounded px-3 py-2"
          >
            <option value="all">Alle Status</option>
            <option value="waiting">Wartend</option>
            <option value="ready">Bereit</option>
          </select>
        </div>
        <input
          type="text"
          placeholder="Suche nach Email, Username oder ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-gray-800 text-white rounded px-4 py-2 placeholder-gray-500"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-400">Lade Matches...</p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          Keine offenen Matches gefunden
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="pb-3 px-2">ID</th>
                <th className="pb-3 px-2">Player A</th>
                <th className="pb-3 px-2">Player B</th>
                <th className="pb-3 px-2">Status</th>
                <th className="pb-3 px-2">Moves</th>
                <th className="pb-3 px-2">Erstellt</th>
                <th className="pb-3 px-2">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {filteredMatches.map((match) => (
                <tr key={match.id} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                  <td className="py-3 px-2 font-mono text-sm text-gray-300">
                    {match.id}
                  </td>
                  <td className="py-3 px-2">
                    <div className="text-white text-sm">
                      {match.player_a_username || 'N/A'}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {match.player_a_email}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="text-white text-sm">
                      {match.player_b_username || 'Nicht beigetreten'}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {match.player_b_email || 'N/A'}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    {getStatusBadge(match.status)}
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex gap-2 text-xs">
                      <span className={match.player_a_moves ? 'text-green-400' : 'text-gray-600'}>
                        A: {match.player_a_moves ? '✓' : '✗'}
                      </span>
                      <span className={match.player_b_moves ? 'text-green-400' : 'text-gray-600'}>
                        B: {match.player_b_moves ? '✓' : '✗'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-400">
                    {formatDate(match.created_at)}
                  </td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() => deleteMatch(match.id)}
                      disabled={deletingId === match.id}
                      className="text-red-400 hover:text-red-300 disabled:text-gray-600 disabled:cursor-not-allowed"
                      title="Match löschen"
                    >
                      {deletingId === match.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent"></div>
                      ) : (
                        <FaTrash />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}