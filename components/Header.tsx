'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from './UserAvatar';
import ChallengeModal from './ChallengeModal';
import LanguageSwitcher from './LanguageSwitcher';
import { FaCheck, FaTimes, FaExternalLinkAlt, FaEye, FaChevronDown, FaChevronUp, FaCheckCircle } from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';

interface Match {
  id: string;
  type: 'invitation' | 'active' | 'waiting_for_opponent' | 'cancelable' | 'finished_recent';
  role: 'defender' | 'challenger';
  challengerEmail: string;
  challengerUsername: string;
  challengerAvatar: string;
  createdAt: string;
  winner?: string;
  scoreA?: number;
  scoreB?: number;
}

export default function Header() {
  const { user, logout } = useAuth();
  const t = useTranslations();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMatchesOpen, setIsMatchesOpen] = useState(false);
  const [isChallengesOpen, setIsChallengesOpen] = useState(false);
  const [isActiveMatchesOpen, setIsActiveMatchesOpen] = useState(false);
  const [isFinishedMatchesOpen, setIsFinishedMatchesOpen] = useState(false);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [matchesError, setMatchesError] = useState('');
  const [acceptingChallenge, setAcceptingChallenge] = useState<string | null>(null);
  const [viewedMatches, setViewedMatches] = useState<Set<string>>(() => {
    // Load viewed matches from localStorage on init
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('viewedFinishedMatches');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    }
    return new Set();
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  
  const isGarderobe = pathname.endsWith('/garderobe');
  const isChallenge = pathname.endsWith('/challenge');
  const isProfile = pathname.endsWith('/profile');

  // Save viewed matches to localStorage
  const saveViewedMatches = (matches: Set<string>) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('viewedFinishedMatches', JSON.stringify([...matches]));
    }
  };

  const fetchMatches = useCallback(async () => {
    setIsLoadingMatches(true);
    setMatchesError('');
    try {
      // Send viewed matches to API to filter them out
      const viewedMatchesArray = [...viewedMatches];
      const url = `/api/matches/pending${viewedMatchesArray.length > 0 ? `?viewed=${encodeURIComponent(JSON.stringify(viewedMatchesArray))}` : ''}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setMatches(data.challenges);
      } else {
        setMatchesError('Fehler beim Laden der Matches');
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      setMatchesError('Netzwerkfehler');
    } finally {
      setIsLoadingMatches(false);
    }
  }, [viewedMatches]);

  // Fetch matches immediately when user is available
  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [user, fetchMatches]);

  // Auto-refresh matches every 30 seconds (only when menu is closed)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      // Only fetch matches if menu is not open
      if (!isMatchesOpen) {
        fetchMatches();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user, isMatchesOpen, fetchMatches]);

  // Refresh matches when window comes back into focus (only when menu is closed)
  useEffect(() => {
    if (!user) return;

    const handleFocus = () => {
      // Only fetch matches if menu is not open
      if (!isMatchesOpen) {
        fetchMatches();
      }
    };

    const handleOpenChallengeModal = () => {
      setIsChallengeModalOpen(true);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('openChallengeModal', handleOpenChallengeModal);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('openChallengeModal', handleOpenChallengeModal);
    };
  }, [user, isMatchesOpen, fetchMatches]);

  const markMatchAsViewed = (matchId: string) => {
    const newViewedMatches = new Set([...viewedMatches, matchId]);
    setViewedMatches(newViewedMatches);
    saveViewedMatches(newViewedMatches);
    
    // Immediately remove the match from the current list for instant UI feedback
    setMatches(prevMatches => prevMatches.filter(match => match.id !== matchId));
  };

  // Get avatar emoji
  const getAvatarEmoji = (avatar: string): string => {
    const avatarMap: { [key: string]: string } = {
      'fire': '🔥', 'lightning': '⚡', 'star': '🌟', 'rocket': '🚀', 'crown': '👑',
      'target': '🎯', 'trophy': '🏆', 'soccer': '⚽', 'muscle': '💪', 'sunglasses': '😎',
      'heart': '❤️', 'diamond': '💎', 'rainbow': '🌈', 'ghost': '👻', 'alien': '👽',
      'robot': '🤖', 'unicorn': '🦄', 'dragon': '🐉', 'ninja': '🥷', 'wizard': '🧙'
    };
    return avatarMap[avatar] || '⚽';
  };

  // Helper functions for match status and actions
  const getMatchStatus = (match: Match): string => {
    switch (match.type) {
      case 'invitation':
        return t('matches.status.newChallenge');
      case 'active':
        return t('matches.status.waitingForYou');
      case 'waiting_for_opponent':
        return t('matches.status.waitingForOpponent');
      case 'cancelable':
        return t('matches.status.waiting');
      case 'finished_recent':
        return getMatchResult(match);
      default:
        return 'Unbekannt';
    }
  };

  // Get match result with score for finished matches
  const getMatchResult = (match: Match): string => {
    if (!match.scoreA && match.scoreA !== 0) return t('matches.status.finished'); // fallback
    
    if (!user?.email) return t('matches.status.finished');
    
    // Determine if current user won/lost based on role and winner
    const userIsPlayerA = match.role === 'challenger'; // user challenged = player_a
    const userScore = userIsPlayerA ? match.scoreA : match.scoreB;
    const opponentScore = userIsPlayerA ? match.scoreB : match.scoreA;
    
    if (userScore === undefined || opponentScore === undefined) return t('matches.status.finished');
    
    if (userScore > opponentScore) return `${t('matches.status.won')}: ${userScore}:${opponentScore}`;
    if (userScore < opponentScore) return `${t('matches.status.lost')}: ${userScore}:${opponentScore}`;
    return `${t('matches.status.draw')}: ${userScore}:${opponentScore}`;
  };

  // Get result color class for styling
  const getMatchResultColor = (match: Match): string => {
    if (!match.scoreA && match.scoreA !== 0 || !user?.email) return "text-gray-400";
    
    const userIsPlayerA = match.role === 'challenger';
    const userScore = userIsPlayerA ? match.scoreA : match.scoreB;
    const opponentScore = userIsPlayerA ? match.scoreB : match.scoreA;
    
    if (userScore === undefined || opponentScore === undefined) return "text-gray-400";
    
    if (userScore > opponentScore) return "text-green-400";
    if (userScore < opponentScore) return "text-red-400";
    return "text-gray-400";
  };

  // Individual badge counts for each category
  const invitationsCount = matches.filter(m => m.type === 'invitation').length;
  const activeMatchesCount = matches.filter(m => m.type === 'active' || m.type === 'waiting_for_opponent' || m.type === 'cancelable').length;
  const finishedMatchesCount = matches.filter(m => m.type === 'finished_recent').length;
  const newMatchesCount = invitationsCount + finishedMatchesCount; // For desktop dropdown

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMatchesOpen(false);
      }
    };

    if (isMatchesOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMatchesOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleLeaderboard = () => {
    // For now, we'll scroll to leaderboard section on Garderobe page
    // Later this could navigate to a dedicated leaderboard page
    if (isGarderobe) {
      const leaderboardElement = document.querySelector('.leaderboard-section');
      leaderboardElement?.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push('/garderobe');
    }
    setIsMenuOpen(false);
  };

  const handleAcceptChallenge = (matchId: string) => {
    setAcceptingChallenge(matchId);
    setIsMatchesOpen(false);
    setIsMenuOpen(false);
    // Direct redirect to keeper page
    router.push(`/keeper?match=${matchId}`);
  };

  return (
    <header className={`modern-header ${isGarderobe ? 'garderobe-header' : ''} ${isChallenge ? 'challenge-header' : ''} ${isProfile ? 'profile-header' : ''}`}>
      <div className="container">
        {!isGarderobe && !isChallenge && !isProfile && (
          <>
            {/* Large Hero Title - Only on non-Garderobe, non-Challenge, non-Profile pages */}
            <div className="header-hero-title">
              <h1 className="hero-main-title">
                PENALTY
              </h1>
              <h2 className="hero-sub-title">
                THE GAME
              </h2>
            </div>
          </>
        )}
        
        <div className="header-content">
          {/* Logo/Title */}
          <a href={user ? `/${locale}/garderobe` : `/${locale}`} className={`logo ${isGarderobe ? 'garderobe-logo' : ''}`}>
            <span className="md:inline hidden">⚽ </span>PENALTY
          </a>

          {/* Show navigation only if user is logged in */}
          {user && (
            <>
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-4">
                
                {/* Challenge Button */}
                <button 
                  onClick={() => setIsChallengeModalOpen(true)}
                  className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all duration-200 transform hover:scale-105"
                >
                  <GiCrossedSwords size={16} />
                  {t('navigation.challenge')}
                </button>
                
                {/* Matches Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsMatchesOpen(!isMatchesOpen)}
                    className="nav-link text-white flex items-center gap-2"
                  >
                    {t('navigation.matches')}
                    {newMatchesCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                        {newMatchesCount}
                      </span>
                    )}
                  </button>
                  
                  {isMatchesOpen && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-gray-900 bg-opacity-95 backdrop-blur-md rounded-lg border border-green-600 shadow-2xl z-50">
                      <div className="p-4">
                        <h3 className="text-white font-bold text-lg mb-3">{t('navigation.matches')}</h3>
                        
                        {isLoadingMatches ? (
                          <div className="text-center py-6">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-400 border-t-transparent mx-auto mb-2"></div>
                            <p className="text-gray-400 text-sm">{t('matches.loading')}</p>
                          </div>
                        ) : matchesError ? (
                          <div className="text-center py-6">
                            <p className="text-red-400 text-sm">{matchesError}</p>
                            <button 
                              onClick={fetchMatches}
                              className="mt-2 text-green-400 hover:text-green-300 text-sm"
                            >
                              {t('common.retry')}
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Neue Herausforderungen */}
                            <div className="mb-4">
                              <h4 className="text-green-400 text-sm font-semibold mb-2">{t('matches.sections.newChallenges')}</h4>
                              {matches.filter(m => m.type === 'invitation').length === 0 ? (
                                <p className="text-gray-400 text-xs py-2">{t('matches.empty.noChallenges')}</p>
                              ) : (
                                matches.filter(m => m.type === 'invitation').map(match => (
                                  <div key={match.id} className="flex items-center justify-between p-2 hover:bg-green-900 hover:bg-opacity-30 rounded transition-colors mb-1">
                                    <div className="flex items-center gap-3">
                                      <span className="text-2xl">{getAvatarEmoji(match.challengerAvatar)}</span>
                                      <div>
                                        <p className="text-white text-sm font-medium">{match.challengerUsername}</p>
                                        <p className="text-gray-400 text-xs">{getMatchStatus(match)}</p>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <button 
                                        onClick={() => handleAcceptChallenge(match.id)}
                                        disabled={acceptingChallenge === match.id}
                                        className="text-green-400 hover:text-green-300 p-1 disabled:text-gray-500"
                                        title="Herausforderung annehmen"
                                      >
                                        {acceptingChallenge === match.id ? (
                                          <div className="animate-spin rounded-full h-3.5 w-3.5 border border-green-400 border-t-transparent"></div>
                                        ) : (
                                          <FaCheck size={14} />
                                        )}
                                      </button>
                                      <button className="text-red-400 hover:text-red-300 p-1" title="Ablehnen">
                                        <FaTimes size={14} />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                            
                            {/* Aktive Matches */}
                            <div className="mb-4">
                              <h4 className="text-yellow-400 text-sm font-semibold mb-2">Aktive Matches</h4>
                              {matches.filter(m => m.type === 'active' || m.type === 'waiting_for_opponent' || m.type === 'cancelable').length === 0 ? (
                                <p className="text-gray-400 text-xs py-2">Keine aktiven Matches</p>
                              ) : (
                                matches.filter(m => m.type === 'active' || m.type === 'waiting_for_opponent' || m.type === 'cancelable').map(match => (
                                  <div key={match.id} className="flex items-center justify-between p-2 hover:bg-green-900 hover:bg-opacity-30 rounded transition-colors mb-1">
                                    <div className="flex items-center gap-3">
                                      <span className="text-2xl">{getAvatarEmoji(match.challengerAvatar)}</span>
                                      <div>
                                        <p className="text-white text-sm font-medium">{match.challengerUsername}</p>
                                        <p className="text-gray-400 text-xs">{getMatchStatus(match)}</p>
                                      </div>
                                    </div>
                                    {match.type === 'cancelable' ? (
                                      <span className="text-gray-500 text-xs px-2">Warte auf Antwort</span>
                                    ) : (
                                      <button 
                                        onClick={() => router.push(`/match/${match.id}`)}
                                        className="text-blue-400 hover:text-blue-300 p-1"
                                        title="Match öffnen"
                                      >
                                        <FaExternalLinkAlt size={14} />
                                      </button>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                            
                            {/* Beendete Matches */}
                            <div>
                              <h4 className="text-gray-400 text-sm font-semibold mb-2">Beendete Matches</h4>
                              {matches.filter(m => m.type === 'finished_recent').length === 0 ? (
                                <p className="text-gray-400 text-xs py-2">Keine beendeten Matches</p>
                              ) : (
                                matches.filter(m => m.type === 'finished_recent').map(match => (
                                  <div key={match.id} className="flex items-center justify-between p-2 hover:bg-green-900 hover:bg-opacity-30 rounded transition-colors mb-1">
                                    <div className="flex items-center gap-3">
                                      <span className="text-2xl">{getAvatarEmoji(match.challengerAvatar)}</span>
                                      <div>
                                        <p className="text-white text-sm font-medium">Gegen {match.challengerUsername}</p>
                                        <p className={`text-xs ${getMatchResultColor(match)}`}>{getMatchStatus(match)}</p>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <button 
                                        onClick={() => {
                                          markMatchAsViewed(match.id);
                                          router.push(`/game/${match.id}`);
                                        }}
                                        className="text-gray-400 hover:text-gray-300 p-1"
                                        title="Ergebnis ansehen"
                                      >
                                        <FaEye size={14} />
                                      </button>
                                      <button 
                                        onClick={() => markMatchAsViewed(match.id)}
                                        className="text-green-400 hover:text-green-300 p-1"
                                        title="Als erledigt markieren"
                                      >
                                        <FaCheckCircle size={14} />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <span className="text-white text-sm">|</span>
                
                {/* Language Switcher */}
                <LanguageSwitcher />
                
                {/* Admin Navigation */}
                {user.is_admin && (
                  <button
                    onClick={() => router.push('/admin')}
                    className="nav-link p-2 text-white hover:text-blue-400 transition-colors"
                    title="Admin-Panel"
                  >
                    🛡️
                  </button>
                )}
                
                <div className="header-avatar">
                  <div onClick={() => router.push('/profile')} className="cursor-pointer">
                    <UserAvatar user={user} size="sm" showName={true} />
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="nav-link p-2 text-white"
                  title="Abmelden"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden flex items-center space-x-3">
                {/* Challenge Button - Mobile only */}
                <button 
                  onClick={() => setIsChallengeModalOpen(true)}
                  className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg transition-all duration-200 transform hover:scale-105"
                  title="Herausfordern"
                >
                  <GiCrossedSwords size={20} />
                </button>
                
                <div onClick={() => router.push('/profile')} className="cursor-pointer">
                  <UserAvatar user={user} size="sm" showName={false} />
                </div>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="nav-link p-2 relative"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                  {newMatchesCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold min-w-[20px] text-center">
                      {newMatchesCount}
                    </span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu - only show if user is logged in */}
        {user && isMenuOpen && (
          <div className="md:hidden border-t border-subtle py-4">
            <div className="space-y-3">
              <div className="px-3 py-2">
                <div onClick={() => {
                  setIsMenuOpen(false);
                  router.push('/profile');
                }} className="cursor-pointer">
                  <UserAvatar user={user} size="md" showName={true} />
                </div>
              </div>
              
              
              {/* Herausforderungen */}
              <button 
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setIsChallengesOpen(!isChallengesOpen);
                }}
                className="nav-link block w-full text-left text-white flex items-center justify-between"
                disabled={invitationsCount === 0}
              >
                <div className="flex items-center gap-2">
                  <span className={invitationsCount === 0 ? 'text-gray-500' : ''}>Herausforderungen</span>
                  {invitationsCount > 0 && (
                    <span className="bg-green-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                      {invitationsCount}
                    </span>
                  )}
                </div>
                {invitationsCount > 0 && (
                  <div className="text-gray-400">
                    {isChallengesOpen ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                )}
              </button>
              
              {/* Herausforderungen Dropdown */}
              {isChallengesOpen && invitationsCount > 0 && (
                <div className="bg-gray-800 bg-opacity-95 backdrop-blur-md rounded-lg border border-green-600 mx-3 p-4 mb-3">
                  <h4 className="text-green-400 text-sm font-semibold mb-2">Neue Herausforderungen</h4>
                  {matches.filter(m => m.type === 'invitation').map(match => (
                    <div key={match.id} className="flex items-center justify-between p-2 hover:bg-green-900 hover:bg-opacity-30 rounded transition-colors mb-1">
                      <div 
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleAcceptChallenge(match.id);
                        }}
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                      >
                        <span className="text-2xl">{getAvatarEmoji(match.challengerAvatar)}</span>
                        <div>
                          <p className="text-white text-sm font-medium">{match.challengerUsername}</p>
                          <p className="text-gray-400 text-xs">{getMatchStatus(match)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleAcceptChallenge(match.id);
                          }}
                          disabled={acceptingChallenge === match.id}
                          className="text-green-400 hover:text-green-300 p-1 disabled:text-gray-500"
                          title="Herausforderung annehmen"
                        >
                          {acceptingChallenge === match.id ? (
                            <div className="animate-spin rounded-full h-3.5 w-3.5 border border-green-400 border-t-transparent"></div>
                          ) : (
                            <FaCheck size={14} />
                          )}
                        </button>
                        <button 
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            // TODO: Implement decline functionality
                          }}
                          className="text-red-400 hover:text-red-300 p-1" 
                          title="Ablehnen"
                        >
                          <FaTimes size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Aktive Matches */}
              <button 
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setIsActiveMatchesOpen(!isActiveMatchesOpen);
                }}
                className="nav-link block w-full text-left text-white flex items-center justify-between"
                disabled={activeMatchesCount === 0}
              >
                <div className="flex items-center gap-2">
                  <span className={activeMatchesCount === 0 ? 'text-gray-500' : ''}>Aktive Matches</span>
                  {activeMatchesCount > 0 && (
                    <span className="bg-yellow-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                      {activeMatchesCount}
                    </span>
                  )}
                </div>
                {activeMatchesCount > 0 && (
                  <div className="text-gray-400">
                    {isActiveMatchesOpen ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                )}
              </button>
              
              {/* Aktive Matches Dropdown */}
              {isActiveMatchesOpen && activeMatchesCount > 0 && (
                <div className="bg-gray-800 bg-opacity-95 backdrop-blur-md rounded-lg border border-yellow-600 mx-3 p-4 mb-3">
                  <h4 className="text-yellow-400 text-sm font-semibold mb-2">Aktive Matches</h4>
                  {matches.filter(m => m.type === 'active' || m.type === 'waiting_for_opponent' || m.type === 'cancelable').map(match => (
                    <div key={match.id} className="flex items-center justify-between p-2 hover:bg-green-900 hover:bg-opacity-30 rounded transition-colors mb-1">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getAvatarEmoji(match.challengerAvatar)}</span>
                        <div>
                          <p className="text-white text-sm font-medium">{match.challengerUsername}</p>
                          <p className="text-gray-400 text-xs">{getMatchStatus(match)}</p>
                        </div>
                      </div>
                      {match.type === 'cancelable' ? (
                        <span className="text-gray-500 text-xs px-2">Warte auf Antwort</span>
                      ) : (
                        <button 
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setIsMenuOpen(false);
                            setIsActiveMatchesOpen(false);
                            router.push(`/match/${match.id}`);
                          }}
                          className="text-blue-400 hover:text-blue-300 p-1"
                          title="Match öffnen"
                        >
                          <FaExternalLinkAlt size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Beendete Matches */}
              <button 
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setIsFinishedMatchesOpen(!isFinishedMatchesOpen);
                }}
                className="nav-link block w-full text-left text-white flex items-center justify-between"
                disabled={finishedMatchesCount === 0}
              >
                <div className="flex items-center gap-2">
                  <span className={finishedMatchesCount === 0 ? 'text-gray-500' : ''}>Beendete Matches</span>
                  {finishedMatchesCount > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                      {finishedMatchesCount}
                    </span>
                  )}
                </div>
                {finishedMatchesCount > 0 && (
                  <div className="text-gray-400">
                    {isFinishedMatchesOpen ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                )}
              </button>
              
              {/* Beendete Matches Dropdown */}
              {isFinishedMatchesOpen && finishedMatchesCount > 0 && (
                <div className="bg-gray-800 bg-opacity-95 backdrop-blur-md rounded-lg border border-blue-600 mx-3 p-4 mb-3">
                  <h4 className="text-gray-400 text-sm font-semibold mb-2">Beendete Matches</h4>
                  {matches.filter(m => m.type === 'finished_recent').map(match => (
                    <div key={match.id} className="flex items-center justify-between p-2 hover:bg-green-900 hover:bg-opacity-30 rounded transition-colors mb-1">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getAvatarEmoji(match.challengerAvatar)}</span>
                        <div>
                          <p className="text-white text-sm font-medium">Gegen {match.challengerUsername}</p>
                          <p className={`text-xs ${getMatchResultColor(match)}`}>{getMatchStatus(match)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setIsMenuOpen(false);
                            setIsFinishedMatchesOpen(false);
                            markMatchAsViewed(match.id);
                            router.push(`/game/${match.id}`);
                          }}
                          className="text-gray-400 hover:text-gray-300 p-1"
                          title="Ergebnis ansehen"
                        >
                          <FaEye size={14} />
                        </button>
                        <button 
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            markMatchAsViewed(match.id);
                          }}
                          className="text-green-400 hover:text-green-300 p-1"
                          title="Als erledigt markieren"
                        >
                          <FaCheckCircle size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <hr className="border-subtle my-2" />
              
              <button
                onClick={handleLogout}
                className="nav-link block w-full text-left text-white"
              >
                Abmelden
              </button>
            </div>
          </div>
        )}

        {/* Challenge Modal */}
        <ChallengeModal 
          isOpen={isChallengeModalOpen}
          onClose={() => setIsChallengeModalOpen(false)}
          redirectToChallengePage={true}
        />
      </div>
    </header>
  );
}