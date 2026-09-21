import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '@/api/client';
import { productsApi } from '@/api/products';
import type { APIError, ProductSummary } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import { SkeletonCard } from '@/components/common/Skeleton';
import { NoInternetBanner } from '@/components/common/NoInternetBanner';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<APIError | null>(null);

  const loadCategoryData = useCallback(async () => {
    if (!slug) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      // Fetch specific category detail to get name
      try {
        const { data: catData } = await apiClient.get(`/api/v1/categories/${slug}/`);
        setCategoryName(catData.name);
      } catch {
        // Fallback name mapping if detail by slug is unavailable
        setCategoryName(slug.charAt(0).toUpperCase() + slug.slice(1).replace('-', ' '));
      }

      // Fetch category products
      const prodRes = await productsApi.list({ category: slug });
      setProducts(prodRes.results);
    } catch (err: any) {
      console.error('Failed to load category details:', err);
      setCategoryName(slug.charAt(0).toUpperCase() + slug.slice(1).replace('-', ' '));
      const isNetwork = !navigator.onLine || err?.code === 'NETWORK_ERROR' || err?.message?.toLowerCase().includes('internet signal');
      setFetchError(
        isNetwork
          ? { error: true, message: 'No internet signal', code: 'NETWORK_ERROR' }
          : { error: true, message: "Couldn't fetch item", code: 'FETCH_ERROR' }
      );
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadCategoryData();
  }, [loadCategoryData]);

  if (fetchError?.code === 'NETWORK_ERROR' || (!navigator.onLine && products.length === 0)) {
    return (
      <div className="container" style={{ padding: 'var(--space-12) 0', display: 'flex', justifyContent: 'center' }}>
        <NoInternetBanner onRetry={loadCategoryData} />
      </div>
    );
  }

  return (
    <div className="container" style={wrapperStyles}>
      {/* Breadcrumb navigation */}
      <nav style={breadcrumbStyles}>
        <Link to="/" style={breadcrumbLinkStyles}>Home</Link>
        <span style={separatorStyles}>/</span>
        <Link to="/products" style={breadcrumbLinkStyles}>Marketplace</Link>
        <span style={separatorStyles}>/</span>
        <span style={currentStyles}>{categoryName}</span>
      </nav>

      <h1 style={titleStyles}>{categoryName}</h1>

      {isLoading ? (
        <div className="marketplace-product-grid">
          {Array.from({ length: 4 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      ) : fetchError ? (
        <div style={emptyStyles}>
          <h3>Couldn't fetch item</h3>
          <p>We couldn't retrieve products for this category right now.</p>
          <button onClick={loadCategoryData} style={{ padding: '8px 16px', marginTop: '12px', cursor: 'pointer' }}>🔄 Retry</button>
        </div>
      ) : products.length > 0 ? (
        <div className="marketplace-product-grid">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div style={emptyStyles}>
          <h3>No products in this category</h3>
          <p>We couldn&apos;t find any active listings. Check back later.</p>
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
  fontSize: 'var(--text-2xl)',
  fontWeight: 'var(--font-bold)',
};


const emptyStyles: React.CSSProperties = {
  textAlign: 'center',
  padding: 'var(--space-16) 0',
  color: 'var(--color-text-muted)',
};
