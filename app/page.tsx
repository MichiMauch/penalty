'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import PlayerCard from '@/components/PlayerCard';
import { AvatarId } from '@/lib/types';

interface ActivePlayer {
  id: string;
  username: string;
  avatar: AvatarId;
  stats: {
    totalPoints: number;
    totalGames: number;
    wins: number;
    winRate: number;
    lastGame: string | null;
  };
  joinedAt: string;
}

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activePlayers, setActivePlayers] = useState<ActivePlayer[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);

  // Redirect logged-in users to garderobe
  useEffect(() => {
    if (!loading && user) {
      router.push('/garderobe');
    }
  }, [user, loading, router]);

  // Fetch active players
  useEffect(() => {
    fetchActivePlayers();
  }, []);

  const fetchActivePlayers = async () => {
    try {
      const response = await fetch('/api/players/active');
      if (response.ok) {
        const data = await response.json();
        setActivePlayers(data.players);
      }
    } catch (error) {
      console.error('Error fetching active players:', error);
    } finally {
      setIsLoadingPlayers(false);
    }
  };

  const handleStartPlaying = () => {
    router.push('/garderobe');
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <Layout showHeader={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-xl">⚽ Lade Fußballpause...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showHeader={false}>
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-600">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
            <div className="animate-bounce mb-8">
              <span className="text-8xl">⚽</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Fußballpause
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8">
              Das ultimative Elfmeter-Duell für jedermann!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleStartPlaying}
                className="px-8 py-4 bg-white text-green-600 font-bold text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                Jetzt spielen ⚽
              </button>
              <button
                onClick={handleStartPlaying}
                className="px-8 py-4 bg-white/20 border-2 border-white text-white font-bold text-lg rounded-full hover:bg-white/30 transform hover:scale-105 transition-all duration-300"
              >
                Anmelden 🔑
              </button>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-white/95 backdrop-blur py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
              So funktioniert&apos;s
            </h2>
            <div className="grid md:grid-cols-5 gap-8">
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📝</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">1. Registrieren</h3>
                <p className="text-gray-600">Erstelle deinen Account mit Avatar</p>
              </div>

              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⚽</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">2. Schießen</h3>
                <p className="text-gray-600">Wähle 5 Schussrichtungen als Schütze</p>
              </div>

              <div className="text-center">
                <div className="bg-yellow-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🧤</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">3. Halten</h3>
                <p className="text-gray-600">Oder verteidige als Torwart</p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🎯</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">4. Punkte</h3>
                <p className="text-gray-600">Tore und Paraden geben Punkte</p>
              </div>

              <div className="text-center">
                <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔄</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">5. Revanche</h3>
                <p className="text-gray-600">Tauscht die Rollen und spielt erneut</p>
              </div>
            </div>
          </div>
        </section>

        {/* Game Rules */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                ⚽ Die Spielregeln
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-green-600">Als Schütze:</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Du wählst 5 Schussrichtungen im Voraus</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Links, Mitte oder Rechts für jeden Schuss</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Jedes Tor gibt dir einen Punkt</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-blue-600">Als Torwart:</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Du wählst 5 Paraden-Richtungen</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Hechtsprung links/rechts oder in der Mitte bleiben</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Jede Parade gibt dir einen Punkt</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-center text-gray-700">
                  <strong>Wichtig:</strong> Die Richtung muss exakt übereinstimmen! 
                  Links-Hecht hält nur Links-Schuss, Mitte-Bleiben nur Mitte-Schuss usw.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Active Players */}
        <section className="bg-gray-100 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
              Aktive Spieler
            </h2>

            {isLoadingPlayers ? (
              <div className="text-center">
                <p className="text-gray-600">Lade Spieler...</p>
              </div>
            ) : activePlayers.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {activePlayers.map((player) => (
                  <PlayerCard
                    key={player.id}
                    username={player.username}
                    avatar={player.avatar}
                    stats={player.stats}
                    joinedAt={player.joinedAt}
                    onChallenge={handleStartPlaying}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-600 mb-4">Noch keine aktiven Spieler</p>
                <p className="text-2xl font-bold text-green-600">Sei der Erste! 🎯</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-green-600 to-blue-600 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Bereit für dein erstes Elfmeter-Duell?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Fordere deine Freunde heraus oder spiele gegen andere Fußballfans!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleStartPlaying}
                className="px-8 py-4 bg-white text-green-600 font-bold text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                Jetzt kostenlos spielen ⚽
              </button>
              <button
                onClick={handleStartPlaying}
                className="px-8 py-4 bg-white/20 border-2 border-white text-white font-bold text-lg rounded-full hover:bg-white/30 transform hover:scale-105 transition-all duration-300"
              >
                Bereits registriert? Anmelden 🔑
              </button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}