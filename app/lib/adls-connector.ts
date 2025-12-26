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

// Extract year from Excel serial date
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
    // Excel serial date - convert to year
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    return date.getFullYear().toString();
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
 * Column mapping based on actual ADLS data structure:
 * 0: case_id (e.g., "Case1", "Case2")
 * 1: doc_id (file name)
 * 2: validator
 * 3: act_last_4_digit
 * 4: monthly_deposit
 * 5-9: "Not Provided by Merchant Pulse" columns
 * 10: monthly_number_of_deposits (BSI extracted)
 * 11: true_bank_name
 * 12: statement_month
 * 13: statement_year
 * 14: account_holder
 * 15: predicted_bank_name
 * 16: statement_period
 * 17: account_number
 * 18: total_monthly_deposit
 * 19: total_monthly_withdrawals
 * 20: number_of_deposits
 * 21: number_of_withdrawals
 * 22-33: MCA details (12 columns)
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
      const statementPeriod = getString(row[16]);
      const trueBankName = getString(row[11]);
      const predictedBankName = getString(row[15]);
      
      // Get statement month and year, with fallback to extracting from statement_period
      let statementMonth = excelDateToString(row[12]);
      let statementYear = excelDateToYear(row[13]);
      
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
        doc_id: getString(row[1]),
        true_bank_name: bankName,
        statement_month: statementMonth,
        statement_year: statementYear,
        account_holder: getString(row[14]),
        predicted_bank_name: predictedBankName || bankName,
        statement_period: statementPeriod,
        account_number: getString(row[17]),
        total_monthly_deposit: parseCurrency(row[18]),
        total_monthly_withdrawals: parseCurrency(row[19]),
        number_of_deposits: getNumber(row[20]),
        number_of_withdrawals: getNumber(row[21]),
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
      // MCA details start at column 22
      const mcaDetails: MCADetails = {
        mca_deposit: getNumber(row[22]),
        mca_withdrawals: getNumber(row[23]),
        returned_item: getNumber(row[24]),
        overdrafts: getNumber(row[25]),
        service_charges: getNumber(row[26]),
        atm_cash_withdrawal: getNumber(row[27]),
        internal_transfer_deposit: getNumber(row[28]),
        internal_transfer_withdrawal: getNumber(row[29]),
        other_transfer_deposit: getNumber(row[30]),
        other_transfer_withdrawal: getNumber(row[31]),
        standard_deposit: getNumber(row[32]),
        standard_withdrawal: getNumber(row[33]),
      };

      // Check if "Not Provided" values are present
      const notProvided = 'Not Provided by Merchant Pulse';
      const fundingTransfer = getString(row[5]);
      const avgBalance = getString(row[6]);
      const returnItems = getString(row[7]);
      const returnDays = getString(row[8]);
      const odDays = getString(row[9]);

      return {
        case_id: getString(row[0]),
        doc_id: getString(row[1]),
        validator: getString(row[2]),
        act_last_4_digit: getString(row[3]),
        monthly_deposit: parseCurrency(row[4]),
        funding_transfer_deposits: fundingTransfer === notProvided ? 0 : parseCurrency(row[5]),
        avg_daily_balance: avgBalance === notProvided ? 0 : parseCurrency(row[6]),
        return_items: returnItems === notProvided ? 0 : getNumber(row[7]),
        return_item_days: returnDays === notProvided ? 0 : getNumber(row[8]),
        overdraft_days: odDays === notProvided ? 0 : getNumber(row[9]),
        monthly_number_of_deposits: getNumber(row[10]),
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
