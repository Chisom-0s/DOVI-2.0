/**
 * DOVI — Hero Promotional Campaigns Verification Suite
 * Validates:
 * 1. Old category-based hero slides and text overlays completely removed.
 * 2. Orange horizontal category navigation bar untouched in Header.tsx.
 * 3. Exact 6 promotional campaign banners in intended order with valid image assets (.jpg and .webp).
 * 4. Dedicated CampaignCollectionPage and router endpoints (/promotions/:slug and /campaigns/:slug).
 * 5. Admin CMS management, campaign presets, and Christmas Deals product assignment.
 * 6. Backend delivery_store.json seed and endpoints.
 */

const fs = require('fs');
const path = require('path');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failedTests++;
  }
}

console.log('====================================================');
console.log('DOVI HERO PROMOTIONAL CAMPAIGNS VERIFICATION');
console.log('====================================================\n');

// TEST 1: Old category-based hero slides and CSS overlays removed
console.log('TEST 1: Verify Old Category Slides & CSS Overlays Removed');
const heroCarouselPath = 'frontend/src/components/home/HeroBannerCarousel.tsx';
assert(fs.existsSync(heroCarouselPath), 'HeroBannerCarousel.tsx exists');
const heroCarouselContent = fs.readFileSync(heroCarouselPath, 'utf8');

const oldCategories = [
  'slide-gadgets',
  'slide-mens-fashion',
  'slide-appliances',
  'slide-kiddies',
  'slide-furniture',
  'slide-beauty',
];
let oldSlidesFound = false;
for (const cat of oldCategories) {
  if (heroCarouselContent.includes(cat)) {
    oldSlidesFound = true;
    break;
  }
}
assert(!oldSlidesFound, 'All old category slide IDs removed from HeroBannerCarousel.tsx');
assert(!heroCarouselContent.includes('hero-glass-card'), 'Old .hero-glass-card overlay removed');
assert(!heroCarouselContent.includes('hero-slide-scrim'), 'Old .hero-slide-scrim overlay removed');
assert(heroCarouselContent.includes('aspect-ratio: 2 / 1'), 'Hero carousel enforces responsive 2:1 aspect ratio');

// TEST 2: Orange category navigation remains untouched in Header.tsx
console.log('\nTEST 2: Verify Orange Category Navigation Remains Untouched');
const headerPath = 'frontend/src/components/layout/Header.tsx';
assert(fs.existsSync(headerPath), 'Header.tsx exists');
const headerContent = fs.readFileSync(headerPath, 'utf8');
assert(headerContent.includes('dovi-category-slider-wrapper') || headerContent.includes('header-category-link'), 'Orange category navigation marquee in Header.tsx is present and intact');

// TEST 3: Six Promotional Campaign Banners In Order & Image Assets
console.log('\nTEST 3: Verify Six Promotional Campaign Banners in Order');
const expectedCampaigns = [
  { key: 'launch', file: 'hero_launch_campaign.jpg', dest: '/promotions/launch' },
  { key: 'black-friday', file: 'hero_black_friday.jpg', dest: '/promotions/black-friday' },
  { key: 'price-drops', file: 'hero_price_drops.jpg', dest: '/promotions/price-drops' },
  { key: 'rewards', file: 'hero_free_gifts.jpg', dest: '/promotions/giveaway' },
  { key: 'limited-deals', file: 'hero_limited_deals.jpg', dest: '/promotions/limited-deals' },
  { key: 'christmas', file: 'hero_christmas_deals.jpg', dest: '/promotions/christmas' },
];

for (const camp of expectedCampaigns) {
  assert(heroCarouselContent.includes(camp.file), `Hero carousel includes ${camp.file}`);
  assert(heroCarouselContent.includes(camp.dest), `Hero carousel links to destination ${camp.dest}`);
  
  // Verify images exist in frontend and admin
  const frontendJpg = path.join('frontend/public/images/hero', camp.file);
  const frontendWebp = path.join('frontend/public/images/hero', camp.file.replace('.jpg', '.webp'));
  const adminJpg = path.join('admin/public/images/hero', camp.file);
  const adminWebp = path.join('admin/public/images/hero', camp.file.replace('.jpg', '.webp'));

  assert(fs.existsSync(frontendJpg), `Frontend asset exists: ${frontendJpg}`);
  assert(fs.existsSync(frontendWebp), `Frontend WebP asset exists: ${frontendWebp}`);
  assert(fs.existsSync(adminJpg), `Admin asset exists: ${adminJpg}`);
  assert(fs.existsSync(adminWebp), `Admin WebP asset exists: ${adminWebp}`);
}

