const fs = require('fs');
const path = require('path');

function search(dir) {
  for (const item of fs.readdirSync(dir)) {
    if (['node_modules', '.git', 'dist', 'backups', '.gemini'].includes(item)) continue;
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      search(full);
    } else if (item.endsWith('.js') || item.endsWith('.ts') || item.endsWith('.json') || item.endsWith('.md') || item.endsWith('.py')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((l, idx) => {
        if (l.includes('admin@dovi.com') && (l.toLowerCase().includes('pass') || l.includes('secret') || l.includes('auth'))) {
          console.log(`${full}:${idx + 1}: ${l.trim()}`);
        }
      });
    }
  }
}

search('.');
