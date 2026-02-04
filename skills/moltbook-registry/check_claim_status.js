
const https = require('https');
require('dotenv').config({ path: '../../.env' });

const API_KEY = process.env.MOLTBOOK_API_KEY;

if (!API_KEY) {
    console.error("❌ No API Key found in .env");
    process.exit(1);
}

const options = {
  hostname: 'www.moltbook.com',
  port: 443,
  path: '/api/v1/agents/status', // Guessing the status endpoint based on previous response "Your heartbeat will check /api/v1/agents/status"
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    'User-Agent': 'Moltbot/1.0'
  }
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    try {
        const json = JSON.parse(body);
        console.log("RESPONSE:", JSON.stringify(json, null, 2));
        
        if (json.status === 'active' || json.verified === true) {
            console.log("\n✅ AGENT IS VERIFIED AND ACTIVE!");
        } else {
            console.log("\n⏳ Still pending verification. Moltbook might be scanning for your tweet...");
        }
    } catch (e) {
        console.log("BODY:", body);
    }
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
