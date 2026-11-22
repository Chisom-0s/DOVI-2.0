const fs = require('fs');

function glob(dir) {
  let files = [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach(f => {
    const full = dir + '/' + f.name;
    if (f.isDirectory() && !full.includes('node_modules') && !full.includes('.git') && !full.includes('dist')) {
      files = files.concat(glob(full));
    } else if (f.isFile() && (full.endsWith('.ts') || full.endsWith('.tsx'))) {
      files.push(full);
    }
  });
  return files;
}

const keys = new Set();
for (const file of glob('admin/src').concat(glob('frontend/src'))) {
  const content = fs.readFileSync(file, 'utf8');
  const regex = /localStorage\.(?:getItem|setItem|removeItem)\(['"`]([^'"`]+)['"`]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    keys.add(match[1]);
  }
}
console.log('All localStorage keys across admin and frontend:');
Array.from(keys).sort().forEach(k => console.log(' - ' + k));
