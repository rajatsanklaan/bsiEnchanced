'use client';

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MPTable from './components/MPTable';
import KYMTable from './components/KYMTable';
import type { MPRecord, KYMRecord, ADLSDataResponse } from './types';

interface BatchesResponse {
  batches: string[];
  success: boolean;
  error?: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'mp' | 'kym'>('mp');
  const [mpData, setMpData] = useState<MPRecord[]>([]);
  const [kymData, setKymData] = useState<KYMRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableBatches, setAvailableBatches] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');

  // Fetch available batches on mount
  useEffect(() => {
    async function fetchBatches() {
      try {
        const response = await fetch('/api/batches');
        const result: BatchesResponse = await response.json();
        
        if (result.success && result.batches.length > 0) {
          setAvailableBatches(result.batches);
          // Set default batch to first available
          setSelectedBatch(result.batches[0]);
        } else {
          console.error('Failed to fetch batches:', result.error);
        }
      } catch (err) {
        console.error('Error fetching batches:', err);
      }
    }

    fetchBatches();
  }, []);

  // Fetch data when batch changes
  useEffect(() => {
    async function fetchData() {
      if (!selectedBatch) return; // Wait for batch to be selected
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/data?batch=${encodeURIComponent(selectedBatch)}`);
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
  }, [selectedBatch]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <div className="px-6 pt-4">
        <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Main Content */}
      <main className="flex-1 px-6 py-6">
        <div className="max-w-[1800px] mx-auto">
          {/* Batch Selection Dropdown */}
          <div className="mb-6">
            <div className="bg-[var(--color-dark-800)] border border-[var(--color-dark-500)] rounded-xl p-5 shadow-lg">
              <div className="flex items-center gap-6">
                {/* Label with Icon */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--color-cyan)] to-[var(--color-dark-200)] flex items-center justify-center">
                    <svg className="w-5 h-5 text-[var(--color-darkest)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </div>
                  <label htmlFor="batch-select" className="text-sm font-semibold text-[var(--color-cyan)] uppercase tracking-wide">
                    Select Batch
                  </label>
                </div>

                {/* Dropdown Select */}
                <div className="flex-1 max-w-xs">
                  <select
                    id="batch-select"
                    value={selectedBatch}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                    className="w-full px-6 py-3.5 bg-[var(--color-dark-700)] border border-[var(--color-dark-500)] rounded-lg text-[var(--text-primary)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-cyan)] focus:border-[var(--color-cyan)] hover:bg-[var(--color-dark-600)] hover:border-[var(--color-dark-400)] transition-all duration-200 cursor-pointer appearance-none"
                    disabled={loading || availableBatches.length === 0}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2300d4ff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 1.25rem center',
                      paddingRight: '3rem'
                    }}
                  >
                    {availableBatches.length === 0 ? (
                      <option value="">Loading batches...</option>
                    ) : (
                      availableBatches.map((batch) => (
                        <option key={batch} value={batch} className="bg-[var(--color-dark-700)]">
                          {batch}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Current Batch Indicator */}
                {selectedBatch && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-dark-700)] border border-[var(--color-dark-500)] rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse"></div>
                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                      Active: <span className="text-[var(--color-cyan)] font-semibold">{selectedBatch}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

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
