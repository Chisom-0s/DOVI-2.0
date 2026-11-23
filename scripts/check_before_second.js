const fs = require('fs');
const content = fs.readFileSync('backend/delivery/payment_views.py', 'utf8');
const needle = 'class MinimumOrderSettingsAPIView(views.APIView):';
const firstIdx = content.indexOf(needle);
const secondIdx = content.indexOf(needle, firstIdx + 1);

console.log('--- 150 chars before secondIdx ---');
console.log(content.slice(secondIdx - 150, secondIdx));
