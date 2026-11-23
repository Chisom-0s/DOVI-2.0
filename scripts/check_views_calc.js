const fs = require('fs');
const content = fs.readFileSync('backend/delivery/views.py', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(20, 110).join('\n'));
