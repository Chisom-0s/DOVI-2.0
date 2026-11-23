const fs = require('fs');
const content = fs.readFileSync('backend/delivery/payment_views.py', 'utf8');
const needle = 'class MinimumOrderSettingsAPIView(views.APIView):';

const firstIdx = content.indexOf(needle);
const secondIdx = content.indexOf(needle, firstIdx + 1);

console.log('First index:', firstIdx);
console.log('Second index:', secondIdx);
if (secondIdx !== -1) {
  console.log('Duplicate length to slice:', content.length - secondIdx);
}
