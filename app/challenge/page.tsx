'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import AuthPage from '@/components/AuthPage';
import PenaltySelector from '@/components/PenaltySelector';
import TribuneFlashes from '@/components/TribuneFlashes';
import AnimatedGameReplay from '@/components/AnimatedGameReplay';
import { PlayerMoves, ShotDirection } from '@/lib/types';
import { nanoid } from '@/lib/utils';
import { FaArrowLeft, FaSearch, FaChartBar } from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';

interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  totalPoints?: number;
}

export default function ChallengePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [matchId, setMatchId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [matchData, setMatchData] = useState<any>(null);
  const [gameResult, setGameResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showGameDetails, setShowGameDetails] = useState(false);
  
  
  // Opponent search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Check for pre-selected user from URL params OR match ID
  useEffect(() => {
    const userId = searchParams.get('user');
    const matchId = searchParams.get('match');
    const isRevanche = searchParams.get('revanche');
    const opponentEmail = searchParams.get('opponent');
    
    if (userId) {
      setIsLoadingUser(true);
      loadUserById(userId);
    } else if (matchId && user) {
      // Load match and set opponent as selected user - only when user is available
      loadMatchAndSetOpponent(matchId);
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
  }, [searchParams, user]); // Add user as dependency

  const loadMatchAndSetOpponent = async (matchId: string) => {
    setIsLoadingUser(true);
    try {
      const response = await fetch(`/api/match?matchId=${matchId}`);
      const data = await response.json();
      
      if (response.ok && data.match) {
        const match = data.match;
        
        // Store match data for result display
        setMatchData(match);
        setGameResult(data.result);
        
        // Check if match is finished
        if (match.status === 'finished' && data.result) {
          // Show animation first for finished matches
          setShowAnimation(true);
          setShowResult(false);
        } else {
          setShowAnimation(false);
          setShowResult(false);
        }
        
        // Check if current user is player B and hasn't joined yet
        if (user?.email === match.player_b_email && !match.player_b) {
          console.log('User is player B but hasnt joined yet, joining now...');
          // Join as player B first
          const playerId = nanoid();
          const joinResponse = await fetch('/api/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'join',
              matchId: matchId,
              playerId,
              email: user.email,
              username: user.username,
              avatar: user.avatar
            })
          });
          
          if (!joinResponse.ok) {
            const joinError = await joinResponse.json();
            console.error('Failed to join match:', joinError);
            setError('Fehler beim Beitreten zum Match');
            return;
          }
          
          // Store the player ID for later use
          localStorage.setItem('playerId', playerId);
          
          // Reload match data after joining
          const reloadResponse = await fetch(`/api/match?matchId=${matchId}`);
          const reloadData = await reloadResponse.json();
          if (reloadResponse.ok && reloadData.match) {
            data.match = reloadData.match;
          }
        }
        
        // Determine opponent based on current user
        let opponentEmail = '';
        let opponentUsername = '';
        let opponentAvatar = 'soccer';
        
        if (user?.email === match.player_a_email) {
          // Current user is player A, opponent is player B
          opponentEmail = match.player_b_email || '';
          opponentUsername = match.player_b_username || match.player_b_email || 'Gegner';
          opponentAvatar = match.player_b_avatar || 'soccer';
        } else if (user?.email === match.player_b_email) {
          // Current user is player B, opponent is player A  
          opponentEmail = match.player_a_email || '';
          opponentUsername = match.player_a_username || match.player_a_email || 'Gegner';
          opponentAvatar = match.player_a_avatar || 'soccer';
        }
        
        if (opponentEmail) {
          const opponentUser = {
            id: 'match_opponent',
            username: opponentUsername,
            email: opponentEmail,
            avatar: opponentAvatar,
            totalPoints: 0
          };
          
          setSelectedUser(opponentUser);
          setSearchQuery(opponentUsername);
          setMatchId(matchId);
          
          // Try to load opponent's actual points
          fetch(`/api/users/search?q=${encodeURIComponent(opponentEmail)}`)
            .then(res => res.json())
            .then(data => {
              const foundUser = data.users?.find((u: User) => u.email === opponentEmail);
              if (foundUser && foundUser.totalPoints !== undefined) {
                setSelectedUser(prev => prev ? { ...prev, totalPoints: foundUser.totalPoints } : prev);
              }
            })
            .catch(err => console.error('Error loading opponent points:', err));
        }
      }
    } catch (error) {
      console.error('Error loading match:', error);
      setError('Fehler beim Laden des Matches');
    } finally {
      setIsLoadingUser(false);
    }
  };

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
      }, 300);
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


  const handleShotsSubmitted = async (moves: PlayerMoves, opponentEmail?: string) => {
    setIsLoading(true);
    try {
      const isExistingMatch = searchParams.get('match');
      console.log('handleShotsSubmitted called:', { isExistingMatch, moves });
      
      if (isExistingMatch) {
        // Submit keeper moves for existing match
        // First get the match to find the correct player ID
        const matchResponse = await fetch(`/api/match?matchId=${isExistingMatch}`);
        const matchData = await matchResponse.json();
        
        if (!matchResponse.ok || !matchData.match) {
          throw new Error('Match nicht gefunden');
        }
        
        const match = matchData.match;
        let playerId = '';
        
        // Find the correct player ID based on user email
        if (user?.email === match.player_a_email) {
          playerId = match.player_a;
        } else if (user?.email === match.player_b_email) {
          playerId = match.player_b;
          // If player B ID is not set, try to get it from localStorage
          if (!playerId) {
            playerId = localStorage.getItem('playerId') || '';
            console.log('Using playerId from localStorage:', playerId);
          }
        } else {
          throw new Error('Du bist nicht Teil dieses Matches');
        }
        
        if (!playerId) {
          throw new Error('Spieler ID nicht gefunden');
        }
        
        console.log('Submitting moves with playerId:', playerId);
        
        const response = await fetch('/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'submit-moves',
            matchId: isExistingMatch,
            playerId,
            moves
          })
        });

        const data = await response.json();
        console.log('API Response:', data);
        console.log('Match ID for redirect:', isExistingMatch);
        
        if (response.ok) {
          if (data.status === 'finished') {
            // Game is finished, reload match data to show result
            console.log('Game finished, reloading match data to show result');
            setIsLoading(false);
            setShowSuccessModal(false);
            // Reload match data to get the result
            await loadMatchAndSetOpponent(isExistingMatch);
            return;
          } else {
            // Game not finished yet, show success modal
            console.log('Game not finished yet, showing success modal. Status:', data.status);
            setShowSuccessModal(true);
          }
        } else {
          throw new Error(data.error || 'Fehler beim Übermitteln der Paraden');
        }
      } else {
        // Normal challenge flow - create new match
        const playerId = nanoid();
        const createResponse = await fetch('/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            playerId,
            email: user?.email,
            username: user?.username,
            avatar: user?.avatar,
            moves: moves.moves
          })
        });

        if (!createResponse.ok) {
          throw new Error('Fehler beim Erstellen des Matches');
        }

        const { matchId: createdMatchId } = await createResponse.json();
        setMatchId(createdMatchId);

        // Then invite the player
        const inviteResponse = await fetch('/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'invite-player',
            matchId: createdMatchId,
            email: opponentEmail
          })
        });

        if (!inviteResponse.ok) {
          const errorData = await inviteResponse.json();
          if (errorData.existingChallenge) {
            // Delete the just created match since we can't proceed
            await fetch('/api/match', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'cancel-challenge',
                matchId: createdMatchId,
                email: user?.email
              })
            });
          }
          throw new Error(errorData.error || 'Fehler beim Senden der Herausforderung');
        }

        // Success - show modal
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error('Error in handleShotsSubmitted:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen der Herausforderung');
      setShowSuccessModal(false); // Make sure modal is not shown on error
      setIsLoading(false);
    }
  };

  const goBackToGarderobe = () => {
    router.push('/garderobe');
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

  const renderLedDigit = (digit: number) => {
    return (
      <div className={`led-digit led-digit-${digit}`}>
        <div className="led-segment seg-a"></div>
        <div className="led-segment seg-b"></div>
        <div className="led-segment seg-c"></div>
        <div className="led-segment seg-d"></div>
        <div className="led-segment seg-e"></div>
        <div className="led-segment seg-f"></div>
        <div className="led-segment seg-g"></div>
      </div>
    );
  };

  const renderLedScore = (score: number) => {
    const scoreStr = score.toString().padStart(1, '0');
    return scoreStr.split('').map((digit, index) => 
      <div key={index}>
        {renderLedDigit(parseInt(digit))}
      </div>
    );
  };

  const getLastName = (fullName: string): string => {
    if (!fullName || fullName.trim() === '') return 'Spieler';
    const parts = fullName.trim().split(' ');
    return parts[parts.length - 1];
  };

  const handleAnimationComplete = () => {
    console.log('handleAnimationComplete called');
    setShowAnimation(false);
    setShowResult(true);
  };

  const skipToResults = () => {
    setShowAnimation(false);
    setShowResult(true);
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

  if (!user) {
    return (
      <Layout showHeader={false}>
        <AuthPage />
      </Layout>
    );
  }

  return (
    <Layout showHeader={true}>
      <div className="challenge-page">
        <TribuneFlashes />
        <div className="container section">
          <div className="max-w-4xl mx-auto">
            
            
            {/* Centered Challenge Info - without frame */}
            {selectedUser && !searchParams.get('match') && (
              <div className="text-center mb-8">
                <p className="text-green-300 text-xl">
                  Du forderst <strong className="text-white">{selectedUser.username}</strong> ({selectedUser.totalPoints || 0} Punkte) heraus
                </p>
              </div>
            )}

            {/* Opponent Selection - Only show if no user is selected or being loaded */}
            {!selectedUser && !isLoadingUser && (
              <div className="mb-8">
                <div className="bg-grass-green-light bg-opacity-60 backdrop-blur-lg rounded-lg border-2 border-green-600 border-opacity-80 shadow-xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-6 text-center">
                    Wähle deinen Gegner
                  </h2>

                  {/* Search Input */}
                  <div className="relative mb-6">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-3 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Spielername eingeben..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-3">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-400 border-t-transparent"></div>
                        </div>
                      )}
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                        {searchResults.map((searchUser) => (
                          <button
                            key={searchUser.id}
                            onClick={() => selectUser(searchUser)}
                            className="w-full p-3 hover:bg-gray-700 text-left flex items-center gap-3 transition-colors"
                          >
                            <span className="text-2xl">{getAvatarEmoji(searchUser.avatar)}</span>
                            <div>
                              <div className="text-white font-medium">{searchUser.username}</div>
                              <div className="text-gray-400 text-sm">{searchUser.totalPoints || 0} Punkte</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Loading User */}
            {isLoadingUser && (
              <div className="mb-8 text-center">
                <div className="bg-grass-green-light bg-opacity-60 backdrop-blur-lg rounded-lg border-2 border-green-600 border-opacity-80 shadow-xl p-8 inline-block">
                  <h2 className="text-2xl font-bold text-white mb-4">Lade Gegner...</h2>
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-400 border-t-transparent mx-auto"></div>
                </div>
              </div>
            )}


            {error && (
              <div className="mb-6 mx-auto max-w-md">
                <div className="p-3 bg-red-900 bg-opacity-50 border border-red-500 rounded-lg">
                  <p className="text-red-300 text-sm text-center">{error}</p>
                </div>
              </div>
            )}

            {/* Skip to Results Button - Show above animation */}
            {showAnimation && gameResult && matchData && (
              <div className="text-center mb-6">
                <button
                  onClick={skipToResults}
                  className="hero-cta-blue inline-flex items-center justify-center gap-2"
                >
                  <FaChartBar />
                  Direkt zum Ergebnis springen
                </button>
              </div>
            )}

            {/* Animated Game Replay - Direct integration like PenaltySelector */}
            {showAnimation && gameResult && matchData && (
              <AnimatedGameReplay
                result={gameResult}
                playerRole={user?.email === matchData.player_a_email ? 'player_a' : 'player_b'}
                playerAEmail={matchData.player_a_email}
                playerBEmail={matchData.player_b_email}
                playerAUsername={matchData.player_a_username}
                playerBUsername={matchData.player_b_username}
                playerAAvatar={matchData.player_a_avatar}
                playerBAvatar={matchData.player_b_avatar}
                onAnimationComplete={handleAnimationComplete}
              />
            )}

            {/* Game Result - Show when match is finished */}
            {showResult && gameResult && matchData && (
              <div className="mb-8">
                <div className="bg-grass-green-light bg-opacity-60 backdrop-blur-lg rounded-lg border-2 border-green-600 border-opacity-80 shadow-xl p-8">
                  
                  {/* Sports Scoreboard */}
                  <div className="sports-scoreboard">
                    
                    {/* Header */}
                    <div className="scoreboard-header">
                      <div className={`scoreboard-status ${
                        gameResult.winner === 'draw' ? 'draw' : 
                        (user?.email === matchData.player_a_email && gameResult.winner === 'player_a') ||
                        (user?.email === matchData.player_b_email && gameResult.winner === 'player_b') ? 'victory' : 'defeat'
                      }`}>
                        {gameResult.winner === 'draw' ? 'Unentschieden' : 
                         (user?.email === matchData.player_a_email && gameResult.winner === 'player_a') ||
                         (user?.email === matchData.player_b_email && gameResult.winner === 'player_b') ? 'Sieg' : 'Niederlage'}
                      </div>
                    </div>

                    {/* Main Scoreboard */}
                    <div className="scoreboard-main">
                      
                      {/* Player A - Schütze */}
                      <div className={`scoreboard-player ${gameResult.winner === 'player_a' ? 'winner' : ''}`}>
                        <span className="player-avatar-large">⚽</span>
                        <div className="player-name-large">{getLastName(matchData.player_a_username || 'Spieler A')}</div>
                        <div className="player-role">Schütze</div>
                      </div>

                      {/* Score Display */}
                      <div className="scoreboard-score">
                        <div className="led-score-display">
                          <div style={{position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                            <div style={{display: 'flex'}}>
                              {renderLedScore(gameResult.scoreA)}
                            </div>
                            <div className="score-stat">Tore</div>
                          </div>
                          <span className="score-separator">:</span>
                          <div style={{position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                            <div style={{display: 'flex'}}>
                              {renderLedScore(gameResult.scoreB)}
                            </div>
                            <div className="score-stat">Paraden</div>
                          </div>
                        </div>
                      </div>

                      {/* Player B - Keeper */}
                      <div className={`scoreboard-player ${gameResult.winner === 'player_b' ? 'winner' : ''}`}>
                        <div className="player-avatar-large">
                          <img src="/gloves.png" alt="Keeper Gloves" className="keeper-gloves-image" />
                        </div>
                        <div className="player-name-large">{getLastName(matchData.player_b_username || 'Spieler B')}</div>
                        <div className="player-role">Keeper</div>
                      </div>

                    </div>

                  </div>

                  {/* Action Buttons Row */}
                  <div className="mb-8 mt-8">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      {/* Zurück zur Garderobe - Links */}
                      <button
                        onClick={() => router.push('/garderobe')}
                        className="hero-cta-green"
                        style={{ marginTop: '2rem' }}
                      >
                        Zurück zur Garderobe
                      </button>
                      
                      {/* Spielverlauf - Mitte */}
                      <button
                        onClick={() => setShowGameDetails(!showGameDetails)}
                        className="hero-cta-blue flex items-center justify-center gap-2"
                        style={{ marginTop: '2rem' }}
                      >
                        <span className="text-lg font-semibold">Spielverlauf</span>
                        <span className={`transition-transform duration-200 ${showGameDetails ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </button>
                      
                      {/* Revanche - Rechts */}
                      <button
                        onClick={() => {
                          // Create new challenge with same opponent
                          if (matchData?.player_b_email && matchData?.player_a_email) {
                            const opponentEmail = user?.email === matchData.player_a_email 
                              ? matchData.player_b_email
                              : matchData.player_a_email;
                            const opponentUsername = user?.email === matchData.player_a_email
                              ? matchData.player_b_username
                              : matchData.player_a_username;
                            const opponentAvatar = user?.email === matchData.player_a_email
                              ? matchData.player_b_avatar
                              : matchData.player_a_avatar;
                            
                            // Navigate to challenge page with opponent pre-selected
                            const opponentUser = {
                              id: 'revanche_opponent',
                              username: opponentUsername || 'Gegner',
                              email: opponentEmail,
                              avatar: opponentAvatar || 'soccer',
                              totalPoints: 0
                            };
                            
                            // Store opponent data and navigate
                            sessionStorage.setItem('revangeOpponent', JSON.stringify(opponentUser));
                            router.push(`/challenge?revanche=true&opponent=${encodeURIComponent(opponentEmail)}`);
                          }
                        }}
                        className="hero-cta-green"
                        style={{ marginTop: '2rem' }}
                      >
                        Revanche
                      </button>
                    </div>
                    
                    {showGameDetails && (
                      <div className="space-y-2 animate-fade-in">
                        {gameResult.rounds.map((round, index) => (
                          <div key={index} className="game-detail-row">
                            <div className="game-detail-round">Schuss {index + 1}</div>
                            <div className="game-detail-center">
                              <div className="game-detail-move">
                                <div className="game-detail-label">Schuss</div>
                                <div className="game-detail-value">{round.shooterMove}</div>
                              </div>
                              <div className="game-detail-icon">
                                {round.goal ? '⚽' : <img src="/gloves.png" alt="Parade" className="game-detail-gloves" />}
                              </div>
                              <div className="game-detail-move">
                                <div className="game-detail-label">Parade</div>
                                <div className="game-detail-value">{round.keeperMove}</div>
                              </div>
                            </div>
                            <div className={`game-detail-result ${round.goal ? 'goal' : 'save'}`}>
                              {round.goal ? 'TOR!' : 'PARADE!'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>


                </div>
              </div>
            )}

            {/* Penalty Selector - Only show when opponent is selected and no result to show */}
            {selectedUser && !showResult && (
              <PenaltySelector
                matchId={matchId}
                onSubmit={handleShotsSubmitted}
                disabled={isLoading}
                playerBEmail={selectedUser.email}
                playerAEmail={user?.email || ''}
                playerAUsername={user?.username || ''}
                playerBUsername={selectedUser.username}
                playerAAvatar={user?.avatar || 'soccer'}
                playerBAvatar={selectedUser.avatar}
                role={searchParams.get('match') ? 'keeper' : 'shooter'}
              />
            )}
          </div>
        </div>
      </div>

      {/* Loading Modal with Ball Spinner */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-grass-green-light backdrop-blur-lg rounded-lg border-2 border-green-600 shadow-2xl max-w-md w-full">
            <div className="p-8 text-center">
              {/* Spinning Ball */}
              <div className="mb-6">
                <div className="mx-auto w-20 h-20 flex items-center justify-center mb-4">
                  <span className="text-6xl animate-spin">⚽</span>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  {searchParams.get('match') ? 'Paraden werden gesendet...' : 'Herausforderung wird gesendet...'}
                </h2>
                <p className="text-gray-300 text-sm">
                  Einen Moment bitte...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-grass-green-light backdrop-blur-lg rounded-lg border-2 border-green-600 shadow-2xl max-w-md w-full">
            <div className="p-6 text-center">
              {/* Header */}
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">⚽</span>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  {searchParams.get('match') ? 'Paraden gesetzt!' : 'Herausforderung gesendet!'}
                </h2>
                <p className="text-gray-300 text-sm">
                  {searchParams.get('match') ? (
                    'Deine Paraden wurden erfolgreich abgegeben. Warten auf Spielergebnis...'
                  ) : (
                    <>Deine Herausforderung wurde erfolgreich an <strong className="text-white">{selectedUser?.username}</strong> gesendet.</>
                  )}
                </p>
              </div>

              {/* Info */}
              {!searchParams.get('match') && (
                <div className="mb-6 p-4 bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg">
                  <p className="text-blue-300 text-sm">
                    <strong>{selectedUser?.username}</strong> hat bis zu <strong>24 Stunden</strong> Zeit, 
                    um deine Herausforderung anzunehmen und seine Schüsse zu platzieren.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/garderobe')}
                  className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                >
                  Zurück zur Garderobe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}