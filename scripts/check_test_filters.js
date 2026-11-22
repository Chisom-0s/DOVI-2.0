const fs = require('fs');
const content = fs.readFileSync('admin/src/api/admin.ts', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(210, 275).join('\n'));
