import { BlobServiceClient } from '@azure/storage-blob';
import * as XLSX from 'xlsx';
import type { MPRecord, KYMRecord, MCADetails } from '../types';

// ADLS Configuration from environment variables
const getADLSConfig = () => {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const sasToken = process.env.AZURE_STORAGE_SAS_TOKEN;
  const containerName = process.env.AZURE_CONTAINER_NAME || 'bronze';
  const fileName = process.env.AZURE_FILE_NAME || 'underscore.xlsx';

  if (!accountName || !sasToken) {
    throw new Error(
      'Missing ADLS configuration. Please set AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_SAS_TOKEN in .env.local'
    );
  }

  return { accountName, sasToken, containerName, fileName };
};

// Generate PDF URL from ADLS for a given doc_id
// PDFs are stored at: bronze/pdfs/{doc_id}
export function getPdfUrlFromADLS(docId: string): string {
  if (!docId) return '';
  
  const { accountName, sasToken, containerName } = getADLSConfig();
  const sasTokenFormatted = sasToken.startsWith('?') ? sasToken : `?${sasToken}`;
  
  // Construct the PDF blob URL: bronze/pdfs/{doc_id}
  const pdfPath = `pdfs/${docId}`;
  return `https://${accountName}.blob.core.windows.net/${containerName}/${pdfPath}${sasTokenFormatted}`;
}

// Create ADLS client using SAS token
const createBlobServiceClient = () => {
  const { accountName, sasToken } = getADLSConfig();
  
  // Construct the blob service URL with SAS token
  const sasTokenFormatted = sasToken.startsWith('?') ? sasToken : `?${sasToken}`;
  const blobServiceUrl = `https://${accountName}.blob.core.windows.net${sasTokenFormatted}`;
  
  return new BlobServiceClient(blobServiceUrl);
};

// Download Excel file from ADLS
export async function downloadExcelFromADLS(): Promise<Buffer> {
  const { containerName, fileName } = getADLSConfig();
  
  const blobServiceClient = createBlobServiceClient();
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobClient = containerClient.getBlobClient(fileName);

  const downloadResponse = await blobClient.download(0);
  
  if (!downloadResponse.readableStreamBody) {
    throw new Error('Failed to download file from ADLS');
  }

  // Convert stream to buffer
  const chunks: Buffer[] = [];
  const reader = downloadResponse.readableStreamBody;
  
  return new Promise((resolve, reject) => {
    reader.on('data', (chunk: Buffer) => chunks.push(chunk));
    reader.on('end', () => resolve(Buffer.concat(chunks)));
    reader.on('error', reject);
  });
}

// Helper to parse currency string to number
function parseCurrency(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  
  // Remove currency symbols, spaces, parentheses (for negative), and commas
  const cleaned = value
    .replace(/[$,\s]/g, '')
    .replace(/^\((.+)\)$/, '-$1'); // Handle (123.45) format for negative numbers
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Helper to safely get string value
function getString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

// Helper to safely get number value
function getNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value.replace(/[,$\s]/g, ''));
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

// Convert Excel serial date to readable date string
function excelDateToString(value: unknown): string {
  if (typeof value === 'string') {
    // Already a string, return as-is
    return value.trim();
  }
  if (typeof value === 'number') {
    // Excel serial date - convert to date
    // Excel's epoch is December 30, 1899
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    
    // Format as month-year (e.g., "Aug-25" or "November")
    const month = date.toLocaleString('en-US', { month: 'long' });
    return month;
  }
  return '';
}

// Extract year from Excel serial date or direct year number
function excelDateToYear(value: unknown): string {
  if (typeof value === 'string') {
    // Check if it's already a year
    if (/^\d{4}$/.test(value.trim())) {
      return value.trim();
    }
    // Check if it's a date like "Aug-25" or "12/1/2025"
    const yearMatch = value.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      return yearMatch[1];
    }
    // Check for 2-digit year format like "Aug-25"
    const shortYearMatch = value.match(/[-/](\d{2})$/);
    if (shortYearMatch) {
      return '20' + shortYearMatch[1];
    }
    return value.trim();
  }
  if (typeof value === 'number') {
    // Check if the number is already a year (e.g., 2020-2099)
    // Years in this range are clearly not Excel serial dates
    if (value >= 1900 && value <= 2100) {
      return Math.floor(value).toString();
    }
    // Excel serial date - convert to year
    // Serial dates for recent years are typically > 40000 (year 2000+)
    if (value > 30000) {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
      return date.getFullYear().toString();
    }
    // For small numbers that don't look like years or valid serial dates, return as-is
    return Math.floor(value).toString();
  }
  return '';
}

