const fs = require('fs');
const content = fs.readFileSync('frontend/src/api/payments.ts', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('submitPaymentEvidence:'));
console.log(lines.slice(start, start + 45).join('\n'));
