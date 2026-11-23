const fs = require('fs');

const homePath = 'frontend/src/pages/Home/HomePage.tsx';
let content = fs.readFileSync(homePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Update import
content = content.replace(
  "import GiveawayBanner from '@/components/home/GiveawayBanner';",
  "import PromotionalBanner from '@/components/home/PromotionalBanner';"
);

// 2. Update JSX element
content = content.replace(
  '<GiveawayBanner />',
  '<PromotionalBanner />'
);

fs.writeFileSync(homePath, content, 'utf8');
console.log('Updated HomePage.tsx to use PromotionalBanner');