// Extract month and year from statement period if not available
function extractMonthYearFromPeriod(period: string): { month: string; year: string } {
  if (!period) return { month: '', year: '' };
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  let month = '';
  let year = '';
  
  // Extract year (4 digits)
  const yearMatch = period.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    year = yearMatch[1];
  }
  
  // Extract month name (full name like "November")
  for (const monthName of monthNames) {
    if (period.toLowerCase().includes(monthName.toLowerCase())) {
      month = monthName;
      break;
    }
  }
  
  // Try short month names (like "Nov")
  if (!month) {
    for (let i = 0; i < shortMonthNames.length; i++) {
      if (period.includes(shortMonthNames[i])) {
        month = monthNames[i];
        break;
      }
    }
  }
  
  // Try to extract from date format like "08/01/2025" (MM/DD/YYYY)
  if (!month) {
    const dateMatch = period.match(/(\d{1,2})\/\d{1,2}\/\d{4}/);
    if (dateMatch) {
      const monthNum = parseInt(dateMatch[1], 10);
      if (monthNum >= 1 && monthNum <= 12) {
        month = monthNames[monthNum - 1];
      }
    }
  }
  
  // Try to extract from ISO date format like "2025-09-01" (YYYY-MM-DD)
  if (!month) {
    const isoDateMatch = period.match(/\d{4}-(\d{2})-\d{2}/);
    if (isoDateMatch) {
      const monthNum = parseInt(isoDateMatch[1], 10);
      if (monthNum >= 1 && monthNum <= 12) {
        month = monthNames[monthNum - 1];
      }
    }
  }
  
  // Try date format like "08-29-2025" (MM-DD-YYYY)
  if (!month) {
    const dateMatch2 = period.match(/(\d{2})-\d{2}-\d{4}/);
    if (dateMatch2) {
      const monthNum = parseInt(dateMatch2[1], 10);
      if (monthNum >= 1 && monthNum <= 12) {
        month = monthNames[monthNum - 1];
      }
    }
  }
  
  return { month, year };
}

/**
 * Column mapping based on actual ADLS spreadsheet structure:
 * 
 * Salesforce BSI Data:
 * 0: case_id (e.g., "Case1", "Case2")
 * 1: Name/doc_id (filename - e.g., "083125 WellsFargo.pdf.pdf")
 * 2: Validator (e.g., "Ankoor Kumar")
 * 3: Column2 (empty/unused)
 * 4: Acct # Last 4 (e.g., "9490")
 * 5: Monthly Deposits ($) (e.g., "13,539.02")
 * 6: Funding/Transfer Deposits (e.g., "0")
 * 7: Avg Daily Balance (e.g., "4121.7")
 * 8: Monthly Number of Deposits (e.g., "14")
 * 
 * Merchant Pulse Outputs (shifted +1 from BSI section):
 * 9: (empty/section separator)
 * 10: True Bank Name (e.g., "WELLS FARGO")
 * 11: Statement Month (e.g., "august")
 * 12: Statement Year (e.g., "2025")
 * 13: Account Holder (e.g., "MYTHIC GYMNASTICS L.L.C.")
 * 14: Predicted Bank Name (e.g., "Wells Fargo")
 * 15: Statement Period (e.g., "01/08/2025 - 31/08/2025")
 * 16: Account Number (e.g., "****9490")
 * 17: Total Monthly Deposits ($) (e.g., "$13,539.02")
 * 18: Total Monthly Withdrawals ($) (e.g., "$13,332.67")
 * 19: Number of Deposits (e.g., "14")
 * 20: Number of Withdrawals (e.g., "22")
 * 
 * Additional Fields:
 * 21: Funding Transfer Deposit ($) (e.g., "0")
 * 
 * MCA Details (12 columns starting at 22):
 * 22: MCA Deposit
 * 23: MCA Withdrawal
 * 24: Returned Items
 * 25: Overdrafts
 * 26: Service Charges
 * 27: ATM Cash Withdrawal
 * 28: Internal Transfer Deposit
 * 29: Other Transfer Deposit
 * 30: Internal Transfer Withdrawal
 * 31: Other Transfer Withdrawal
 * 32: Standard Deposit
 * 33: Standard Withdrawal
 */

