import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import apiClient from '@/api/client';
import { productsApi } from '@/api/products';
import type { APIError, ProductSummary, Subcategory } from '@/types';
import {
  findMainCategory,
  findSubcategory,
  getSubcategoriesForCategory,
  syncCategoriesFromSharedDb,
} from '@/services/categoryService';
import ProductCard from '@/components/product/ProductCard';
import { SkeletonCard } from '@/components/common/Skeleton';
import { NoInternetBanner } from '@/components/common/NoInternetBanner';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const subcategoryParam = searchParams.get('subcategory') ?? '';

  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<APIError | null>(null);

  const loadCategoryData = useCallback(async () => {
    if (!slug) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      await syncCategoriesFromSharedDb().catch(() => {});

      const mainCat = findMainCategory(slug);
      const subCatMatch = !mainCat ? findSubcategory(slug) : null;
      const subCat = subCatMatch?.subcategory;
      const subParentCat = subCatMatch?.parentCategory;

      if (mainCat) {
        setCategoryName(mainCat.name);
        setCategoryDescription(mainCat.description || '');
        setSubcategories(getSubcategoriesForCategory(mainCat.slug));
      } else if (subCat && subParentCat) {
        setCategoryName(subCat.name);
        setCategoryDescription(subCat.description || `${subParentCat.name} › ${subCat.name}`);
        setSubcategories(getSubcategoriesForCategory(subParentCat.slug));
      } else if (slug.toLowerCase() === 'auto') {
        setCategoryName('DOVI Auto');
        setCategoryDescription('Vehicles, motor parts, and automotive accessories.');
        setSubcategories(getSubcategoriesForCategory('automotive-motor-accessories'));
      } else {
        try {
          const { data: catData } = await apiClient.get(`/api/v1/categories/${slug}/`);
          setCategoryName(catData.name);
          setCategoryDescription(catData.description || '');
        } catch {
          setCategoryName(slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '));
          setCategoryDescription('');
        }
        setSubcategories([]);
      }

      // Fetch category products
      const prodRes = await productsApi.list({
        category: mainCat ? mainCat.slug : subParentCat ? subParentCat.slug : slug,
        subcategory: subcategoryParam || (subCat ? subCat.slug : undefined),
      });
      setProducts(prodRes.results);
    } catch (err: any) {
      console.error('Failed to load category details:', err);
      setCategoryName(slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '));
      const isNetwork = !navigator.onLine || err?.code === 'NETWORK_ERROR' || err?.message?.toLowerCase().includes('internet signal');
      setFetchError(
        isNetwork
          ? { error: true, message: 'No internet signal', code: 'NETWORK_ERROR' }
          : { error: true, message: "Couldn't fetch item", code: 'FETCH_ERROR' }
      );
    } finally {
      setIsLoading(false);
    }
  }, [slug, subcategoryParam]);

  useEffect(() => {
    loadCategoryData();
  }, [loadCategoryData]);

  const handleSelectSubcategory = (subSlug: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!subSlug) {
      next.delete('subcategory');
    } else {
      next.set('subcategory', subSlug);
    }
    setSearchParams(next);
  };

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

      <div>
        <h1 style={titleStyles}>{categoryName}</h1>
        {categoryDescription && (
          <p style={{ marginTop: '6px', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            {categoryDescription}
          </p>
        )}
      </div>

      {/* Subcategories Filter Bar */}
      {subcategories.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            padding: '12px 14px',
            backgroundColor: 'var(--color-bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginRight: '4px',
            }}
          >
            Subcategories:
          </span>
          <button
            type="button"
            onClick={() => handleSelectSubcategory(null)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid',
              fontSize: '12.5px',
              cursor: 'pointer',
              backgroundColor: !subcategoryParam ? 'var(--color-primary)' : '#ffffff',
              color: !subcategoryParam ? '#ffffff' : 'var(--color-text)',
              borderColor: !subcategoryParam ? 'var(--color-primary)' : 'var(--color-border)',
              fontWeight: !subcategoryParam ? 700 : 500,
            }}
          >
            All in {categoryName}
          </button>
          {subcategories.map(sub => {
            const isSelected = subcategoryParam === sub.slug || subcategoryParam === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => handleSelectSubcategory(isSelected ? null : sub.slug)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'var(--color-primary)' : '#ffffff',
                  color: isSelected ? '#ffffff' : 'var(--color-text)',
                  borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                  fontWeight: isSelected ? 700 : 500,
                }}
              >
                {sub.name}
              </button>
            );
          })}
        </div>
      )}

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
          {subcategoryParam && (
            <button
              type="button"
              onClick={() => handleSelectSubcategory(null)}
              style={{
                marginTop: '12px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Show All in {categoryName}
            </button>
          )}
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
  flexWrap: 'wrap',
  gap: 'var(--space-2)',
  fontSize: '13px',
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
