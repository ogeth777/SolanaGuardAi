
require('dotenv').config();
const { status, register } = require('./index.js');
const { ethers } = require('ethers');

async function main() {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC);
    const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider);
    console.log(`Checking wallet: ${wallet.address}`);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

    // Check if already registered (by checking owner of ID 0 for example, or trying to find self)
    // The status function takes { query }. If we pass our address?
    // The code says "Reverse lookup (Wallet -> ID) coming soon", so we can't check by wallet yet via that tool.
    // But we can try to register if balance > 0.0001
    
    if (balance < ethers.parseEther("0.0001")) {
      console.log("⚠️ Insufficient balance for registration fee (0.0001 ETH)");
    } else {
      console.log("✅ Balance sufficient. Ready to register.");
    }

  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
