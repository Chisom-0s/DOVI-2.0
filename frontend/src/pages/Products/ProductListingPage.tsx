import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '@/api/client';
import { productsApi } from '@/api/products';
import type { APIError, ProductSummary } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import { SkeletonCard } from '@/components/common/Skeleton';
import { NoInternetBanner } from '@/components/common/NoInternetBanner';

const DEFAULT_LISTING_CATEGORIES = [
  { name: 'Phones & Tablets', slug: 'phones-tablets' },
  { name: 'Computers', slug: 'computers' },
  { name: 'Audio & Music', slug: 'audio-video' },
  { name: 'Gaming', slug: 'gaming' },
  { name: 'Smart Home', slug: 'smart-home' },
  { name: 'Fashion & Apparel', slug: 'fashion' },
  { name: 'Shoes', slug: 'shoes' },
  { name: 'Books & Media', slug: 'books' },
  { name: 'Dovi Auto (Cars)', slug: 'auto-cars' },
];

const PRICE_PRESETS = [
  { label: 'Under ₦10k', min: '', max: '10000' },
  { label: '₦10k – ₦50k', min: '10000', max: '50000' },
  { label: '₦50k – ₦200k', min: '50000', max: '200000' },
  { label: 'Above ₦200k', min: '200000', max: '' },
];

