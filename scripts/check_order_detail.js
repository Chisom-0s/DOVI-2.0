const fs = require('fs');
const content = fs.readFileSync('backend/delivery/payment_views.py', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(1281, 1352).join('\n'));
