import { NextResponse } from 'next/server';
import { getAvailableBatches } from '@/app/lib/batch-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const batches = getAvailableBatches();
    
    return NextResponse.json({
      batches,
      success: true,
    });
  } catch (error) {
    console.error('API Error:', error);
    
    return NextResponse.json(
      {
        batches: [],
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch batches',
      },
      { status: 500 }
    );
  }
}

