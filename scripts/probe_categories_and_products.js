const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(res.statusCode + ': ' + data));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching live categories from Render...');
  const start = Date.now();
  const cats = await fetchJson('https://dovi-2-0-backend.onrender.com/api/v1/categories/');
  const duration = Date.now() - start;
  console.log(`Fetched in ${duration}ms. Total: ${cats.length}`);
  cats.forEach((c, idx) => {
    console.log(`${idx + 1}. [${c.id}] ${c.name} (slug: ${c.slug}, parent: ${c.parent}, subs: ${c.subcategories ? c.subcategories.length : 0})`);
  });
}

main().catch(console.error);
