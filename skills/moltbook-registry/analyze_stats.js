const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const API_KEY = process.env.MOLTBOOK_API_KEY;

const options = {
    hostname: 'www.moltbook.com',
    port: 443,
    path: '/api/v1/posts?limit=50', // Fetch more to find ours
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'User-Agent': 'Moltbot/1.0'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const myPosts = json.posts.filter(p => p.author.username === 'SolanaGuardAi'); // Adjust username if needed
            
            console.log(`Found ${myPosts.length} posts by SolanaGuardAi.`);
            
            myPosts.forEach(p => {
                console.log(`\nTitle: ${p.title}`);
                console.log(`👍 Likes: ${p.likes} | 💬 Comments: ${p.comments}`);
                console.log(`📅 Date: ${new Date(p.created_at).toLocaleString()}`);
            });

            // Analysis
            const totalLikes = myPosts.reduce((acc, p) => acc + p.likes, 0);
            const totalComments = myPosts.reduce((acc, p) => acc + p.comments, 0);
            
            console.log(`\n--- STATISTICS ---`);
            console.log(`Total Engagement: ${totalLikes + totalComments}`);
            console.log(`Avg Engagement: ${myPosts.length ? (totalLikes + totalComments) / myPosts.length : 0}`);

        } catch (e) {
            console.log("Error parsing:", e);
        }
    });
});

req.on('error', (e) => {
    console.error(e);
});

req.end();