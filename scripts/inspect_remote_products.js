const https = require('https');
const fs = require('fs');

const localCatalog = JSON.parse(fs.readFileSync('backend/products_catalog.json', 'utf8'));
const localDeliveryStore = JSON.parse(fs.readFileSync('backend/delivery_store.json', 'utf8'));

console.log('localCatalog products count:', localCatalog.length);
console.log('localDeliveryStore products count:', localDeliveryStore.products.length);

function getPage(page, pageSize = 24, retries = 5) {
  return new Promise((resolve, reject) => {
    const url = `https://dovi-2-0-backend.onrender.com/api/v1/products/?page=${page}&page_size=${pageSize}`;
    https.get(url, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', async () => {
        if (res.statusCode !== 200) {
          if (retries > 0) {
            console.log(`Page ${page} returned status ${res.statusCode}. Retrying in 2.5s... (${retries} left)`);
            await new Promise(r => setTimeout(r, 2500));
            return resolve(await getPage(page, pageSize, retries - 1));
          }
          return reject(new Error(`Page ${page} failed with status ${res.statusCode}: ${d}`));
        }
        try {
          resolve(JSON.parse(d));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', async (err) => {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 2500));
        return resolve(await getPage(page, pageSize, retries - 1));
      }
      reject(err);
    });
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('Fetching Page 1...');
  const p1 = await getPage(1, 24);
  console.log(`Page 1 loaded (${p1.results.length} items). Total count on backend: ${p1.count}`);
  await sleep(1500);

  console.log('Fetching Page 2...');
  const p2 = await getPage(2, 24);
  console.log(`Page 2 loaded (${p2.results.length} items).`);
  await sleep(1500);

  console.log('Fetching Page 3...');
  const p3 = await getPage(3, 24);
  console.log(`Page 3 loaded (${p3.results.length} items).`);

  const remote = [...p1.results, ...p2.results, ...p3.results];
  console.log('\nTotal products on Render:', remote.length);

  const localIds = new Set(localCatalog.map(p => p.id));
  const newOnRemote = remote.filter(p => !localIds.has(p.id));

  console.log(`\n======================================================`);
  console.log(`PRODUCTS CREATED ON RENDER NOT IN LOCAL CATALOG: ${newOnRemote.length}`);
  console.log(`======================================================`);
  newOnRemote.forEach((p, idx) => {
    console.log(`\n[${idx + 1}] ID: ${p.id}`);
    console.log(`    Name: ${p.name}`);
    console.log(`    Status: ${p.status}`);
    console.log(`    Category: ${p.category_name} (${p.category})`);
    console.log(`    Price: ${p.price}`);
    console.log(`    Primary Image: ${p.primary_image_url || 'NONE'}`);
    console.log(`    Images count: ${p.images ? p.images.length : 0}`);
    console.log(`    Created At: ${p.created_at}`);
  });

  // Save the full remote product list for comparison
  fs.writeFileSync('scripts/remote_products_dump.json', JSON.stringify(remote, null, 2));
  console.log('\nDumped all remote products to scripts/remote_products_dump.json');
}

main().catch(console.error);