// Parse Excel data and extract MP records
function parseMPData(worksheet: XLSX.WorkSheet): MPRecord[] {
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
  
  if (jsonData.length < 2) return [];
  
  // Skip header row
  const dataRows = jsonData.slice(1);
  
  return dataRows
    .filter((row) => row && row.length > 0 && row[0])
    .map((row) => {
      // Column mapping (0-indexed):
      // 0: case_id, 1: doc_id, 2: validator, 3: (empty), 4: last4, 5: monthly_deposit
      // 6: funding/transfer, 7: avg_daily_balance, 8: # deposits, 9: (empty/separator)
      // 10: true_bank_name, 11: month, 12: year, 13: account_holder, 14: predicted_bank
      // 15: statement_period, 16: account_number, 17: total_deposit, 18: total_withdrawal
      // 19: # deposits, 20: # withdrawals
      
      // Get doc_id and generate PDF URL from ADLS
      const docId = getString(row[1]);
      const docLink = getPdfUrlFromADLS(docId);
      
      const statementPeriod = getString(row[15]);
      const trueBankName = getString(row[10]);
      const predictedBankName = getString(row[14]);
      
      // Get statement month and year, with fallback to extracting from statement_period
      let statementMonth = excelDateToString(row[11]);
      let statementYear = excelDateToYear(row[12]);
      
      // If month/year columns are empty or contain date serials, try extracting from period
      if (!statementMonth || !statementYear) {
        const extracted = extractMonthYearFromPeriod(statementPeriod);
        if (!statementMonth && extracted.month) statementMonth = extracted.month;
        if (!statementYear && extracted.year) statementYear = extracted.year;
      }
      
      // If true_bank_name is empty but predicted_bank_name exists, use that
      const bankName = trueBankName || predictedBankName;
      
      return {
        case_id: getString(row[0]),
        doc_id: docId,
        doc_link: docLink,
        validator: getString(row[2]),
        true_bank_name: bankName,
        statement_month: statementMonth,
        statement_year: statementYear,
        account_holder: getString(row[13]),
        predicted_bank_name: predictedBankName || bankName,
        statement_period: statementPeriod,
        account_number: getString(row[16]),
        total_monthly_deposit: parseCurrency(row[17]),
        total_monthly_withdrawals: parseCurrency(row[18]),
        number_of_deposits: getNumber(row[19]),
        number_of_withdrawals: getNumber(row[20]),
      };
    });
}

// Parse Excel data and extract KYM records
function parseKYMData(worksheet: XLSX.WorkSheet): KYMRecord[] {
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
  
  if (jsonData.length < 2) return [];
  
  // Skip header row
  const dataRows = jsonData.slice(1);
  
  return dataRows
    .filter((row) => row && row.length > 0 && row[0])
    .map((row) => {
      // Get doc_id and generate PDF URL from ADLS
      const docId = getString(row[1]);
      const docLink = getPdfUrlFromADLS(docId);
      // Column mapping (0-indexed):
      // 0: case_id, 1: doc_id, 2: validator, 3: (empty Column2), 4: (empty)
      // 5: last4, 6: monthly_deposit, 7: funding/transfer, 8: avg_daily_balance, 9: # deposits
      // MCA details: 22-33 (column 21 is Funding Transfer Deposit $)
      
      // MCA details start at column 22
      const mcaDetails: MCADetails = {
        mca_deposit: getNumber(row[22]),
        mca_withdrawals: getNumber(row[23]),
        returned_item: getNumber(row[24]),
        overdrafts: getNumber(row[25]),
        service_charges: getNumber(row[26]),
        atm_cash_withdrawal: getNumber(row[27]),
        internal_transfer_deposit: getNumber(row[28]),
        internal_transfer_withdrawal: getNumber(row[30]),
        other_transfer_deposit: getNumber(row[29]),
        other_transfer_withdrawal: getNumber(row[31]),
        standard_deposit: getNumber(row[32]),
        standard_withdrawal: getNumber(row[33]),
      };

      // Get avg_daily_balance - try to parse as number
      let avgDailyBalanceStr = '';
      if (typeof row[8] === 'number') {
        avgDailyBalanceStr = row[8].toString();
      } else if (typeof row[8] === 'string') {
        avgDailyBalanceStr = row[8].trim();
      }

      return {
        case_id: getString(row[0]),
        doc_id: getString(row[1]),
        doc_link: docLink,
        validator: getString(row[2]),
        act_last_4_digit: getString(row[5]),
        monthly_deposit: parseCurrency(row[6]),
        funding_transfer_deposits: getNumber(row[7]),
        avg_daily_balance: avgDailyBalanceStr,
        monthly_number_of_deposits: getNumber(row[9]),
        funding_transfer_deposit_amount: parseCurrency(row[21]), // Funding Transfer Deposit ($)
        mca_details: mcaDetails,
      };
    });
}

// Main function to fetch and parse data from ADLS
export async function fetchDataFromADLS(): Promise<{
  mpData: MPRecord[];
  kymData: KYMRecord[];
}> {
  try {
    // Download Excel file
    const buffer = await downloadExcelFromADLS();
    
    // Parse Excel workbook
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Get sheet names
    const sheetNames = workbook.SheetNames;
    console.log('Available sheets:', sheetNames);
    
    let mpData: MPRecord[] = [];
    let kymData: KYMRecord[] = [];
    
    // Use the first sheet for both MP and KYM data
    const mainSheet = workbook.Sheets[sheetNames[0]];
    
    if (mainSheet) {
      mpData = parseMPData(mainSheet);
      kymData = parseKYMData(mainSheet);
      console.log(`Parsed ${mpData.length} MP records and ${kymData.length} KYM records`);
    }
    
    return { mpData, kymData };
  } catch (error) {
    console.error('Error fetching data from ADLS:', error);
    throw error;
  }
}
