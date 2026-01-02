import { NextResponse } from 'next/server';
import { fetchDataFromADLS } from '@/app/lib/adls-connector';
import { getSheetNameForBatch, getDefaultBatch } from '@/app/lib/batch-config';
import type { ADLSDataResponse } from '@/app/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse<ADLSDataResponse>> {
  try {
    // Get batch parameter from query string
    const { searchParams } = new URL(request.url);
    const batchName = searchParams.get('batch') || getDefaultBatch();
    
    // Get sheet name for the selected batch
    const sheetName = getSheetNameForBatch(batchName);
    
    if (!sheetName) {
      return NextResponse.json(
        {
          mpData: [],
          kymData: [],
          success: false,
          error: `Invalid batch: "${batchName}". Please select a valid batch.`,
        },
        { status: 400 }
      );
    }
    
    // Fetch data with the specified sheet name and batch name (for PDF path prefix)
    const { mpData, kymData } = await fetchDataFromADLS(sheetName, batchName);
    
    return NextResponse.json({
      mpData,
      kymData,
      success: true,
    });
  } catch (error) {
    console.error('API Error:', error);
    
    return NextResponse.json(
      {
        mpData: [],
        kymData: [],
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch data from ADLS',
      },
      { status: 500 }
    );
  }
}

