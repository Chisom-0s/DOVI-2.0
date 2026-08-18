import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsApi } from '@/api/products';
import type { ProductSummary } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import { SkeletonCard } from '@/components/common/Skeleton';

export default function ProductListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Array<{ name: string; slug: string }>>([]);

  // Extract query filters from URL search params
  const categoryParam = searchParams.get('category') ?? '';
  const sortParam = searchParams.get('sort') ?? 'newest';
  const minPriceParam = searchParams.get('min_price') ?? '';
  const maxPriceParam = searchParams.get('max_price') ?? '';
  const inStockParam = searchParams.get('in_stock') === 'true';
  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);

  // Fetch categories list for filters
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/categories/`);
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products list on filter change
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await productsApi.list({
          page: pageParam,
          page_size: 12,
          category: categoryParam || undefined,
          sort: sortParam as 'price_asc' | 'price_desc' | 'newest' | 'rating',
          min_price: minPriceParam ? parseFloat(minPriceParam) : undefined,
          max_price: maxPriceParam ? parseFloat(maxPriceParam) : undefined,
          in_stock: inStockParam ? true : undefined,
        });
        setProducts(response.results);
        setTotalCount(response.count);
      } catch (err) {
        console.error('Failed to load products list:', err);
        setProducts([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [categoryParam, sortParam, minPriceParam, maxPriceParam, inStockParam, pageParam]);

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

  const totalPages = Math.ceil(totalCount / 12);

  return (
    <div className="container" style={wrapperStyles}>
      {/* Filters Sidebar */}
      <aside style={sidebarStyles} className="hide-mobile">
        <h3 style={sidebarTitleStyles}>Filters</h3>

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
          <span style={resultsCountStyles}>
            {totalCount} products found
          </span>
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
        {isLoading ? (
          <div style={gridStyles}>
            {Array.from({ length: 8 }).map((_, idx) => (
              <SkeletonCard key={idx} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div style={gridStyles}>
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
        ) : (
          <div style={emptyStyles}>
            <h3>No results found</h3>
            <p>Try resetting filters or checking different criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const wrapperStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-8)',
  paddingTop: 'var(--space-6)',
  paddingBottom: 'var(--space-12)',
};

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

const gridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: 'var(--space-6)',
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
