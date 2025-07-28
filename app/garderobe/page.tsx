'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import AuthPage from '@/components/AuthPage';
import UserAvatar from '@/components/UserAvatar';
import Layout from '@/components/Layout';
import UserStatsCard from '@/components/UserStatsCard';
import Leaderboard from '@/components/Leaderboard';
import ChallengeModal from '@/components/ChallengeModal';
import { calculateLevel } from '@/lib/levels';

interface PendingChallenge {
  id: string;
  challengerEmail: string;
  challengerUsername: string;
  challengerAvatar: string;
  createdAt: string;
  type: 'invitation' | 'active' | 'waiting_for_opponent' | 'cancelable' | 'finished_recent';
  role: 'defender' | 'challenger';
  winner?: string;
}

export default function Garderobe() {
  const [error, setError] = useState('');
  const [pendingChallenges, setPendingChallenges] = useState<PendingChallenge[]>([]);
  const [isLoadingChallenges, setIsLoadingChallenges] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [userStats, setUserStats] = useState<any>(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedUserToChallenge, setSelectedUserToChallenge] = useState<{id: string; username: string; email: string; avatar: string} | null>(null);
  const [isCheckingChallenge, setIsCheckingChallenge] = useState(false);
  const [checkingUserId, setCheckingUserId] = useState<string | null>(null);
  const [viewedMatches, setViewedMatches] = useState<Set<string>>(() => {
    // Load viewed matches from localStorage on init
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('viewedFinishedMatches');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    }
    return new Set();
  });
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  // Fetch pending challenges and user stats when user is loaded
  useEffect(() => {
    if (user) {
      fetchPendingChallenges();
      fetchUserStats();
    }
  }, [user]);

  // Auto-close welcome modal after 4 seconds
  useEffect(() => {
    if (showWelcomeModal) {
      const timer = setTimeout(() => {
        setShowWelcomeModal(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showWelcomeModal]);

  const fetchPendingChallenges = async () => {
    try {
      const response = await fetch('/api/matches/pending');
      if (response.ok) {
        const data = await response.json();
        setPendingChallenges(data.challenges);
      }
    } catch (error) {
      console.error('Error fetching pending challenges:', error);
    } finally {
      setIsLoadingChallenges(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch(`/api/stats/user/${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setUserStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const declineChallenge = async (challengeId: string) => {
    try {
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'decline-challenge', 
          matchId: challengeId,
          email: user?.email
        })
      });
      
      if (response.ok) {
        // Refresh the challenges list
        fetchPendingChallenges();
      } else {
        const data = await response.json();
        setError(data.error || 'Fehler beim Ablehnen der Herausforderung');
      }
    } catch (err) {
      setError('Netzwerkfehler');
    }
  };

  const cancelChallenge = async (challengeId: string) => {
    try {
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'cancel-challenge', 
          matchId: challengeId,
          email: user?.email
        })
      });
      
      if (response.ok) {
        // Refresh the challenges list
        fetchPendingChallenges();
      } else {
        const data = await response.json();
        setError(data.error || 'Fehler beim Löschen der Herausforderung');
      }
    } catch (err) {
      setError('Netzwerkfehler');
    }
  };

  // Save viewed matches to localStorage
  const saveViewedMatches = (matches: Set<string>) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('viewedFinishedMatches', JSON.stringify([...matches]));
    }
  };

  const acceptChallenge = async (challengeId: string, type: 'invitation' | 'active' | 'waiting_for_opponent' | 'cancelable' | 'finished_recent') => {
    if (type === 'invitation') {
      // Simply redirect to challenge page - joining will happen there
      router.push(`/challenge?match=${challengeId}`);
    } else {
      // Mark finished games as viewed when opening them
      if (type === 'finished_recent') {
        const newViewedMatches = new Set([...viewedMatches, challengeId]);
        setViewedMatches(newViewedMatches);
        saveViewedMatches(newViewedMatches);
      }
      // Just navigate to the match (active, waiting_for_opponent, cancelable, or finished_recent)
      router.push(`/challenge?match=${challengeId}`);
    }
  };

  // Show auth page if not logged in
  if (loading) {
    return (
      <Layout showHeader={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-xl">⚽ Lade PENALTY...</div>
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
  

  const handleChallengeUser = async (challengeUser: {id: string; username: string; email: string; avatar: string}) => {
    // Set loading states
    setIsCheckingChallenge(true);
    setCheckingUserId(challengeUser.id);
    setError(''); // Clear any previous errors
    
    // Check for existing challenge before opening modal
    if (user?.email) {
      try {
        const checkResponse = await fetch(`/api/matches/check-existing?playerA=${encodeURIComponent(user.email)}&playerB=${encodeURIComponent(challengeUser.email)}`);
        if (checkResponse.ok) {
          const { hasPendingChallenge } = await checkResponse.json();
          if (hasPendingChallenge) {
            setError(`Es existiert bereits eine offene Herausforderung mit ${challengeUser.username}. Bitte warte, bis diese abgeschlossen ist.`);
            // Auto-clear error after 5 seconds
            setTimeout(() => setError(''), 5000);
            setIsCheckingChallenge(false);
            setCheckingUserId(null);
            return;
          }
        }
      } catch (err) {
        console.error('Error checking existing challenge:', err);
        setError('Fehler beim Prüfen der Herausforderung. Bitte versuche es erneut.');
        setTimeout(() => setError(''), 5000);
        setIsCheckingChallenge(false);
        setCheckingUserId(null);
        return;
      }
    }
    
    // Clear loading states and open modal
    setIsCheckingChallenge(false);
    setCheckingUserId(null);
    setSelectedUserToChallenge(challengeUser);
    setShowChallengeModal(true);
  };

  
  return (
    <Layout showHeader={true}>
      {/* Global Error Toast */}
      {error && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full px-4">
          <div className="bg-red-900 bg-opacity-95 backdrop-blur-lg border-2 border-red-400 rounded-lg p-4 shadow-2xl animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-red-400 text-xl">⚠️</span>
              <p className="text-red-100 font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}
      {/* Welcome Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="welcome-modal bg-grass-green-light backdrop-blur-lg rounded-lg border-2 border-green-600 shadow-xl pt-12 pb-6 px-8 max-w-lg w-full text-center relative">
            <div className="mb-4">
              <h2 className="hero-title text-xl md:text-2xl text-white" style={{fontFamily: 'var(--font-notable)', marginBottom: '2.5rem', whiteSpace: 'nowrap', lineHeight: '1.2', marginTop: '1rem'}}>WILLKOMMEN ZURÜCK</h2>
              <h3 className="text-base text-green-900 mb-5 font-semibold">
                in deiner Garderobe {userStats ? `${calculateLevel(userStats.totalPoints).name} ` : ''}{user?.username}
              </h3>
              <p className="text-green-900 text-sm font-medium mb-6">Möge die Macht mit dir sein</p>
              <div className="flex items-center justify-center gap-6">
                <span className="text-5xl">⚽</span>
                <img src="/gloves.png" alt="Torwart Handschuhe" className="gloves-image w-20 h-auto" />
              </div>
            </div>
            <button
              onClick={() => setShowWelcomeModal(false)}
              className="text-green-900 hover:text-white transition-colors absolute top-4 right-4 text-xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Garderobe Content */}
      <div className="garderobe-page">
        <div className="container section">
          
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Area */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Player Stats - Now More Prominent */}
            <div className="bg-grass-green-light bg-opacity-60 backdrop-blur-lg rounded-lg border-2 border-green-600 border-opacity-80 shadow-xl p-6">
              <UserStatsCard 
                userId={user.id}
                username={user.username}
                avatar={user.avatar}
              />
            </div>
            
            {/* Challenge Info */}
            <div className="bg-grass-green-light bg-opacity-60 backdrop-blur-lg rounded-lg border-2 border-green-600 border-opacity-80 shadow-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                PENALTY Challenge
              </h2>
              <p className="text-gray-300 mb-6">
                Fordere andere Spieler zu spannenden Penalty-Duellen heraus
              </p>
            
              <div className="space-y-6">
                <div className="text-center">
                  <button
                    onClick={() => setShowChallengeModal(true)}
                    disabled={isCheckingChallenge}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-green-600 text-white text-xl font-bold rounded-lg hover:bg-green-500 transition-all duration-200 transform hover:scale-105 border border-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isCheckingChallenge ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                        PRÜFE...
                      </>
                    ) : (
                      <>
                        <span className="text-2xl">⚽</span>
                        JETZT HERAUSFORDERN
                      </>
                    )}
                  </button>
                </div>
                
                <div className="text-center">
                  <p className="text-green-300 text-sm">
                    Verwende den &quot;HERAUSFORDERN&quot; Button in der Navigation oder klicke hier
                  </p>
                </div>
              </div>
              
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-grass-green-light bg-opacity-60 backdrop-blur-lg rounded-lg border-2 border-green-600 border-opacity-80 shadow-xl p-6 leaderboard-section">
              <Leaderboard 
                currentUserId={user.id} 
                onChallengeUser={handleChallengeUser}
                checkingUserId={checkingUserId}
              />
            </div>
            
            <div className="bg-grass-green-light bg-opacity-60 backdrop-blur-lg rounded-lg border-2 border-green-600 border-opacity-80 shadow-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Spielregeln</h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="text-center p-3 bg-green-900 bg-opacity-50 rounded">
                  <span className="block text-2xl font-bold text-green-400">5</span>
                  <span className="text-gray-300 text-sm">Penalty</span>
                </div>
                <div className="text-center p-3 bg-blue-900 bg-opacity-50 rounded">
                  <span className="block text-2xl font-bold text-blue-400">10</span>
                  <span className="text-gray-300 text-sm">Punkte/Tor</span>
                </div>
                <div className="text-center p-3 bg-yellow-900 bg-opacity-50 rounded">
                  <span className="block text-2xl font-bold text-yellow-400">15</span>
                  <span className="text-gray-300 text-sm">Punkte/Parade</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Challenge Modal */}
      <ChallengeModal 
        isOpen={showChallengeModal}
        onClose={() => {
          setShowChallengeModal(false);
          setSelectedUserToChallenge(null);
        }}
        preSelectedUser={selectedUserToChallenge}
        redirectToChallengePage={true}
      />
    </Layout>
  );
}