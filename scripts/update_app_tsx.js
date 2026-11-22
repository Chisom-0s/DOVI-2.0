const fs = require('fs');
const path = require('path');

const appPath = path.resolve('frontend/src/App.tsx');
let content = fs.readFileSync(appPath, 'utf8').replace(/\r\n/g, '\n');

if (!content.includes('GiveawayProvider')) {
  content = content.replace(
    "import { CartProvider } from '@/contexts/CartContext';",
    "import { CartProvider } from '@/contexts/CartContext';\nimport { GiveawayProvider } from '@/contexts/GiveawayContext';"
  );
  content = content.replace(
    '<CartProvider>',
    '<CartProvider>\n            <GiveawayProvider>'
  );
  content = content.replace(
    '</CartProvider>',
    '</GiveawayProvider>\n          </CartProvider>'
  );
  fs.writeFileSync(appPath, content, 'utf8');
  console.log('Added GiveawayProvider to frontend/src/App.tsx');
} else {
  console.log('GiveawayProvider already present in App.tsx');
}
