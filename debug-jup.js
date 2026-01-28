
const { Connection, PublicKey } = require("@solana/web3.js");
const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const { fetchMetadata, findMetadataPda } = require('@metaplex-foundation/mpl-token-metadata');
const { publicKey } = require('@metaplex-foundation/umi');

const RPC_ENDPOINTS = [
  "https://api.mainnet-beta.solana.com",
  "https://solana-rpc.publicnode.com",
];

const JUP_ADDRESS = "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN";

async function runDebug() {
    console.log("Starting Debug for JUP...");
    
    // 1. Connection
    let connection;
    for (const rpc of RPC_ENDPOINTS) {
        console.log(`Trying ${rpc}...`);
        try {
            const conn = new Connection(rpc, { commitment: "confirmed", disableRetryOnRateLimit: true });
            const pubKey = new PublicKey(JUP_ADDRESS);
            
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000));
            await Promise.race([conn.getParsedAccountInfo(pubKey), timeoutPromise]);
            
            connection = conn;
            console.log("Connected!");
            break;
        } catch (e) {
            console.log("Failed:", e.message);
        }
    }

    if (!connection) {
        console.error("Could not connect to any RPC");
        return;
    }

    // 2. DexScreener
    console.log("Fetching DexScreener...");
    try {
        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${JUP_ADDRESS}`);
        const data = await res.json();
        console.log("DexScreener Data found pairs:", data.pairs?.length || 0);
    } catch (e) {
        console.error("DexScreener Failed:", e.message);
    }

    // 3. Top Holders
    console.log("Fetching Top Holders...");
    try {
        const pubKey = new PublicKey(JUP_ADDRESS);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Holders Timeout")), 5000));
        
        const large = await Promise.race([
            connection.getTokenLargestAccounts(pubKey),
            timeoutPromise
        ]);
        console.log("Top Holders found:", large.value.length);
    } catch (e) {
        console.error("Top Holders Failed (Expected for JUP on public RPC):", e.message);
    }

    // 4. Metadata
    console.log("Fetching Metadata...");
    try {
        const umi = createUmi(connection.rpcEndpoint);
        const metadataPda = findMetadataPda(umi, { mint: publicKey(JUP_ADDRESS) });
        const metadata = await fetchMetadata(umi, metadataPda);
        console.log("Metadata found, isMutable:", metadata.isMutable);
    } catch (e) {
        console.error("Metadata Failed:", e.message);
    }
    
    console.log("Debug Complete");
}

runDebug();
