'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import RegisterForm from '@/components/RegisterForm';
import { RegisterData } from '@/lib/types';

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading, register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justRegistered, setJustRegistered] = useState(false);

  // Redirect logged-in users to garderobe
  if (!loading && user) {
    if (justRegistered) {
      router.push('/garderobe?welcome=true');
    } else {
      router.push('/garderobe');
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
      await register(data);
      setJustRegistered(true);
      // Redirect will happen automatically via AuthContext
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrierung fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToLogin = () => {
    router.push('/login');
  };

  return (
    <Layout showHeader={false}>
      <div className="min-h-screen hero-stadium flex items-center justify-center p-4">
        <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <RegisterForm
            onSubmit={handleRegister}
            onSwitchToLogin={handleSwitchToLogin}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>
    </Layout>
  );
}