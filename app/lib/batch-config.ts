/**
 * Batch Configuration
 * Maps batch names to their corresponding Excel sheet names and PDF path prefixes
 * 
 * To add new batches, simply add entries to the BATCH_CONFIG object.
 * The batch names will automatically appear in the dropdown.
 */

export interface BatchInfo {
  sheetName: string;
  pdfPathPrefix: string; // e.g., "29_batch", "30_batch", etc.
}

export interface BatchConfig {
  [batchName: string]: BatchInfo;
}

// Batch configuration mapping
// You can also load this from environment variables or a separate JSON file
export const BATCH_CONFIG: BatchConfig = {
  'Batch 1': {
    sheetName: process.env.BATCH_1_SHEET_NAME || 'querry',
    pdfPathPrefix: process.env.BATCH_1_PDF_PATH || '29_batch',
  },
  'Batch 2': {
    sheetName: process.env.BATCH_2_SHEET_NAME || 'this',
    pdfPathPrefix: process.env.BATCH_2_PDF_PATH || '30_batch',
  },
  // Add more batches as needed:
  // 'Batch 3': {
  //   sheetName: process.env.BATCH_3_SHEET_NAME || 'sheet3',
  //   pdfPathPrefix: process.env.BATCH_3_PDF_PATH || '31_batch',
  // },
};

/**
 * Get all available batch names
 */
export function getAvailableBatches(): string[] {
  return Object.keys(BATCH_CONFIG);
}

/**
 * Get sheet name for a given batch
 * @param batchName - The batch name (e.g., "Batch 1")
 * @returns The corresponding sheet name or undefined if not found
 */
export function getSheetNameForBatch(batchName: string): string | undefined {
  return BATCH_CONFIG[batchName]?.sheetName;
}

/**
 * Get PDF path prefix for a given batch
 * @param batchName - The batch name (e.g., "Batch 1")
 * @returns The corresponding PDF path prefix or undefined if not found
 */
export function getPdfPathPrefixForBatch(batchName: string): string | undefined {
  return BATCH_CONFIG[batchName]?.pdfPathPrefix;
}

/**
 * Get batch info (both sheet name and PDF path prefix)
 * @param batchName - The batch name (e.g., "Batch 1")
 * @returns The batch info or undefined if not found
 */
export function getBatchInfo(batchName: string): BatchInfo | undefined {
  return BATCH_CONFIG[batchName];
}

/**
 * Get the default batch name (first batch in config)
 */
export function getDefaultBatch(): string {
  const batches = getAvailableBatches();
  return batches.length > 0 ? batches[0] : '';
}

