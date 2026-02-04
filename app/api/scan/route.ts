import { NextResponse } from 'next/server';
import { analyzeToken } from '@/lib/solana';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("API /scan received body:", body);
    
    const { address } = body;

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    // Only allow Solana addresses (simple check, assume non-0x or validate length if needed)
    if (address.startsWith('0x')) {
        return NextResponse.json({ error: 'Only Solana addresses are supported' }, { status: 400 });
    }

    const report = await analyzeToken(address);
    return NextResponse.json(report);
    
  } catch (error: any) {
    console.error("API /scan error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to scan token' },
      { status: 500 }
    );
  }
}
