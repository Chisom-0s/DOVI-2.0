const fs = require('fs');
const path = require('path');

const filePath = path.resolve('frontend/src/pages/Checkout/CheckoutPage.tsx');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

console.log('CheckoutPage total lines:', content.split('\n').length);
