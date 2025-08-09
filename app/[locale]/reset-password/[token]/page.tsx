'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { FaLock, FaEye, FaEyeSlash, FaCheckCircle } from 'react-icons/fa';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const router = useRouter();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!token) {
      setError('Ungültiger Reset-Link');
      return;
    }
  }, [token]);

  useEffect(() => {
    // Real-time password validation
    const errors: string[] = [];
    
    if (password.length > 0) {
      if (password.length < 6) {
        errors.push('Mindestens 6 Zeichen');
      }
      if (confirmPassword.length > 0 && password !== confirmPassword) {
        errors.push('Passwörter stimmen nicht überein');
      }
    }
    
    setValidationErrors(errors);
  }, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validationErrors.length > 0) {
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: token as string, 
          password 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login?message=Passwort wurde zurückgesetzt. Du kannst dich jetzt anmelden.');
        }, 3000);
      } else {
        setError(data.error || 'Ein Fehler ist aufgetreten');
      }
    } catch (error) {
      setError('Netzwerk-Fehler. Bitte versuche es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = password.length >= 6 && 
                   confirmPassword.length >= 6 && 
                   password === confirmPassword && 
                   validationErrors.length === 0;

  if (success) {
    return (
      <Layout showHeader={false}>
        <div className="min-h-screen bg-gradient-to-br from-green-900 via-gray-900 to-black flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCheckCircle className="text-2xl text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-white">Erfolgreich!</h1>
                <p className="text-green-100 mt-2">
                  Dein Passwort wurde zurückgesetzt.
                </p>
              </div>
              
              <div className="p-6 text-center">
                <p className="text-gray-300 mb-4">
                  Du wirst automatisch zur Anmeldung weitergeleitet...
                </p>
                <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showHeader={false}>
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <FaLock className="text-2xl text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-white">Neues Passwort setzen</h1>
              <p className="text-red-100 mt-2">
                Wähle ein sicheres neues Passwort für deinen Account.
              </p>
            </div>

            {/* Form */}
            <div className="p-6">
              {error && (
                <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* New Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Neues Passwort
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 pr-12 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      placeholder="Neues Passwort eingeben"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    Passwort bestätigen
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 pr-12 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      placeholder="Passwort wiederholen"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <div className="text-sm text-red-400">
                    <ul className="list-disc list-inside space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !canSubmit}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Wird gespeichert...
                    </div>
                  ) : (
                    'Passwort zurücksetzen'
                  )}
                </button>
              </form>

              {/* Security Info */}
              <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm">
                  Nach dem Zurücksetzen wirst du zur Anmeldung weitergeleitet.
                </p>
              </div>
            </div>
          </div>

          {/* Additional Links */}
          <div className="text-center mt-6">
            <Link 
              href="/login" 
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Zurück zur Anmeldung
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}