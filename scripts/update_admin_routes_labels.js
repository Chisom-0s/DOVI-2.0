const fs = require('fs');

// 1. Update AdminLayout.tsx
const layoutPath = 'admin/src/components/layout/AdminLayout.tsx';
let layoutContent = fs.readFileSync(layoutPath, 'utf8').replace(/\r\n/g, '\n');
layoutContent = layoutContent.replace(
  "label: 'Launch Giveaway',",
  "label: 'Promotions & Giveaway',"
);
fs.writeFileSync(layoutPath, layoutContent, 'utf8');
console.log('Updated AdminLayout label to Promotions & Giveaway');

// 2. Update admin/src/App.tsx
const appPath = 'admin/src/App.tsx';
let appContent = fs.readFileSync(appPath, 'utf8').replace(/\r\n/g, '\n');
if (!appContent.includes('path="promotions"')) {
  appContent = appContent.replace(
    '<Route path="giveaway" element={<GiveawayManagerPage />} />',
    '<Route path="giveaway" element={<GiveawayManagerPage />} />\n                <Route path="promotions" element={<GiveawayManagerPage />} />'
  );
  fs.writeFileSync(appPath, appContent, 'utf8');
  console.log('Added promotions route to admin/src/App.tsx');
}
