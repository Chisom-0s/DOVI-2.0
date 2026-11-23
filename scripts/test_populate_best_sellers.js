const fs = require('fs');

const catalog = JSON.parse(fs.readFileSync('backend/products_catalog.json', 'utf8'));

// Check how populateProductsForSection works
function populateProductsForSection(section, realProducts) {
  let orderedIds = [];
  // If no manual ids in localStorage, what is checked?
  const isBestSeller = (p) => Boolean(p.is_best_seller) || orderedIds.includes(p.id);
  return realProducts.filter(isBestSeller);
}

console.log('Without orderedIds or is_best_seller, count is:', populateProductsForSection({ key: 'BEST_SELLERS' }, catalog).length);
