import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import {
  listMainCategories,
  getSubcategoriesForCategory,
  createSubcategory,
  updateMainCategory,
  updateSubcategory,
  toggleMainCategoryStatus,
  toggleSubcategoryStatus,
  reorderMainCategories,
  reorderSubcategories,
  deleteSubcategory,
  saveProductCategoryAssignment,
  syncCategoriesFromSharedDb,
  resetCategoriesToDefault12,
} from '@/services/categoryService';
import type { Category, Subcategory, ProductSummary, APIError } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  // Expanded main category IDs
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Subcategory Create / Edit Form State
  const [formMode, setFormMode] = useState<'CREATE_SUBCATEGORY' | 'EDIT_SUBCATEGORY' | 'EDIT_MAIN_CATEGORY'>('CREATE_SUBCATEGORY');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [displayOrder, setDisplayOrder] = useState<string>('1');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subcategory Deletion / Product Reassignment Modal State
  const [subToDelete, setSubToDelete] = useState<{ sub: Subcategory; parentCat: Category } | null>(null);
  const [reassignTargetSubId, setReassignTargetSubId] = useState<string>('');
  const [isDeletingSub, setIsDeletingSub] = useState(false);

  // Flagged Product Quick-Assignment State
  const [reviewAssignments, setReviewAssignments] = useState<Record<string, { categoryId: string; subcategoryId: string }>>({});

  const loadData = async (showSpinner = true) => {
    if (showSpinner) setIsLoading(true);
    setError(null);
    try {
      await syncCategoriesFromSharedDb().catch(() => {});
      let prodList: ProductSummary[] = [];
      try {
        const prodRes = await adminApi.listProducts({ page: 1 });
        prodList = prodRes.results || [];
      } catch {
        prodList = [];
      }
      setAllProducts(prodList);

      const mainCats = listMainCategories({ includeInactive: true, products: prodList });
      setCategories(mainCats);

      if (!parentCategoryId && mainCats.length > 0) {
        setParentCategoryId(mainCats[0].id);
      }

      // Expand the first 3 categories by default on initial load
      setExpandedCategoryIds((prev) => {
        if (Object.keys(prev).length > 0) return prev;
        const initial: Record<string, boolean> = {};
        mainCats.slice(0, 3).forEach((c) => {
          initial[c.id] = true;
        });
        return initial;
      });
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load categories.');
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, []);

  const refreshLocalTree = (prodOverride?: ProductSummary[]) => {
    const prods = prodOverride ?? allProducts;
    const updated = listMainCategories({ includeInactive: true, products: prods });
    setCategories(updated);
  };

  // Summary metrics
  const metrics = useMemo(() => {
    const totalMain = categories.length;
    const activeMain = categories.filter((c) => c.is_active !== false).length;
    const allSubs = categories.flatMap((c) => c.subcategories || []);
    const totalSubs = allSubs.length;
    const activeSubs = allSubs.filter((s) => s.is_active !== false).length;
    const totalAssignedProducts = categories.reduce((sum, c) => sum + (c.product_count || 0), 0);
    const flaggedProducts = allProducts.filter((p) => p.needs_category_review);
    return {
      totalMain,
      activeMain,
      totalSubs,
      activeSubs,
      totalAssignedProducts,
      flaggedProducts,
    };
  }, [categories, allProducts]);

  // Filtered categories based on search and active/inactive filter
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return categories
      .filter((cat) => {
        if (statusFilter === 'ACTIVE' && cat.is_active === false) return false;
        if (statusFilter === 'INACTIVE' && cat.is_active !== false) return false;
        if (!q) return true;
        const catMatch =
          cat.name.toLowerCase().includes(q) ||
          cat.slug.toLowerCase().includes(q) ||
          (cat.description || '').toLowerCase().includes(q);
        const subMatch = (cat.subcategories || []).some(
          (s) => s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q)
        );
        return catMatch || subMatch;
      })
      .map((cat) => {
        if (!q) return cat;
        const catMatch = cat.name.toLowerCase().includes(q) || cat.slug.toLowerCase().includes(q);
        if (catMatch) return cat;
        return {
          ...cat,
          subcategories: (cat.subcategories || []).filter(
            (s) => s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q)
          ),
        };
      });
  }, [categories, searchQuery, statusFilter]);

  const toggleExpandCategory = (catId: string) => {
    setExpandedCategoryIds((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    categories.forEach((c) => {
      next[c.id] = true;
    });
    setExpandedCategoryIds(next);
  };

  const handleCollapseAll = () => {
    setExpandedCategoryIds({});
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (formMode === 'CREATE_SUBCATEGORY') {
      setSlug(
        val
          .toLowerCase()
          .replace(/&/g, 'and')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      );
    }
  };

  const handleStartCreateSubcategory = (defaultParentId?: string) => {
    const targetParent = defaultParentId || categories[0]?.id || '';
    const parentCat = categories.find((c) => c.id === targetParent);
    const nextOrder = (parentCat?.subcategories?.length || 0) + 1;

    setFormMode('CREATE_SUBCATEGORY');
    setSelectedId(null);
    setName('');
    setSlug('');
    setParentCategoryId(targetParent);
    setDescription('');
    setIcon('');
    setDisplayOrder(String(nextOrder));
    setIsActive(true);

    if (defaultParentId) {
      setExpandedCategoryIds((prev) => ({ ...prev, [defaultParentId]: true }));
    }
  };

  const handleStartEditMainCategory = (cat: Category) => {
    setFormMode('EDIT_MAIN_CATEGORY');
    setSelectedId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setParentCategoryId('');
    setDescription(cat.description || '');
    setIcon(cat.icon || '');
    setDisplayOrder(String(cat.display_order ?? 1));
    setIsActive(cat.is_active !== false);
  };

  const handleStartEditSubcategory = (sub: Subcategory) => {
    setFormMode('EDIT_SUBCATEGORY');
    setSelectedId(sub.id);
    setName(sub.name);
    setSlug(sub.slug);
    setParentCategoryId(sub.parent_category_id || sub.parent_id);
    setDescription(sub.description || '');
    setIcon('');
    setDisplayOrder(String(sub.display_order ?? 1));
    setIsActive(sub.is_active !== false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderNum = Math.max(1, parseInt(displayOrder, 10) || 1);

      if (formMode === 'EDIT_MAIN_CATEGORY' && selectedId) {
        updateMainCategory(selectedId, {
          name: name.trim(),
          description: description.trim(),
          icon: icon.trim() || undefined,
          display_order: orderNum,
          is_active: isActive,
        });
        toast.success(`Main category "${name.trim()}" updated.`);
      } else if (formMode === 'EDIT_SUBCATEGORY' && selectedId) {
        if (!parentCategoryId) {
          toast.error('Please select a parent category.');
          setIsSubmitting(false);
          return;
        }
        updateSubcategory(selectedId, {
          name: name.trim(),
          slug: slug.trim() || undefined,
          parent_category_id: parentCategoryId,
          description: description.trim(),
          display_order: orderNum,
          is_active: isActive,
        });
        setExpandedCategoryIds((prev) => ({ ...prev, [parentCategoryId]: true }));
        toast.success(`Subcategory "${name.trim()}" updated.`);
      } else {
        if (!parentCategoryId) {
          toast.error('Please select a parent main category.');
          setIsSubmitting(false);
          return;
        }
        createSubcategory({
          name: name.trim(),
          slug: slug.trim() || undefined,
          parent_category_id: parentCategoryId,
          description: description.trim(),
          display_order: orderNum,
          is_active: isActive,
        });
        setExpandedCategoryIds((prev) => ({ ...prev, [parentCategoryId]: true }));
        toast.success(`Subcategory "${name.trim()}" created.`);
      }

      refreshLocalTree();
      handleStartCreateSubcategory(parentCategoryId || categories[0]?.id);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save changes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active / Inactive for Main Category
  const handleToggleMainActive = (cat: Category) => {
    try {
      const nextStatus = cat.is_active === false;
      toggleMainCategoryStatus(cat.id, nextStatus);
      refreshLocalTree();
      toast.success(
        `Category "${cat.name}" ${nextStatus ? 'activated (visible on storefront)' : 'deactivated (hidden from new listings)'}.`
      );
    } catch (err: any) {
      toast.error(err?.message || 'Could not update category status.');
    }
  };

  // Toggle Active / Inactive for Subcategory
  const handleToggleSubActive = (sub: Subcategory) => {
    try {
      const nextStatus = sub.is_active === false;
      toggleSubcategoryStatus(sub.id, nextStatus);
      refreshLocalTree();
      toast.success(
        `Subcategory "${sub.name}" ${nextStatus ? 'activated' : 'deactivated'}.`
      );
    } catch (err: any) {
      toast.error(err?.message || 'Could not update subcategory status.');
    }
  };

  // Move Main Category Display Order Up / Down
  const handleMoveMainCategory = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const ids = categories.map((c) => c.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(targetIndex, 0, moved);
    try {
      reorderMainCategories(ids);
      refreshLocalTree();
      toast.success('Main category display order updated.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reorder categories.');
    }
  };

  // Move Subcategory Display Order Up / Down within its Parent Category
  const handleMoveSubcategory = (parentCat: Category, subIndex: number, direction: 'UP' | 'DOWN') => {
    const subs = parentCat.subcategories || [];
    const targetIndex = direction === 'UP' ? subIndex - 1 : subIndex + 1;
    if (targetIndex < 0 || targetIndex >= subs.length) return;
    const subIds = subs.map((s) => s.id);
    const [moved] = subIds.splice(subIndex, 1);
    subIds.splice(targetIndex, 0, moved);
    try {
      reorderSubcategories(parentCat.id, subIds);
      refreshLocalTree();
      toast.success(`Reordered subcategories under ${parentCat.name}.`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reorder subcategories.');
    }
  };

  // Initiate Subcategory Delete (checks product count first)
  const handleInitiateSubcategoryDelete = (sub: Subcategory, parentCat: Category) => {
    if ((sub.product_count ?? 0) > 0) {
      const siblingSubs = (parentCat.subcategories || []).filter((s) => s.id !== sub.id && s.is_active !== false);
      setReassignTargetSubId(siblingSubs[0]?.id || '');
      setSubToDelete({ sub, parentCat });
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to delete subcategory "${sub.name}" from ${parentCat.name}?`);
    if (!confirmed) return;

    try {
      deleteSubcategory(sub.id, { confirmed: true, allProducts });
      refreshLocalTree();
      toast.success(`Subcategory "${sub.name}" deleted.`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete subcategory.');
    }
  };

  const handleConfirmDeleteWithReassignment = () => {
    if (!subToDelete) return;
    setIsDeletingSub(true);
    try {
      deleteSubcategory(subToDelete.sub.id, {
        reassignToSubcategoryId: reassignTargetSubId || undefined,
        confirmed: true,
        allProducts,
      });
      refreshLocalTree();
      toast.success(
        reassignTargetSubId
          ? `Reassigned products and deleted subcategory "${subToDelete.sub.name}".`
          : `Deleted subcategory "${subToDelete.sub.name}" (products preserved under ${subToDelete.parentCat.name}).`
      );
      setSubToDelete(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete subcategory.');
    } finally {
      setIsDeletingSub(false);
    }
  };

  // Assign a flagged product from the review queue
  const handleAssignFlaggedProduct = (product: ProductSummary) => {
    const selection = reviewAssignments[product.id];
    if (!selection?.categoryId) {
      toast.error('Please select a Main Category for this product.');
      return;
    }
    try {
      saveProductCategoryAssignment(product.id, {
        categoryIdOrSlug: selection.categoryId,
        subcategoryIdOrSlug: selection.subcategoryId || null,
      });
      const nextProducts = allProducts.map((p) =>
        p.id === product.id ? { ...p, needs_category_review: false } : p
      );
      setAllProducts(nextProducts);
      refreshLocalTree(nextProducts);
      toast.success(`Assigned "${product.name}" to its updated category.`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to assign category.');
    }
  };

  if (isLoading) {
    return (
      <div style={containerStyles}>
        <h2 style={titleStyles}>Category &amp; Subcategory Management</h2>
        <Skeleton width="100%" height="100px" borderRadius="12px" />
        <Skeleton width="100%" height="420px" borderRadius="12px" />
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      {/* Page Header */}
      <div style={headerRowStyles}>
        <div>
          <h2 style={titleStyles}>Category &amp; Subcategory Management</h2>
          <p style={subtitleStyles}>
            Manage the 12 official DOVI storefront product categories, expand and organize subcategories, control display order, and review product assignments.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleStartCreateSubcategory(categories[0]?.id)}
            style={primaryBtnStyles}
          >
            + New Subcategory
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Restore any missing default subcategories across the 12 main DOVI categories? Custom subcategories and product assignments will be preserved.')) {
                resetCategoriesToDefault12();
                refreshLocalTree();
                toast.success('Default 12 main categories & 74 subcategories verified.');
              }
            }}
            style={secondaryBtnStyles}
          >
            Sync Default Structure
          </button>
        </div>
      </div>

      <ApiErrorMessage error={error} />

      {/* Summary KPI Cards */}
      <div style={metricsGridStyles}>
        <div style={metricCardStyles}>
          <span style={metricLabelStyles}>Main Categories</span>
          <strong style={metricValueStyles}>{metrics.totalMain}</strong>
          <span style={metricSubtextStyles}>{metrics.activeMain} active on storefront</span>
        </div>
        <div style={metricCardStyles}>
          <span style={metricLabelStyles}>Subcategories</span>
          <strong style={metricValueStyles}>{metrics.totalSubs}</strong>
          <span style={metricSubtextStyles}>{metrics.activeSubs} active · {metrics.totalSubs - metrics.activeSubs} inactive</span>
        </div>
        <div style={metricCardStyles}>
          <span style={metricLabelStyles}>Categorized Products</span>
          <strong style={metricValueStyles}>{metrics.totalAssignedProducts}</strong>
          <span style={metricSubtextStyles}>Mapped to the 12 main categories</span>
        </div>
        <div
          style={{
            ...metricCardStyles,
            borderColor: metrics.flaggedProducts.length > 0 ? '#fde68a' : '#e5e7eb',
            backgroundColor: metrics.flaggedProducts.length > 0 ? '#fffbeb' : '#ffffff',
          }}
        >
          <span style={metricLabelStyles}>Needs Admin Review</span>
          <strong
            style={{
              ...metricValueStyles,
              color: metrics.flaggedProducts.length > 0 ? '#d97706' : '#10b981',
            }}
          >
            {metrics.flaggedProducts.length}
          </strong>
          <span style={metricSubtextStyles}>
            {metrics.flaggedProducts.length > 0
              ? 'Unmapped products flagged below'
              : 'All products confidently mapped'}
          </span>
        </div>
      </div>

      {/* Flagged Products Review Queue (if any existing products could not be confidently mapped) */}
      {metrics.flaggedProducts.length > 0 && (
        <div
          style={{
            ...cardStyles,
            borderColor: '#fcd34d',
            backgroundColor: '#fffbeb',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#92400e' }}>
                ⚠️ Products Flagged for Category Review ({metrics.flaggedProducts.length})
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#b45309' }}>
                These existing products could not be automatically mapped to one of the 12 main categories with high confidence. Their records are preserved — assign their Main Category and Subcategory below.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
            {metrics.flaggedProducts.map((prod) => {
              const currentSel = reviewAssignments[prod.id] || { categoryId: '', subcategoryId: '' };
              const subOptions = currentSel.categoryId
                ? getSubcategoriesForCategory(currentSel.categoryId)
                : [];
              return (
                <div
                  key={prod.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    padding: '10px 14px',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #fde68a',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '13.5px', color: '#1f2937' }}>{prod.name}</strong>
                    <div style={{ fontSize: '11.5px', color: '#6b7280' }}>ID: {prod.id}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <select
                      value={currentSel.categoryId}
                      onChange={(e) =>
                        setReviewAssignments((prev) => ({
                          ...prev,
                          [prod.id]: { categoryId: e.target.value, subcategoryId: '' },
                        }))
                      }
                      style={{ ...selectStyles, minWidth: '200px' }}
                    >
                      <option value="">Select Main Category...</option>
                      {categories
                        .filter((c) => c.is_active !== false)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                    <select
                      value={currentSel.subcategoryId}
                      disabled={!currentSel.categoryId}
                      onChange={(e) =>
                        setReviewAssignments((prev) => ({
                          ...prev,
                          [prod.id]: { ...currentSel, subcategoryId: e.target.value },
                        }))
                      }
                      style={{ ...selectStyles, minWidth: '180px' }}
                    >
                      <option value="">Select Subcategory (Optional)...</option>
                      {subOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleAssignFlaggedProduct(prod)}
                      style={primaryBtnStyles}
                    >
                      Save Assignment
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Split Layout: Left = 12 Main Categories & Expandable Subcategories, Right = Create/Edit Form */}
      <div style={splitLayoutStyles}>
        {/* Left Column: Expandable Category & Subcategory Hierarchy */}
        <div style={cardStyles}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #f3f4f6', paddingBottom: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827' }}>
                12 Main Categories &amp; Subcategories
              </h3>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                Click any main category to expand its subcategories, reorder, or manage status.
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="button" onClick={handleExpandAll} style={smallOutlineBtnStyles}>
                Expand All
              </button>
              <button type="button" onClick={handleCollapseAll} style={smallOutlineBtnStyles}>
                Collapse All
              </button>
            </div>
          </div>

          {/* Search & Status Filter Bar */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search main categories or subcategories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ ...inputStyles, flex: 1, minWidth: '220px' }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              style={{ ...selectStyles, width: '160px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          {filteredCategories.length === 0 ? (
            <EmptyState
              icon="📁"
              title="No Matching Categories"
              subtitle="Try clearing your search query or status filter."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredCategories.map((cat, idx) => {
                const isExpanded = Boolean(expandedCategoryIds[cat.id] || searchQuery.trim());
                const subs = cat.subcategories || [];
                const activeSubCount = subs.filter((s) => s.is_active !== false).length;
                const isCatActive = cat.is_active !== false;

                return (
                  <div
                    key={cat.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      backgroundColor: isCatActive ? '#ffffff' : '#f9fafb',
                    }}
                  >
                    {/* Main Category Header Row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        gap: '12px',
                        flexWrap: 'wrap',
                        backgroundColor: isExpanded ? '#f8fafc' : 'transparent',
                        borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none',
                      }}
                    >
                      <div
                        onClick={() => toggleExpandCategory(cat.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1, minWidth: '220px' }}
                      >
                        <span style={{ fontSize: '12px', color: '#6b7280', width: '16px' }}>
                          {isExpanded ? '▼' : '▶'}
                        </span>
                        <span style={{ fontSize: '20px' }}>{cat.icon || '📦'}</span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '14.5px', color: '#111827' }}>
                              {cat.display_order ?? idx + 1}. {cat.name}
                            </strong>
                            <span style={{ fontSize: '11.5px', color: '#9ca3af' }}>({cat.slug})</span>
                            <span style={statusBadgeStyles(isCatActive)}>
                              {isCatActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          {cat.description && (
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                              {cat.description}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Counts & Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={pillCounterStyles}>
                          {activeSubCount}/{subs.length} subcategories
                        </span>
                        <span style={{ ...pillCounterStyles, backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                          {cat.product_count ?? 0} products
                        </span>

                        {/* Reorder Up/Down */}
                        <div style={{ display: 'inline-flex', gap: '4px' }}>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveMainCategory(idx, 'UP')}
                            title="Move category up"
                            style={{ ...iconActionBtnStyles, opacity: idx === 0 ? 0.35 : 1 }}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            disabled={idx === filteredCategories.length - 1}
                            onClick={() => handleMoveMainCategory(idx, 'DOWN')}
                            title="Move category down"
                            style={{ ...iconActionBtnStyles, opacity: idx === filteredCategories.length - 1 ? 0.35 : 1 }}
                          >
                            ↓
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStartCreateSubcategory(cat.id)}
                          style={{ ...smallActionBtnStyles, color: '#059669' }}
                        >
                          + Subcategory
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEditMainCategory(cat)}
                          style={{ ...smallActionBtnStyles, color: '#ff7a00' }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleMainActive(cat)}
                          style={{
                            ...smallActionBtnStyles,
                            color: isCatActive ? '#dc2626' : '#059669',
                          }}
                        >
                          {isCatActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Subcategories Table */}
                    {isExpanded && (
                      <div style={{ padding: '12px 16px', backgroundColor: '#ffffff' }}>
                        {subs.length === 0 ? (
                          <div style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                            No subcategories in {cat.name}.{' '}
                            <button
                              type="button"
                              onClick={() => handleStartCreateSubcategory(cat.id)}
                              style={{ color: '#ff7a00', background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                            >
                              + Create first subcategory
                            </button>
                          </div>
                        ) : (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid #f3f4f6', color: '#6b7280', textAlign: 'left', fontSize: '11.5px', textTransform: 'uppercase' }}>
                                  <th style={{ padding: '8px 10px' }}>Order</th>
                                  <th style={{ padding: '8px 10px' }}>Subcategory Name</th>
                                  <th style={{ padding: '8px 10px' }}>Parent Category</th>
                                  <th style={{ padding: '8px 10px' }}>Products</th>
                                  <th style={{ padding: '8px 10px' }}>Status</th>
                                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {subs.map((sub, sIdx) => {
                                  const isSubActive = sub.is_active !== false;
                                  return (
                                    <tr
                                      key={sub.id}
                                      style={{
                                        borderBottom: '1px solid #f9fafb',
                                        backgroundColor: selectedId === sub.id ? '#fff7ed' : 'transparent',
                                      }}
                                    >
                                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                          <span style={{ color: '#6b7280', fontWeight: 600, minWidth: '20px' }}>
                                            #{sub.display_order ?? sIdx + 1}
                                          </span>
                                          <button
                                            type="button"
                                            disabled={sIdx === 0}
                                            onClick={() => handleMoveSubcategory(cat, sIdx, 'UP')}
                                            style={{ ...iconActionBtnStyles, padding: '1px 5px', opacity: sIdx === 0 ? 0.35 : 1 }}
                                            title="Move up"
                                          >
                                            ↑
                                          </button>
                                          <button
                                            type="button"
                                            disabled={sIdx === subs.length - 1}
                                            onClick={() => handleMoveSubcategory(cat, sIdx, 'DOWN')}
                                            style={{ ...iconActionBtnStyles, padding: '1px 5px', opacity: sIdx === subs.length - 1 ? 0.35 : 1 }}
                                            title="Move down"
                                          >
                                            ↓
                                          </button>
                                        </div>
                                      </td>
                                      <td style={{ padding: '8px 10px' }}>
                                        <strong style={{ color: '#1f2937' }}>{sub.name}</strong>
                                        <span style={{ color: '#9ca3af', fontSize: '11px', marginLeft: '6px' }}>
                                          ({sub.slug})
                                        </span>
                                      </td>
                                      <td style={{ padding: '8px 10px', color: '#4b5563', fontSize: '12px' }}>
                                        {cat.name}
                                      </td>
                                      <td style={{ padding: '8px 10px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: (sub.product_count ?? 0) > 0 ? '#1d4ed8' : '#6b7280' }}>
                                          {sub.product_count ?? 0} products
                                        </span>
                                      </td>
                                      <td style={{ padding: '8px 10px' }}>
                                        <span style={statusBadgeStyles(isSubActive)}>
                                          {isSubActive ? 'Active' : 'Inactive'}
                                        </span>
                                      </td>
                                      <td style={{ padding: '8px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                                          <button
                                            type="button"
                                            onClick={() => handleStartEditSubcategory(sub)}
                                            style={{ ...smallActionBtnStyles, color: '#ff7a00' }}
                                          >
                                            Edit / Move
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleToggleSubActive(sub)}
                                            style={{
                                              ...smallActionBtnStyles,
                                              color: isSubActive ? '#d97706' : '#059669',
                                            }}
                                          >
                                            {isSubActive ? 'Deactivate' : 'Activate'}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleInitiateSubcategoryDelete(sub, cat)}
                                            style={{ ...smallActionBtnStyles, color: '#ef4444' }}
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Sticky Subcategory / Category Configuration Form */}
        <div style={{ ...cardStyles, position: 'sticky', top: '24px' }}>
          <h3 style={cardTitleStyles}>
            {formMode === 'EDIT_MAIN_CATEGORY'
              ? `Edit Main Category: ${name}`
              : formMode === 'EDIT_SUBCATEGORY'
              ? `Edit Subcategory: ${name}`
              : 'Create New Subcategory'}
          </h3>

          <form onSubmit={handleFormSubmit} style={formStyles}>
            {formMode !== 'EDIT_MAIN_CATEGORY' && (
              <div style={inputGroupStyles}>
                <label style={labelStyles}>Parent Main Category *</label>
                <select
                  value={parentCategoryId}
                  onChange={(e) => setParentCategoryId(e.target.value)}
                  required
                  style={selectStyles}
                >
                  <option value="" disabled>
                    Select one of the 12 main categories...
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon ? `${c.icon} ` : ''}{c.name} {c.is_active === false ? '(Inactive)' : ''}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '11px', color: '#6b7280' }}>
                  {formMode === 'EDIT_SUBCATEGORY'
                    ? 'Changing the parent category moves this subcategory under the selected main category.'
                    : 'Every subcategory must belong to one of the 12 official main categories.'}
                </span>
              </div>
            )}

            <div style={inputGroupStyles}>
              <label style={labelStyles}>
                {formMode === 'EDIT_MAIN_CATEGORY' ? 'Main Category Name *' : 'Subcategory Name *'}
              </label>
              <input
                type="text"
                required
                placeholder={formMode === 'EDIT_MAIN_CATEGORY' ? 'e.g. Fashion & Clothing' : 'e.g. Men\'s Clothing'}
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                style={inputStyles}
              />
            </div>

            <div style={inputGroupStyles}>
              <label style={labelStyles}>URL Slug *</label>
              <input
                type="text"
                required
                disabled={formMode === 'EDIT_MAIN_CATEGORY'}
                placeholder="e.g. mens-clothing"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                style={{
                  ...inputStyles,
                  backgroundColor: formMode === 'EDIT_MAIN_CATEGORY' ? '#f3f4f6' : '#ffffff',
                }}
              />
            </div>

            {formMode === 'EDIT_MAIN_CATEGORY' && (
              <div style={inputGroupStyles}>
                <label style={labelStyles}>Category Icon (Emoji)</label>
                <input
                  type="text"
                  placeholder="e.g. 👗"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  style={inputStyles}
                />
              </div>
            )}

            <div style={inputGroupStyles}>
              <label style={labelStyles}>Description (Optional)</label>
              <textarea
                rows={3}
                placeholder="Describe the products included in this category..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ ...inputStyles, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={inputGroupStyles}>
                <label style={labelStyles}>Display Order</label>
                <input
                  type="number"
                  min="1"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  style={inputStyles}
                />
              </div>

              <div style={inputGroupStyles}>
                <label style={labelStyles}>Status</label>
                <select
                  value={isActive ? 'ACTIVE' : 'INACTIVE'}
                  onChange={(e) => setIsActive(e.target.value === 'ACTIVE')}
                  style={selectStyles}
                >
                  <option value="ACTIVE">Active (Visible)</option>
                  <option value="INACTIVE">Inactive (Hidden)</option>
                </select>
              </div>
            </div>

            <div style={formActionsStyles}>
              {formMode !== 'CREATE_SUBCATEGORY' && (
                <button
                  type="button"
                  onClick={() => handleStartCreateSubcategory(parentCategoryId || categories[0]?.id)}
                  style={cancelFormBtnStyles}
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  ...submitBtnStyles,
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting
                  ? 'Saving...'
                  : formMode === 'EDIT_MAIN_CATEGORY'
                  ? 'Save Main Category'
                  : formMode === 'EDIT_SUBCATEGORY'
                  ? 'Save Subcategory'
                  : 'Create Subcategory'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Subcategory Deletion & Product Reassignment Confirmation Modal */}
      {subToDelete && (
        <div style={modalOverlayStyles}>
          <div style={modalCardStyles}>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#111827' }}>
              Reassign Products Before Deleting &ldquo;{subToDelete.sub.name}&rdquo;
            </h3>
            <p style={{ margin: '8px 0 0', fontSize: '13.5px', color: '#4b5563', lineHeight: 1.5 }}>
              Subcategory <strong>{subToDelete.sub.name}</strong> currently has{' '}
              <strong>{subToDelete.sub.product_count} associated product(s)</strong>. Deleting a subcategory will never delete any products, but you can reassign those products to another subcategory under{' '}
              <strong>{subToDelete.parentCat.name}</strong> first.
            </p>

            <div style={{ ...inputGroupStyles, marginTop: '14px' }}>
              <label style={labelStyles}>Reassign Associated Products To:</label>
              <select
                value={reassignTargetSubId}
                onChange={(e) => setReassignTargetSubId(e.target.value)}
                style={selectStyles}
              >
                <option value="">
                  Keep in &ldquo;{subToDelete.parentCat.name}&rdquo; without a subcategory
                </option>
                {(subToDelete.parentCat.subcategories || [])
                  .filter((s) => s.id !== subToDelete.sub.id)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setSubToDelete(null)}
                disabled={isDeletingSub}
                style={cancelFormBtnStyles}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteWithReassignment}
                disabled={isDeletingSub}
                style={{
                  ...submitBtnStyles,
                  backgroundColor: '#dc2626',
                }}
              >
                {isDeletingSub ? 'Deleting...' : 'Confirm & Delete Subcategory'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const headerRowStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '16px',
  flexWrap: 'wrap',
};

const titleStyles: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 800,
  color: '#1f2937',
  margin: 0,
};

const subtitleStyles: React.CSSProperties = {
  fontSize: '13px',
  color: '#6b7280',
  margin: '4px 0 0 0',
};

const metricsGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
  gap: '16px',
};

const metricCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  padding: '16px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
};

const metricLabelStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const metricValueStyles: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 800,
  color: '#111827',
};

const metricSubtextStyles: React.CSSProperties = {
  fontSize: '12px',
  color: '#6b7280',
};

const splitLayoutStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.45fr 0.85fr',
  gap: '24px',
  alignItems: 'start',
};

const cardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  padding: '22px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const cardTitleStyles: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 700,
  color: '#374151',
  margin: 0,
  borderBottom: '1px solid #f3f4f6',
  paddingBottom: '10px',
};

const statusBadgeStyles = (active: boolean): React.CSSProperties => ({
  display: 'inline-block',
  fontSize: '10.5px',
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: '9999px',
  backgroundColor: active ? '#dcfce7' : '#f3f4f6',
  color: active ? '#15803d' : '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
});

const pillCounterStyles: React.CSSProperties = {
  fontSize: '11.5px',
  fontWeight: 600,
  backgroundColor: '#f3f4f6',
  color: '#374151',
  padding: '3px 9px',
  borderRadius: '9999px',
  whiteSpace: 'nowrap',
};

const iconActionBtnStyles: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
  borderRadius: '6px',
  padding: '2px 7px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
  color: '#374151',
};

const smallActionBtnStyles: React.CSSProperties = {
  fontSize: '11.5px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontWeight: 700,
  padding: '2px 4px',
};

const smallOutlineBtnStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  padding: '5px 10px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  color: '#374151',
  cursor: 'pointer',
};

const primaryBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '8px',
  backgroundColor: '#ff7a00',
  color: '#ffffff',
  border: 'none',
  fontSize: '12.5px',
  fontWeight: 700,
  cursor: 'pointer',
};

const secondaryBtnStyles: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: '8px',
  backgroundColor: '#ffffff',
  color: '#374151',
  border: '1px solid #d1d5db',
  fontSize: '12.5px',
  fontWeight: 600,
  cursor: 'pointer',
};

const formStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
};

const inputGroupStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const labelStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#4b5563',
};

const inputStyles: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  outline: 'none',
  backgroundColor: '#ffffff',
};

const selectStyles: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  outline: 'none',
  backgroundColor: '#ffffff',
};

const formActionsStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '8px',
};

const cancelFormBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '9999px',
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  fontSize: '12px',
  fontWeight: 700,
  color: '#4b5563',
  cursor: 'pointer',
};

const submitBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '9999px',
  backgroundColor: '#ff7a00',
  fontSize: '12px',
  fontWeight: 700,
  color: '#ffffff',
  cursor: 'pointer',
  border: 'none',
};

const modalOverlayStyles: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(17, 24, 39, 0.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: '16px',
};

const modalCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '24px',
  maxWidth: '520px',
  width: '100%',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
};
