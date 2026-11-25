const https = require('https');
const fs = require('fs');

const BASE_URL = 'https://dovi-2-0-backend.onrender.com';

function requestEndpoint(path) {
  return new Promise((resolve) => {
    const start = process.hrtime.bigint();
    const req = https.get(BASE_URL + path, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'DoviPhase2FollowUpVerifier/1.0',
        'Accept-Encoding': 'gzip, deflate, br',
      }
    }, (res) => {
      let bytes = 0;
      let raw = '';
      res.on('data', chunk => {
        bytes += chunk.length;
        raw += chunk;
      });
      res.on('end', () => {
        const totalMs = Math.round(Number(process.hrtime.bigint() - start) / 1e6);
        let itemCount = 0;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) itemCount = parsed.length;
          else if (parsed.results && Array.isArray(parsed.results)) itemCount = parsed.results.length;
        } catch {}
        resolve({
          path,
          status: res.statusCode,
          totalMs,
          bytes,
          itemCount,
          cacheControl: res.headers['cache-control'] || 'none',
          cfCache: res.headers['cf-cache-status'] || 'none',
        });
      });
    });
    req.on('error', err => resolve({ path, error: err.message, totalMs: Math.round(Number(process.hrtime.bigint() - start) / 1e6) }));
    req.setTimeout(45000, () => {
      req.destroy();
      resolve({ path, error: 'Timeout after 45s', totalMs: 45000 });
    });
  });
}

async function run() {
  console.log('========================================================================');
  console.log('DOVI 2.0 — PHASE 2 FOLLOW-UP LIVE PRODUCTION PERFORMANCE BENCHMARK');
  console.log('Backend Host:', BASE_URL);
  console.log('Timestamp:', new Date().toISOString());
  console.log('========================================================================\n');

  const targets = [
    { name: 'Health Check (/health/)', path: '/health/' },
    { name: 'Products Catalog (page_size=1)', path: '/api/v1/products/?page_size=1' },
    { name: 'Products Catalog (page_size=24)', path: '/api/v1/products/?page_size=24' },
    { name: 'Categories List (/api/v1/categories/)', path: '/api/v1/categories/' },
  ];

  console.log('--- WARM STATE PROFILING (3 Iterations) ---');
  const results = {};
  for (const t of targets) {
    results[t.path] = [];
    process.stdout.write(`Benchmarking ${t.name}... `);
    for (let i = 0; i < 3; i++) {
      const res = await requestEndpoint(t.path);
      results[t.path].push(res);
      process.stdout.write(`[${res.totalMs}ms] `);
    }
    console.log();
  }

  console.log('\n========================================================================');
  console.log('SUMMARY TABLE:');
  console.log('========================================================================');
  for (const t of targets) {
    const runs = results[t.path];
    const avg = Math.round(runs.reduce((acc, r) => acc + (r.totalMs || 0), 0) / runs.length);
    const min = Math.min(...runs.map(r => r.totalMs));
    const max = Math.max(...runs.map(r => r.totalMs));
    const sample = runs[0];
    console.log(`${t.name.padEnd(38)} | Status: ${sample.status} | Avg: ${avg}ms (Min: ${min}ms, Max: ${max}ms) | Size: ${sample.bytes}B | Items: ${sample.itemCount}`);
  }

  fs.writeFileSync('scripts/live_performance_benchmark_results.json', JSON.stringify(results, null, 2));
  console.log('\nWrote full results to scripts/live_performance_benchmark_results.json');
}

run();
