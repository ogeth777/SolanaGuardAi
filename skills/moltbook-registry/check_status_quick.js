
const { ethers } = require("ethers");
require('dotenv').config({ path: '../../.env' });

async function main() {
    const txHash = "0x1d2cca9d6e4dcdefc21e20b275bec196a0083989cb9958f53368e39bc23be432";
    const RPC_URL = "https://mainnet.base.org";
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    console.log(`🔍 Checking transaction: ${txHash}`);

    try {
        const receipt = await provider.getTransactionReceipt(txHash);
        
        if (!receipt) {
            console.log("❌ Receipt not found yet.");
            return;
        }

        console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

        // Look for Transfer event (Topic 0: 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef)
        // transfer(from, to, tokenId)
        const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
        
        for (const log of receipt.logs) {
            if (log.topics[0] === transferTopic) {
                // Topic 1: from (should be 0x0 for mint)
                // Topic 2: to (should be our wallet)
                // Topic 3: tokenId (if indexed) OR Data (if not indexed)
                
                // ERC721 Transfer: event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
                // So tokenId should be in topics[3]
                
                if (log.topics.length >= 4) {
                    const tokenIdHex = log.topics[3];
                    const tokenId = BigInt(tokenIdHex).toString();
                    
                    console.log(`\n🎉 AGENT ID FOUND: ${tokenId}`);
                    console.log("-----------------------------------------------");
                    console.log(`🔗 TRY THIS CLAIM LINK:`);
                    console.log(`👉 https://moltbook.com/agent/${tokenId}`);
                    console.log("-----------------------------------------------");
                    return;
                }
            }
        }
        
        console.log("⚠️ Transfer event not found in logs. Check manual explorer.");

    } catch (e) {
        console.error("❌ Error fetching receipt:", e.message);
    }
}

main();
