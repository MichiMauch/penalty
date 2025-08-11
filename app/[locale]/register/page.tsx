'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import RegisterForm from '@/components/RegisterForm';
import { RegisterData } from '@/lib/types';

export default function RegisterPage() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { user, loading, register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justRegistered, setJustRegistered] = useState(false);
  
  // Check for invitation parameters
  const invitationToken = searchParams.get('invitation');
  const matchId = searchParams.get('match');
  const invitedEmail = searchParams.get('email');

  // Add stadium background class to body
  useEffect(() => {
    document.body.classList.add('has-stadium-background');
    return () => {
      document.body.classList.remove('has-stadium-background');
    };
  }, []);

  // Redirect logged-in users to garderobe or keeper mode for invitations
  if (!loading && user) {
    if (justRegistered && invitationToken && matchId) {
      // Redirect invited user to keeper mode after registration
      router.push(`/${locale}/keeper?match=${matchId}&invitation=${invitationToken}`);
    } else if (justRegistered) {
      router.push(`/${locale}/garderobe?welcome=true`);
    } else {
      router.push(`/${locale}/garderobe`);
    }
    return null;
  }

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

  const handleRegister = async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Include invitation token if present
      const registerData = invitationToken && matchId 
        ? { ...data, invitationToken, matchId }
        : data;
        
      await register(registerData);
      setJustRegistered(true);
      // Redirect will happen automatically via the user check above
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrierung fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToLogin = () => {
    router.push(`/${locale}/login`);
  };

  return (
    <Layout showHeader={false}>
      <div className="hero-stadium" />
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <RegisterForm
            onSubmit={handleRegister}
            onSwitchToLogin={handleSwitchToLogin}
            isLoading={isLoading}
            error={error}
            defaultEmail={invitedEmail || undefined}
            isInvitation={!!invitationToken}
          />
        </div>
      </div>
    </Layout>
  );
}