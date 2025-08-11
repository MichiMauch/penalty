'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import AuthPage from '@/components/AuthPage';

function ChallengePageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!user) return;

    const matchId = searchParams.get('match');
    const userId = searchParams.get('user');
    const isRevanche = searchParams.get('revanche');
    const opponentEmail = searchParams.get('opponent');
    
    // Build query parameters
    const currentParams = searchParams.toString();
    
    if (matchId) {
      // Redirect to keeper page for match challenges
      router.push(`/keeper?match=${matchId}`);
    } else if (userId || isRevanche || opponentEmail) {
      // Redirect to challenge-new with parameters
      router.push(`/challenge-new${currentParams ? '?' + currentParams : ''}`);
    } else {
      // Redirect to challenge-new without parameters
      router.push('/challenge-new');
    }
  }, [user, searchParams, router]);

  if (loading) {
    return (
      <Layout showHeader={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-xl">⚽ Lade Challenge...</div>
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
    <Layout showHeader={false}>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">⚽ Weiterleitung...</div>
      </div>
    </Layout>
  );
}

export default function ChallengePage() {
  return (
    <div className="has-stadium-background">
      <Suspense fallback={
        <Layout showHeader={false}>
          <div className="min-h-screen hero-stadium flex items-center justify-center">
            <div className="text-white text-xl">⚽ Lade Challenge...</div>
          </div>
        </Layout>
      }>
        <ChallengePageContent />
      </Suspense>
    </div>
  );
}