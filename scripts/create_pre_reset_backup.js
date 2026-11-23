const fs = require('fs');
const path = require('path');

const ts = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.resolve(`backend/backups/pre_customer_reset_backup_${ts}`);

fs.mkdirSync(backupDir, { recursive: true });

const filesToBackup = [
  { src: 'backend/delivery_store.json', dest: 'delivery_store.json' },
  { src: 'admin/public/delivery_store.json', dest: 'admin_delivery_store.json' },
  { src: 'frontend/public/delivery_store.json', dest: 'frontend_delivery_store.json' },
  { src: 'backend/products_catalog.json', dest: 'products_catalog.json' },
];

for (const file of filesToBackup) {
  if (fs.existsSync(file.src)) {
    fs.copyFileSync(file.src, path.join(backupDir, file.dest));
    console.log(`Backed up: ${file.src} -> ${path.join(backupDir, file.dest)}`);
  }
}

console.log(`Backup completed successfully at: ${backupDir}`);
