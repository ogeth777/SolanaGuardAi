
const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const API_KEY = process.env.MOLTBOOK_API_KEY;

if (!API_KEY) {
    console.error("❌ No API Key found in .env");
    process.exit(1);
}

const options = {
  hostname: 'www.moltbook.com',
  port: 443,
  path: '/api/v1/posts?sort=hot&limit=5',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    'User-Agent': 'Moltbot/1.0'
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
        const json = JSON.parse(body);
        if (json.posts) {
            console.log("Recent posts found in submolts:");
            json.posts.forEach(p => console.log(`- [${JSON.stringify(p.submolt)}] ${p.title}`));
        } else {
            console.log("Response:", JSON.stringify(json, null, 2));
        }
    } catch (e) {
        console.log("Error parsing response:", body);
    }
  });
});

req.on('error', (e) => console.error(e));
req.end();
