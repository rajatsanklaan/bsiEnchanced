'use client';

import React, { useState, useEffect } from 'react';
import type { MPRecord } from '../types';

const formatCurrency = (value: number) => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Math.abs(value));
  return value < 0 ? `-${formatted}` : formatted;
};

interface MPTableProps {
  data?: MPRecord[];
  loading?: boolean;
  error?: string | null;
}

export default function MPTable({ data = [], loading = false, error = null }: MPTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (loading) {
    return (
      <div className="table-container">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-[var(--color-cyan)] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[var(--text-secondary)] text-sm">Loading data from ADLS...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="table-container">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--color-danger)]/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--color-danger)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-[var(--color-danger)] text-sm font-medium">Failed to load data</p>
            <p className="text-[var(--text-muted)] text-xs max-w-md">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="table-container">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--color-dark-500)] flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-[var(--text-muted)] text-sm">No data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      {/* Expand/Collapse Button */}
      <div className="mb-6 mt-2 flex justify-end">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-5 py-2.5 bg-[var(--color-dark-800)] hover:bg-[var(--color-dark-700)] text-[var(--color-cyan)] rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 border border-[var(--color-cyan)] hover:border-[var(--color-cyan)]/80"
        >
          {isExpanded ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Collapse
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Expand
            </>
          )}
        </button>
      </div>
      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Sr No.</th>
              <th>Case ID</th>
              <th>Doc ID</th>
              <th>Validator</th>
              <th>True Bank Name</th>
              <th>Month</th>
              <th>Year</th>
              {isExpanded && (
                <>
                  <th>Account Holder</th>
                  <th>Predicted Bank</th>
                  <th>Statement Period</th>
                  <th>Account #</th>
                  <th>Deposits</th>
                  <th>Withdrawals</th>
                  <th># Dep</th>
                  <th># Wth</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={row.case_id || index}>
                <td>
                  <span className="text-[10px] text-[var(--text-muted)]">{index + 1}</span>
                </td>
                <td>
                  <span className="font-mono text-[var(--text-primary)] font-medium text-[10px]">{row.case_id}</span>
                </td>
                <td>
                  <span className="font-mono text-[var(--text-muted)] text-[10px]">{row.doc_id}</span>
                </td>
                <td>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--color-cyan)] to-[var(--color-dark-200)] flex items-center justify-center text-[8px] font-bold text-[var(--color-darkest)]">
                      {row.validator.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-[10px]">{row.validator}</span>
                  </div>
                </td>
                <td className="font-medium">{row.true_bank_name}</td>
                <td>{row.statement_month}</td>
                <td>{row.statement_year}</td>
                {isExpanded && (
                  <>
                    <td>
                      <span className="text-[var(--text-primary)] text-[10px]" title={row.account_holder}>
                        {row.account_holder.length > 20 ? row.account_holder.substring(0, 20) + '...' : row.account_holder}
                      </span>
                    </td>
                    <td>
                      <span className="badge text-[var(--text-primary)]">
                        {row.predicted_bank_name}
                      </span>
                    </td>
                    <td className="text-[10px] text-[var(--text-secondary)]">{row.statement_period}</td>
                    <td>
                      <span className="font-mono text-[10px]">{row.account_number}</span>
                    </td>
                    <td>
                      <span className="text-[var(--text-primary)]">{formatCurrency(row.total_monthly_deposit)}</span>
                    </td>
                    <td>
                      <span className="text-[var(--text-primary)]">{formatCurrency(row.total_monthly_withdrawals)}</span>
                    </td>
                    <td>
                      <span className="num-badge text-[var(--text-primary)]">
                        {row.number_of_deposits}
                      </span>
                    </td>
                    <td>
                      <span className="num-badge text-[var(--text-primary)]">
                        {row.number_of_withdrawals}
                      </span>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
