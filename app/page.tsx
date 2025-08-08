'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import PlayerCard from '@/components/PlayerCard';
import TribuneFlashes from '@/components/TribuneFlashes';
import { FaUser, FaSignInAlt, FaUserPlus, FaChevronDown, FaPlay, FaBullseye, FaChartBar, FaBell, FaRedoAlt } from 'react-icons/fa';
import { IoFootball, IoTrophy } from 'react-icons/io5';
import { MdSportsSoccer, MdHome, MdMovie } from 'react-icons/md';
import { GiGoalKeeper } from 'react-icons/gi';
import { AvatarId } from '@/lib/types';
import { calculateLevel } from '@/lib/levels';

interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  avatar: AvatarId;
  email?: string;
  stats: {
    totalPoints: number;
    gamesPlayed: number;
    gamesWon: number;
    winRate: number;
    goalsScored: number;
    savesMade: number;
  };
  level: {
    id: number;
    name: string;
    icon: string;
  };
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
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);
  const [appStats, setAppStats] = useState<AppStats | null>(null);

  // Redirect logged-in users to garderobe
  useEffect(() => {
    if (!loading && user) {
      router.push('/garderobe');
    }
  }, [user, loading, router]);

  // Fetch leaderboard and stats
  useEffect(() => {
    fetchLeaderboard();
    fetchAppStats();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/stats/leaderboard');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
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
          <div className="hero-content">
            <p className="hero-subtitle">
              Das ultimative Elfmeter-Duell! Zeig deine Nerven aus Stahl und werde zur Penalty-Legende!
            </p>
            <h1 className="hero-title">PENALTY SHOOTOUT</h1>
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
                <p className="text-gray-200">Kostenlosen Account erstellen und Avatar wählen</p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <IoFootball size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">2. Herausfordern</h3>
                <p className="text-gray-200">Freunde zum Penalty-Duell einladen</p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                  <IoTrophy size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">3. Gewinnen</h3>
                <p className="text-gray-200">Punkte sammeln und aufsteigen</p>
              </div>
            </div>

            {/* Game Rules */}
            <section className="section-header">
              <h2 className="section-title">Spielregeln</h2>
              <p className="section-subtitle">Einfach, fair und spannend!</p>
            </section>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="app-card text-center p-4 bg-green-900 bg-opacity-50">
                <div className="text-3xl font-bold text-green-400">5</div>
                <div className="text-white text-sm">Elfmeter</div>
                <div className="text-gray-200 text-xs mt-1">pro Spiel</div>
              </div>
              
              <div className="app-card text-center p-4 bg-blue-900 bg-opacity-50">
                <div className="text-3xl font-bold text-blue-400">3</div>
                <div className="text-white text-sm">Punkte</div>
                <div className="text-gray-200 text-xs mt-1">für jeden Sieg</div>
              </div>
              
              <div className="app-card text-center p-4 bg-red-900 bg-opacity-50">
                <div className="text-3xl font-bold text-red-400">0</div>
                <div className="text-white text-sm">Punkte</div>
                <div className="text-gray-200 text-xs mt-1">bei Niederlage</div>
              </div>
              
              <div className="app-card text-center p-4 bg-yellow-900 bg-opacity-50">
                <div className="text-3xl font-bold text-yellow-400">+10</div>
                <div className="text-white text-sm">Bonus</div>
                <div className="text-gray-200 text-xs mt-1">Level-Aufstieg</div>
              </div>
            </div>


            {/* Live Stats */}
            {appStats && (
              <div className="mb-8 border-2 border-green-600 rounded-lg p-6" style={{backgroundColor: 'rgba(22, 101, 52, 0.9)', background: 'linear-gradient(90deg, rgba(22, 101, 52, 0.9), rgba(20, 83, 45, 0.9)'}}>
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
              <div className="p-8 hover:transform hover:scale-105 hover:shadow-2xl transition-all duration-300 border-2 border-green-600 rounded-lg" style={{backgroundColor: 'rgba(22, 101, 52, 0.9)', background: 'linear-gradient(135deg, rgba(22, 101, 52, 0.9), rgba(20, 83, 45, 0.9)'}}>
                <div className="text-6xl mb-4 text-center animate-pulse text-green-400 flex justify-center">
                  <FaChartBar />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 text-center">Live-Rangliste</h3>
                <p className="text-green-200 text-center text-lg">Sieh sofort wo du stehst und kämpfe dich nach oben!</p>
              </div>

              <div className="p-8 hover:transform hover:scale-105 hover:shadow-2xl transition-all duration-300 border-2 border-blue-600 rounded-lg" style={{backgroundColor: 'rgba(30, 58, 138, 0.9)', background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.9), rgba(29, 78, 216, 0.9)'}}>
                <div className="text-6xl mb-4 text-center animate-bounce text-blue-400 flex justify-center">
                  <FaRedoAlt />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 text-center">Revanche-Button</h3>
                <p className="text-blue-200 text-center text-lg">Verloren? Mit einem Klick startest du die Revanche.</p>
              </div>

              <div className="p-8 hover:transform hover:scale-105 hover:shadow-2xl transition-all duration-300 border-2 border-yellow-600 rounded-lg" style={{backgroundColor: 'rgba(146, 64, 14, 0.9)', background: 'linear-gradient(135deg, rgba(146, 64, 14, 0.9), rgba(180, 83, 9, 0.9)'}}>
                <div className="text-6xl mb-4 text-center text-yellow-400 relative flex justify-center">
                  <span className="animate-ping absolute inline-flex h-16 w-16 rounded-full bg-yellow-400 opacity-75 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"></span>
                  <span className="relative inline-flex">
                    <FaBell />
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 text-center">Push-Benachrichtigungen</h3>
                <p className="text-yellow-200 text-center text-lg">Verpasse kein Match - wir halten dich auf dem Laufenden!</p>
              </div>

              <div className="p-8 hover:transform hover:scale-105 hover:shadow-2xl transition-all duration-300 border-2 border-purple-600 rounded-lg" style={{backgroundColor: 'rgba(88, 28, 135, 0.9)', background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.9), rgba(107, 33, 168, 0.9)'}}>
                <div className="text-6xl mb-4 text-center text-purple-400 flex justify-center">
                  <span className="inline-block animate-spin">
                    <MdMovie />
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 text-center">Spannende Animationen</h3>
                <p className="text-purple-200 text-center text-lg">Erlebe jedes Tor und jede Parade hautnah mit!</p>
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
                <p className="text-gray-200">Lade Spieler...</p>
              </div>
            ) : leaderboard.length > 0 ? (
              <div className="mb-8 border-2 border-green-600 rounded-lg overflow-hidden" style={{backgroundColor: 'rgba(22, 101, 52, 0.9)', background: 'linear-gradient(135deg, rgba(22, 101, 52, 0.9), rgba(20, 83, 45, 0.9)'}}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-green-900 bg-opacity-50 text-green-400">
                        <th className="text-left py-3 px-4 font-semibold">
                          <span className="hidden md:inline">Platz</span>
                          <span className="inline md:hidden">#</span>
                        </th>
                        <th className="text-left py-3 px-4 font-semibold">
                          <span className="hidden md:inline">Spieler</span>
                          <span className="inline md:hidden">Name</span>
                        </th>
                        <th className="text-center py-3 px-4 font-semibold">SP</th>
                        <th className="text-center py-3 px-4 font-semibold hidden md:table-cell">G</th>
                        <th className="text-center py-3 px-4 font-semibold hidden md:table-cell">V</th>
                        <th className="text-right py-3 px-4 font-semibold">
                          <span className="hidden md:inline">Punkte</span>
                          <span className="inline md:hidden">Pkt</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-white">
                      {leaderboard.slice(0, 10).map((player, index) => {
                        const isEvenRow = index % 2 === 0;
                        return (
                          <tr key={player.id} className={`${isEvenRow ? 'bg-gray-800 bg-opacity-20' : ''} hover:bg-green-900 hover:bg-opacity-20 transition-colors`}>
                            <td className="py-3 px-4">
                              <span className="text-lg">
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : player.rank}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-white">
                                {player.username.length > 12 
                                  ? player.username.substring(0, 10) + '.' 
                                  : player.username}
                              </div>
                            </td>
                            <td className="text-center py-3 px-4">{player.stats.gamesPlayed}</td>
                            <td className="text-center py-3 px-4 hidden md:table-cell">{player.stats.gamesWon}</td>
                            <td className="text-center py-3 px-4 hidden md:table-cell">{player.stats.gamesPlayed - player.stats.gamesWon}</td>
                            <td className="text-right py-3 px-4 font-semibold text-green-400">{player.stats.totalPoints}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="mb-8 text-center py-8 border-2 border-green-600 rounded-lg" style={{backgroundColor: 'rgba(22, 101, 52, 0.9)', background: 'linear-gradient(135deg, rgba(22, 101, 52, 0.9), rgba(20, 83, 45, 0.9)'}}>
                <div className="text-4xl mb-2">🏆</div>
                <p className="text-gray-200">Noch keine Einträge</p>
                <p className="text-sm mt-2 text-gray-300">Spiele dein erstes Match!</p>
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
              <div className="flex justify-center">
                <button 
                  className="stadium-btn stadium-btn-primary"
                  onClick={() => router.push('/register')}
                >
                  JETZT SPIELEN 🚀
                </button>
              </div>
              <p className="text-sm text-gray-200 mt-4">Kostenlos registrieren und loslegen!</p>
            </div>
            
          </div>
        </div>
      </div>
    </Layout>
  );
}