export default function ProductListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract query filters from URL search params
  const categoryParam = searchParams.get('category') ?? '';
  const sortParam = searchParams.get('sort') ?? 'newest';
  const minPriceParam = searchParams.get('min_price') ?? '';
  const maxPriceParam = searchParams.get('max_price') ?? '';
  const minRatingParam = searchParams.get('min_rating') ?? '';
  const inStockParam = searchParams.get('in_stock') === 'true';
  const searchParam = searchParams.get('q') || searchParams.get('search') || '';

  // Synchronous cache seed for instant 0ms mount
  const [products, setProducts] = useState<ProductSummary[]>(() => {
    if (!categoryParam && !minPriceParam && !maxPriceParam && !inStockParam && !minRatingParam && !searchParam) {
      try {
        const cached = sessionStorage.getItem('dovi_real_products_cache');
        if (cached) {
          const list = JSON.parse(cached);
          if (Array.isArray(list) && list.length > 0) {
            let deletedIds: string[] = [];
            try {
              deletedIds = JSON.parse(localStorage.getItem('dovi_deleted_product_ids') || '[]');
            } catch {}
            return list.filter((p: any) => !deletedIds.includes(p.id) && p.status !== 'ARCHIVED' && p.status !== 'DELETED');
          }
        }
      } catch {}
    }
    return [];
  });

  const [totalCount, setTotalCount] = useState<number>(() => products.length);
  const [isLoading, setIsLoading] = useState<boolean>(() => products.length === 0);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [categories, setCategories] = useState<Array<{ name: string; slug: string }>>(DEFAULT_LISTING_CATEGORIES);
  const [fetchError, setFetchError] = useState<APIError | null>(null);

  // Filter Drawer & Sort Drawer States
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [showMobileSort, setShowMobileSort] = useState(false);

  // Draft Filter States inside Drawer
  const [draftCategory, setDraftCategory] = useState(categoryParam);
  const [draftMinPrice, setDraftMinPrice] = useState(minPriceParam);
  const [draftMaxPrice, setDraftMaxPrice] = useState(maxPriceParam);
  const [draftMinRating, setDraftMinRating] = useState(minRatingParam);
  const [draftInStock, setDraftInStock] = useState(inStockParam);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Sync draft states whenever drawer opens
  const openFilterDrawer = () => {
    setDraftCategory(categoryParam);
    setDraftMinPrice(minPriceParam);
    setDraftMaxPrice(maxPriceParam);
    setDraftMinRating(minRatingParam);
    setDraftInStock(inStockParam);
    setIsFilterDrawerOpen(true);
  };

  const closeFilterDrawer = () => {
    setIsFilterDrawerOpen(false);
  };

  // Fetch categories list for filters
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await apiClient.get('/api/v1/categories/');
        const list = Array.isArray(data) ? data : (data?.results ?? []);
        if (list.length > 0) {
          setCategories(list);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Update URL search parameters
  const updateFilters = (newParams: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === '') {
        nextParams.delete(key);
      } else {
        nextParams.set(key, val);
      }
    });
    // Remove numbered page param if present (continuous scrolling now used)
    nextParams.delete('page');
    setSearchParams(nextParams);
  };

  // Fetch initial batch of products on filter change
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await productsApi.list({
        page: 1,
        page_size: 24,
        category: categoryParam || undefined,
        sort: sortParam as 'price_asc' | 'price_desc' | 'newest' | 'rating',
        min_price: minPriceParam ? parseFloat(minPriceParam) : undefined,
        max_price: maxPriceParam ? parseFloat(maxPriceParam) : undefined,
        min_rating: minRatingParam ? parseFloat(minRatingParam) : undefined,
        in_stock: inStockParam ? true : undefined,
        q: searchParam.trim() || undefined,
      });

      setProducts(response.results);
      setTotalCount(response.count);
      setPage(1);
      setHasMore(response.results.length < response.count && Boolean(response.next));

      if (!categoryParam && !minPriceParam && !maxPriceParam && !inStockParam && !minRatingParam && !searchParam && response.results.length > 0) {
        try {
          sessionStorage.setItem('dovi_real_products_cache', JSON.stringify(response.results));
        } catch {}
      }
    } catch (err: any) {
      console.error('Failed to load products list:', err);
      setProducts([]);
      setTotalCount(0);
      setHasMore(false);
      const isNetwork = !navigator.onLine || err?.code === 'NETWORK_ERROR' || err?.message?.toLowerCase().includes('internet signal');
      setFetchError(
        isNetwork
          ? { error: true, message: 'No internet signal', code: 'NETWORK_ERROR' }
          : { error: true, message: "Couldn't fetch item", code: 'FETCH_ERROR' }
      );
    } finally {
      setIsLoading(false);
    }
  }, [categoryParam, sortParam, minPriceParam, maxPriceParam, minRatingParam, inStockParam, searchParam]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Load next batch of products on scroll (Continuous listing)
  const loadMoreProducts = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await productsApi.list({
        page: nextPage,
        page_size: 24,
        category: categoryParam || undefined,
        sort: sortParam as 'price_asc' | 'price_desc' | 'newest' | 'rating',
        min_price: minPriceParam ? parseFloat(minPriceParam) : undefined,
        max_price: maxPriceParam ? parseFloat(maxPriceParam) : undefined,
        min_rating: minRatingParam ? parseFloat(minRatingParam) : undefined,
        in_stock: inStockParam ? true : undefined,
        q: searchParam.trim() || undefined,
      });

      setProducts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newProducts = response.results.filter(p => !existingIds.has(p.id));
        return [...prev, ...newProducts];
      });

      setPage(nextPage);
      setHasMore(response.results.length > 0 && Boolean(response.next));
    } catch (err) {
      console.error('Failed to load more products:', err);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoading, isLoadingMore, hasMore, page, categoryParam, sortParam, minPriceParam, maxPriceParam, minRatingParam, inStockParam, searchParam]);

  // IntersectionObserver to auto-load next batch when sentinel enters viewport
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || isLoading || isLoadingMore) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          loadMoreProducts();
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMoreProducts, hasMore, isLoading, isLoadingMore]);

  // Apply draft filters from drawer
  const handleApplyDraftFilters = () => {
    updateFilters({
      category: draftCategory || null,
      min_price: draftMinPrice || null,
      max_price: draftMaxPrice || null,
      min_rating: draftMinRating || null,
      in_stock: draftInStock ? 'true' : null,
    });
    setIsFilterDrawerOpen(false);
  };

  // Clear all filters completely
  const handleClearAllFilters = () => {
    setDraftCategory('');
    setDraftMinPrice('');
    setDraftMaxPrice('');
    setDraftMinRating('');
    setDraftInStock(false);
    updateFilters({
      category: null,
      min_price: null,
      max_price: null,
      min_rating: null,
      in_stock: null,
      q: null,
    });
    setIsFilterDrawerOpen(false);
  };

  const handleClearSearch = () => {
    updateFilters({ q: null });
  };

  const activeFilterCount = [
    Boolean(categoryParam),
    Boolean(minPriceParam || maxPriceParam),
    Boolean(minRatingParam),
    Boolean(inStockParam),
  ].filter(Boolean).length;

  const hasActiveFilters = Boolean(searchParam || categoryParam || minPriceParam || maxPriceParam || minRatingParam || inStockParam);
  const activeCategoryObj = categories.find(c => c.slug === categoryParam);

  return (
    <div className="container product-listing-layout">
      {/* Floating Mobile Action Bar (Fixed on phones & tablets) */}
      <div className="mobile-floating-bar hide-desktop">
        <button
          onClick={() => setShowMobileSort(true)}
          className="floating-action-btn"
          aria-label="Sort products"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <polyline points="19 12 12 19 5 12"></polyline>
          </svg>
          <span>Sort</span>
        </button>
        <div className="floating-divider"></div>
        <button
          onClick={openFilterDrawer}
          className="floating-action-btn"
          aria-label="Filter products"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          <span>Filters</span>
          {activeFilterCount > 0 && <span className="floating-badge-count">{activeFilterCount}</span>}
        </button>
      </div>

      {/* Desktop Filters Sidebar (Always present on large screens >= 1024px) */}
      <aside className="product-listing__sidebar hide-mobile">
        <div style={sidebarHeaderStyles}>
          <h3 style={sidebarTitleStyles}>Filters</h3>
          {hasActiveFilters && (
            <button onClick={handleClearAllFilters} style={sidebarResetBtnStyles}>
              Reset all
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div style={filterGroupStyles}>
          <h4 style={filterTitleStyles}>Categories</h4>
          <div style={filterListStyles}>
            <button
              onClick={() => updateFilters({ category: null })}
              style={{
                ...filterBtnStyles,
                fontWeight: !categoryParam ? 'var(--font-bold)' : 'var(--font-normal)',
                color: !categoryParam ? 'var(--color-primary)' : 'var(--color-text)',
              }}
            >
              All Categories
            </button>
            {categories.map(cat => (
              <button
                key={cat.slug}
                onClick={() => updateFilters({ category: cat.slug })}
                style={{
                  ...filterBtnStyles,
                  fontWeight: categoryParam === cat.slug ? 'var(--font-bold)' : 'var(--font-normal)',
                  color: categoryParam === cat.slug ? 'var(--color-primary)' : 'var(--color-text)',
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range Filters */}
        <div style={filterGroupStyles}>
          <h4 style={filterTitleStyles}>Price Range (₦)</h4>
          <div style={priceInputsStyles}>
            <input
              type="number"
              placeholder="Min"
              value={minPriceParam}
              onChange={e => updateFilters({ min_price: e.target.value || null })}
              style={priceInputStyles}
            />
            <span style={{ color: 'var(--color-text-muted)' }}>-</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPriceParam}
              onChange={e => updateFilters({ max_price: e.target.value || null })}
              style={priceInputStyles}
            />
          </div>
          {/* Quick presets */}
          <div style={presetChipsStyles}>
            {PRICE_PRESETS.map((p, idx) => {
              const isSelected = minPriceParam === p.min && maxPriceParam === p.max;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => updateFilters({ min_price: p.min || null, max_price: p.max || null })}
                  style={{
                    ...presetChipStyles,
                    backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
                    color: isSelected ? '#ffffff' : 'var(--color-text)',
                    borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Customer Rating Filter */}
        <div style={filterGroupStyles}>
          <h4 style={filterTitleStyles}>Rating</h4>
          <div style={filterListStyles}>
            {[
              { label: 'All Ratings', val: '' },
              { label: '★ 4.0 & above', val: '4' },
              { label: '★ 3.0 & above', val: '3' },
            ].map(r => (
              <button
                key={r.val}
                type="button"
                onClick={() => updateFilters({ min_rating: r.val || null })}
                style={{
                  ...filterBtnStyles,
                  fontWeight: minRatingParam === r.val ? 'var(--font-bold)' : 'var(--font-normal)',
                  color: minRatingParam === r.val ? 'var(--color-primary)' : 'var(--color-text)',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stock Status */}
        <div style={filterGroupStyles}>
          <label style={checkboxLabelStyles}>
            <input
              type="checkbox"
              checked={inStockParam}
              onChange={e => updateFilters({ in_stock: e.target.checked ? 'true' : null })}
              style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }}
            />
            <span>In Stock Only</span>
          </label>
        </div>
      </aside>

      {/* Main Listing Content */}
      <div style={mainContentStyles}>
        {/* Results Header Info & Active Filters Bar */}
        <div style={resultsHeaderStyles}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <span style={resultsCountStyles}>
                <strong>{totalCount}</strong> {totalCount === 1 ? 'product' : 'products'} found
                {searchParam ? (
                  <>
                    {' '}for &ldquo;<strong>{searchParam}</strong>&rdquo;
                  </>
                ) : null}
              </span>

              {/* Desktop Filters Trigger Button */}
              <button
                type="button"
                onClick={openFilterDrawer}
                className="desktop-filter-modal-trigger"
                title="Open Filters Drawer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                <span>Filter Options</span>
                {activeFilterCount > 0 && <span className="desktop-filter-badge">{activeFilterCount}</span>}
              </button>
            </div>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <div style={activeChipsContainerStyles}>
                {activeCategoryObj && (
                  <span style={chipStyles}>
                    Category: {activeCategoryObj.name}
                    <button type="button" onClick={() => updateFilters({ category: null })} style={chipRemoveBtnStyles}>&times;</button>
                  </span>
                )}
                {(minPriceParam || maxPriceParam) && (
                  <span style={chipStyles}>
                    ₦{minPriceParam || '0'} – ₦{maxPriceParam || 'Max'}
                    <button type="button" onClick={() => updateFilters({ min_price: null, max_price: null })} style={chipRemoveBtnStyles}>&times;</button>
                  </span>
                )}
                {minRatingParam && (
                  <span style={chipStyles}>
                    ★ {minRatingParam}+ rating
                    <button type="button" onClick={() => updateFilters({ min_rating: null })} style={chipRemoveBtnStyles}>&times;</button>
                  </span>
                )}
                {inStockParam && (
                  <span style={chipStyles}>
                    In Stock Only
                    <button type="button" onClick={() => updateFilters({ in_stock: null })} style={chipRemoveBtnStyles}>&times;</button>
                  </span>
                )}
                {searchParam && (
                  <span style={chipStyles}>
                    &ldquo;{searchParam}&rdquo;
                    <button type="button" onClick={handleClearSearch} style={chipRemoveBtnStyles}>&times;</button>
                  </span>
                )}
                <button type="button" onClick={handleClearAllFilters} style={chipClearAllStyles}>
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div style={sortWrapperStyles} className="hide-mobile">
            <label htmlFor="sort-dropdown" style={sortLabelStyles}>Sort by:</label>
            <select
              id="sort-dropdown"
              value={sortParam}
              onChange={e => updateFilters({ sort: e.target.value })}
              style={selectStyles}
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {isLoading && products.length === 0 ? (
          /* Initial load: skeleton placeholders */
          <div className="marketplace-product-grid">
            {Array.from({ length: 8 }).map((_, idx) => (
              <SkeletonCard key={idx} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="marketplace-product-grid">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Continuous Loading Sentinel & Spinner */}
            <div ref={sentinelRef} style={{ width: '100%', height: '24px', margin: '24px 0 12px 0' }}>
              {isLoadingMore && (
                <div className="continuous-loading-indicator">
                  <div className="continuous-spinner" />
                  <span>Loading more items...</span>
                </div>
              )}
            </div>
          </>
        ) : fetchError?.code === 'NETWORK_ERROR' || (!navigator.onLine && products.length === 0) ? (
          <NoInternetBanner onRetry={fetchProducts} />
        ) : fetchError ? (
          <div style={emptyStyles}>
            <h3>Couldn&apos;t fetch item</h3>
            <p>We couldn&apos;t retrieve products from the database right now.</p>
            <button onClick={fetchProducts} style={actionButtonStyles}>🔄 Retry</button>
          </div>
        ) : (
          <div style={emptyStyles}>
            <h3>No results found{searchParam ? ` for "${searchParam}"` : ''}</h3>
            <p>Try resetting filters, adjusting price ranges, or searching for other items.</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                style={{ ...actionButtonStyles, marginTop: 'var(--space-4)', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none' }}
              >
                Reset All Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter Drawer Panel (Responsive Modal / Bottom Sheet) */}
      {isFilterDrawerOpen && (
        <div className="dovi-filter-overlay" onClick={closeFilterDrawer}>
          <div className="dovi-filter-drawer" onClick={e => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="dovi-filter-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 700 }}>Filter Products</h3>
                {activeFilterCount > 0 && <span className="filter-drawer-badge">{activeFilterCount} active</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setDraftCategory('');
                    setDraftMinPrice('');
                    setDraftMaxPrice('');
                    setDraftMinRating('');
                    setDraftInStock(false);
                  }}
                  style={drawerResetBtnStyles}
                >
                  Reset
                </button>
                <button type="button" onClick={closeFilterDrawer} className="dovi-filter-drawer-close" aria-label="Close filters">
                  &times;
                </button>
              </div>
            </div>

            {/* Drawer Content Body */}
            <div className="dovi-filter-drawer-body">
              {/* Categories Section */}
              <div style={filterGroupStyles}>
                <h4 style={filterTitleStyles}>Category</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setDraftCategory('')}
                    style={{
                      ...filterPillStyles,
                      backgroundColor: !draftCategory ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
                      color: !draftCategory ? '#ffffff' : 'var(--color-text)',
                      borderColor: !draftCategory ? 'var(--color-primary)' : 'var(--color-border)',
                      fontWeight: !draftCategory ? 700 : 500,
                    }}
                  >
                    All Categories
                  </button>
                  {categories.map(cat => {
                    const isSelected = draftCategory === cat.slug;
                    return (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => setDraftCategory(isSelected ? '' : cat.slug)}
                        style={{
                          ...filterPillStyles,
                          backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
                          color: isSelected ? '#ffffff' : 'var(--color-text)',
                          borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                          fontWeight: isSelected ? 700 : 500,
                        }}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range Section */}
              <div style={filterGroupStyles}>
                <h4 style={filterTitleStyles}>Price Range (₦)</h4>
                <div style={priceInputsStyles}>
                  <input
                    type="number"
                    placeholder="Min ₦"
                    value={draftMinPrice}
                    onChange={e => setDraftMinPrice(e.target.value)}
                    style={priceInputStyles}
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="Max ₦"
                    value={draftMaxPrice}
                    onChange={e => setDraftMaxPrice(e.target.value)}
                    style={priceInputStyles}
                  />
                </div>
                {/* Presets */}
                <div style={presetChipsStyles}>
                  {PRICE_PRESETS.map((p, idx) => {
                    const isSelected = draftMinPrice === p.min && draftMaxPrice === p.max;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setDraftMinPrice('');
                            setDraftMaxPrice('');
                          } else {
                            setDraftMinPrice(p.min);
                            setDraftMaxPrice(p.max);
                          }
                        }}
                        style={{
                          ...presetChipStyles,
                          backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
                          color: isSelected ? '#ffffff' : 'var(--color-text)',
                          borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customer Rating Section */}
              <div style={filterGroupStyles}>
                <h4 style={filterTitleStyles}>Customer Rating</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'All Ratings', val: '' },
                    { label: '★ 4.0 & up', val: '4' },
                    { label: '★ 3.0 & up', val: '3' },
                  ].map(r => {
                    const isSelected = draftMinRating === r.val;
                    return (
                      <button
                        key={r.val}
                        type="button"
                        onClick={() => setDraftMinRating(r.val)}
                        style={{
                          ...presetChipStyles,
                          backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
                          color: isSelected ? '#ffffff' : 'var(--color-text)',
                          borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                        }}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* In Stock Only */}
              <div style={filterGroupStyles}>
                <label style={checkboxLabelStyles}>
                  <input
                    type="checkbox"
                    checked={draftInStock}
                    onChange={e => setDraftInStock(e.target.checked)}
                    style={{ accentColor: 'var(--color-primary)', width: '18px', height: '18px' }}
                  />
                  <span style={{ fontWeight: 600 }}>In Stock Only</span>
                </label>
              </div>
            </div>

            {/* Drawer Sticky Footer Actions */}
            <div className="dovi-filter-drawer-footer">
              <button
                type="button"
                onClick={closeFilterDrawer}
                style={drawerCancelBtnStyles}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyDraftFilters}
                style={drawerApplyBtnStyles}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sort Drawer Overlay */}
      {showMobileSort && (
        <div className="mobile-sort-overlay hide-desktop" onClick={() => setShowMobileSort(false)}>
          <div className="mobile-sort-drawer" onClick={e => e.stopPropagation()}>
            <div className="mobile-sort-header">
              <h3>Sort By</h3>
              <button onClick={() => setShowMobileSort(false)} aria-label="Close sort menu">&times;</button>
            </div>
            <div className="mobile-sort-options">
              {[
                { value: 'newest', label: 'Newest Arrivals' },
                { value: 'price_asc', label: 'Price: Low to High' },
                { value: 'price_desc', label: 'Price: High to Low' },
                { value: 'rating', label: 'Top Rated' },
              ].map(opt => (
                <button
                  key={opt.value}
                  className={`mobile-sort-opt ${sortParam === opt.value ? 'active' : ''}`}
                  onClick={() => {
                    updateFilters({ sort: opt.value });
                    setShowMobileSort(false);
                  }}
                >
                  {opt.label}
                  {sortParam === opt.value && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Inline Styles & Responsive Overrides */}
      <style>{`
        /* Mobile Floating Filter/Sort Bar */
        .mobile-floating-bar {
          position: fixed;
          bottom: var(--bottom-nav-total);
          left: 0;
          right: 0;
          height: 52px;
          background-color: #ffffff;
          box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
          display: flex;
          align-items: center;
          z-index: 190;
          border-top: 1px solid var(--color-border);
        }

        @media (min-width: 768px) {
          .mobile-floating-bar {
            bottom: 0;
            height: calc(52px + var(--safe-bottom));
            padding-bottom: var(--safe-bottom);
          }
        }
        
        .floating-action-btn {
          flex: 1;
          height: 100%;
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: none;
          border: none;
          color: var(--color-text);
          font-weight: 600;
          font-size: var(--text-sm);
          cursor: pointer;
          position: relative;
        }

        .floating-action-btn:active {
          background-color: var(--color-bg-subtle);
        }

        .floating-divider {
          width: 1px;
          height: 30px;
          background-color: var(--color-border);
        }

        .floating-badge-count {
          background-color: var(--color-primary);
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 9999px;
          min-width: 18px;
          text-align: center;
        }

        /* Desktop Filter Button in Results Header */
        .desktop-filter-modal-trigger {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-full);
          background-color: #ffffff;
          color: var(--color-text);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 180ms ease;
        }

        .desktop-filter-modal-trigger:hover {
          border-color: var(--color-primary);
          color: var(--color-primary);
          background-color: rgba(255, 122, 0, 0.04);
        }

        .desktop-filter-badge {
          background-color: var(--color-primary);
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
          border-radius: 9999px;
          padding: 1px 6px;
        }

        /* Universal Filter Drawer Overlay (Mobile bottom-sheet & Desktop panel) */
        .dovi-filter-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(3px);
          z-index: 1000;
          display: flex;
          align-items: flex-end;
          animation: doviFadeIn 0.22s ease-out;
        }

        @media (min-width: 768px) {
          .dovi-filter-overlay {
            justify-content: flex-end;
            align-items: stretch;
          }
        }

        .dovi-filter-drawer {
          background-color: #ffffff;
          width: 100%;
          border-top-left-radius: 20px;
          border-top-right-radius: 20px;
          display: flex;
          flex-direction: column;
          max-height: 88vh;
          overflow: hidden;
          animation: doviSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.15);
        }

        @media (min-width: 768px) {
          .dovi-filter-drawer {
            width: 440px;
            max-width: 100%;
            max-height: 100vh;
            border-radius: 0;
            border-left: 1px solid var(--color-border);
            animation: doviSlideLeft 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          }
        }

        .dovi-filter-drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          border-bottom: 1px solid var(--color-border);
          background-color: #ffffff;
        }

        .filter-drawer-badge {
          background-color: rgba(255, 122, 0, 0.12);
          color: var(--color-primary);
          font-size: 12px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 9999px;
        }

        .dovi-filter-drawer-close {
          background: none;
          border: none;
          font-size: 26px;
          line-height: 1;
          color: var(--color-text-muted);
          cursor: pointer;
          padding: 0 4px;
        }

        .dovi-filter-drawer-close:hover {
          color: var(--color-text);
        }

        .dovi-filter-drawer-body {
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 22px;
          flex: 1;
        }

        .dovi-filter-drawer-footer {
          display: flex;
          gap: 12px;
          padding: 16px 20px calc(16px + var(--safe-bottom)) 20px;
          border-top: 1px solid var(--color-border);
          background-color: #ffffff;
        }

        /* Mobile Sort Drawer */
        .mobile-sort-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0,0,0,0.55);
          backdrop-filter: blur(3px);
          z-index: 1000;
          display: flex;
          align-items: flex-end;
          animation: doviFadeIn 0.2s ease;
        }

        .mobile-sort-drawer {
          background-color: #ffffff;
          width: 100%;
          border-top-left-radius: 20px;
          border-top-right-radius: 20px;
          padding: 20px 20px calc(20px + var(--safe-bottom)) 20px;
          max-height: 85vh;
          overflow-y: auto;
          animation: doviSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .mobile-sort-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .mobile-sort-header h3 {
          margin: 0;
          font-size: var(--text-lg);
          font-weight: 700;
        }

        .mobile-sort-header button {
          background: none;
          border: none;
          font-size: 26px;
          line-height: 1;
          color: var(--color-text-muted);
          cursor: pointer;
        }

        .mobile-sort-options {
          display: flex;
          flex-direction: column;
        }

        .mobile-sort-opt {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 0;
          min-height: var(--tap-min);
          background: none;
          border: none;
          border-bottom: 1px solid var(--color-border);
          font-size: var(--text-base);
          color: var(--color-text);
          cursor: pointer;
        }

        .mobile-sort-opt:last-child {
          border-bottom: none;
        }

        .mobile-sort-opt.active {
          color: var(--color-primary);
          font-weight: 700;
        }

        /* Continuous Scroll Loading Spinner */
        .continuous-loading-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px 0;
          color: var(--color-text-muted);
          font-size: var(--text-sm);
          font-weight: 600;
        }

        .continuous-spinner {
          width: 20px;
          height: 20px;
          border: 2.5px solid rgba(255, 122, 0, 0.2);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: doviSpin 0.7s linear infinite;
        }

        @keyframes doviSpin {
          to { transform: rotate(360deg); }
        }

        @keyframes doviFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes doviSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        @keyframes doviSlideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .hide-mobile {
          display: block;
        }
        .hide-desktop {
          display: none;
        }

        @media (max-width: 1023px) {
          .hide-mobile {
            display: none !important;
          }
          .hide-desktop {
            display: flex !important;
          }
          .product-listing-layout {
            padding-bottom: calc(56px + var(--safe-bottom) + var(--space-6));
          }
        }
      `}</style>
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const sidebarHeaderStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: '1px solid var(--color-border)',
  paddingBottom: 'var(--space-3)',
};

const sidebarTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--font-bold)',
  margin: 0,
};

const sidebarResetBtnStyles: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--color-primary)',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  cursor: 'pointer',
  padding: '4px 6px',
};

const filterGroupStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
};

const filterTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  margin: 0,
};

const filterListStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  alignItems: 'flex-start',
};

const filterBtnStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  border: 'none',
  background: 'none',
  padding: '5px 0',
  minHeight: '32px',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  transition: 'color 150ms ease',
};

const filterPillStyles: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--color-border)',
  fontSize: '13px',
  cursor: 'pointer',
  transition: 'all 160ms ease',
};

const priceInputsStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
};

const priceInputStyles: React.CSSProperties = {
  width: '100%',
  minWidth: 0,
  minHeight: '40px',
  padding: 'var(--space-2) var(--space-3)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-sm)',
  outline: 'none',
  backgroundColor: 'var(--color-bg)',
};

const presetChipsStyles: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  marginTop: '4px',
};

const presetChipStyles: React.CSSProperties = {
  fontSize: '11.5px',
  fontWeight: 600,
  padding: '5px 10px',
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--color-border)',
  cursor: 'pointer',
  transition: 'all 150ms ease',
};

const checkboxLabelStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  fontSize: 'var(--text-sm)',
  cursor: 'pointer',
};

const mainContentStyles: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-6)',
};

const resultsHeaderStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 'var(--space-3) var(--space-4)',
  borderBottom: '1px solid var(--color-border)',
  paddingBottom: 'var(--space-3)',
  minWidth: 0,
};

const resultsCountStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
};

const activeChipsContainerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '6px',
  marginTop: '4px',
};

const chipStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '12px',
  fontWeight: 600,
  backgroundColor: 'rgba(255, 122, 0, 0.08)',
  color: 'var(--color-primary-dark, #c95e00)',
  border: '1px solid rgba(255, 122, 0, 0.25)',
  borderRadius: 'var(--radius-full)',
  padding: '3px 10px',
};

const chipRemoveBtnStyles: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'inherit',
  cursor: 'pointer',
  fontSize: '14px',
  lineHeight: 1,
  padding: 0,
};

const chipClearAllStyles: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--color-primary)',
  fontSize: '12px',
  fontWeight: 700,
  textDecoration: 'underline',
  cursor: 'pointer',
  padding: '3px 6px',
};

const sortWrapperStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  flexShrink: 0,
};

const sortLabelStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
};

const selectStyles: React.CSSProperties = {
  padding: '6px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-sm)',
  outline: 'none',
  backgroundColor: 'var(--color-bg)',
  cursor: 'pointer',
};

const actionButtonStyles: React.CSSProperties = {
  padding: '8px 20px',
  minHeight: '40px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-sm)',
  backgroundColor: 'var(--color-bg)',
  cursor: 'pointer',
};

const drawerCancelBtnStyles: React.CSSProperties = {
  flex: 1,
  minHeight: '44px',
  backgroundColor: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  cursor: 'pointer',
  color: 'var(--color-text)',
};

const drawerApplyBtnStyles: React.CSSProperties = {
  flex: 2,
  minHeight: '44px',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-sm)',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(255, 122, 0, 0.35)',
};

const drawerResetBtnStyles: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--color-primary)',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  padding: '4px 6px',
};

const emptyStyles: React.CSSProperties = {
  textAlign: 'center',
  padding: 'var(--space-16) 0',
  color: 'var(--color-text-muted)',
};
