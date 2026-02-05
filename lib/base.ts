import { SecurityReport, MarketData } from './types';
import { getMarketData } from './market';

// GoPlus API Response Types (Partial)
interface GoPlusResponse {
    code: number;
    message: string;
    result: {
        [address: string]: {
            token_name: string;
            token_symbol: string;
            is_mintable: string; // "0" or "1"
            is_open_source: string;
            is_proxy: string;
            is_honeypot: string;
            owner_address: string; // "" if renounced
            buy_tax: string;
            sell_tax: string;
            cannot_sell_all: string;
            hidden_owner: string;
            creator_address: string;
            total_supply: string;
            holder_count: string;
        }
    }
}

export async function analyzeBaseToken(tokenAddress: string): Promise<SecurityReport> {
    console.log(`Analyzing Base token: ${tokenAddress}`);

    // 1. Fetch Market Data (DexScreener + CoinGecko)
    // DexScreener auto-detects chain, but we can verify it's on Base if we want.
    // getDexScreenerData logic in solana.ts is generic enough if we pass the address.
    // However, we need to ensure we are getting Base data.
    const marketData = await getMarketData(tokenAddress, 'base');
    
    // Check if it's actually on Base
    if (marketData && !marketData.pairAddress.startsWith('0x')) {
        // Should not happen for EVM, but good to know.
    }

    // 2. Fetch Security Data (GoPlus)
    const goPlusRes = await fetch(`https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${tokenAddress}`);
    const goPlusJson: GoPlusResponse = await goPlusRes.json();
    const security = goPlusJson.result[tokenAddress.toLowerCase()];

    if (!security) {
        // Fallback if GoPlus doesn't have data (rare for active tokens)
        // We will rely on DexScreener data and default to High Risk if no security data
        return {
            address: tokenAddress,
            isValid: true,
            mintAuthority: "Unknown",
            freezeAuthority: "Unknown",
            supply: 0,
            decimals: 18,
            isMintable: false,
            isFreezable: false,
            isMutable: true,
            isLpBurned: false,
            isHoneypot: false,
            topHolders: [],
            marketData: marketData || undefined,
            riskScore: 80, // High risk because unknown
            verdict: "UNKNOWN (CAUTION)"
        };
    }

    // 3. Map to SecurityReport
    const isMintable = security.is_mintable === "1";
    const isHoneypot = security.is_honeypot === "1";
    const isProxy = security.is_proxy === "1"; // Can be considered "Freezable/Mutable" risk
    const ownershipRenounced = security.owner_address === "" || security.owner_address === "0x0000000000000000000000000000000000000000";
    const isMutable = !ownershipRenounced || isProxy; // If owner exists or proxy, it's mutable
    
    // Taxes
    const buyTax = parseFloat(security.buy_tax || "0");
    const sellTax = parseFloat(security.sell_tax || "0");
    const highTax = buyTax > 10 || sellTax > 10;

    // Risk Score Calculation
    let riskScore = 0;
    
    if (isHoneypot) riskScore += 100;
    if (isMintable) riskScore += 50;
    if (!ownershipRenounced) riskScore += 30; // Owner can change things
    if (isProxy) riskScore += 20;
    if (highTax) riskScore += 40;
    if (security.is_open_source === "0") riskScore += 30; // Unverified contract

    // Market checks
    if (marketData) {
        if (marketData.liquidityUsd < 1000) riskScore += 30;
    } else {
        riskScore += 20; // No market data
    }

    riskScore = Math.min(riskScore, 100);

    let verdict = "SAFE";
    if (riskScore > 30) verdict = "CAUTION";
    if (riskScore > 70) verdict = "HIGH RISK";
    if (isHoneypot) verdict = "SCAM (HONEYPOT)";

    // Top Holders - GoPlus doesn't return list, checking if we can get it from somewhere else?
    // Covalent or similar needed for holders. For now we leave empty or mock.
    // Actually, we can return empty and UI handles it.

    return {
        address: tokenAddress,
        isValid: true,
        mintAuthority: ownershipRenounced ? null : (security.owner_address || "Yes"),
        freezeAuthority: isProxy ? "Proxy Contract" : null,
        supply: parseFloat(security.total_supply || "0"),
        decimals: 18, // Standard EVM
        isMintable,
        isFreezable: isProxy, // Proxy acts as freeze/upgrade authority
        isMutable,
        isLpBurned: false, // Hard to verify without more API calls
        isHoneypot,
        topHolders: [], // Not available in free GoPlus endpoint easily without extra calls
        marketData: marketData || undefined,
        riskScore,
        verdict
    };
}
