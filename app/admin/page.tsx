'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import MatchesTable from '@/components/admin/MatchesTable';
import StatsOverview from '@/components/admin/StatsOverview';
import { FaTable, FaChartBar } from 'react-icons/fa';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'matches' | 'stats'>('stats');

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
          <div className="flex space-x-1 mb-6">
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
          </div>

          {/* Tab Content */}
          {activeTab === 'stats' && <StatsOverview />}
          {activeTab === 'matches' && <MatchesTable />}
        </div>
      </div>
    </Layout>
  );
}