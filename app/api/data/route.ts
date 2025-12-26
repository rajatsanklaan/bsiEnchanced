import { NextResponse } from 'next/server';
import { fetchDataFromADLS } from '@/app/lib/adls-connector';
import type { ADLSDataResponse } from '@/app/types';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse<ADLSDataResponse>> {
  try {
    const { mpData, kymData } = await fetchDataFromADLS();
    
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

