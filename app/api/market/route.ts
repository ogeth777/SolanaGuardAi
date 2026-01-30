import { NextResponse } from 'next/server';
import { getMarketData } from '@/lib/market';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const chain = address.startsWith('0x') ? 'base' : 'solana';
    const marketData = await getMarketData(address, chain);
    
    if (!marketData) {
        return NextResponse.json({ error: 'Data not found' }, { status: 404 });
    }

    return NextResponse.json(marketData);
    
  } catch (error: any) {
    console.error("API /market error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}
