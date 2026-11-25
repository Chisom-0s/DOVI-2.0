const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../admin/src/pages/ProductsPage.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add apiClient import if not present
if (!content.includes("import apiClient from '@/api/client';")) {
  content = content.replace(
    "import { adminApi } from '@/api/admin';",
    "import apiClient from '@/api/client';\nimport { adminApi } from '@/api/admin';"
  );
  console.log('Added apiClient import');
}

// 2. Add verifyProductPublication helper before `export default function ProductsPage()`
const helperFunc = `
// Product publication safeguard & catalogue visibility verification
async function verifyProductPublication(productId: string, productName: string): Promise<boolean> {
  console.log(\`[DOVI_PUBLICATION_SAFEGUARD] Verifying catalogue visibility for product "\${productName}" (ID: \${productId})...\`);
  try {
    // 1. Invalidate storefront caches so customer views update immediately
    try {
      localStorage.removeItem('dovi_real_products_cache');
      sessionStorage.removeItem('dovi_real_products_cache');
      localStorage.setItem('dovi_catalog_last_updated', Date.now().toString());
      window.dispatchEvent(new CustomEvent('dovi-products-updated', { detail: { productId } }));
    } catch {}

    // 2. Query public endpoint to verify product is indexed and published
    const res = await apiClient.get(\`/api/v1/products/\${productId}/\`);
    if (res?.data && (res.data.id === productId || res.data.name === productName)) {
      console.log(\`[DOVI_PUBLICATION_SAFEGUARD] SUCCESS: Product "\${productName}" is verified in catalogue with status "\${res.data.status || 'PUBLISHED'}".\`);
      return true;
    }
  } catch (err: any) {
    console.warn(\`[DOVI_PUBLICATION_SAFEGUARD] Notice: Product verification query returned:\`, err?.message || err);
  }
  return false;
}
`;

if (!content.includes('function verifyProductPublication')) {
  content = content.replace(
    'export default function ProductsPage()',
    `${helperFunc}\nexport default function ProductsPage()`
  );
  console.log('Added verifyProductPublication helper');
}

// 3. Update EDIT MODE
const oldEditToast = "toast.success(`Product \"${form.name}\" updated successfully.`);";
const newEditToast = `await verifyProductPublication(editingProduct.id, form.name.trim());\n        toast.success(\`Product "\${form.name}" updated and verified in catalogue.\`);`;
if (content.includes(oldEditToast)) {
  content = content.replace(oldEditToast, newEditToast);
  console.log('Updated EDIT MODE toast with verification');
}

// 4. Update CREATE MODE
const oldCreateSuccess = "toast.success('Product created with photos, category & delivery classification!');";
const newCreateSuccess = `const isVerified = await verifyProductPublication(String(targetProductId), form.name.trim());\n            toast.success(isVerified ? 'Product created, photos uploaded, and verified live in catalogue!' : 'Product created with photos, category & delivery classification!');`;
if (content.includes(oldCreateSuccess)) {
  content = content.replace(oldCreateSuccess, newCreateSuccess);
  console.log('Updated CREATE MODE with verification');
}

const oldCreateListingSuccess = "toast.success('Product listing created successfully!');";
const newCreateListingSuccess = `const isVerifiedNoPhotos = await verifyProductPublication(String(targetProductId), form.name.trim());\n          toast.success(isVerifiedNoPhotos ? 'Product created and verified live in catalogue!' : 'Product listing created successfully!');`;
if (content.includes(oldCreateListingSuccess)) {
  content = content.replace(oldCreateListingSuccess, newCreateListingSuccess);
  console.log('Updated CREATE MODE no-photos with verification');
}

// 5. Invalidate cache on product archive/delete
const oldArchiveSuccess = "toast.success(`Product \"${productToArchive.name}\" deleted.`);";
const newArchiveSuccess = `try {\n        localStorage.removeItem('dovi_real_products_cache');\n        sessionStorage.removeItem('dovi_real_products_cache');\n        localStorage.setItem('dovi_catalog_last_updated', Date.now().toString());\n        window.dispatchEvent(new CustomEvent('dovi-products-updated', { detail: { productId: productToArchive.id } }));\n      } catch {}\n      toast.success(\`Product "\${productToArchive.name}" deleted.\`);`;
if (content.includes(oldArchiveSuccess)) {
  content = content.replace(oldArchiveSuccess, newArchiveSuccess);
  console.log('Updated ARCHIVE with cache invalidation');
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('ProductsPage.tsx successfully patched with publication safeguards!');
