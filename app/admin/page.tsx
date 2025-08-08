'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import AuthPage from '@/components/AuthPage';
import MatchesTable from '@/components/admin/MatchesTable';
import StatsOverview from '@/components/admin/StatsOverview';
import UserManagement from '@/components/admin/UserManagement';
import { FaTable, FaChartBar, FaUsers } from 'react-icons/fa';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'stats' | 'matches' | 'users'>('stats');

  // Show loading state
  if (loading) {
    return (
      <Layout showHeader={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-xl">🛡️ Lade Admin-Panel...</div>
        </div>
      </Layout>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <Layout showHeader={false}>
        <AuthPage />
      </Layout>
    );
  }

  // Check admin permissions
  if (!user.is_admin) {
    return (
      <Layout showHeader={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-red-900 border border-red-500 rounded-lg p-8 max-w-md text-center">
            <div className="text-red-400 text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-white mb-4">Zugriff verweigert</h1>
            <p className="text-red-200 mb-6">
              Du hast keine Berechtigung für den Admin-Bereich.
            </p>
            <button
              onClick={() => window.location.href = '/garderobe'}
              className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Zurück zur Garderobe
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showHeader={false}>
      <div className="container mx-auto p-8">
        <div className="bg-gray-900 rounded-lg p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              🛡️ Admin Dashboard
            </h1>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap space-x-1 mb-6">
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                activeTab === 'stats'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <FaChartBar />
              Statistiken
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                activeTab === 'matches'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <FaTable />
              Offene Matches
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <FaUsers />
              User-Verwaltung
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'stats' && <StatsOverview />}
          {activeTab === 'matches' && <MatchesTable />}
          {activeTab === 'users' && <UserManagement />}
        </div>
      </div>
    </Layout>
  );
}