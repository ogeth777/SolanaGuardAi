
export interface MarketData {
    name: string;
    symbol: string;
    imageUrl?: string;
    priceUsd: number;
    liquidityUsd: number;
    fdv: number;
    marketCap?: number;
    circulatingSupply?: number;
    volToMktCap?: number;
    pairAddress: string;
    dexId: string;
    volume24h: number;
    websites: { label: string; url: string }[];
    socials: { type: string; url: string }[];
    buys24h: number;
    sells24h: number;
    priceChange24h: number;
    externalUrl?: string; // CMC or CoinGecko URL
    searchUrl?: string; // Fallback search URL
}

export interface SecurityReport {
    address: string;
    isValid: boolean;
    mintAuthority: string | null;
    freezeAuthority: string | null;
    supply: number;
    decimals: number;
    isMintable: boolean;
    isFreezable: boolean;
    isMutable: boolean | null; // null if unknown
    isLpBurned: boolean;
    isHoneypot: boolean;
    topHolders: { address: string; amount: number; percentage: number }[];
    marketData?: MarketData;
    riskScore: number; // 0-100 (High is risky)
    verdict: string;
}
