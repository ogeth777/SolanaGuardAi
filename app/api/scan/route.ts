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
