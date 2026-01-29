
const fetch = require('node-fetch');

async function check() {
  const addresses = [
    'JUPyiwrYJFskUPiHa7hkeR8VUtkPHCLkdPwmXB82Jpp', // Real JUP
    'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'  // User Provided
  ];

  for (const address of addresses) {
      console.log(`\n--- Checking ${address} ---`);
      const url = `https://api.dexscreener.com/latest/dex/tokens/${address}`;
      
      try {
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.pairs && data.pairs.length > 0) {
          // Check ALL pairs for info
          let found = false;
          data.pairs.forEach((pair, i) => {
            if (pair.info?.websites) {
                const links = pair.info.websites.map(w => w.url);
                console.log(`Pair ${i} Links:`, links);
                if (JSON.stringify(links).includes('coinmarketcap') || JSON.stringify(links).includes('coingecko')) {
                    console.log("FOUND CMC/CG LINK!");
                    found = true;
                }
            }
          });
          
          if (!found) console.log("No CMC/CG links found in any pair.");
          
          const bestPair = data.pairs[0];
          console.log('Price USD:', bestPair.priceUsd);
          console.log('Symbol:', bestPair.baseToken.symbol);
        } else {
          console.log('No pairs found');
        }
      } catch (e) {
        console.error(e);
      }
  }
}

check();
