const https = require('https');

function timeRequest(url, headers = {}) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const elapsed = Date.now() - start;
        let json = null;
        try { json = JSON.parse(data); } catch {}
        resolve({
          url,
          status: res.statusCode,
          elapsed,
          headers: res.headers,
          dataLength: data.length,
          itemCount: json?.results ? json.results.length : (Array.isArray(json) ? json.length : null),
          totalCount: json?.count ?? null,
        });
      });
    });
    req.on('error', (err) => {
      console.log('REQUEST ERROR for ' + url + ':', err.message);
      resolve({ url, error: err.message, elapsed: Date.now() - start });
    });
    req.setTimeout(35000, () => {
      req.destroy(new Error('ETIMEDOUT'));
    });
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('========================================================================');
  console.log('      DOVI 2.0 PRODUCTION PERFORMANCE & UNCACHED API VALIDATION        ');
  console.log('========================================================================\n');

  // 1. Health check
  console.log('[1] Testing /health/ endpoint...');
  const health = await timeRequest('https://dovi-2-0-backend.onrender.com/health/');
  console.log(`-> /health/: HTTP ${health.status} | Time: ${health.elapsed}ms | Server: ${health.headers?.server}`);

  await sleep(1000);

  // 2. Uncached Products API (page_size=1)
  console.log('\n[2] Testing Uncached Products API (1 product, page_size=1)...');
  const p1Trial1 = await timeRequest('https://dovi-2-0-backend.onrender.com/api/v1/products/?page=1&page_size=1&_cb=' + Date.now(), { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' });
  console.log(`-> Trial 1: HTTP ${p1Trial1.status} | Time: ${p1Trial1.elapsed}ms | Cloudflare Status: ${p1Trial1.headers?.['cf-cache-status'] || 'NONE'}`);

  await sleep(1000);

  // 3. Uncached Products API (page_size=24)
  console.log('\n[3] Testing Uncached Products API (24 products, page_size=24)...');
  const p24Trial1 = await timeRequest('https://dovi-2-0-backend.onrender.com/api/v1/products/?page=1&page_size=24&_cb=' + Date.now(), { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' });
  console.log(`-> Trial 1: HTTP ${p24Trial1.status} | Time: ${p24Trial1.elapsed}ms | Items: ${p24Trial1.itemCount} | Total: ${p24Trial1.totalCount} | Cloudflare Status: ${p24Trial1.headers?.['cf-cache-status'] || 'NONE'}`);

  await sleep(1000);

  // 4. Warm / Repeat request (checking if CDN or server caches)
  console.log('\n[4] Testing Repeat Products API Request (identical URL)...');
  const p24Repeat = await timeRequest('https://dovi-2-0-backend.onrender.com/api/v1/products/?page=1&page_size=24', {});
  console.log(`-> Repeat: HTTP ${p24Repeat.status} | Time: ${p24Repeat.elapsed}ms | Cloudflare Status: ${p24Repeat.headers?.['cf-cache-status'] || 'NONE'}`);

  await sleep(1000);

  // 5. Uncached Categories API
  console.log('\n[5] Testing Uncached Categories API...');
  const catTrial1 = await timeRequest('https://dovi-2-0-backend.onrender.com/api/v1/categories/?_cb=' + Date.now(), { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' });
  console.log(`-> Categories: HTTP ${catTrial1.status} | Time: ${catTrial1.elapsed}ms | Categories Count: ${catTrial1.itemCount} | Cloudflare Status: ${catTrial1.headers?.['cf-cache-status'] || 'NONE'}`);

  await sleep(1000);

  // 6. Progressive Bounded Batch Full Catalogue Retrieval
  console.log('\n[6] Testing Progressive Full Catalogue Retrieval (All Pages)...');
  const allBatchesStart = Date.now();
  let totalProducts = 0;
  let page = 1;
  let hasNext = true;
  const uniqueIds = new Set();
  const pagesSummary = [];

  while (hasNext) {
    const pageUrl = `https://dovi-2-0-backend.onrender.com/api/v1/products/?page=${page}&page_size=24`;
    const res = await timeRequest(pageUrl);
    if (res.status === 200) {
      let json = null;
      try {
        const httpsReq = require('https');
        // Already timed, let's parse
      } catch {}
      pagesSummary.push({ page, items: res.itemCount, time: res.elapsed });
      totalProducts += res.itemCount || 0;
      hasNext = Boolean(res.itemCount === 24);
      page++;
      await sleep(1000);
    } else {
      hasNext = false;
    }
  }

  const allBatchesTime = Date.now() - allBatchesStart;
  console.log(`-> Progressive Retrieval Complete in ${allBatchesTime}ms:`);
  pagesSummary.forEach(p => console.log(`   Page ${p.page}: ${p.items} products (${p.time}ms)`));
  console.log(`   Total products across all batches: ${totalProducts}`);

  console.log('\n========================================================================');
  console.log('                         VALIDATION COMPLETE                            ');
  console.log('========================================================================');
}

main().catch(console.error);
