const fs = require('fs');
const content = fs.readFileSync('frontend/src/pages/Checkout/CheckoutPage.tsx', 'utf8');
const lines = content.split('\n');

console.log('Lines 460 to 570 (State & City inputs):');
console.log(lines.slice(459, 570).join('\n'));