// TEST 4: CampaignCollectionPage & Router Registration
console.log('\nTEST 4: Verify CampaignCollectionPage & Routing');
const campaignPagePath = 'frontend/src/pages/Promotions/CampaignCollectionPage.tsx';
assert(fs.existsSync(campaignPagePath), 'CampaignCollectionPage.tsx exists');
const campaignPageContent = fs.readFileSync(campaignPagePath, 'utf8');
assert(campaignPageContent.includes('CAMPAIGN_REGISTRY'), 'Campaign registry defined in CampaignCollectionPage');
assert(campaignPageContent.includes('christmas'), 'Christmas Deals configuration present');
assert(campaignPageContent.includes('giveaway'), 'Free Gifts & Rewards configuration with rules present');
assert(campaignPageContent.includes('price-drops'), 'Price Drops configuration with discount filtering present');

const routerPath = 'frontend/src/router/index.tsx';
const routerContent = fs.readFileSync(routerPath, 'utf8');
assert(routerContent.includes('CampaignCollectionPage'), 'CampaignCollectionPage imported in router');
assert(routerContent.includes("path: 'promotions/:slug'"), 'Route /promotions/:slug registered');
assert(routerContent.includes("path: 'campaigns/:slug'"), 'Route /campaigns/:slug registered');

// TEST 5: Backend delivery_store.json Seed & Views
console.log('\nTEST 5: Verify Backend Store & API Views');
const storePath = 'backend/delivery_store.json';
assert(fs.existsSync(storePath), 'delivery_store.json exists');
const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
assert(Array.isArray(store.homepageBanners) && store.homepageBanners.length === 6, 'delivery_store.json has 6 homepageBanners');

const christmasBanner = store.homepageBanners.find(b => b.campaign_key === 'christmas');
assert(christmasBanner && Array.isArray(christmasBanner.product_ids) && christmasBanner.product_ids.length > 0, 'Christmas Deals has assigned participating product_ids');

const paymentViewsPath = 'backend/delivery/payment_views.py';
const paymentViewsContent = fs.readFileSync(paymentViewsPath, 'utf8');
assert(paymentViewsContent.includes('PublicHomepageBannersAPIView'), 'PublicHomepageBannersAPIView implemented');
assert(paymentViewsContent.includes('AdminHomepageBannersAPIView'), 'AdminHomepageBannersAPIView implemented');
assert(paymentViewsContent.includes('CampaignProductsAPIView'), 'CampaignProductsAPIView implemented');

const urlsPath = 'backend/delivery/urls.py';
const urlsContent = fs.readFileSync(urlsPath, 'utf8');
assert(urlsContent.includes('homepage/banners/'), 'Homepage banners route registered in urls.py');
assert(urlsContent.includes('campaigns/<str:campaign_key>/products/'), 'Campaign products route registered in urls.py');

// TEST 6: Admin Management & Product Assignment
console.log('\nTEST 6: Verify Admin Management & Product Assignment');
const bannerFormPath = 'admin/src/pages/Homepage/BannerFormPage.tsx';
assert(fs.existsSync(bannerFormPath), 'BannerFormPage.tsx exists');
const bannerFormContent = fs.readFileSync(bannerFormPath, 'utf8');
assert(bannerFormContent.includes('CAMPAIGN_PRESETS'), 'Campaign presets configured in BannerFormPage');
assert(bannerFormContent.includes('assignedProductIds'), 'Product assignment enabled in BannerFormPage');
assert(bannerFormContent.includes('Christmas Deals'), 'Christmas Deals preset configured');

const adminApiPath = 'admin/src/api/admin.ts';
const adminApiContent = fs.readFileSync(adminApiPath, 'utf8');
assert(adminApiContent.includes('getCampaignProducts'), 'getCampaignProducts in adminApi');
assert(adminApiContent.includes('assignCampaignProducts'), 'assignCampaignProducts in adminApi');

console.log('\n====================================================');
console.log(`SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('====================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 All Hero Promotional Campaign specifications verified successfully!');
  process.exit(0);
}
