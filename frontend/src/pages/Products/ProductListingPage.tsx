import { useEffect, useState, useCallback } from 'react';
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
  { name: 'Dovi Auto (Cars)', slug: 'auto-cars' },
];

export default function ProductListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();


  // Extract query filters from URL search params
  const categoryParam = searchParams.get('category') ?? '';
  const sortParam = searchParams.get('sort') ?? 'newest';
  const minPriceParam = searchParams.get('min_price') ?? '';
  const maxPriceParam = searchParams.get('max_price') ?? '';
  const inStockParam = searchParams.get('in_stock') === 'true';
  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
  const searchParam = searchParams.get('q') || searchParams.get('search') || '';

  // Synchronous cache seed for instant 0ms mount
  const [products, setProducts] = useState<ProductSummary[]>(() => {
    if (!categoryParam && !minPriceParam && !maxPriceParam && !inStockParam && !searchParam && pageParam === 1) {
      try {
        const cached = sessionStorage.getItem('dovi_real_products_cache');
        if (cached) {
          const list = JSON.parse(cached);
          if (Array.isArray(list) && list.length > 0) return list;
        }
      } catch { }
    }
    return [];
  });
  const [totalCount, setTotalCount] = useState<number>(() => products.length);
  const [isLoading, setIsLoading] = useState<boolean>(() => products.length === 0);
  const [categories, setCategories] = useState<Array<{ name: string; slug: string }>>(DEFAULT_LISTING_CATEGORIES);
  const [fetchError, setFetchError] = useState<APIError | null>(null);

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

  // Fetch products list on filter change
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await productsApi.list({
        page: pageParam,
        page_size: 12,
        category: categoryParam || undefined,
        sort: sortParam as 'price_asc' | 'price_desc' | 'newest' | 'rating',
        min_price: minPriceParam ? parseFloat(minPriceParam) : undefined,
        max_price: maxPriceParam ? parseFloat(maxPriceParam) : undefined,
        in_stock: inStockParam ? true : undefined,
        q: searchParam.trim() || undefined,
      });
      setProducts(response.results);
      setTotalCount(response.count);
      if (!categoryParam && !minPriceParam && !maxPriceParam && !inStockParam && !searchParam && pageParam === 1 && response.results.length > 0) {
        try {
          sessionStorage.setItem('dovi_real_products_cache', JSON.stringify(response.results));
        } catch {}
      }
    } catch (err: any) {
      console.error('Failed to load products list:', err);
      setProducts([]);
      setTotalCount(0);
      const isNetwork = !navigator.onLine || err?.code === 'NETWORK_ERROR' || err?.message?.toLowerCase().includes('internet signal');
      setFetchError(
        isNetwork
          ? { error: true, message: 'No internet signal', code: 'NETWORK_ERROR' }
          : { error: true, message: "Couldn't fetch item", code: 'FETCH_ERROR' }
      );
    } finally {
      setIsLoading(false);
    }
  }, [categoryParam, sortParam, minPriceParam, maxPriceParam, inStockParam, pageParam, searchParam]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateFilters = (newParams: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === '') {
        nextParams.delete(key);
      } else {
        nextParams.set(key, val);
      }
    });
    // Reset page to 1 on filter changes
    if (newParams.page === undefined) {
      nextParams.delete('page');
    }
    setSearchParams(nextParams);
  };

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage.toString() });
  };

  const [searchTerm, setSearchTerm] = useState(searchParam);

  useEffect(() => {
    setSearchTerm(searchParam);
  }, [searchParam]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateFilters({ q: searchTerm.trim() || null });
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    updateFilters({ q: null });
  };

  const hasSearched = Boolean(searchParam.trim());
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const hasActiveFilters = Boolean(searchParam || categoryParam || minPriceParam || maxPriceParam || inStockParam);

  const totalPages = Math.ceil(totalCount / 12);

  return (
    <div className="container product-listing-layout">
      {/* Mobile Filter Toggle Button */}
      <div className="mobile-filter-bar hide-desktop">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="mobile-filter-toggle-btn"
          aria-expanded={showMobileFilters}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span>{showMobileFilters ? 'Hide Filters & Categories' : 'Filter & Categories'}</span>
          {hasActiveFilters && (
            <span className="mobile-filter-badge">Active</span>
          )}
        </button>
      </div>

      {/* Filters Sidebar */}
      <aside style={sidebarStyles} className={`product-listing__sidebar ${showMobileFilters ? 'product-listing__sidebar--open' : ''}`}>
        <h3 style={sidebarTitleStyles}>Filters</h3>

        {/* Search Filter */}
        <div style={filterGroupStyles}>
          <h4 style={filterTitleStyles}>Search</h4>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={priceInputStyles}
            />
            <button
              type="submit"
              style={{
                padding: 'var(--space-2) var(--space-3)',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-medium)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Go
            </button>
          </form>
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
            <span>-</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPriceParam}
              onChange={e => updateFilters({ max_price: e.target.value || null })}
              style={priceInputStyles}
            />
          </div>
        </div>

        {/* Stock Status */}
        <div style={filterGroupStyles}>
          <label style={checkboxLabelStyles}>
            <input
              type="checkbox"
              checked={inStockParam}
              onChange={e => updateFilters({ in_stock: e.target.checked ? 'true' : null })}
            />
            <span>In Stock Only</span>
          </label>
        </div>
      </aside>

      {/* Main Listing Content */}
      <div style={mainContentStyles}>
        {/* Results Header Info */}
        <div style={resultsHeaderStyles}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {hasSearched ? (
              <span style={resultsCountStyles}>
                {totalCount} {totalCount === 1 ? 'product' : 'products'} found
                {searchParam ? (
                  <>
                    {' '}for &ldquo;<strong>{searchParam}</strong>&rdquo;
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      style={{
                        marginLeft: 'var(--space-2)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-primary)',
                        cursor: 'pointer',
                        fontSize: 'var(--text-xs)',
                        textDecoration: 'underline',
                        padding: 0,
                      }}
                      title="Clear search"
                    >
                      Clear
                    </button>
                  </>
                ) : null}
              </span>
            ) : (
              <span style={resultsCountStyles}></span>
            )}
          </div>
          <div style={sortWrapperStyles}>
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
          /* Initial load: no data yet, show skeleton placeholders */
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={paginationStyles}>
                <button
                  disabled={pageParam === 1}
                  onClick={() => handlePageChange(pageParam - 1)}
                  style={pageBtnStyles}
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePageChange(idx + 1)}
                    style={{
                      ...pageNumberBtnStyles,
                      backgroundColor: pageParam === idx + 1 ? 'var(--color-primary)' : 'transparent',
                      color: pageParam === idx + 1 ? 'white' : 'var(--color-text)',
                    }}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  disabled={pageParam === totalPages}
                  onClick={() => handlePageChange(pageParam + 1)}
                  style={pageBtnStyles}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : fetchError?.code === 'NETWORK_ERROR' || (!navigator.onLine && products.length === 0) ? (
          <NoInternetBanner onRetry={fetchProducts} />
        ) : fetchError ? (
          <div style={emptyStyles}>
            <h3>Couldn't fetch item</h3>
            <p>We couldn't retrieve products from the database right now.</p>
            <button onClick={fetchProducts} style={pageBtnStyles}>🔄 Retry</button>
          </div>
        ) : (
          <div style={emptyStyles}>
            <h3>No results found{searchParam ? ` for "${searchParam}"` : ''}</h3>
            <p>Try resetting filters, checking your spelling, or searching for other items.</p>
            {hasSearched && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{ ...pageBtnStyles, marginTop: 'var(--space-4)', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none' }}
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------

const sidebarStyles: React.CSSProperties = {
  width: '240px',
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-6)',
};

const sidebarTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--font-bold)',
  borderBottom: '1px solid var(--color-border)',
  paddingBottom: 'var(--space-3)',
};

const filterGroupStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const filterTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
};

const filterListStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
  alignItems: 'flex-start',
};

const filterBtnStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  border: 'none',
  background: 'none',
  padding: 0,
  cursor: 'pointer',
  textAlign: 'left',
};

const priceInputsStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
};

const priceInputStyles: React.CSSProperties = {
  width: '100%',
  padding: 'var(--space-2)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--text-sm)',
  outline: 'none',
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
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-6)',
};

const resultsHeaderStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: '1px solid var(--color-border)',
  paddingBottom: 'var(--space-3)',
};

const resultsCountStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
};

const sortWrapperStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
};

const sortLabelStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
};

const selectStyles: React.CSSProperties = {
  padding: 'var(--space-2)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--text-sm)',
  outline: 'none',
  backgroundColor: 'var(--color-bg)',
};


const paginationStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-2)',
  marginTop: 'var(--space-8)',
};

const pageBtnStyles: React.CSSProperties = {
  padding: 'var(--space-2) var(--space-4)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--text-sm)',
  backgroundColor: 'var(--color-bg)',
  cursor: 'pointer',
};

const pageNumberBtnStyles: React.CSSProperties = {
  width: '36px',
  height: '36px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--text-sm)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color var(--transition-fast)',
};

const emptyStyles: React.CSSProperties = {
  textAlign: 'center',
  padding: 'var(--space-16) 0',
  color: 'var(--color-text-muted)',
};
