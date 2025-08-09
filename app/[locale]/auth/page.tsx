'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import AuthPage from '@/components/AuthPage';

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  // Get the mode from URL search params (login or register)
  const mode = searchParams.get('mode') || 'login';

  // Redirect logged-in users to garderobe
  if (!loading && user) {
    router.push('/garderobe');
    return null;
  }

  // Show loading while checking auth
  if (loading) {
    return (
      <Layout showHeader={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-xl">⚽ Lade Fußballpause...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showHeader={false}>
      <div className="min-h-screen hero-stadium">
        <AuthPage />
      </div>
    </Layout>
  );
}

export default function AuthPageRoute() {
  return (
    <Suspense fallback={
      <Layout showHeader={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-xl">⚽ Lade Fußballpause...</div>
        </div>
      </Layout>
    }>
      <AuthPageContent />
    </Suspense>
  );
}