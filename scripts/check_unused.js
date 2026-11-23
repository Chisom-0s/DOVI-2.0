const fs = require('fs');
const content = fs.readFileSync('frontend/src/pages/Checkout/CheckoutPage.tsx', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(140, 160).join('\n'));
