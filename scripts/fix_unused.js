const fs = require('fs');
const path = require('path');

const filePath = path.resolve('frontend/src/pages/Checkout/CheckoutPage.tsx');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

content = content.replace('  const addressSectionRef = useRef<HTMLElement>(null);\n', '');
content = content.replace(
  '    let activeAddress = addresses.find((a) => a.id === selectedAddressId);',
  '    let activeAddress = selectedAddress;'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed unused variables in CheckoutPage.tsx');
