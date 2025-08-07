'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import AuthPage from '@/components/AuthPage';
import GameField from '@/components/GameField';
import { FaSearch } from 'react-icons/fa';

interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  totalPoints?: number;
}

function ChallengeNewPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [error, setError] = useState('');
  
  // Opponent search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for pre-selected user from URL params
  useEffect(() => {
    const userId = searchParams.get('user');
    const isRevanche = searchParams.get('revanche');
    const opponentEmail = searchParams.get('opponent');
    
    if (userId) {
      setIsLoadingUser(true);
      loadUserById(userId);
    } else if (isRevanche && opponentEmail) {
      // Handle revanche - load opponent from sessionStorage or URL
      const storedOpponent = sessionStorage.getItem('revangeOpponent');
      if (storedOpponent) {
        try {
          const opponent = JSON.parse(storedOpponent);
          setSelectedUser(opponent);
          setSearchQuery(opponent.username);
          // Clear the stored data
          sessionStorage.removeItem('revangeOpponent');
        } catch (error) {
          console.error('Error parsing revanche opponent:', error);
        }
      }
    }
  }, [searchParams]);

  const loadUserById = async (userId: string) => {
    try {
      // Try to load user by ID first from the stats API
      const statsResponse = await fetch(`/api/stats/user/${userId}`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.user) {
          const loadedUser = {
            id: statsData.user.id,
            username: statsData.user.username,
            email: statsData.user.email,
            avatar: statsData.user.avatar,
            totalPoints: statsData.stats?.totalPoints || 0
          };
          
          // Check for existing challenge with this user
          if (user?.email) {
            const checkResponse = await fetch(`/api/matches/check-existing?playerA=${encodeURIComponent(user.email)}&playerB=${encodeURIComponent(loadedUser.email)}`);
            if (checkResponse.ok) {
              const { hasPendingChallenge } = await checkResponse.json();
              if (hasPendingChallenge) {
                setError('Es existiert bereits eine offene Herausforderung zwischen euch. Bitte warte, bis diese abgeschlossen ist.');
                setIsLoadingUser(false);
                // Redirect back to garderobe after showing error
                setTimeout(() => {
                  router.push('/garderobe');
                }, 3000);
                return;
              }
            }
          }
          
          setSelectedUser(loadedUser);
          setSearchQuery(loadedUser.username);
          setIsLoadingUser(false);
          return;
        }
      }
      
      // Fallback: try search API 
      const searchResponse = await fetch(`/api/users/search?q=${userId}`);
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        const foundUser = searchData.users.find((u: User) => u.id === userId);
        if (foundUser) {
          // Check for existing challenge with this user
          if (user?.email) {
            const checkResponse = await fetch(`/api/matches/check-existing?playerA=${encodeURIComponent(user.email)}&playerB=${encodeURIComponent(foundUser.email)}`);
            if (checkResponse.ok) {
              const { hasPendingChallenge } = await checkResponse.json();
              if (hasPendingChallenge) {
                setError('Es existiert bereits eine offene Herausforderung zwischen euch. Bitte warte, bis diese abgeschlossen ist.');
                setIsLoadingUser(false);
                // Redirect back to garderobe after showing error
                setTimeout(() => {
                  router.push('/garderobe');
                }, 3000);
                return;
              }
            }
          }
          
          setSelectedUser(foundUser);
          setSearchQuery(foundUser.username);
          setIsLoadingUser(false);
        } else {
          setIsLoadingUser(false);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setIsLoadingUser(false);
    }
  };

  // Opponent search functions
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300) as any;
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const searchUsers = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users.filter((u: User) => u.id !== user?.id));
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectUser = async (selectedUser: User) => {
    // Check for existing challenge before selecting user
    if (user?.email) {
      try {
        const checkResponse = await fetch(`/api/matches/check-existing?playerA=${encodeURIComponent(user.email)}&playerB=${encodeURIComponent(selectedUser.email)}`);
        if (checkResponse.ok) {
          const { hasPendingChallenge } = await checkResponse.json();
          if (hasPendingChallenge) {
            setError('Es existiert bereits eine offene Herausforderung zwischen euch. Bitte warte, bis diese abgeschlossen ist.');
            setSearchResults([]);
            return;
          }
        }
      } catch (err) {
        console.error('Error checking existing challenge:', err);
      }
    }
    
    setSelectedUser(selectedUser);
    setSearchQuery(selectedUser.username);
    setSearchResults([]);
    setError(''); // Clear any previous errors
  };

  const handleStartChallenge = () => {
    if (selectedUser) {
      // Navigate to shooter page with opponent info
      const params = new URLSearchParams({
        opponent: selectedUser.id,
        name: selectedUser.username,
        email: selectedUser.email,
        points: (selectedUser.totalPoints || 0).toString()
      });
      router.push(`/shooter?${params.toString()}`);
    }
  };

  const getAvatarEmoji = (avatar: string): string => {
    const avatarMap: { [key: string]: string } = {
      'fire': '🔥', 'lightning': '⚡', 'star': '🌟', 'rocket': '🚀', 'crown': '👑',
      'target': '🎯', 'trophy': '🏆', 'soccer': '⚽', 'muscle': '💪', 'sunglasses': '😎',
      'heart': '❤️', 'diamond': '💎', 'rainbow': '🌈', 'ghost': '👻', 'alien': '👽',
      'robot': '🤖', 'unicorn': '🦄', 'dragon': '🐉', 'ninja': '🥷', 'wizard': '🧙'
    };
    return avatarMap[avatar] || '⚽';
  };

  if (loading) {
    return (
      <Layout showHeader={false}>
        <GameField mode="shooter">
          <div className="loading">⚽ Lade Challenge...</div>
        </GameField>
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

  return (
    <Layout showHeader={false}>
      <GameField mode="shooter">
        {/* Header */}
        <div className="challenge-header">
          <h1 className="challenge-title">⚽ Neue Herausforderung</h1>
          <p className="challenge-subtitle">
            Wähle einen Gegner für dein Elfmeterschießen
          </p>
        </div>

        {/* Content Area */}
        <div className="challenge-content">
          {/* Selected User Display */}
          {selectedUser && (
            <div className="selected-user-card">
              <div className="selected-user-info">
                <span className="selected-user-avatar">{getAvatarEmoji(selectedUser.avatar)}</span>
                <div className="selected-user-details">
                  <div className="selected-user-name">{selectedUser.username}</div>
                  <div className="selected-user-points">{selectedUser.totalPoints || 0} Punkte</div>
                </div>
              </div>
              <button
                onClick={handleStartChallenge}
                className="challenge-start-btn"
              >
                Herausfordern
              </button>
            </div>
          )}

          {/* Opponent Selection - Only show if no user is selected or being loaded */}
          {!selectedUser && !isLoadingUser && (
            <div className="opponent-selection">
              <h2 className="selection-title">Wähle deinen Gegner</h2>

              {/* Search Input */}
              <div className="search-container">
                <div className="search-input-wrapper">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Spielername eingeben..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                  {isSearching && (
                    <div className="search-loading">
                      <div className="search-spinner"></div>
                    </div>
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map((searchUser) => (
                      <button
                        key={searchUser.id}
                        onClick={() => selectUser(searchUser)}
                        className="search-result-item"
                      >
                        <span className="result-avatar">{getAvatarEmoji(searchUser.avatar)}</span>
                        <div className="result-info">
                          <div className="result-name">{searchUser.username}</div>
                          <div className="result-points">{searchUser.totalPoints || 0} Punkte</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Loading User */}
          {isLoadingUser && (
            <div className="loading-user">
              <h2 className="loading-title">Lade Gegner...</h2>
              <div className="loading-spinner"></div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="challenge-controls">
          <button
            onClick={() => router.push('/garderobe')}
            className="back-btn"
          >
            Zurück zur Garderobe
          </button>
        </div>
      </GameField>

      <style jsx>{`
        .loading {
          grid-area: field;
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
          font-size: clamp(1.5rem, 4vw, 2rem);
          text-align: center;
        }

        .challenge-header {
          grid-area: header;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 2vh 0;
        }

        .challenge-title {
          color: #10b981;
          font-size: clamp(1.8rem, 5vw, 2.5rem);
          font-weight: bold;
          margin-bottom: 1vh;
        }

        .challenge-subtitle {
          color: #fbbf24;
          font-size: clamp(1rem, 2.5vw, 1.3rem);
          margin: 0;
        }

        .challenge-content {
          grid-area: field;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 2rem;
          gap: 2rem;
        }

        .selected-user-card {
          background: rgba(0, 0, 0, 0.8);
          border: 2px solid #10b981;
          border-radius: 1.5rem;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          backdrop-filter: blur(10px);
          max-width: 400px;
          width: 100%;
        }

        .selected-user-info {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .selected-user-avatar {
          font-size: 3rem;
        }

        .selected-user-details {
          text-align: left;
        }

        .selected-user-name {
          color: white;
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }

        .selected-user-points {
          color: #fbbf24;
          font-size: 1.1rem;
        }

        .challenge-start-btn {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 0.75rem;
          padding: 1rem 2rem;
          font-size: 1.2rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .challenge-start-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }

        .opponent-selection {
          background: rgba(0, 0, 0, 0.7);
          border: 2px solid rgba(16, 185, 129, 0.5);
          border-radius: 1.5rem;
          padding: 2rem;
          backdrop-filter: blur(10px);
          max-width: 500px;
          width: 100%;
        }

        .selection-title {
          color: white;
          font-size: 1.5rem;
          font-weight: bold;
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .search-container {
          position: relative;
        }

        .search-input-wrapper {
          position: relative;
          margin-bottom: 1rem;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
          z-index: 10;
        }

        .search-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          background: #374151;
          border: 1px solid #6b7280;
          border-radius: 0.75rem;
          color: white;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.3s ease;
        }

        .search-input:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 1px #10b981;
        }

        .search-input::placeholder {
          color: #9ca3af;
        }

        .search-loading {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
        }

        .search-spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid #10b981;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .search-results {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #374151;
          border: 1px solid #6b7280;
          border-radius: 0.75rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          z-index: 20;
          max-height: 200px;
          overflow-y: auto;
        }

        .search-result-item {
          width: 100%;
          padding: 1rem;
          background: none;
          border: none;
          color: white;
          display: flex;
          align-items: center;
          gap: 1rem;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .search-result-item:hover {
          background: #4b5563;
        }

        .result-avatar {
          font-size: 1.5rem;
        }

        .result-info {
          text-align: left;
        }

        .result-name {
          font-size: 1rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .result-points {
          font-size: 0.875rem;
          color: #9ca3af;
        }

        .loading-user {
          text-align: center;
          color: white;
        }

        .loading-title {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 1rem;
        }

        .loading-spinner {
          width: 2rem;
          height: 2rem;
          border: 3px solid #10b981;
          border-top: 3px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid #ef4444;
          border-radius: 0.75rem;
          padding: 1rem;
          color: #fca5a5;
          text-align: center;
          max-width: 400px;
        }

        .challenge-controls {
          grid-area: controls;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          padding-bottom: 2rem;
        }

        .back-btn {
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: 2px solid #6b7280;
          border-radius: 0.75rem;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(5px);
        }

        .back-btn:hover {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.1);
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .challenge-content {
            padding: 1rem;
          }
          
          .selected-user-card,
          .opponent-selection {
            padding: 1.5rem;
          }
        }
      `}</style>
    </Layout>
  );
}

export default function ChallengeNewPage() {
  return (
    <Suspense fallback={
      <Layout showHeader={false}>
        <GameField mode="shooter">
          <div className="loading">⚽ Lade Challenge...</div>
        </GameField>
      </Layout>
    }>
      <ChallengeNewPageContent />
    </Suspense>
  );
}