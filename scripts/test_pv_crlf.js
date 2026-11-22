const fs = require('fs');
const path = require('path');

const pvPath = path.resolve('backend/delivery/payment_views.py');
let content = fs.readFileSync(pvPath, 'utf8').replace(/\r\n/g, '\n');

console.log('Total characters after CRLF normalization:', content.length);
console.log('Contains save_receipt_file:', content.includes('save_receipt_file'));
console.log('Contains class SubmitPaymentEvidenceAPIView:', content.includes('class SubmitPaymentEvidenceAPIView'));
console.log('Contains class PaymentSessionListCreateAPIView:', content.includes('class PaymentSessionListCreateAPIView'));
console.log('Contains class OrderListCreateAPIView:', content.includes('class OrderListCreateAPIView'));
