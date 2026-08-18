import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { productsApi } from '@/api/products';
import type { ProductSummary } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import { SkeletonCard } from '@/components/common/Skeleton';

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setProducts([]);
      setTotalCount(0);
      setIsLoading(false);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      try {
        const response = await productsApi.search(query);
        setProducts(response.results);
        setTotalCount(response.count);
      } catch (err) {
        console.error('Search failed:', err);
        setProducts([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [query]);

  return (
    <div className="container" style={wrapperStyles}>
      {/* Breadcrumb navigation */}
      <nav style={breadcrumbStyles}>
        <Link to="/" style={breadcrumbLinkStyles}>Home</Link>
        <span style={separatorStyles}>/</span>
        <span style={currentStyles}>Search Results</span>
      </nav>

      <h1 style={titleStyles}>
        Search Results for &ldquo;{query}&rdquo;
      </h1>

      {isLoading ? (
        <div style={gridStyles}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <>
          <p style={countStyles}>{totalCount} results found</p>
          <div style={gridStyles}>
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        <div style={emptyStyles}>
          <h3>No matches found</h3>
          <p>Double-check your spelling or search terms, or try looking in popular categories.</p>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const wrapperStyles: React.CSSProperties = {
  paddingTop: 'var(--space-6)',
  paddingBottom: 'var(--space-12)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-6)',
};

const breadcrumbStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  fontSize: 'var(--text-xs)',
};

const breadcrumbLinkStyles: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  textDecoration: 'none',
};

const separatorStyles: React.CSSProperties = {
  color: 'var(--color-border)',
};

const currentStyles: React.CSSProperties = {
  color: 'var(--color-text)',
  fontWeight: 'var(--font-medium)',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-bold)',
};

const countStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
  marginTop: '-var(--space-4)',
};

const gridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: 'var(--space-6)',
};

const emptyStyles: React.CSSProperties = {
  textAlign: 'center',
  padding: 'var(--space-16) 0',
  color: 'var(--color-text-muted)',
};
