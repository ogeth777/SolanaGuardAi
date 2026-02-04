
const { ethers } = require("ethers");
const fs = require('fs');
const path = require('path');
const { register } = require('./index.js');
// Load env from root
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function main() {
    console.log("🛡️ Solana & Base Guard AI - Moltbook Setup 🛡️");
    console.log("-----------------------------------------------");

    let privateKey = process.env.WALLET_PRIVATE_KEY;
    let wallet;
    // Use Base Mainnet
    const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");

    if (!privateKey) {
        console.log("⚠️ No private key found in .env");
        console.log("🎲 Generating new dedicated wallet for this agent...");
        wallet = ethers.Wallet.createRandom();
        privateKey = wallet.privateKey;
        
        // Save to .env in root
        const envPath = path.resolve(__dirname, '../../.env');
        // Check if .env exists, if not create it
        if (!fs.existsSync(envPath)) {
            fs.writeFileSync(envPath, `WALLET_PRIVATE_KEY=${privateKey}\n`);
        } else {
            fs.appendFileSync(envPath, `\nWALLET_PRIVATE_KEY=${privateKey}\n`);
        }
        console.log(`✅ Saved new wallet to ${envPath}`);
    } else {
        wallet = new ethers.Wallet(privateKey, provider);
    }

    // Connect wallet to provider
    wallet = wallet.connect(provider);

    console.log(`\n🤖 Agent Wallet Address: ${wallet.address}`);
    
    // Check balance
    try {
        const balance = await provider.getBalance(wallet.address);
        const balanceEth = ethers.formatEther(balance);
        console.log(`💰 Balance: ${balanceEth} ETH`);

        const REQUIRED_ETH = "0.0002"; // 0.0001 fee + gas

        if (balance < ethers.parseEther(REQUIRED_ETH)) {
            console.log(`\n🔴 INSUFFICIENT FUNDS`);
            console.log(`Please send at least ${REQUIRED_ETH} ETH (Base Network) to:`);
            console.log(`👉 ${wallet.address}`);
            console.log(`\nAfter funding, run this script again to complete registration.`);
            return;
        }

        console.log("\n✅ Funds detected. Proceeding to registration...");

        // Register
        try {
            const uri = "https://solana-guard-ai.vercel.app/";
            const endpoints = {
                mcp: "mcp://solana-guard.agent",
                web: "https://solana-guard-ai.vercel.app/",
                twitter: "https://x.com/S0lGuardAI"
            };

            const result = await register({
                endpoints: JSON.stringify(endpoints),
                uri: uri,
                agentWallet: wallet.address
            });

            console.log(result);
            
            console.log("\n🎉 SETUP COMPLETE!");
            console.log("-----------------------------------------------");
            console.log("🔗 CLAIM LINK (Send this to your human):");
            console.log(`👉 https://moltbook.com/agent/${wallet.address}`);
            console.log("-----------------------------------------------");

        } catch (error) {
            console.error("❌ Registration failed:", error.message);
        }
    } catch (e) {
        console.error("Error checking balance/connection:", e.message);
    }
}

main();
