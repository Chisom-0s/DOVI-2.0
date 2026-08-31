import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '@/api/client';
import { productsApi } from '@/api/products';
import type { ProductSummary } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import { SkeletonCard } from '@/components/common/Skeleton';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const loadCategoryData = async () => {
      setIsLoading(true);
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
      } catch (err) {
        console.error('Failed to load category details:', err);
        setCategoryName(slug.charAt(0).toUpperCase() + slug.slice(1).replace('-', ' '));
      } finally {
        setIsLoading(false);
      }
    };

    loadCategoryData();
  }, [slug]);

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
        <div style={gridStyles}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div style={gridStyles}>
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
