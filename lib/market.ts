
import { MarketData } from './types';

async function fetchCoinGeckoData(address: string): Promise<Partial<MarketData> | null> {
    try {
        const platformId = address.startsWith('0x') ? 'base' : 'solana';

        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 3000); // 3s timeout (fast fail)
        
        // Fetch Token Info
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/${platformId}/contract/${address}`, {
            signal: controller.signal
        });
        clearTimeout(id);

        if (!res.ok) {
            // 404 or Rate Limited
            return null;
        }

        const data = await res.json();
        
        return {
            name: data.name,
            symbol: data.symbol?.toUpperCase(),
            imageUrl: data.image?.large || data.image?.small,
            marketCap: data.market_data?.market_cap?.usd,
            fdv: data.market_data?.fully_diluted_valuation?.usd,
            circulatingSupply: data.market_data?.circulating_supply,
            externalUrl: `https://www.coingecko.com/en/coins/${data.id}`,
            // We trust DexScreener more for real-time price/liquidity of pairs, 
            // but CG is good for metadata.
        };
    } catch (e) {
        console.warn("CoinGecko fetch failed:", e);
        return null;
    }
}

export async function getMarketData(tokenAddress: string): Promise<MarketData | null> {
    try {
        // Run fetches in parallel to speed up loading
        const [dexRes, cgData] = await Promise.all([
            fetchDexScreenerData(tokenAddress),
            fetchCoinGeckoData(tokenAddress)
        ]);

        // 3. Merge Data
        if (!dexRes && !cgData) return null;

        // Start with DexScreener (it has market stats)
        const finalData = dexRes || {
            name: "Unknown",
            symbol: "???",
            priceUsd: 0,
            liquidityUsd: 0,
            fdv: 0,
            pairAddress: "",
            dexId: "",
            volume24h: 0,
            websites: [],
            socials: [],
            buys24h: 0,
            sells24h: 0,
            priceChange24h: 0
        } as MarketData;

        // Overlay CG Data (Higher Quality Metadata)
        if (cgData) {
            finalData.name = cgData.name || finalData.name;
            finalData.symbol = cgData.symbol || finalData.symbol;
            // Prefer CG Image if available (usually better resolution)
            if (cgData.imageUrl) finalData.imageUrl = cgData.imageUrl;
            
            if (cgData.marketCap) finalData.marketCap = cgData.marketCap;
            if (cgData.circulatingSupply) finalData.circulatingSupply = cgData.circulatingSupply;
            
            // Recalculate Vol/MCap if possible
            if (finalData.marketCap && finalData.volume24h) {
                finalData.volToMktCap = finalData.volume24h / finalData.marketCap;
            }

            // Prefer CG URL if not found in DexScreener
            if (!finalData.externalUrl && cgData.externalUrl) {
                finalData.externalUrl = cgData.externalUrl;
            }
        }

        return finalData;

    } catch (e) {
        console.error("Market Data fetch failed:", e);
        return null;
    }
}

async function fetchDexScreenerData(tokenAddress: string): Promise<MarketData | null> {
    try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`, {
            signal: controller.signal
        });
        clearTimeout(id);

        if (!res.ok) return null;

        const data = await res.json();
        if (data.pairs && data.pairs.length > 0) {
            // Filter pairs by chain if possible
            const chainId = tokenAddress.startsWith('0x') ? 'base' : 'solana';
            
            // 1. Try to find pairs where our token is the BASE token AND matches chain
            let bestPair = data.pairs
                .filter((p: any) => p.baseToken.address.toLowerCase() === tokenAddress.toLowerCase() && p.chainId === chainId)
                .sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];

            // 2. If no base pair found, fallback to any pair on the chain
            if (!bestPair) {
                bestPair = data.pairs
                    .filter((p: any) => p.chainId === chainId)
                    .sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
            }

            // 3. Last resort: ANY pair (cross-chain?) - unlikely but maybe user pasted bridged token address
            if (!bestPair && data.pairs.length > 0) {
                    bestPair = data.pairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
            }

            if (bestPair) {
                const isBase = bestPair.baseToken.address.toLowerCase() === tokenAddress.toLowerCase();
                const targetToken = isBase ? bestPair.baseToken : bestPair.quoteToken;

                // Calculate price
                let price = 0;
                if (isBase) {
                    price = parseFloat(bestPair.priceUsd || "0");
                } else {
                    // We are quote. Price = priceUsd / priceNative
                    const pUsd = parseFloat(bestPair.priceUsd || "0");
                    const pNative = parseFloat(bestPair.priceNative || "0");
                    if (pNative > 0) {
                        price = pUsd / pNative;
                    }
                }

                // Extract External Links
                let externalUrl: string | undefined;
                for (const pair of data.pairs) {
                    if (pair.info?.websites) {
                        const cmc = pair.info.websites.find((w: any) => w.url.includes('coinmarketcap.com'));
                        const cg = pair.info.websites.find((w: any) => w.url.includes('coingecko.com'));
                        
                        if (cmc) {
                            externalUrl = cmc.url;
                            break;
                        }
                        if (cg && !externalUrl) {
                            externalUrl = cg.url;
                        }
                    }
                }

                // Fallback search URL
                let searchUrl: string | undefined;
                if (!externalUrl && (bestPair.liquidity?.usd || 0) > 1000) {
                    searchUrl = `https://www.google.com/search?q=site:coinmarketcap.com+${targetToken.name}+${targetToken.symbol}+crypto`;
                }

                return {
                    name: targetToken.name,
                    symbol: targetToken.symbol,
                    imageUrl: bestPair.info?.imageUrl,
                    priceUsd: price,
                    liquidityUsd: bestPair.liquidity?.usd || 0,
                    fdv: bestPair.fdv || 0,
                    pairAddress: bestPair.pairAddress,
                    dexId: bestPair.dexId,
                    volume24h: bestPair.volume?.h24 || 0,
                    websites: bestPair.info?.websites || [],
                    socials: bestPair.info?.socials || [],
                    buys24h: bestPair.txns?.h24?.buys || 0,
                    sells24h: bestPair.txns?.h24?.sells || 0,
                    priceChange24h: bestPair.priceChange?.h24 || 0,
                    externalUrl,
                    searchUrl
                };
            }
        }
        return null;
    } catch (e) {
        console.error("DexScreener fetch failed:", e);
        return null;
    }
}
