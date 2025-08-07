'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import PlayerCard from '@/components/PlayerCard';
import TribuneFlashes from '@/components/TribuneFlashes';
import { FaUser, FaSignInAlt, FaUserPlus, FaChevronDown, FaPlay, FaBullseye } from 'react-icons/fa';
import { IoFootball, IoTrophy } from 'react-icons/io5';
import { MdSportsSoccer, MdHome } from 'react-icons/md';
import { GiGoalKeeper } from 'react-icons/gi';
import { AvatarId } from '@/lib/types';
import { calculateLevel } from '@/lib/levels';

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

interface AppStats {
  totalMatches: number;
  totalUsers: number;
  currentChampion: {
    username: string;
    points: number;
  } | null;
}

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activePlayers, setActivePlayers] = useState<ActivePlayer[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);
  const [appStats, setAppStats] = useState<AppStats | null>(null);

  // Redirect logged-in users to garderobe
  useEffect(() => {
    if (!loading && user) {
      router.push('/garderobe');
    }
  }, [user, loading, router]);

  // Fetch active players and stats
  useEffect(() => {
    fetchActivePlayers();
    fetchAppStats();
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

  const fetchAppStats = async () => {
    try {
      const response = await fetch('/api/admin-stats');
      if (response.ok) {
        const data = await response.json();
        setAppStats({
          totalMatches: data.system?.total_matches || 0,
          totalUsers: data.system?.total_users || 0,
          currentChampion: data.topPlayers?.[0] ? {
            username: data.topPlayers[0].username,
            points: data.topPlayers[0].total_points
          } : null
        });
      }
    } catch (error) {
      console.error('Error fetching app stats:', error);
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
          <div className="text-white text-xl">⚽ Lade PENALTY...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showHeader={false}>
      <div className="modern-app-layout">
        {/* Hero Section with Stadium Background */}
        <section className="hero-stadium">
          <TribuneFlashes />
          <h1 className="hero-title">PENALTY SHOOTOUT</h1>
          <div className="hero-content">
            <p className="hero-subtitle">
              Das ultimative Elfmeter-Duell! Zeig deine Nerven aus Stahl und werde zur Penalty-Legende!
            </p>
          </div>
          

          {/* Bottom Action Area */}
          <div className="hero-bottom-actions">
            <div className="auth-buttons">
              <button 
                className="stadium-btn stadium-btn-primary"
                onClick={() => router.push('/login')}
              >
                <FaSignInAlt />
                <span>Anmelden</span>
              </button>
              <button 
                className="stadium-btn stadium-btn-primary"
                onClick={() => router.push('/register')}
              >
                <FaUserPlus />
                <span>Registrieren</span>
              </button>
            </div>
            
            <div className="scroll-indicator" onClick={() => {
              document.querySelector('.app-content')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              <FaChevronDown className="scroll-arrow" />
            </div>
          </div>
        </section>

        {/* App Content */}
        <div className="app-content">
          <div className="max-w-4xl mx-auto">
            
            {/* How it Works */}
            <section className="section-header">
              <h2 className="section-title">So funktioniert&apos;s</h2>
              <p className="section-subtitle">In drei einfachen Schritten zum Sieg</p>
            </section>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <FaUser size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">1. Anmelden</h3>
                <p className="text-gray-400">Kostenlosen Account erstellen und Avatar wählen</p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <IoFootball size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">2. Herausfordern</h3>
                <p className="text-gray-400">Freunde zum Penalty-Duell einladen</p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                  <IoTrophy size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">3. Gewinnen</h3>
                <p className="text-gray-400">Punkte sammeln und aufsteigen</p>
              </div>
            </div>

            {/* Point System */}
            <section className="section-header">
              <h2 className="section-title">Das Punktesystem</h2>
              <p className="section-subtitle">Jeder Sieg zählt - kämpfe dich an die Spitze!</p>
            </section>
            
            <div className="feature-grid mb-8">
              <div className="app-card text-center">
                <div className="text-5xl mb-3">🏆</div>
                <h3 className="text-2xl font-bold text-primary mb-2">Sieg</h3>
                <p className="text-4xl font-bold text-green-400 mb-2">3 Punkte</p>
                <p className="text-sm text-gray-400">Wie im echten Fußball!</p>
              </div>

              <div className="app-card text-center">
                <div className="text-5xl mb-3">⭐</div>
                <h3 className="text-2xl font-bold text-primary mb-2">Perfektes Spiel</h3>
                <p className="text-4xl font-bold text-yellow-400 mb-2">+5 Bonus</p>
                <p className="text-sm text-gray-400">5/5 Tore oder Paraden</p>
              </div>

              <div className="app-card text-center">
                <div className="text-5xl mb-3">🚀</div>
                <h3 className="text-2xl font-bold text-primary mb-2">Level-Aufstieg</h3>
                <p className="text-4xl font-bold text-purple-400 mb-2">+10 Bonus</p>
                <p className="text-sm text-gray-400">Belohnung für Fortschritte</p>
              </div>
            </div>

            {/* Level System */}
            <section className="section-header">
              <h2 className="section-title">Dein Weg zur Legende</h2>
              <p className="section-subtitle">Sammle Punkte und steige im Rang auf!</p>
            </section>
            
            <div className="app-card mb-8 bg-gradient-to-r from-gray-800 to-gray-900">
              <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
                <div className="text-center px-4 py-2">
                  <div className="text-4xl mb-2">🤡</div>
                  <div className="text-sm font-bold text-white">Stolperer</div>
                  <div className="text-xs text-gray-400">0-9 Punkte</div>
                </div>
                
                <div className="text-2xl text-gray-600">→</div>
                
                <div className="text-center px-4 py-2">
                  <div className="text-4xl mb-2">⚽</div>
                  <div className="text-sm font-bold text-white">Spieler</div>
                  <div className="text-xs text-gray-400">10-29 Punkte</div>
                </div>
                
                <div className="text-2xl text-gray-600">→</div>
                
                <div className="text-center px-4 py-2">
                  <div className="text-4xl mb-2">🎯</div>
                  <div className="text-sm font-bold text-white">Profi</div>
                  <div className="text-xs text-gray-400">30-59 Punkte</div>
                </div>
                
                <div className="text-2xl text-gray-600">→</div>
                
                <div className="text-center px-4 py-2 relative">
                  <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">NEU!</div>
                  <div className="text-4xl mb-2">🌟</div>
                  <div className="text-sm font-bold text-white">GOAT</div>
                  <div className="text-xs text-gray-400">1000+ Punkte</div>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-white font-semibold mb-2">10 Levels warten auf dich!</p>
                <p className="text-sm text-gray-400">Jeder Level-Aufstieg bringt dir +10 Bonuspunkte!</p>
              </div>
            </div>

            {/* Live Stats */}
            {appStats && (
              <div className="app-card mb-8 bg-gradient-to-r from-green-900 to-green-800 border-green-600">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-white">{appStats.totalMatches}</div>
                    <div className="text-sm text-green-200">Matches gespielt</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">{appStats.totalUsers}</div>
                    <div className="text-sm text-green-200">Aktive Spieler</div>
                  </div>
                  {appStats.currentChampion && (
                    <div>
                      <div className="text-3xl font-bold text-yellow-400">👑 {appStats.currentChampion.username}</div>
                      <div className="text-sm text-green-200">Aktueller Champion ({appStats.currentChampion.points} Punkte)</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Features Section */}
            <section className="section-header">
              <h2 className="section-title">Das erwartet dich</h2>
              <p className="section-subtitle">Moderne Features für das ultimative Penalty-Erlebnis</p>
            </section>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="app-card p-6 hover:transform hover:scale-105 transition-transform">
                <div className="text-4xl mb-4 text-center">📊</div>
                <h3 className="text-xl font-bold text-white mb-2 text-center">Live-Rangliste</h3>
                <p className="text-gray-400 text-center">Sieh sofort wo du stehst und kämpfe dich nach oben!</p>
              </div>

              <div className="app-card p-6 hover:transform hover:scale-105 transition-transform">
                <div className="text-4xl mb-4 text-center">🔄</div>
                <h3 className="text-xl font-bold text-white mb-2 text-center">Revanche-Button</h3>
                <p className="text-gray-400 text-center">Verloren? Fordere sofort die Revanche heraus!</p>
              </div>

              <div className="app-card p-6 hover:transform hover:scale-105 transition-transform">
                <div className="text-4xl mb-4 text-center">🔔</div>
                <h3 className="text-xl font-bold text-white mb-2 text-center">Push-Benachrichtigungen</h3>
                <p className="text-gray-400 text-center">Verpasse kein Match - wir halten dich auf dem Laufenden!</p>
              </div>

              <div className="app-card p-6 hover:transform hover:scale-105 transition-transform">
                <div className="text-4xl mb-4 text-center">🎬</div>
                <h3 className="text-xl font-bold text-white mb-2 text-center">Spannende Animationen</h3>
                <p className="text-gray-400 text-center">Erlebe jedes Tor und jede Parade hautnah mit!</p>
              </div>
            </div>

            {/* Top Players Section */}
            <section className="section-header">
              <h2 className="section-title">Top Spieler</h2>
              <p className="section-subtitle">Die besten Penalty-Schützen der Liga</p>
            </section>
            
            {isLoadingPlayers ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">⚽</div>
                <p className="text-gray-400">Lade Spieler...</p>
              </div>
            ) : activePlayers.length > 0 ? (
              <div className="app-card mb-8">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Rang</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Spieler</th>
                        <th className="text-center py-3 px-4 text-gray-400 font-semibold">Level</th>
                        <th className="text-center py-3 px-4 text-gray-400 font-semibold">Punkte</th>
                        <th className="text-center py-3 px-4 text-gray-400 font-semibold">Siege</th>
                        <th className="text-center py-3 px-4 text-gray-400 font-semibold">Gewinnrate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activePlayers.slice(0, 10).map((player, index) => {
                        const level = calculateLevel(player.stats.totalPoints);
                        return (
                          <tr key={player.id} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                            <td className="py-3 px-4">
                              <span className="text-2xl">
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-white">{player.username}</div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="text-lg">{level.icon}</span>
                              <span className="ml-2 text-sm text-gray-400">{level.name}</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-bold text-green-400">{player.stats.totalPoints}</span>
                            </td>
                            <td className="py-3 px-4 text-center text-white">
                              {player.stats.wins}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="text-yellow-400">{player.stats.winRate}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="app-card mb-8 text-center py-8">
                <div className="text-4xl mb-2">🏆</div>
                <p className="text-gray-400">Noch keine Spieler - sei der Erste!</p>
              </div>
            )}

            {/* YouTube Video Section */}
            <section className="section-header">
              <h2 className="section-title">So spannend kann ein Match sein!</h2>
              <p className="section-subtitle">Erlebe die Dramatik eines Penalty-Duells</p>
            </section>
            
            <div className="app-card mb-8 p-0 overflow-hidden">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src="https://www.youtube.com/embed/XvDNH2b3QZQ?autoplay=1&mute=1&loop=1&playlist=XvDNH2b3QZQ&controls=0&showinfo=0&rel=0"
                  title="Penalty Shootout Gameplay"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center mt-12 mb-8">
              <button 
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transform transition hover:scale-105"
                onClick={() => router.push('/register')}
              >
                JETZT SPIELEN 🚀
              </button>
              <p className="text-sm text-gray-400 mt-4">Kostenlos registrieren und loslegen!</p>
            </div>
            
          </div>
        </div>
      </div>
    </Layout>
  );
}