'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import LoginForm from '@/components/LoginForm';
import { LoginCredentials } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect logged-in users to garderobe
  useEffect(() => {
    if (!loading && user) {
      router.push('/garderobe');
    }
  }, [loading, user, router]);

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

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await login(credentials);
      // Redirect will happen automatically via AuthContext
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToRegister = () => {
    router.push('/register');
  };

  return (
    <Layout showHeader={false}>
      <div className="min-h-screen hero-stadium flex items-center justify-center p-4">
        <div className="w-full max-w-md max-h-[90vh] overflow-y-auto">
          <LoginForm
            onSubmit={handleLogin}
            onSwitchToRegister={handleSwitchToRegister}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>
    </Layout>
  );
}