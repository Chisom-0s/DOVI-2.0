const fs = require('fs');

// 1. In frontend/src/api/homepage.ts, ensure DEFAULT_CORE_SECTIONS is imported at the top
let hp = fs.readFileSync('frontend/src/api/homepage.ts', 'utf8').replace(/\r\n/g, '\n');
if (!hp.includes('DEFAULT_CORE_SECTIONS')) {
  hp = "import { DEFAULT_CORE_SECTIONS } from '@/services/homepagePlacementService';\n" + hp;
} else if (!hp.includes("import { DEFAULT_CORE_SECTIONS }")) {
  hp = hp.replace("import { isDiscountActiveNow,", "import { DEFAULT_CORE_SECTIONS, isDiscountActiveNow,");
}
fs.writeFileSync('frontend/src/api/homepage.ts', hp, 'utf8');
console.log('Fixed DEFAULT_CORE_SECTIONS in homepage.ts');

// 2. In frontend/src/components/common/PromotionalPopup.tsx, remove unused React and use secondary_text
let popup = fs.readFileSync('frontend/src/components/common/PromotionalPopup.tsx', 'utf8').replace(/\r\n/g, '\n');
popup = popup.replace("import React from 'react';\n", "");
popup = popup.replace(
  "{description}",
  "{description}\n          {secondary_text && <p style={{ fontSize: '11px', color: '#6b7280', margin: '4px 0 0' }}>{secondary_text}</p>}"
);
fs.writeFileSync('frontend/src/components/common/PromotionalPopup.tsx', popup, 'utf8');
console.log('Fixed PromotionalPopup.tsx');

// 3. In frontend/src/components/home/PromotionalBanner.tsx, remove unused React
let banner = fs.readFileSync('frontend/src/components/home/PromotionalBanner.tsx', 'utf8').replace(/\r\n/g, '\n');
banner = banner.replace("import React from 'react';\n", "");
fs.writeFileSync('frontend/src/components/home/PromotionalBanner.tsx', banner, 'utf8');
console.log('Fixed PromotionalBanner.tsx');

// 4. In frontend/src/contexts/PromotionContext.tsx, explicit useContext typing
let ctx = fs.readFileSync('frontend/src/contexts/PromotionContext.tsx', 'utf8').replace(/\r\n/g, '\n');
ctx = ctx.replace(
  "const context = useContext(PromotionContext);",
  "const context = useContext<PromotionContextType | null>(PromotionContext);"
);
fs.writeFileSync('frontend/src/contexts/PromotionContext.tsx', ctx, 'utf8');
console.log('Fixed PromotionContext.tsx');

// 5. In frontend/src/pages/Home/HomePage.tsx, fix duplicate isBanner
let home = fs.readFileSync('frontend/src/pages/Home/HomePage.tsx', 'utf8').replace(/\r\n/g, '\n');
const duplicateBlock = `          const hasProducts = Boolean(section?.products && section.products.length > 0);
          const isBanner = slot.defaultLayout === 'BANNER';

          // Gracefully omit empty product collections so no blank space or empty boxes appear
          if (!isBanner && !hasProducts && !isLoading) {
            return null;
          }
          const isBanner = slot.defaultLayout === 'BANNER';`;

const fixedBlock = `          const hasProducts = Boolean(section?.products && section.products.length > 0);
          const isBanner = slot.defaultLayout === 'BANNER';

          // Gracefully omit empty product collections so no blank space or empty boxes appear
          if (!isBanner && !hasProducts && !isLoading) {
            return null;
          }`;

if (home.includes('const isBanner = slot.defaultLayout === \'BANNER\';\n\n          // Gracefully omit')) {
  // Replace the second occurrence
  const idx1 = home.indexOf('const isBanner = slot.defaultLayout === \'BANNER\';');
  const idx2 = home.indexOf('const isBanner = slot.defaultLayout === \'BANNER\';', idx1 + 20);
  if (idx2 !== -1) {
    home = home.slice(0, idx2) + home.slice(idx2 + 'const isBanner = slot.defaultLayout === \'BANNER\';\n'.length);
  }
}
fs.writeFileSync('frontend/src/pages/Home/HomePage.tsx', home, 'utf8');
console.log('Fixed isBanner in HomePage.tsx');
