'use client';

import { useState, useEffect } from 'react';
import { FaSearch, FaUserShield, FaUser, FaSpinner } from 'react-icons/fa';

interface User {
  id: string;
  email: string;
  username: string;
  avatar: string;
  created_at: string;
  is_admin: boolean;
  total_points: number;
  games_played: number;
  games_won: number;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const limit = 20;

  useEffect(() => {
    fetchUsers();
  }, [search, page]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams({
        search,
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString()
      });

      const response = await fetch(`/api/admin/users?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Laden der User');
      }

      const data: UsersResponse = await response.json();
      setUsers(data.users);
      setTotal(data.total);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error instanceof Error ? error.message : 'Fehler beim Laden der User');
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    if (updatingUserId) return; // Prevent multiple requests

    const confirmMessage = currentStatus 
      ? 'Admin-Rechte entfernen?' 
      : 'Admin-Rechte gewähren?';
    
    if (!window.confirm(confirmMessage)) return;

    setUpdatingUserId(userId);
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_admin: !currentStatus
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Update');
      }

      const result = await response.json();
      console.log(result.message);

      // Update the local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, is_admin: !currentStatus }
          : user
      ));

    } catch (error) {
      console.error('Error updating admin status:', error);
      alert(error instanceof Error ? error.message : 'Fehler beim Update');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page when searching
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAvatarEmoji = (avatar: string): string => {
    const avatarMap: { [key: string]: string } = {
      'fire': '🔥', 'lightning': '⚡', 'star': '🌟', 'rocket': '🚀', 'crown': '👑',
      'target': '🎯', 'trophy': '🏆', 'soccer': '⚽', 'muscle': '💪', 'sunglasses': '😎',
      'heart': '❤️', 'diamond': '💎', 'rainbow': '🌈', 'ghost': '👻', 'alien': '👽',
      'robot': '🤖', 'unicorn': '🦄', 'dragon': '🐉', 'ninja': '🥷', 'wizard': '🧙',
      'player1': '⚽', 'player2': '⚽', 'player3': '⚽', 'player4': '⚽', 'player5': '⚽',
      'player6': '⚽', 'player7': '⚽', 'player8': '⚽'
    };
    return avatarMap[avatar] || '⚽';
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-white">User-Verwaltung</h2>
        
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Email oder Username suchen..."
            value={search}
            onChange={handleSearchChange}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="text-gray-300 text-sm">
        {loading ? 'Lade...' : `${total} User gefunden`}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900 border border-red-500 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-white font-medium">User</th>
                <th className="px-4 py-3 text-left text-white font-medium">Email</th>
                <th className="px-4 py-3 text-left text-white font-medium">Punkte</th>
                <th className="px-4 py-3 text-left text-white font-medium">Spiele</th>
                <th className="px-4 py-3 text-left text-white font-medium">Registriert</th>
                <th className="px-4 py-3 text-center text-white font-medium">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    <FaSpinner className="animate-spin mx-auto mb-2" />
                    Lade User...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Keine User gefunden
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getAvatarEmoji(user.avatar)}</span>
                        <div>
                          <div className="text-white font-medium">{user.username}</div>
                          <div className="text-xs text-gray-400">ID: {user.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-yellow-400 font-medium">{user.total_points}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-300">
                        <span className="text-green-400">{user.games_won}</span>
                        <span className="text-gray-500"> / </span>
                        <span>{user.games_played}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-sm">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                        disabled={updatingUserId === user.id}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          user.is_admin
                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                            : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={user.is_admin ? 'Admin-Rechte entfernen' : 'Admin-Rechte gewähren'}
                      >
                        {updatingUserId === user.id ? (
                          <FaSpinner className="animate-spin" />
                        ) : user.is_admin ? (
                          <FaUserShield />
                        ) : (
                          <FaUser />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
          >
            Vorherige
          </button>
          
          <span className="text-gray-300 mx-4">
            Seite {page} von {totalPages}
          </span>
          
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
          >
            Nächste
          </button>
        </div>
      )}
    </div>
  );
}