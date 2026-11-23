const fs = require('fs');
const path = require('path');

const storePath = path.resolve('backend/delivery_store.json');
const backupDir = path.resolve('backend/backups');
fs.mkdirSync(backupDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupDir, `delivery_store_backup_${timestamp}.json`);

if (fs.existsSync(storePath)) {
  fs.copyFileSync(storePath, backupPath);
  console.log(`✓ Backup successfully created at: ${backupPath}`);
  
  const raw = fs.readFileSync(storePath, 'utf8');
  const store = JSON.parse(raw);
  
  console.log('\n--- STORE CONTENTS BREAKDOWN ---');
  for (const k of Object.keys(store)) {
    const val = store[k];
    const count = Array.isArray(val) ? val.length : (typeof val === 'object' && val !== null ? Object.keys(val).length : 1);
    console.log(`  - ${k}: ${count}`);
  }
} else {
  console.log('No delivery_store.json found');
}

// Check media receipts
const receiptsDir = path.resolve('backend/media/receipts');
if (fs.existsSync(receiptsDir)) {
  const files = fs.readdirSync(receiptsDir);
  console.log(`\n--- MEDIA RECEIPTS: ${files.length} files ---`);
  files.forEach(f => console.log(`  - ${f}`));
} else {
  console.log('No media/receipts directory found');
}
