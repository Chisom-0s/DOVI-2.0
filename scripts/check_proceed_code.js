const fs = require('fs');
const content = fs.readFileSync('frontend/src/pages/Checkout/CheckoutPage.tsx', 'utf8');
const lines = content.split('\n');

const pStart = lines.findIndex(l => l.includes('const handleProceedToPayment ='));
console.log('handleProceedToPayment lines:');
console.log(lines.slice(pStart, pStart + 70).join('\n'));
