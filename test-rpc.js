
const { Connection, PublicKey } = require("@solana/web3.js");

const RPC_ENDPOINTS = [
  "https://api.mainnet-beta.solana.com",
  "https://solana-rpc.publicnode.com",
  "https://mainnet.helius-rpc.com/?api-key=0e353842-491c-42b7-a36c-941c9a632c0d",
];

const TOKEN = "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN";

async function test() {
  console.log("Testing RPCs...");
  
  for (const rpc of RPC_ENDPOINTS) {
    console.log(`\nChecking ${rpc}...`);
    try {
      const start = Date.now();
      const connection = new Connection(rpc, "confirmed");
      const pubKey = new PublicKey(TOKEN);
      
      // Race with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 3000)
      );
      
      const info = await Promise.race([
        connection.getParsedAccountInfo(pubKey),
        timeoutPromise
      ]);

      const time = Date.now() - start;
      console.log(`✅ Success in ${time}ms`);
      if (info.value) console.log("   Token found!");
    } catch (e) {
      console.log(`❌ Failed: ${e.message}`);
    }
  }
}

test();
