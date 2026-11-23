const fs = require('fs');
const content = fs.readFileSync('backend/delivery/payment_views.py', 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);
console.log('Line 748:', lines[747]);
console.log('Line 749:', lines[748]);
console.log('Line 1096:', lines[1095]);
console.log('Line 1097:', lines[1096]);
console.log('Line 1351:', lines[1350]);
console.log('Line 1352:', lines[1351]);
