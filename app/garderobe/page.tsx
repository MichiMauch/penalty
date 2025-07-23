'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import AuthPage from '@/components/AuthPage';
import UserAvatar from '@/components/UserAvatar';
import Layout from '@/components/Layout';
import UserStatsCard from '@/components/UserStatsCard';
import Leaderboard from '@/components/Leaderboard';

export default function Garderobe() {
  const [matchId, setMatchId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  // Show auth page if not logged in
  if (loading) {
    return (
      <Layout showHeader={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-xl">⚽ Lade Fußballpause...</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout showHeader={false}>
        <AuthPage />
      </Layout>
    );
  }
  
  const createMatch = async () => {
    setIsCreating(true);
    setError('');
    
    try {
      const playerId = nanoid();
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'create', 
          playerId, 
          email: user.email,
          username: user.username,
          avatar: user.avatar
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('playerId', playerId);
        router.push(`/game/${data.matchId}`);
      } else {
        setError(data.error || 'Fehler beim Erstellen des Matches');
      }
    } catch (err) {
      setError('Netzwerkfehler');
    } finally {
      setIsCreating(false);
    }
  };
  
  const joinMatch = async () => {
    if (!matchId.trim()) {
      setError('Bitte gib eine Match-ID ein');
      return;
    }
    
    setIsJoining(true);
    setError('');
    
    try {
      const playerId = nanoid();
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'join', 
          matchId: matchId.trim(), 
          playerId,
          email: user.email,
          username: user.username,
          avatar: user.avatar
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('playerId', playerId);
        router.push(`/game/${matchId.trim()}`);
      } else {
        setError(data.error || 'Fehler beim Beitreten des Matches');
      }
    } catch (err) {
      setError('Netzwerkfehler');
    } finally {
      setIsJoining(false);
    }
  };
  
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-600 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Main Game Area */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* User Stats Dashboard */}
              <UserStatsCard 
                userId={user.id}
                username={user.username}
                avatar={user.avatar}
              />
              
              {/* Quick Play Section */}
              <div className="bg-white rounded-lg shadow-xl p-8">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">⚽ Spiel starten</h1>
                  <p className="text-gray-600">Bereit für ein neues Elfmeter-Duell?</p>
                </div>
              
                <div className="space-y-6">
                  <div className="space-y-4">
                    <button
                      onClick={createMatch}
                      disabled={isCreating}
                      className="w-full px-6 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold text-lg transition-colors"
                    >
                      {isCreating ? 'Wird erstellt...' : '⚽ Als Schütze starten'}
                    </button>
                  </div>
                  
                  <div className="text-center text-gray-500">oder</div>
                  
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Match-ID eingeben"
                      value={matchId}
                      onChange={(e) => setMatchId(e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={joinMatch}
                      disabled={isJoining}
                      className="w-full px-6 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold text-lg transition-colors"
                    >
                      {isJoining ? 'Trete bei...' : '🧤 Als Torwart beitreten'}
                    </button>
                  </div>
                </div>
                
                {error && (
                  <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}
              </div>
              
              {/* Game Rules */}
              <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg p-6">
                <h3 className="font-bold text-lg mb-4 text-gray-800">⚽ Spielregeln</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2">Als Schütze:</h4>
                    <ul className="space-y-1">
                      <li>• Wähle 5 Schussrichtungen</li>
                      <li>• +10 Punkte pro Tor</li>
                      <li>• +100 Bonus bei 5/5 Toren</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-600 mb-2">Als Torwart:</h4>
                    <ul className="space-y-1">
                      <li>• Wähle 5 Paraden-Richtungen</li>
                      <li>• +15 Punkte pro Parade</li>
                      <li>• +100 Bonus bei 5/5 Paraden</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                  <p className="text-sm text-yellow-800">
                    <strong>Bonuspunkte:</strong> +50 für Sieg, +20 für Unentschieden, +300 für 5er-Serie
                  </p>
                </div>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-8">
              <Leaderboard />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}