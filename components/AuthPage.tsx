'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import UserAvatar from './UserAvatar';
import { LoginCredentials, RegisterData, Match } from '@/lib/types';

interface AuthPageProps {
  matchId?: string;
  match?: Match;
  invitationMode?: boolean;
  invitedEmail?: string;
}

export default function AuthPage({ matchId, match, invitationMode = false, invitedEmail }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [emailCheckDone, setEmailCheckDone] = useState(!invitedEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, register } = useAuth();

  // Check if invited email already exists
  useEffect(() => {
    if (invitedEmail && !emailCheckDone) {
      checkEmailExists();
    }
  }, [invitedEmail, emailCheckDone]);

  const checkEmailExists = async () => {
    if (!invitedEmail) return;
    
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: invitedEmail })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Email exists -> show login form
        setIsLogin(data.exists);
      } else {
        // API error -> default to login
        setIsLogin(true);
      }
    } catch (err) {
      // Network error -> default to login
      setIsLogin(true);
    } finally {
      setEmailCheckDone(true);
    }
  };

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await login(credentials);
      // Success message for invitation mode will be handled by automatic redirect
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await register(data);
      // Success message for invitation mode will be handled by automatic redirect
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrierung fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  // Create user object for inviter display
  const inviterUser = match?.player_a_username && match?.player_a_avatar ? {
    id: 'inviter',
    email: match.player_a_email || '',
    username: match.player_a_username,
    avatar: match.player_a_avatar,
    created_at: '',
    updated_at: ''
  } : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Invitation Context */}
        {invitationMode && match && (
          <div className="bg-white/95 backdrop-blur rounded-xl p-6 text-center shadow-xl border border-white/20">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              ⚽ Du wurdest eingeladen!
            </h2>
            <div className="mb-4">
              <p className="text-gray-600 mb-3">
                Du wurdest zu einem Elfmeterschießen herausgefordert von:
              </p>
              <div className="flex justify-center">
                {inviterUser ? (
                  <UserAvatar user={inviterUser} size="lg" showName={true} />
                ) : (
                  <div className="text-lg font-bold text-blue-600">
                    {match.player_a_username || match.player_a_email || 'Ein Spieler'}
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {isLogin ? 'Melde dich an' : 'Erstelle einen Account'}, um die Herausforderung anzunehmen!
            </p>
          </div>
        )}

        {/* Auth Forms */}
        {!emailCheckDone ? (
          <div className="bg-white rounded-xl p-8 shadow-xl border border-white/20 text-center">
            <div className="text-gray-600">Prüfe E-Mail-Adresse...</div>
          </div>
        ) : isLogin ? (
          <LoginForm
            onSubmit={handleLogin}
            onSwitchToRegister={() => {
              setIsLogin(false);
              setError(null);
            }}
            isLoading={isLoading}
            error={error}
            defaultEmail={invitedEmail}
          />
        ) : (
          <RegisterForm
            onSubmit={handleRegister}
            onSwitchToLogin={() => {
              setIsLogin(true);
              setError(null);
            }}
            isLoading={isLoading}
            error={error}
            defaultEmail={invitedEmail}
          />
        )}
      </div>
    </div>
  );
}