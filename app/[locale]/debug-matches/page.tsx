'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';

interface DebugMatch {
  id: string;
  player_a_email: string;
  player_a_username: string;
  player_b_email: string;
  player_b_username: string;
  player_b: string;
  player_a_moves: string;
  player_b_moves: string;
  status: string;
  created_at: string;
  winner: string;
}

export default function DebugMatchesPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<DebugMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchAllMatches();
    }
  }, [user]);

  const fetchAllMatches = async () => {
    try {
      const response = await fetch('/api/debug/matches');
      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches);
      } else {
        setError('Fehler beim Laden der Matches');
      }
    } catch (err) {
      setError('Netzwerkfehler');
      console.error('Error fetching debug matches:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getMatchType = (match: DebugMatch) => {
    const isPlayerA = user?.email === match.player_a_email;
    const isPlayerB = user?.email === match.player_b_email;
    
    if (!isPlayerA && !isPlayerB) return 'NOT_INVOLVED';
    
    if (match.status === 'finished') return 'FINISHED';
    
    if (isPlayerB) {
      if (!match.player_b) return 'INVITATION'; // Not joined yet
      if (!match.player_b_moves) return 'ACTIVE'; // Joined but no moves
      return 'WAITING_FOR_RESULT';
    }
    
    if (isPlayerA) {
      if (!match.player_b) return 'CANCELABLE'; // No one joined
      if (!match.player_b_moves && match.player_a_moves) return 'WAITING_FOR_OPPONENT';
      if (!match.player_a_moves) return 'NEED_TO_PLAY';
      return 'BOTH_PLAYED';
    }
    
    return 'UNKNOWN';
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'INVITATION': return 'bg-blue-500';
      case 'ACTIVE': return 'bg-green-500';
      case 'CANCELABLE': return 'bg-yellow-500';
      case 'WAITING_FOR_OPPONENT': return 'bg-orange-500';
      case 'FINISHED': return 'bg-gray-500';
      case 'NOT_INVOLVED': return 'bg-red-500';
      default: return 'bg-purple-500';
    }
  };

  if (!user) {
    return <Layout><div className="p-8 text-white">Please log in to see debug info</div></Layout>;
  }

  return (
    <Layout>
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold text-white mb-6">🐛 Match Debug für {user.email}</h1>
        
        {isLoading ? (
          <div className="text-white">Lädt Matches...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div className="space-y-4">
            <div className="text-white mb-4">
              Insgesamt {matches.length} Matches gefunden
            </div>
            
            {matches.map((match) => {
              const matchType = getMatchType(match);
              const isPlayerA = user.email === match.player_a_email;
              
              return (
                <div key={match.id} className="bg-gray-800 rounded-lg p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-mono text-sm text-gray-400">
                      {match.id}
                    </div>
                    <div className={`px-3 py-1 rounded text-xs font-bold ${getStatusColor(matchType)}`}>
                      {matchType}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Player A (Angreifer):</strong><br/>
                      {match.player_a_email}<br/>
                      <span className={isPlayerA ? 'text-green-400' : 'text-gray-400'}>
                        Moves: {match.player_a_moves ? '✅' : '❌'}
                      </span>
                    </div>
                    
                    <div>
                      <strong>Player B (Verteidiger):</strong><br/>
                      {match.player_b_email || 'Nicht eingeladen'}<br/>
                      <span className={!isPlayerA ? 'text-green-400' : 'text-gray-400'}>
                        Beigetreten: {match.player_b ? '✅' : '❌'}<br/>
                        Moves: {match.player_b_moves ? '✅' : '❌'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-400 flex justify-between">
                    <span>Status: {match.status}</span>
                    <span>Erstellt: {new Date(match.created_at).toLocaleString()}</span>
                    {match.winner && <span>Gewinner: {match.winner}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}