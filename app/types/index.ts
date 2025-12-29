// Types for MP Table data
export interface MPRecord {
  case_id: string;
  doc_id: string;
  validator: string;
  true_bank_name: string;
  statement_month: string;
  statement_year: string;
  account_holder: string;
  predicted_bank_name: string;
  statement_period: string;
  account_number: string;
  total_monthly_deposit: number;
  total_monthly_withdrawals: number;
  number_of_deposits: number;
  number_of_withdrawals: number;
}

// Types for MCA Details
export interface MCADetails {
  mca_deposit: number;
  mca_withdrawals: number;
  returned_item: number;
  overdrafts: number;
  service_charges: number;
  atm_cash_withdrawal: number;
  internal_transfer_deposit: number;
  internal_transfer_withdrawal: number;
  other_transfer_deposit: number;
  other_transfer_withdrawal: number;
  standard_deposit: number;
  standard_withdrawal: number;
}

// Types for KYM Table data
export interface KYMRecord {
  case_id: string;
  doc_id: string;
  validator: string;
  act_last_4_digit: string;
  monthly_deposit: number;
  funding_transfer_deposits: number;
  avg_daily_balance: string | number;
  monthly_number_of_deposits: number;
  funding_transfer_deposit_amount: number; // Funding Transfer Deposit ($) from column 21
  mca_details: MCADetails;
}

// API Response types
export interface ADLSDataResponse {
  mpData: MPRecord[];
  kymData: KYMRecord[];
  success: boolean;
  error?: string;
}

