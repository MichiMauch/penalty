'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import AuthPage from '@/components/AuthPage';
import AvatarSelector from '@/components/AvatarSelector';
import { EmailPreferences, AvatarId } from '@/lib/types';
import { FaUser, FaEnvelope, FaLock, FaBell, FaSave, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatar: AvatarId;
  preferred_language: 'de' | 'en';
  email_preferences: EmailPreferences;
  created_at: string;
}

function ProfilePageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'account' | 'email' | 'notifications'>('account');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Form states
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarId>('player1');
  const [preferredLanguage, setPreferredLanguage] = useState<'de' | 'en'>('de');
  const [emailPreferences, setEmailPreferences] = useState<EmailPreferences>({
    challenges: true,
    match_results: true,
    invitations: true
  });
  
  // Email change states
  const [newEmail, setNewEmail] = useState('');
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setUsername(data.user.username);
        setSelectedAvatar(data.user.avatar);
        setPreferredLanguage(data.user.preferred_language);
        setEmailPreferences(data.user.email_preferences);
        setNewEmail(data.user.email);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({ type: 'error', text: t('profile.messages.loadError') });
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  const updateProfile = async () => {
    setIsSaving(true);
    setMessage(null);
    
    try {
      const updateData: any = {
        username,
        avatar: selectedAvatar,
        preferred_language: preferredLanguage,
        email_preferences: emailPreferences
      };
      
      // Add password change if provided
      if (currentPassword && newPassword) {
        if (newPassword !== confirmPassword) {
          setMessage({ type: 'error', text: 'Neue Passwörter stimmen nicht überein' });
          setIsSaving(false);
          return;
        }
        
        if (newPassword.length < 6) {
          setMessage({ type: 'error', text: 'Neues Passwort muss mindestens 6 Zeichen lang sein' });
          setIsSaving(false);
          return;
        }
        
        updateData.current_password = currentPassword;
        updateData.new_password = newPassword;
      }
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setProfile(data.user);
        setMessage({ type: 'success', text: t('profile.messages.profileUpdated') });
        
        // Clear password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: data.error || t('profile.messages.updateError') });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Netzwerkfehler beim Aktualisieren' });
    } finally {
      setIsSaving(false);
    }
  };

  const changeEmail = async () => {
    if (!currentPasswordForEmail) {
      setMessage({ type: 'error', text: 'Aktuelles Passwort erforderlich' });
      return;
    }
    
    setIsSaving(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/user/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_email: newEmail,
          current_password: currentPasswordForEmail
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (profile) {
          setProfile({ ...profile, email: data.new_email });
        }
        setMessage({ type: 'success', text: t('profile.messages.emailChanged') });
        setCurrentPasswordForEmail('');
      } else {
        setMessage({ type: 'error', text: data.error || t('profile.messages.updateError') });
      }
    } catch (error) {
      console.error('Error changing email:', error);
      setMessage({ type: 'error', text: 'Netzwerkfehler beim Ändern der E-Mail' });
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading while checking auth
  if (loading || isLoading) {
    return (
      <Layout showHeader={true}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-xl">⚽ Lade Profil...</div>
        </div>
      </Layout>
    );
  }

  // Show auth page if not logged in
  if (!user || !profile) {
    return (
      <Layout showHeader={false}>
        <AuthPage />
      </Layout>
    );
  }

  // Clear message after 5 seconds
  if (message) {
    setTimeout(() => setMessage(null), 5000);
  }

  return (
    <Layout showHeader={true}>
      <div className="p-4 profile-page" style={{ paddingTop: '80px' }}>
        <div className="container mx-auto max-w-4xl">
          {/* Header with Back Button */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.push(`/${locale}/garderobe`)}
              className="flex items-center gap-2 text-white hover:text-green-400 transition-colors"
            >
              <FaArrowLeft />
              <span className="font-semibold">{t('profile.backToGarderobe')}</span>
            </button>
            
            <h1 className="text-3xl font-bold text-white text-center flex-1">
              <FaUser className="inline-block mr-3" />
              {t('profile.title')}
            </h1>
            
            <div className="w-40"></div> {/* Spacer for centering */}
          </div>
          
          {/* Message */}
          {message && (
            <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full px-4`}>
              <div className={`${message.type === 'success' ? 'bg-green-900' : 'bg-red-900'} bg-opacity-95 backdrop-blur-lg border-2 ${message.type === 'success' ? 'border-green-400' : 'border-red-400'} rounded-lg p-4 shadow-2xl`}>
                <p className={`${message.type === 'success' ? 'text-green-100' : 'text-red-100'} font-medium`}>{message.text}</p>
              </div>
            </div>
          )}
          
          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-grass-green-light bg-opacity-60 backdrop-blur-lg rounded-lg border-2 border-green-600 border-opacity-80 p-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('account')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    activeTab === 'account'
                      ? 'bg-green-600 text-white'
                      : 'text-green-200 hover:bg-green-800 hover:bg-opacity-50'
                  }`}
                >
                  <FaUser className="inline-block mr-2" />
                  {t('profile.tabs.account')}
                </button>
                <button
                  onClick={() => setActiveTab('email')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    activeTab === 'email'
                      ? 'bg-green-600 text-white'
                      : 'text-green-200 hover:bg-green-800 hover:bg-opacity-50'
                  }`}
                >
                  <FaEnvelope className="inline-block mr-2" />
                  {t('profile.tabs.emailPassword')}
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    activeTab === 'notifications'
                      ? 'bg-green-600 text-white'
                      : 'text-green-200 hover:bg-green-800 hover:bg-opacity-50'
                  }`}
                >
                  <FaBell className="inline-block mr-2" />
                  {t('profile.tabs.notifications')}
                </button>
              </div>
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="bg-grass-green-light bg-opacity-60 backdrop-blur-lg rounded-lg border-2 border-green-600 border-opacity-80 shadow-xl p-8">
            {activeTab === 'account' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">{t('profile.account.title')}</h2>
                
                {/* Username */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">{t('profile.account.username')}</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-3 bg-green-900 bg-opacity-50 border border-green-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder={t('profile.account.usernamePlaceholder')}
                  />
                </div>
                
                {/* Avatar */}
                <div>
                  <label className="block text-white text-sm font-medium mb-4">{t('profile.account.avatar')}</label>
                  <AvatarSelector
                    selectedAvatar={selectedAvatar}
                    onSelectAvatar={setSelectedAvatar}
                  />
                </div>
                
                {/* Language */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">{t('profile.account.language')}</label>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value as 'de' | 'en')}
                    className="w-full p-3 bg-green-900 bg-opacity-50 border border-green-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="de">{t('profile.account.languageGerman')}</option>
                    <option value="en">{t('profile.account.languageEnglish')}</option>
                  </select>
                </div>
                
                {/* Password Change */}
                <div className="border-t border-green-600 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">{t('profile.account.passwordChange')}</h3>
                  
                  <div className="space-y-4">
                    {/* First row: Current password */}
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">{t('profile.account.currentPassword')}</label>
                      <div className="relative">
                        <input
                          type={showPasswords ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full p-3 bg-green-900 bg-opacity-50 border border-green-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 pr-12"
                          placeholder={t('profile.account.currentPasswordPlaceholder')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(!showPasswords)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showPasswords ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                    
                    {/* Second row: New password and confirmation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">{t('profile.account.newPassword')}</label>
                        <input
                          type={showPasswords ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full p-3 bg-green-900 bg-opacity-50 border border-green-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder={t('profile.account.newPasswordPlaceholder')}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">{t('profile.account.confirmPassword')}</label>
                        <input
                          type={showPasswords ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full p-3 bg-green-900 bg-opacity-50 border border-green-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder={t('profile.account.confirmPasswordPlaceholder')}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={updateProfile}
                  disabled={isSaving}
                  className="w-full bg-green-600 text-white font-bold py-4 px-8 rounded-lg hover:bg-green-500 transition-all duration-200 transform hover:scale-105 border border-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent inline-block mr-2"></div>
                      {t('profile.account.saving')}
                    </>
                  ) : (
                    <>
                      <FaSave className="inline-block mr-2" />
                      {t('profile.account.saveButton')}
                    </>
                  )}
                </button>
              </div>
            )}
            
            {activeTab === 'email' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">{t('profile.email.changeEmail')}</h2>
                
                <div className="bg-green-900 bg-opacity-30 border border-green-600 rounded-lg p-4 mb-6">
                  <p className="text-green-200 text-sm">
                    <strong>{t('profile.email.currentEmail')}:</strong> {profile.email}
                  </p>
                </div>
                
                <div>
                  <label className="block text-white text-sm font-medium mb-2">{t('profile.email.newEmail')}</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full p-3 bg-green-900 bg-opacity-50 border border-green-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder={t('profile.email.newEmailPlaceholder')}
                  />
                </div>
                
                <div>
                  <label className="block text-white text-sm font-medium mb-2">{t('profile.email.passwordConfirmation')}</label>
                  <input
                    type="password"
                    value={currentPasswordForEmail}
                    onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
                    className="w-full p-3 bg-green-900 bg-opacity-50 border border-green-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder={t('profile.email.passwordConfirmationPlaceholder')}
                  />
                </div>
                
                <button
                  onClick={changeEmail}
                  disabled={isSaving || !newEmail || !currentPasswordForEmail || newEmail === profile.email}
                  className="w-full bg-green-600 text-white font-bold py-4 px-8 rounded-lg hover:bg-green-500 transition-all duration-200 transform hover:scale-105 border border-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent inline-block mr-2"></div>
                      {t('profile.email.changing')}
                    </>
                  ) : (
                    <>
                      <FaEnvelope className="inline-block mr-2" />
                      {t('profile.email.changeButton')}
                    </>
                  )}
                </button>
              </div>
            )}
            
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">{t('profile.notifications.title')}</h2>
                
                <p className="text-gray-300 mb-6">
                  {t('profile.notifications.description')}:
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-900 bg-opacity-30 border border-green-600 rounded-lg">
                    <div>
                      <h3 className="text-white font-semibold">{t('profile.notifications.challenges')}</h3>
                      <p className="text-gray-300 text-sm">{t('profile.notifications.challengesDescription')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailPreferences.challenges}
                        onChange={(e) => setEmailPreferences({ ...emailPreferences, challenges: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-green-900 bg-opacity-30 border border-green-600 rounded-lg">
                    <div>
                      <h3 className="text-white font-semibold">{t('profile.notifications.matchResults')}</h3>
                      <p className="text-gray-300 text-sm">{t('profile.notifications.matchResultsDescription')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailPreferences.match_results}
                        onChange={(e) => setEmailPreferences({ ...emailPreferences, match_results: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-green-900 bg-opacity-30 border border-green-600 rounded-lg">
                    <div>
                      <h3 className="text-white font-semibold">{t('profile.notifications.invitations')}</h3>
                      <p className="text-gray-300 text-sm">{t('profile.notifications.invitationsDescription')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailPreferences.invitations}
                        onChange={(e) => setEmailPreferences({ ...emailPreferences, invitations: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                </div>
                
                <button
                  onClick={updateProfile}
                  disabled={isSaving}
                  className="w-full bg-green-600 text-white font-bold py-4 px-8 rounded-lg hover:bg-green-500 transition-all duration-200 transform hover:scale-105 border border-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent inline-block mr-2"></div>
                      {t('profile.account.saving')}
                    </>
                  ) : (
                    <>
                      <FaBell className="inline-block mr-2" />
                      {t('profile.notifications.saveButton')}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <Layout showHeader={true}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-xl">⚽ Loading Profile...</div>
        </div>
      </Layout>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}