
require('dotenv').config();
const { register } = require('./index.js');

async function main() {
  try {
    console.log("🚀 Starting registration...");
    
    // Using our project URL as the metadata URI
    const uri = "https://solana-guard-ai.vercel.app/";
    
    // Defining endpoints (using a standard MCP format)
    const endpoints = {
      mcp: "mcp://solana-guard.agent",
      web: "https://solana-guard-ai.vercel.app/"
    };

    const result = await register({
      endpoints: JSON.stringify(endpoints),
      uri: uri
    });

    console.log(result);
    
  } catch (error) {
    console.error("❌ Error during registration:", error.message);
  }
}

main();
