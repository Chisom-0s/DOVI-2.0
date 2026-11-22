const fs = require('fs');
const content = fs.readFileSync('frontend/src/pages/Checkout/CheckoutSessionPage.tsx', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(69, 130).join('\n'));
