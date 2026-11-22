const fs = require('fs');
const content = fs.readFileSync('frontend/src/pages/Checkout/CheckoutPage.tsx', 'utf8');
const lines = content.split('\n');

console.log('Lines 490 to 570:');
console.log(lines.slice(490, 570).join('\n'));
console.log('Lines 630 to 710:');
console.log(lines.slice(630, 710).join('\n'));
