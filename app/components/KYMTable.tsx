'use client';

import React, { useState } from 'react';
import type { KYMRecord, MCADetails } from '../types';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
};

interface MCAModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MCADetails | null;
  caseId: string;
  docId: string;
}

function MCAModal({ isOpen, onClose, data, caseId, docId }: MCAModalProps) {
  if (!isOpen || !data) return null;

  const mcaFields = [
    { label: 'MCA Deposit', value: data.mca_deposit, type: 'positive' },
    { label: 'MCA Withdrawals', value: data.mca_withdrawals, type: 'negative' },
    { label: 'Returned Item', value: data.returned_item, type: 'warning' },
    { label: 'Overdrafts', value: data.overdrafts, type: 'danger' },
    { label: 'Service Charges', value: data.service_charges, type: 'neutral' },
    { label: 'ATM Cash Withdrawal', value: data.atm_cash_withdrawal, type: 'negative' },
    { label: 'Internal Transfer Dep', value: data.internal_transfer_deposit, type: 'positive' },
    { label: 'Internal Transfer Wth', value: data.internal_transfer_withdrawal, type: 'negative' },
    { label: 'Other Transfer Dep', value: data.other_transfer_deposit, type: 'positive' },
    { label: 'Other Transfer Wth', value: data.other_transfer_withdrawal, type: 'negative' },
    { label: 'Standard Deposit', value: data.standard_deposit, type: 'positive' },
    { label: 'Standard Withdrawal', value: data.standard_withdrawal, type: 'negative' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-[var(--color-dark-500)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-cyan)] to-[var(--color-dark-200)] flex items-center justify-center">
              <svg className="w-4 h-4 text-[var(--color-darkest)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--color-cyan)]">BSI Details</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md bg-[var(--color-dark-600)] hover:bg-[var(--color-dark-500)] transition-colors"
          >
            <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* MCA Details Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4 p-1 mt-4">
          {mcaFields.map((field, index) => (
            <div key={index} className="info-card">
              <div className="info-card-label">{field.label}</div>
              <div className="info-card-value text-xs text-[var(--text-primary)]">
                {(field.value)}
              </div>
            </div>
          ))}
        </div>

        {/* Close Button */}
        <div className="mt-16 flex justify-center">
          <button onClick={onClose} className="btn-close">Close</button>
        </div>
      </div>
    </div>
  );
}

interface KYMTableProps {
  data?: KYMRecord[];
  loading?: boolean;
  error?: string | null;
}

export default function KYMTable({ data = [], loading = false, error = null }: KYMTableProps) {
  const [selectedRecord, setSelectedRecord] = useState<KYMRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewMCA = (record: KYMRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

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
    <>
      <div className="table-container">
        {/* Table */}
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sr No.</th>
                <th>Case ID</th>
                <th>Doc ID</th>
                <th>Validator</th>
                <th>Last 4</th>
                <th>Monthly Deposit</th>
                <th>Funding/Transfer</th>
                <th>Avg Daily Bal</th>
                {/* <th># Return</th> */}
                {/* <th>Ret Days</th> */}
                {/* <th>OD Days</th> */}
                <th># Deposits</th>
                <th>MCA OD And others</th>
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
                  <td>
                    <span className="font-mono px-1.5 py-0.5 bg-[var(--color-dark-500)] rounded text-[var(--text-primary)] text-[10px]">
                      {row.act_last_4_digit}
                    </span>
                  </td>
                  <td>
                    <span className="text-[var(--text-primary)]">{formatCurrency(row.monthly_deposit)}</span>
                  </td>
                  <td>
                    <span className="text-[var(--text-primary)]">{formatCurrency(row.funding_transfer_deposits)}</span>
                  </td>
                  <td>
                    <span className="text-[var(--text-primary)]">{formatCurrency(row.avg_daily_balance)}</span>
                  </td>
                  {/* <td>
                    <span className="num-badge text-[var(--text-primary)]">
                      {row.return_items}
                    </span>
                  </td>
                  <td>
                    <span className="num-badge text-[var(--text-primary)]">
                      {row.return_item_days}
                    </span>
                  </td>
                  <td>
                    <span className="num-badge text-[var(--text-primary)]">
                      {row.overdraft_days}
                    </span>
                  </td> */}
                  <td>
                    <span className="num-badge text-[var(--text-primary)]">
                      {row.monthly_number_of_deposits}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleViewMCA(row)}
                      className="btn-view"
                      title="View MCA Details"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <MCAModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        data={selectedRecord?.mca_details ?? null}
        caseId={selectedRecord?.case_id ?? ''}
        docId={selectedRecord?.doc_id ?? ''}
      />
    </>
  );
}
