const fs = require('fs');
const path = require('path');

const catPagePath = path.join(__dirname, '..', 'admin', 'src', 'pages', 'CategoriesPage.tsx');
let content = fs.readFileSync(catPagePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add Link and resolveProductCategoryAndSubcategory imports
content = content.replace(
  `import { useEffect, useState, useMemo } from 'react';`,
  `import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';`
);

content = content.replace(
  `  syncCategoriesFromSharedDb,
  resetCategoriesToDefault12,
} from '@/services/categoryService';`,
  `  syncCategoriesFromSharedDb,
  resetCategoriesToDefault12,
  resolveProductCategoryAndSubcategory,
} from '@/services/categoryService';`
);

// 2. Add selectedCategory, subFilter, productQuery states
const targetStates = `  // Expanded main category IDs
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');`;

const replaceStates = `  // Expanded main category IDs
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Dedicated Category Details & Category Products View state
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubFilter, setSelectedSubFilter] = useState<string>('ALL');
  const [categoryProductQuery, setCategoryProductQuery] = useState<string>('');`;

content = content.replace(targetStates, replaceStates);

// 3. Compute products belonging to the selectedCategory
const targetFilteredCategories = `  // Filtered categories based on search and active/inactive filter
  const filteredCategories = useMemo(() => {`;

const replaceFilteredCategories = `  // Products filtered for the dedicated category view
  const categoryProducts = useMemo(() => {
    if (!selectedCategory) return [];
    return allProducts.filter((p) => {
      const resolved = resolveProductCategoryAndSubcategory(p);
      const matchesCat =
        resolved.category_id === selectedCategory.id ||
        resolved.category_slug === selectedCategory.slug ||
        (resolved.category_name && resolved.category_name.toLowerCase() === selectedCategory.name.toLowerCase()) ||
        (p as any).category === selectedCategory.id;
      if (!matchesCat) return false;

      if (selectedSubFilter !== 'ALL') {
        const matchesSub =
          resolved.subcategory_id === selectedSubFilter ||
          resolved.subcategory_slug === selectedSubFilter;
        if (!matchesSub) return false;
      }

      if (categoryProductQuery.trim()) {
        const q = categoryProductQuery.trim().toLowerCase();
        const nameMatch = (p.name || '').toLowerCase().includes(q);
        const refMatch = (p.reference_code || p.id || '').toLowerCase().includes(q);
        return nameMatch || refMatch;
      }

      return true;
    });
  }, [selectedCategory, selectedSubFilter, categoryProductQuery, allProducts]);

  // Filtered categories based on search and active/inactive filter
  const filteredCategories = useMemo(() => {`;

content = content.replace(targetFilteredCategories, replaceFilteredCategories);

// 4. In the category row, add the prominent "View Products" button
const targetCountsAndActions = `{/* Counts & Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={pillCounterStyles}>
                          {activeSubCount}/{subs.length} subcategories
                        </span>
                        <span style={{ ...pillCounterStyles, backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                          {cat.product_count ?? 0} products
                        </span>`;

const replaceCountsAndActions = `{/* Counts & Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat);
                            setSelectedSubFilter('ALL');
                            setCategoryProductQuery('');
                          }}
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#ffffff',
                            backgroundColor: '#ff7a00',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: '0 1px 2px rgba(255, 122, 0, 0.25)',
                          }}
                          title="View all products and subcategories in this category"
                        >
                          View Products ({cat.product_count ?? 0}) →
                        </button>
                        <span style={pillCounterStyles}>
                          {activeSubCount}/{subs.length} subcategories
                        </span>`;

content = content.replace(targetCountsAndActions, replaceCountsAndActions);

// 5. In the left column, if selectedCategory is active, render the dedicated category view instead of the full list
const targetMainCategoriesView = `{/* Left Column: Expandable Category & Subcategory Hierarchy */}
        <div style={cardStyles}>`;

const replaceMainCategoriesView = `{/* Left Column: Dedicated Category Details View OR Full Category List */}
        <div style={cardStyles}>
          {selectedCategory ? (
            <div>
              {/* Breadcrumb Navigation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ff7a00',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 0,
                  }}
                >
                  ← All Categories
                </button>
                <span style={{ color: '#9ca3af' }}>/</span>
                <span style={{ fontWeight: 700, color: '#111827', fontSize: '13px' }}>
                  {selectedCategory.name}
                </span>
              </div>

              {/* Category Header Card */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '10px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                      }}
                    >
                      {selectedCategory.icon || '📦'}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                          {selectedCategory.name}
                        </h3>
                        <span style={statusBadgeStyles(selectedCategory.is_active !== false)}>
                          {selectedCategory.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                        <span style={{ ...pillCounterStyles, backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                          {selectedCategory.product_count ?? 0} Products
                        </span>
                        <span style={pillCounterStyles}>
                          {selectedCategory.subcategories?.length || 0} Subcategories
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                        Slug: <code>{selectedCategory.slug}</code>
                        {selectedCategory.description && (' · ' + selectedCategory.description)}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleStartCreateSubcategory(selectedCategory.id)}
                      style={{ ...smallActionBtnStyles, color: '#059669', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
                    >
                      + Add Subcategory
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEditMainCategory(selectedCategory)}
                      style={{ ...smallActionBtnStyles, color: '#ff7a00', backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}
                    >
                      Edit Category
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleMainActive(selectedCategory)}
                      style={{ ...smallActionBtnStyles, color: selectedCategory.is_active !== false ? '#d97706' : '#059669' }}
                    >
                      {selectedCategory.is_active !== false ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>

                {/* Subcategory Filter Pills */}
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Filter by Subcategory:
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedSubFilter('ALL')}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: '1px solid',
                        cursor: 'pointer',
                        borderColor: selectedSubFilter === 'ALL' ? '#ff7a00' : '#cbd5e1',
                        backgroundColor: selectedSubFilter === 'ALL' ? '#ff7a00' : '#ffffff',
                        color: selectedSubFilter === 'ALL' ? '#ffffff' : '#475569',
                      }}
                    >
                      All ({selectedCategory.product_count ?? 0})
                    </button>
                    {(selectedCategory.subcategories || []).map((sub) => {
                      const isActive = selectedSubFilter === sub.id || selectedSubFilter === sub.slug;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setSelectedSubFilter(sub.id)}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 600,
                            border: '1px solid',
                            cursor: 'pointer',
                            borderColor: isActive ? '#ff7a00' : '#cbd5e1',
                            backgroundColor: isActive ? '#ff7a00' : '#ffffff',
                            color: isActive ? '#ffffff' : '#475569',
                          }}
                        >
                          {sub.name} ({sub.product_count ?? 0})
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Product Search & Listing */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '380px' }}>
                  <input
                    type="text"
                    placeholder={\`Search products in \${selectedCategory.name}...\`}
                    value={categoryProductQuery}
                    onChange={(e) => setCategoryProductQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 32px',
                      fontSize: '13px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      outline: 'none',
                    }}
                  />
                  <span style={{ position: 'absolute', left: '10px', top: '9px', fontSize: '13px', color: '#94a3b8' }}>
                    🔍
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Showing <strong>{categoryProducts.length}</strong> products
                </div>
              </div>

              {/* Category Products Table */}
              {categoryProducts.length === 0 ? (
                <EmptyState
                  icon="📦"
                  title="No Products in This View"
                  subtitle="No products currently match this subcategory filter or search term. You can assign existing products or create new products in this category."
                />
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 600 }}>Product</th>
                        <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 600 }}>Price</th>
                        <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 600 }}>Subcategory</th>
                        <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 600, textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryProducts.map((p) => {
                        const resolved = resolveProductCategoryAndSubcategory(p);
                        const priceNum = parseFloat(p.price || (p as any).base_price || '0');
                        const priceFormatted = new Intl.NumberFormat('en-NG', {
                          style: 'currency',
                          currency: 'NGN',
                          minimumFractionDigits: 0,
                        }).format(priceNum);

                        return (
                          <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {p.primary_image_url ? (
                                  <img
                                    src={p.primary_image_url}
                                    alt={p.name}
                                    style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                                  />
                                ) : (
                                  <div style={{ width: '36px', height: '36px', backgroundColor: '#f1f5f9', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                                    📦
                                  </div>
                                )}
                                <div>
                                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{p.name}</div>
                                  <div style={{ fontSize: '11px', color: '#64748b' }}>{p.reference_code || p.id}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                              {priceFormatted}
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#f1f5f9', color: '#475569' }}>
                                {resolved.subcategory_name || 'General'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={statusBadgeStyles(p.status === 'PUBLISHED')}>
                                {p.status || 'PUBLISHED'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                              <Link
                                to={\`/products?q=\${encodeURIComponent(p.name)}\`}
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: '#ff7a00',
                                  textDecoration: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: '#fff7ed',
                                }}
                              >
                                Edit Product ↗
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <>`;

content = content.replace(targetMainCategoriesView, replaceMainCategoriesView);

// 6. Close the condition at the end of the left column
const targetCloseLeftColumn = `              })}
            </div>
          )}
        </div>

        {/* Right Column: Sticky Subcategory / Category Configuration Form */}`;

const replaceCloseLeftColumn = `              })}
            </div>
          )}
            </>
          )}
        </div>

        {/* Right Column: Sticky Subcategory / Category Configuration Form */}`;

content = content.replace(targetCloseLeftColumn, replaceCloseLeftColumn);

fs.writeFileSync(catPagePath, content, 'utf8');
console.log('CategoriesPage.tsx successfully updated with dedicated view.');
