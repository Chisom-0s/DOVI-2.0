const fs = require('fs');
const content = fs.readFileSync('backend/delivery/payment_views.py', 'utf8');
const lines = content.split('\n');

console.log('Lines 200 to 240:');
console.log(lines.slice(199, 240).join('\n'));
