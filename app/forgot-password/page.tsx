'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { FaArrowLeft, FaEnvelope } from 'react-icons/fa';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setEmail(''); // Clear form
      } else {
        setError(data.error || 'Ein Fehler ist aufgetreten');
      }
    } catch (error) {
      setError('Netzwerk-Fehler. Bitte versuche es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout showHeader={false}>
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-6 group"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            Zurück zur Anmeldung
          </Link>

          {/* Card */}
          <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <FaEnvelope className="text-2xl text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-white">Passwort vergessen?</h1>
              <p className="text-red-100 mt-2">
                Kein Problem! Wir senden dir einen Reset-Link.
              </p>
            </div>

            {/* Form */}
            <div className="p-6">
              {message && (
                <div className="mb-6 p-4 bg-green-900 border border-green-700 rounded-lg">
                  <p className="text-green-200 text-sm">{message}</p>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    E-Mail-Adresse
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    placeholder="deine@email.de"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Wird gesendet...
                    </div>
                  ) : (
                    'Reset-Link senden'
                  )}
                </button>
              </form>

              {/* Info */}
              <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm">
                  Du erhältst eine E-Mail mit einem Link zum Zurücksetzen deines Passworts.
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Der Link ist 15 Minuten gültig.
                </p>
              </div>
            </div>
          </div>

          {/* Additional Links */}
          <div className="text-center mt-6 space-x-4">
            <Link 
              href="/register" 
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Noch kein Account? Registrieren
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}