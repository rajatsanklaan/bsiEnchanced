'use client';

import React from 'react';

interface NavbarProps {
  activeTab: 'mp' | 'kym';
  onTabChange: (tab: 'mp' | 'kym') => void;
}

export default function Navbar({ activeTab, onTabChange }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-[var(--color-dark-900)] border border-[var(--color-dark-500)] rounded-xl">
      <div className="max-w-[1800px] mx-auto px-6">
        <div className="flex items-center justify-center h-14 px-6 py-4">
          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-[var(--color-dark-700)] p-1 rounded-lg">
            <button
              onClick={() => onTabChange('mp')}
              className={`nav-link ${activeTab === 'mp' ? 'active' : ''}`}
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                BSI Params
              </span>
            </button>
            <button
              onClick={() => onTabChange('kym')}
              className={`nav-link ${activeTab === 'kym' ? 'active' : ''}`}
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                BSI Enhanced
              </span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
