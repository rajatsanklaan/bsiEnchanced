'use client';

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MPTable from './components/MPTable';
import KYMTable from './components/KYMTable';
import type { MPRecord, KYMRecord, ADLSDataResponse } from './types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'mp' | 'kym'>('mp');
  const [mpData, setMpData] = useState<MPRecord[]>([]);
  const [kymData, setKymData] = useState<KYMRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/data');
        const result: ADLSDataResponse = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch data');
        }
        
        setMpData(result.mpData);
        setKymData(result.kymData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data from ADLS');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <div className="px-6 pt-4">
        <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Main Content */}
      <main className="flex-1 px-6 py-6">
        <div className="max-w-[1800px] mx-auto">
          {/* Table Section */}
          <div className="mt-4">
            {activeTab === 'mp' ? (
              <MPTable data={mpData} loading={loading} error={error} />
            ) : (
              <KYMTable data={kymData} loading={loading} error={error} />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 mt-4 border-t border-[var(--color-dark-600)]">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <p className="text-[10px] text-[var(--text-muted)]">© 2025 Self Serve Portal</p>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-[var(--text-muted)]">v1.0.0</span>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-[var(--color-warning)] animate-pulse' : error ? 'bg-[var(--color-danger)]' : 'bg-[var(--color-success)]'}`}></div>
              <span className="text-[10px] text-[var(--text-muted)]">
                {loading ? 'Loading...' : error ? 'Error' : 'Operational'}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
