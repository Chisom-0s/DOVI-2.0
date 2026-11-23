const fs = require('fs');
const content = fs.readFileSync('backend/delivery/services.py', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(20, 70).join('\n'));
