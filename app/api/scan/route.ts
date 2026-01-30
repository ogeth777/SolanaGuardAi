import { NextResponse } from 'next/server';
import { analyzeToken } from '@/lib/solana';
import { analyzeBaseToken } from '@/lib/base';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("API /scan received body:", body);
    
    const { address } = body;

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    let report;
    // Check if EVM address (Base)
    if (address.startsWith('0x')) {
        report = await analyzeBaseToken(address);
    } else {
        // Assume Solana
        report = await analyzeToken(address);
    }

    return NextResponse.json(report);
    
  } catch (error: any) {
    console.error("API /scan error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to scan token' },
      { status: 500 }
    );
  }
}
