const fs = require('fs');

// 1. Update frontend/src/api/homepage.ts
let hpApi = fs.readFileSync('frontend/src/api/homepage.ts', 'utf8').replace(/\r\n/g, '\n');

// Import DEFAULT_CORE_SECTIONS if not imported
if (!hpApi.includes('DEFAULT_CORE_SECTIONS')) {
  hpApi = hpApi.replace(
    "import { isDiscountActiveNow, listMerchandisingSections } from '@/services/homepagePlacementService';",
    "import { isDiscountActiveNow, listMerchandisingSections, DEFAULT_CORE_SECTIONS } from '@/services/homepagePlacementService';"
  );
}

const targetBestSellers = `    case 'BEST_SELLERS': {
      candidates = realProducts.filter(
        (p) => (Boolean(p.is_best_seller) || orderedIds.includes(p.id)) &&
               (p.status === 'ACTIVE' || (p.status as any) === 'PUBLISHED') &&
               p.in_stock !== false
      );
      break;
    }`;

const replacementBestSellers = `    case 'BEST_SELLERS': {
      let effectiveBestIds = [...orderedIds];
      if (effectiveBestIds.length === 0) {
        const defaultBestSec = DEFAULT_CORE_SECTIONS.find((s) => s.key === 'BEST_SELLERS');
        if (defaultBestSec?.product_ids && defaultBestSec.product_ids.length > 0) {
          effectiveBestIds = [...defaultBestSec.product_ids];
        }
      }

      candidates = realProducts.filter(
        (p) => (Boolean(p.is_best_seller) || effectiveBestIds.includes(p.id)) &&
               (p.status === 'ACTIVE' || (p.status as any) === 'PUBLISHED') &&
               p.in_stock !== false
      );
      break;
    }`;

if (hpApi.includes(targetBestSellers)) {
  hpApi = hpApi.replace(targetBestSellers, replacementBestSellers);
  fs.writeFileSync('frontend/src/api/homepage.ts', hpApi, 'utf8');
  console.log('Updated homepage.ts Best Sellers resolution');
} else {
  console.error('Target Best Sellers block not found in homepage.ts');
}

// 2. Update HomePage.tsx so empty sections do not render excessive blank space or headers with big empty boxes
let homePage = fs.readFileSync('frontend/src/pages/Home/HomePage.tsx', 'utf8').replace(/\r\n/g, '\n');

const targetEmptyCheck = `        {ORDERED_SECTION_SLOTS.map((slot, index) => {
          const section = findSection(slot);`;

const replacementEmptyCheck = `        {ORDERED_SECTION_SLOTS.map((slot, index) => {
          const section = findSection(slot);
          const hasProducts = Boolean(section?.products && section.products.length > 0);
          const isBanner = slot.defaultLayout === 'BANNER';

          // Gracefully omit empty product collections so no blank space or empty boxes appear
          if (!isBanner && !hasProducts && !isLoading) {
            return null;
          }`;

if (homePage.includes(targetEmptyCheck) && !homePage.includes('Gracefully omit empty product collections')) {
  homePage = homePage.replace(targetEmptyCheck, replacementEmptyCheck);
  fs.writeFileSync('frontend/src/pages/Home/HomePage.tsx', homePage, 'utf8');
  console.log('Updated HomePage.tsx to gracefully hide empty sections without blank space');
} else {
  console.log('HomePage.tsx already updated or target not found');
}
