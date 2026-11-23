const fs = require('fs');

const files = ['frontend/vite.config.ts', 'admin/vite.config.ts'];

files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

  // In merged = { ... }
  const targetNeedle = `            minimumOrderSettings: incoming.minimumOrderSettings !== undefined
              ? incoming.minimumOrderSettings
              : (current.minimumOrderSettings || { enabled: true, minimum_amount: 10000 }),`;

  const addition = `
            launchGiveaway: incoming.launchGiveaway !== undefined
              ? incoming.launchGiveaway
              : (current.launchGiveaway !== undefined ? current.launchGiveaway : undefined),`;

  if (content.includes(targetNeedle) && !content.includes('launchGiveaway:')) {
    content = content.replace(targetNeedle, targetNeedle + addition);
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file} with launchGiveaway support`);
  } else {
    console.log(`Skipped ${file} (already contains or target not matched)`);
  }
});
