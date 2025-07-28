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
          <h1 className="hero-title">Penalty</h1>
          <div className="hero-content">
            <p className="hero-subtitle">
              Fordere deine Freunde heraus und werde zum Penalty-König
            </p>
          </div>
          
          {/* Stadium Players Area - Left Side */}
          <div className="stadium-players">
            {isLoadingPlayers ? (
              <div className="loading-players">
                <div className="text-4xl mb-2">⚽</div>
                <p className="text-sm text-white">Lade Spieler...</p>
              </div>
            ) : activePlayers.length > 0 ? (
              <div className="players-list">
                {activePlayers.slice(0, 4).map((player) => {
                  const level = calculateLevel(player.stats.totalPoints);
                  return (
                    <div key={player.id} className="stadium-player-card">
                      <div className="stadium-player-info">
                        <div className="stadium-player-stats">
                          <span className="stadium-player-name">{player.username}</span>
                          <span className="stadium-player-level">{level.name} {level.icon}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-players">
                <div className="text-2xl mb-2">🏆</div>
                <p className="text-sm text-white">Keine Spieler online</p>
              </div>
            )}
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
                <span>Sign Up</span>
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
              <p className="section-subtitle">In vier einfachen Schritten zum Elfmeter-Duell</p>
            </section>
            
            <div className="icon-grid mb-12">
              <div className="feature-icon">
                <div className="feature-icon-image">
                  <FaUser size={24} />
                </div>
                <h3 className="feature-icon-title">Anmelden</h3>
                <p className="feature-icon-desc">Kostenlosen Account erstellen</p>
              </div>
              
              <div className="feature-icon">
                <div className="feature-icon-image">
                  <IoFootball size={24} />
                </div>
                <h3 className="feature-icon-title">Schießen</h3>
                <p className="feature-icon-desc">5 Penalties platzieren</p>
              </div>
              
              <div className="feature-icon">
                <div className="feature-icon-image">
                  <GiGoalKeeper size={24} />
                </div>
                <h3 className="feature-icon-title">Halten</h3>
                <p className="feature-icon-desc">Als Torwart parieren</p>
              </div>
              
              <div className="feature-icon">
                <div className="feature-icon-image">
                  <IoTrophy size={24} />
                </div>
                <h3 className="feature-icon-title">Gewinnen</h3>
                <p className="feature-icon-desc">Punkte sammeln</p>
              </div>
            </div>

            {/* Game Rules */}
            <section className="section-header">
              <h2 className="section-title">Spielregeln</h2>
              <p className="section-subtitle">Wie Schütze und Torwart Punkte sammeln</p>
            </section>
            
            <div className="feature-grid mb-8">
              <div className="app-card">
                <div className="text-center mb-4">
                  <div className="feature-icon-image mx-auto mb-3">
                    <FaBullseye size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-4">Schütze</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: 'var(--accent-green)'}}></div>
                    <span style={{color: 'var(--text-secondary)'}}>5 Schussrichtungen wählen</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: 'var(--accent-green)'}}></div>
                    <span style={{color: 'var(--text-secondary)'}}>Links, Mitte oder Rechts</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: 'var(--status-warning)'}}></div>
                    <span style={{color: 'var(--text-primary)'}} className="font-semibold">10 Punkte pro Tor</span>
                  </div>
                </div>
              </div>

              <div className="app-card">
                <div className="text-center mb-4">
                  <div className="feature-icon-image mx-auto mb-3">
                    <GiGoalKeeper size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-4">Torwart</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: 'var(--accent-green)'}}></div>
                    <span style={{color: 'var(--text-secondary)'}}>5 Paraden vorausplanen</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: 'var(--accent-green)'}}></div>
                    <span style={{color: 'var(--text-secondary)'}}>Hecht oder Mitte bleiben</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: 'var(--status-warning)'}}></div>
                    <span style={{color: 'var(--text-primary)'}} className="font-semibold">15 Punkte pro Parade</span>
                  </div>
                </div>
              </div>
            </div>
            

            
          </div>
        </div>
      </div>
    </Layout>
  );
}