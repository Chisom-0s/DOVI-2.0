const fs = require('fs');
const content = fs.readFileSync('backend/delivery/payment_views.py', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('class OrderListCreateAPIView'));
console.log('OrderListCreateAPIView start:', start + 1);
console.log(lines.slice(start, start + 100).join('\n'));
