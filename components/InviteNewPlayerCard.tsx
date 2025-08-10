'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { FaEnvelope, FaUserPlus } from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';

interface InviteNewPlayerCardProps {
  className?: string;
}

export default function InviteNewPlayerCard({ className = '' }: InviteNewPlayerCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  
  const [email, setEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInvite = async () => {
    if (!user) return;
    
    setError('');
    setSuccess('');
    
    // Validation
    if (!email.trim()) {
      setError(t('invite.errors.emailRequired'));
      return;
    }
    
    if (!validateEmail(email)) {
      setError(t('invite.errors.invalidEmail'));
      return;
    }
    
    if (email.toLowerCase() === user.email?.toLowerCase()) {
      setError(t('invite.errors.cannotInviteSelf'));
      return;
    }
    
    setIsInviting(true);
    
    try {
      // Check if user already exists
      const checkResponse = await fetch(`/api/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() })
      });
      
      if (checkResponse.ok) {
        const { exists } = await checkResponse.json();
        if (exists) {
          setError(t('invite.errors.userAlreadyExists'));
          setIsInviting(false);
          return;
        }
      }
      
      // Create invitation match
      const inviteResponse = await fetch('/api/match/invite-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitedEmail: email.toLowerCase(),
          challengerEmail: user.email,
          challengerUsername: user.username,
          challengerAvatar: user.avatar
        })
      });
      
      if (!inviteResponse.ok) {
        const errorData = await inviteResponse.json();
        throw new Error(errorData.error || t('invite.errors.invitationFailed'));
      }
      
      const { matchId, invitationToken } = await inviteResponse.json();
      
      // Success - redirect to shooter
      setSuccess(t('invite.success.invitationSent', { email }));
      
      // Short delay to show success message, then redirect to shooter
      setTimeout(() => {
        router.push(`/shooter?match=${matchId}&invitation=true`);
      }, 1500);
      
    } catch (error) {
      console.error('Error sending invitation:', error);
      setError(error instanceof Error ? error.message : t('invite.errors.networkError'));
      setIsInviting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isInviting) {
      handleInvite();
    }
  };

  return (
    <div className={`bg-grass-green-light bg-opacity-60 backdrop-blur-lg rounded-lg border-2 border-green-600 border-opacity-80 shadow-xl p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
        <FaUserPlus className="text-green-400" />
        {t('invite.card.title')}
      </h2>
      
      <p className="text-gray-300 mb-6">
        {t('invite.card.description')}
      </p>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-900 bg-opacity-50 border border-green-600 rounded-lg">
          <p className="text-green-200 text-sm">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-900 bg-opacity-50 border border-red-600 rounded-lg">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Email Input */}
        <div>
          <label htmlFor="invite-email" className="block text-white text-sm font-medium mb-2">
            {t('invite.card.emailLabel')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaEnvelope className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('invite.card.emailPlaceholder')}
              disabled={isInviting || !!success}
              className="w-full pl-10 pr-4 py-3 bg-green-900 bg-opacity-50 border border-green-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-800 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Invite Button */}
        <button
          onClick={handleInvite}
          disabled={isInviting || !email.trim() || !!success}
          className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-green-600 text-white text-lg font-bold rounded-lg hover:bg-green-500 transition-all duration-200 transform hover:scale-105 border border-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none disabled:opacity-50"
        >
          {isInviting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              {t('invite.card.sending')}
            </>
          ) : success ? (
            <>
              <GiCrossedSwords size={20} />
              {t('invite.card.redirecting')}
            </>
          ) : (
            <>
              <GiCrossedSwords size={20} />
              {t('invite.card.inviteButton')}
            </>
          )}
        </button>

        {/* Info Text */}
        <div className="text-center">
          <p className="text-green-300 text-sm">
            {t('invite.card.infoText')}
          </p>
        </div>
      </div>
    </div>
  );
}