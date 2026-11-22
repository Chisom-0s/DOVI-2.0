const fs = require('fs');
const content = fs.readFileSync('frontend/src/api/checkout.ts', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('initializeSession:'));
console.log(lines.slice(start, start + 50).join('\n'));
