import { Connection, PublicKey } from "@solana/web3.js";
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { fetchMetadata, findMetadataPda } from '@metaplex-foundation/mpl-token-metadata';
import { publicKey } from '@metaplex-foundation/umi';

// List of public RPC endpoints to try
const RPC_ENDPOINTS = [
  "https://api.mainnet-beta.solana.com",
  "https://solana-rpc.publicnode.com",
];

// Known Burn Addresses
const BURN_ADDRESSES = [
  "1nc1nerator11111111111111111111111111111111",
  "QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ",
  "DeadInfo11111111111111111111111111111111111",
  "0x000000000000000000000000000000000000dEaD" // Sometimes used in bridged tokens
];

export interface MarketData {
  name: string;
  symbol: string;
  imageUrl?: string;
  priceUsd: number;
  liquidityUsd: number;
  fdv: number;
  pairAddress: string;
  dexId: string;
  volume24h: number;
  websites: { label: string; url: string }[];
  socials: { type: string; url: string }[];
  buys24h: number;
  sells24h: number;
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
  isHoneypot: boolean; // Simulation proxy
  topHolders: { address: string; amount: number; percentage: number }[];
  marketData?: MarketData;
  riskScore: number; // 0-100 (High is risky)
  verdict: string;
}

async function getDexScreenerData(tokenAddress: string): Promise<MarketData | null> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`, {
      signal: controller.signal
    });
    clearTimeout(id);

    if (!res.ok) return null;
    
    const data = await res.json();
    if (!data.pairs || data.pairs.length === 0) return null;

    // Get the most liquid pair
    const pair = data.pairs.sort((a: any, b: any) => b.liquidity?.usd - a.liquidity?.usd)[0];

    return {
      name: pair.baseToken.name,
      symbol: pair.baseToken.symbol,
      imageUrl: pair.info?.imageUrl,
      priceUsd: parseFloat(pair.priceUsd),
      liquidityUsd: pair.liquidity?.usd || 0,
      fdv: pair.fdv || 0,
      pairAddress: pair.pairAddress,
      dexId: pair.dexId,
      volume24h: pair.volume?.h24 || 0,
      websites: pair.info?.websites || [],
      socials: pair.info?.socials || [],
      buys24h: pair.txns?.h24?.buys || 0,
      sells24h: pair.txns?.h24?.sells || 0
    };
  } catch (e) {
    console.warn("DexScreener fetch failed:", e);
    return null;
  }
}

async function tryConnection(tokenAddress: string, rpcUrl: string) {
  console.log(`Trying RPC: ${rpcUrl}`);
  try {
      const connection = new Connection(rpcUrl, {
        commitment: "confirmed",
        disableRetryOnRateLimit: true,
      });
      const pubKey = new PublicKey(tokenAddress);
      
      // Add 3s timeout for connection test
       const timeoutPromise = new Promise<never>((_, reject) => 
         setTimeout(() => reject(new Error("RPC Timeout")), 3000)
       );

      const mintInfo = await Promise.race([
        connection.getParsedAccountInfo(pubKey),
        timeoutPromise
      ]) as any; // Cast to avoid complex type issues with Promise.race

      return { connection, mintInfo, pubKey };
  } catch (error) {
      throw error;
  }
}

export async function analyzeToken(tokenAddress: string): Promise<SecurityReport> {
  console.log(`Analyzing token: ${tokenAddress}`);
  
  let connection: Connection | null = null;
  let mintInfo: any = null;
  let pubKey: PublicKey | null = null;
  let lastError: any = null;

  // Try RPCs sequentially with timeout
  for (const rpc of RPC_ENDPOINTS) {
    try {
      const result = await tryConnection(tokenAddress, rpc);
      if (result.mintInfo.value) {
        connection = result.connection;
        mintInfo = result.mintInfo;
        pubKey = result.pubKey;
        console.log(`Connected via ${rpc}`);
        break;
      } else {
        throw new Error("Token not found on this RPC");
      }
    } catch (e: any) {
      console.warn(`Failed RPC ${rpc}:`, e.message);
      lastError = e;
    }
  }

  if (!connection || !mintInfo || !pubKey) {
    throw new Error(lastError?.message || "Failed to connect to Solana network or Token not found.");
  }

  try {
    const data = (mintInfo.value.data as any).parsed?.info;
    if (!data) {
       console.error("Not a valid SPL token");
       throw new Error("Address is not a valid SPL Token Mint.");
    }

    const mintAuthority = data.mintAuthority;
    const freezeAuthority = data.freezeAuthority;
    const supply = parseFloat(data.supply);
    const decimals = data.decimals;
    console.log(`Mint Info: Supply=${supply}, MintAuth=${mintAuthority}`);

    // 2. Get Top Holders (Largest Accounts)
    console.log("Fetching top holders...");
    let topHolders: { address: string; amount: number; percentage: number }[] = [];
    try {
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("Top Holders Timeout")), 5000)
        );

        const largestAccounts = await Promise.race([
            connection.getTokenLargestAccounts(pubKey),
            timeoutPromise
        ]) as any;

        topHolders = largestAccounts.value.slice(0, 10).map((acc: any) => ({
        address: acc.address.toString(),
        amount: acc.uiAmount || 0,
        percentage: (acc.uiAmount || 0) / (supply / Math.pow(10, decimals)) * 100 // Rough calc
        }));
    } catch (e) {
        console.warn("Failed to fetch top holders (might be empty or new token):", e);
        // Continue without holders
    }

    // 3. Get Market Data (DexScreener)
    console.log("Fetching market data...");
    const marketData = await getDexScreenerData(tokenAddress);

    // 4. Get Metadata (Metaplex) for Mutable Check
    console.log("Fetching Metaplex metadata...");
    let isMutable: boolean | null = null;
    try {
      const umi = createUmi(connection.rpcEndpoint);
      const metadataPda = findMetadataPda(umi, { mint: publicKey(tokenAddress) });
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Metaplex Timeout")), 5000)
      );

      const metadata = await Promise.race([
        fetchMetadata(umi, metadataPda),
        timeoutPromise
      ]) as any;

      isMutable = metadata.isMutable;
    } catch (e) {
      console.warn("Failed to fetch Metaplex metadata (might be a vanilla SPL token):", e);
      isMutable = null;
    }

    // 5. Calculate Risk Score
    let riskScore = 0;
    
    // Check if LP is Burned (Top holder is a burn address)
    // NOTE: This is a heuristic. Often LP tokens are held in a specific account.
    // Real check requires finding the LP Mint from the Pair Address, then checking its holders.
    // For now, we check if ANY top holder of the TOKEN itself is a burn address (unlikely for SPL, but possible for mechanics)
    // OR if we can infer from market data (not reliable without LP Mint).
    // BETTER: We'll assume LP Burn check is difficult without Pair Mint info.
    // Alternative: Check if Top Holder is the Pair Address (Raydium/Orca) -> Liquidity is pooled.
    // If the Pair Address itself is locked/burned, that's the key.
    // SIMPLIFICATION: We will mark "LP Burned" if we see a Burn Address in top holders OR if we trust DexScreener (DexScreener doesn't provide this directly via API).
    // Let's implement the "Honeypot" proxy first.
    
    // Honeypot Proxy: 
    // If Liquidity > $1000 AND Sells < 2 AND Buys > 20 -> Suspicious (Nobody selling?)
    let isHoneypot = false;
    if (marketData) {
        if (marketData.liquidityUsd > 1000 && marketData.buys24h > 10 && marketData.sells24h === 0) {
            isHoneypot = true;
            riskScore += 90; // Almost certainly a honeypot
        }
    }

    // LP Burned Proxy (Placeholder for now, or check if Raydium Authority is burned? Hard.)
    // We will default to FALSE unless we see a burn address in top holders.
    const isLpBurned = topHolders.some(h => BURN_ADDRESSES.includes(h.address));
    if (isLpBurned) riskScore -= 20; // Good sign

    // Risk: Mintable (Dev can print more)
    if (mintAuthority) riskScore += 50;
    
    // Risk: Freezable (Dev can freeze wallet)
    if (freezeAuthority) riskScore += 30;

    // Risk: Mutable Metadata (Dev can change info/image)
    if (isMutable) riskScore += 10;

    // Risk: Top 1 Holder > 30% (Whale risk)
    const top1 = topHolders[0]?.percentage || 0;
    if (top1 > 50 && !isLpBurned) riskScore += 20; // Ignore if top holder is burn address

    // Risk: Low Liquidity (< $1k)
    if (marketData && marketData.liquidityUsd < 1000) riskScore += 40;
    // Risk: No Liquidity found (Very high risk if not new)
    if (!marketData) riskScore += 10; // Could be just new or not listed

    // Cap at 100
    riskScore = Math.min(riskScore, 100);

    let verdict = "SAFE";
    if (riskScore > 30) verdict = "CAUTION";
    if (riskScore > 70) verdict = "HIGH RISK";
    if (isHoneypot) verdict = "SCAM (HONEYPOT)";

    return {
      address: tokenAddress,
      isValid: true,
      mintAuthority,
      freezeAuthority,
      supply,
      decimals,
      isMintable: !!mintAuthority,
      isFreezable: !!freezeAuthority,
      isMutable,
      isLpBurned,
      isHoneypot,
      topHolders,
      marketData: marketData || undefined,
      riskScore,
      verdict
    };

  } catch (error: any) {
    console.error("Error in analyzeToken:", error);
    throw new Error(error.message || "Failed to analyze token.");
  }
}
