import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productsApi } from '@/api/products';
import { recentlyViewedApi } from '@/api/recently-viewed';
import { useCart, findKnownProduct, getCartItemMeta } from '@/contexts/CartContext';
import type { APIError, Product, ProductVariant, ProductSummary } from '@/types';
import {
  resolveProductDeliveryAttributes,
  PARCEL_CLASSIFICATION_LABELS,
} from '@/services/deliveryPricingService';
import { resolveProductCategoryAndSubcategory } from '@/services/categoryService';
import ProductImageGallery from '@/components/product/ProductImageGallery';
import VariantSelector from '@/components/product/VariantSelector';
import ProductDescription from '@/components/product/ProductDescription';
import ShareButtons from '@/components/product/ShareButtons';
import ProductRow from '@/components/product/ProductRow';
import { Skeleton } from '@/components/common/Skeleton';
import { formatPrice } from '@/utils/currency';
import { NoInternetBanner } from '@/components/common/NoInternetBanner';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const stateProduct = (location.state as { product?: any })?.product;

  const initialProduct = useMemo<Product | null>(() => {
    if (stateProduct && (stateProduct.id === id || stateProduct.slug === id)) {
      return stateProduct as Product;
    }
    try {
      const cached = sessionStorage.getItem('dovi_real_products_cache');
      if (cached) {
        const list = JSON.parse(cached);
        const found = list.find((p: any) => p.id === id || p.slug === id);
        if (found) return found as Product;
      }
    } catch {}

    const known = findKnownProduct(id || '', undefined, id) || getCartItemMeta(id || '');
    if (known) {
      return {
        id: known.productId || known.id,
        name: known.name,
        price: known.price,
        base_price: known.price,
        primary_image_url: known.imageUrl,
        image_url: known.imageUrl,
        status: 'PUBLISHED',
      } as Product;
    }
    return null;
  }, [id, stateProduct]);

  const [product, setProduct] = useState<Product | null>(() => initialProduct);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(() => {
    if (initialProduct?.variants && initialProduct.variants.length > 0) {
      return initialProduct.variants[0];
    }
    return null;
  });
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(() => !initialProduct);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<ProductSummary[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(true);
  const [fetchError, setFetchError] = useState<APIError | null>(null);

  // Keep a stable ref to product to prevent re-creating fetchDetailData on state updates
  const productRef = useRef<Product | null>(product);
  useEffect(() => {
    productRef.current = product;
    if (product) {
      recentlyViewedApi.recordView(product);
    }
  }, [product]);

  // Track the ID that was already fetched to completely avoid infinite re-render loops
  const lastFetchedIdRef = useRef<string | null>(null);

  // Fetch product detail and related recommendations strictly once per product id
  const fetchDetailData = useCallback(async () => {
    if (!id) return;
    if (lastFetchedIdRef.current === id) return;
    lastFetchedIdRef.current = id;

    if (!productRef.current) {
      setIsLoading(true);
    }
    setIsLoadingRelated(true);
    setFetchError(null);
    try {
      const detail = await productsApi.getById(id);
      setProduct(detail);
      setQuantity(1);

      // Pre-select first variant if available
      if (detail.variants && detail.variants.length > 0) {
        setSelectedVariant(detail.variants[0]);
      } else {
        setSelectedVariant(null);
      }

      // Fetch related products
      try {
        const related = await productsApi.getRelated(id);
        if (related && related.length > 0) {
          setRelatedProducts(related);
        } else {
          // Graceful fallback: show other catalog products so section is populated stably
          try {
            const cached = sessionStorage.getItem('dovi_real_products_cache');
            if (cached) {
              const list: ProductSummary[] = JSON.parse(cached);
              const others = list.filter((p: any) => p.id !== id && (p.slug ? p.slug !== id : true));
              setRelatedProducts(others.slice(0, 6));
            } else {
              setRelatedProducts([]);
            }
          } catch {
            setRelatedProducts([]);
          }
        }
      } catch (rErr) {
        console.warn('Could not load related products:', rErr);
        setRelatedProducts([]);
      }
    } catch (err: any) {
      console.error('Failed to load product detail:', err);
      // If we already have a product shown from cache, don't wipe it out or crash
      if (productRef.current) {
        return;
      }
      const fallback = findKnownProduct(id, undefined, id) || getCartItemMeta(id);
      const resolvedId = fallback?.productId || (fallback?.id !== id ? fallback?.id : undefined);
      if (resolvedId && resolvedId !== id) {
        navigate(`/products/${resolvedId}`, { replace: true });
        return;
      }
      const isNetwork = !navigator.onLine || err?.code === 'NETWORK_ERROR' || err?.message?.toLowerCase().includes('internet signal');
      setFetchError(
        isNetwork
          ? { error: true, message: 'No internet signal', code: 'NETWORK_ERROR' }
          : { error: true, message: "Couldn't fetch item", code: 'FETCH_ERROR' }
      );
    } finally {
      setIsLoading(false);
      setIsLoadingRelated(false);
    }
  }, [id, navigate]);

  const { addToCart } = useCart();

  useEffect(() => {
    lastFetchedIdRef.current = null;
    fetchDetailData();
  }, [id, fetchDetailData]);

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAddingToCart(true);

    try {
      await addToCart(product, quantity, {
        variantId: selectedVariant ? selectedVariant.id : undefined,
        variantName: selectedVariant?.name,
        price: selectedVariant?.price_override ?? selectedVariant?.price ?? product.base_price ?? product.price,
        imageUrl: product.primary_image_url || product.image_url || undefined,
      });
      toast.success(`Added ${product.name} to cart!`);
    } catch (err) {
      console.error('Failed to add to cart:', err);
      toast.error('Could not add to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product || isOutOfStock) return;
    setIsBuying(true);

    try {
      await addToCart(product, quantity, {
        variantId: selectedVariant ? selectedVariant.id : undefined,
        variantName: selectedVariant?.name,
        price: selectedVariant?.price_override ?? selectedVariant?.price ?? product.base_price ?? product.price,
        imageUrl: product.primary_image_url || product.image_url || undefined,
      });
      navigate('/checkout', {
        state: {
          directBuy: true,
          product,
          quantity,
          variant: selectedVariant,
        },
      });
    } catch (err) {
      console.error('Failed to buy item:', err);
      navigate('/checkout', {
        state: {
          directBuy: true,
          product,
          quantity,
          variant: selectedVariant,
        },
      });
    } finally {
      setIsBuying(false);
    }
  };

  const handleSaveToOwn = () => {
    if (!product) return;
    navigate(`/save2own?productId=${product.id}${selectedVariant ? `&variantId=${selectedVariant.id}` : ''}`);
  };

  if (isLoading) {
    return (
      <div className="container" style={loadingWrapperStyles}>
        <div style={loadingHeaderGridStyles}>
          <Skeleton width="100%" height="400px" borderRadius="var(--radius-lg)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Skeleton width="80%" height="32px" />
            <Skeleton width="40%" height="24px" />
            <Skeleton width="30%" height="36px" />
            <Skeleton width="100%" height="100px" />
          </div>
        </div>
      </div>
    );
  }

  if (fetchError?.code === 'NETWORK_ERROR' || (!product && !navigator.onLine)) {
    return (
      <div className="container" style={{ padding: 'var(--space-12) 0', display: 'flex', justifyContent: 'center' }}>
        <NoInternetBanner onRetry={fetchDetailData} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={errorWrapperStyles}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}>⚠️</div>
        <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>Couldn't fetch item</h3>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
          This item could not be retrieved from the database. It may have been removed or is temporarily unavailable.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button onClick={fetchDetailData} style={backBtnStyles}>
            🔄 Retry
          </button>
          <Link to="/products" style={backBtnStyles}>
            🏪 Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  // Display price and stock matching either the variant (if overridden) or the base product
  const variantPrice = selectedVariant
    ? (selectedVariant.price_override || selectedVariant.price)
    : null;
  const rawPrice = variantPrice || product.base_price || product.price;
  const displayPrice = formatPrice(rawPrice);

  const displaySku = selectedVariant?.sku || product.sku || product.reference_code || 'N/A';

  const rawStock = selectedVariant
    ? (selectedVariant.stock ?? selectedVariant.stock_quantity)
    : (product.stock_quantity ?? (product as { stock?: number }).stock ?? 0);
  const displayStock = typeof rawStock === 'number' ? rawStock : (parseInt(String(rawStock || '0'), 10) || 0);
  const isOutOfStock = displayStock <= 0;

  const avgRating = typeof product.average_rating === 'number'
    ? product.average_rating
    : (parseFloat(String(product.average_rating || 0)) || 0);

  const reviewCount = typeof product.review_count === 'number'
    ? product.review_count
    : (parseInt(String(product.review_count || 0), 10) || 0);

  const deliveryAttrs = resolveProductDeliveryAttributes(product);
  const resolvedCat = resolveProductCategoryAndSubcategory(product);

  return (
    <div className="container" style={pageWrapperStyles}>
      {/* Breadcrumbs */}
      <div style={{ ...breadcrumbsStyles, flexWrap: 'wrap' }}>
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/products">Marketplace</Link>
        {resolvedCat.category_name && (
          <>
            <span>/</span>
            <Link to={`/products?category=${resolvedCat.category_slug}`}>
              {resolvedCat.category_name}
            </Link>
          </>
        )}
        {resolvedCat.subcategory_name && resolvedCat.category_slug && (
          <>
            <span>/</span>
            <Link to={`/products?category=${resolvedCat.category_slug}&subcategory=${resolvedCat.subcategory_slug}`}>
              {resolvedCat.subcategory_name}
            </Link>
          </>
        )}
        <span>/</span>
        <span style={activeBreadcrumbStyles}>{product.name}</span>
      </div>

      {/* Main product columns */}
      <div className="product-detail-grid">
        {/* Left Column: Image Gallery & Socials */}
        <div style={leftColStyles}>
          <ProductImageGallery images={product.images || []} product={product} />
          <ShareButtons productName={product.name} />
        </div>

        {/* Right Column: Pricing, Variations and Primary CTAs */}
        <div style={rightColStyles}>
          {resolvedCat.category_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <Link
                to={`/products?category=${resolvedCat.category_slug}`}
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  backgroundColor: 'rgba(255, 122, 0, 0.08)',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  textDecoration: 'none',
                }}
              >
                {resolvedCat.category_name}
              </Link>
              {resolvedCat.subcategory_name && (
                <Link
                  to={`/products?category=${resolvedCat.category_slug}&subcategory=${resolvedCat.subcategory_slug}`}
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    backgroundColor: 'var(--color-bg-subtle)',
                    border: '1px solid var(--color-border)',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    textDecoration: 'none',
                  }}
                >
                  {resolvedCat.subcategory_name}
                </Link>
              )}
            </div>
          )}
          <h1 style={titleStyles}>{product.name}</h1>
          
          {/* Rating aggregate display banner */}
          <div style={ratingRowStyles}>
            <span style={{ color: '#f39c12', fontWeight: 'bold' }}>
              ★ {avgRating.toFixed(1)}
            </span>
            <span style={countTextStyles}>
              ({reviewCount} customer {reviewCount === 1 ? 'review' : 'reviews'})
            </span>
            <span style={skuStyles}>SKU: {displaySku}</span>
          </div>

          <hr style={dividerStyles} />

          {/* Pricing area */}
          <div style={priceContainerStyles}>
            <span style={priceStyles}>
              {displayPrice}
            </span>
            <span style={isOutOfStock ? outOfStockBadgeStyles : inStockBadgeStyles}>
              {isOutOfStock ? 'Out of Stock' : 'In Stock'}
            </span>
          </div>

          {/* DOVI Onitsha Hub Delivery Classification & Consolidation Banner */}
          <div
            style={{
              backgroundColor: '#fff7ed',
              border: '1px solid #fed7aa',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              fontSize: '12px',
              color: '#7c2d12',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ fontWeight: 700 }}>
                🚚 DOVI Onitsha Hub Consolidated Dispatch
              </span>
              <span
                style={{
                  backgroundColor: '#ffedd5',
                  color: '#9a3412',
                  border: '1px solid #fdba74',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                {PARCEL_CLASSIFICATION_LABELS[deliveryAttrs.delivery_classification]}
              </span>
            </div>
            <div style={{ color: '#9a3412', lineHeight: 1.4 }}>
              Inspected & packaged at our Onitsha Hub. Combine multiple products across categories in your cart for a single consolidated shipment fee whenever practical.
              {deliveryAttrs.weight_kg ? ` · Est. Weight: ${deliveryAttrs.weight_kg} kg` : ''}
              {deliveryAttrs.dimensions_cm ? ` · Dimensions: ${deliveryAttrs.dimensions_cm} cm` : ''}
            </div>
          </div>

          {/* Product variants choice selectors */}
          {product.variants && product.variants.length > 0 && (
            <VariantSelector
              variants={product.variants}
              selectedVariant={selectedVariant}
              onVariantChange={setSelectedVariant}
            />
          )}

          {/* Purchase Actions (Quantity selector & Add button) */}
          <div style={purchaseWrapperStyles}>
            {!isOutOfStock && (
              <div style={qtyWrapperStyles}>
                <button
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  style={qtyBtnStyles}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span style={qtyValStyles}>{quantity}</span>
                <button
                  onClick={() => setQuantity(prev => Math.min(displayStock, prev + 1))}
                  style={qtyBtnStyles}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAddingToCart || isBuying}
              style={{
                ...cartBtnStyles,
                opacity: (isOutOfStock || isAddingToCart || isBuying) ? 0.6 : 1,
                cursor: (isOutOfStock || isAddingToCart || isBuying) ? 'not-allowed' : 'pointer',
              }}
            >
              {isAddingToCart ? 'Adding to Cart...' : '🛒 Add to Cart'}
            </button>

            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock || isBuying || isAddingToCart}
              style={{
                ...buyBtnStyles,
                opacity: (isOutOfStock || isBuying || isAddingToCart) ? 0.6 : 1,
                cursor: (isOutOfStock || isBuying || isAddingToCart) ? 'not-allowed' : 'pointer',
              }}
            >
              {isBuying ? 'Opening Checkout...' : '⚡ Buy Now'}
            </button>
          </div>

          {/* Save to Own goals saving program promotion CTA */}
          <button
            onClick={handleSaveToOwn}
            style={save2ownBtnStyles}
            title="Setup automated goals contribution mapping for this item"
          >
            💰 Save to Own
          </button>
        </div>
      </div>

      {/* Product Description */}
      <div style={descriptionSectionStyles}>
        <h2 style={descriptionHeadingStyles}>Product Description</h2>
        <ProductDescription description={product.description} />
      </div>

      {/* Related Category Recommendations Carousel */}
      <div style={{ marginTop: 'var(--space-8)' }}>
        <ProductRow
          title="Related Products"
          products={relatedProducts}
          isLoading={isLoadingRelated}
        />
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const pageWrapperStyles: React.CSSProperties = {
  paddingTop: 'var(--space-6)',
  paddingBottom: 'var(--space-12)',
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
};

const breadcrumbsStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  marginBottom: 'var(--space-6)',
};

const activeBreadcrumbStyles: React.CSSProperties = {
  color: 'var(--color-text)',
  fontWeight: 'var(--font-medium)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: '24ch',
};

const leftColStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  width: '100%',
};

const rightColStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  width: '100%',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-2xl)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  lineHeight: 'var(--leading-tight)',
};

const ratingRowStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  fontSize: 'var(--text-sm)',
  flexWrap: 'wrap',
};

const countTextStyles: React.CSSProperties = {
  color: 'var(--color-text-muted)',
};

const skuStyles: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  marginLeft: 'auto',
  fontSize: 'var(--text-xs)',
};

const dividerStyles: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid var(--color-border)',
  margin: '0',
};

const priceContainerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const priceStyles: React.CSSProperties = {
  fontSize: 'var(--text-2xl)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-primary)',
};

const inStockBadgeStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 'var(--font-bold)',
  color: '#ffffff',
  backgroundColor: 'var(--color-success)',
  padding: '4px 12px',
  borderRadius: 'var(--radius-full)',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
};

const outOfStockBadgeStyles: React.CSSProperties = {
  ...inStockBadgeStyles,
  backgroundColor: 'var(--color-danger)',
};

const purchaseWrapperStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-3)',
  alignItems: 'center',
  width: '100%',
  flexWrap: 'wrap',
};

const qtyWrapperStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  border: '2px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
  height: '48px',
};

const qtyBtnStyles: React.CSSProperties = {
  width: '42px',
  height: '100%',
  backgroundColor: 'var(--color-bg-subtle)',
  color: 'var(--color-text)',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-lg)',
  border: 'none',
  cursor: 'pointer',
  transition: 'background-color var(--transition-fast)',
};

const qtyValStyles: React.CSSProperties = {
  paddingLeft: 'var(--space-3)',
  paddingRight: 'var(--space-3)',
  minWidth: '36px',
  textAlign: 'center',
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-bold)',
};

const cartBtnStyles: React.CSSProperties = {
  flex: '1',
  height: '48px',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-bold)',
  cursor: 'pointer',
  transition: 'background-color var(--transition-fast), transform var(--transition-fast)',
  minWidth: '180px',
  boxShadow: '0 4px 14px rgba(255, 122, 0, 0.28)',
};

const save2ownBtnStyles: React.CSSProperties = {
  width: '100%',
  height: '48px',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--color-success)',
  color: '#ffffff',
  border: 'none',
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-bold)',
  cursor: 'pointer',
  transition: 'background-color var(--transition-fast), transform var(--transition-fast)',
  boxShadow: '0 4px 14px rgba(39, 174, 96, 0.22)',
};

const buyBtnStyles: React.CSSProperties = {
  flex: '1',
  height: '48px',
  borderRadius: 'var(--radius-md)',
  backgroundColor: '#111827',
  color: '#ffffff',
  border: 'none',
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-bold)',
  cursor: 'pointer',
  transition: 'background-color var(--transition-fast), transform var(--transition-fast)',
  minWidth: '160px',
  boxShadow: '0 4px 14px rgba(17, 24, 39, 0.2)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
};

const descriptionSectionStyles: React.CSSProperties = {
  marginTop: 'var(--space-8)',
  width: '100%',
  backgroundColor: '#ffffff',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  padding: 'var(--space-6)',
  boxShadow: 'var(--shadow-sm)',
};

const descriptionHeadingStyles: React.CSSProperties = {
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--font-bold)',
  margin: '0 0 var(--space-4) 0',
  paddingBottom: 'var(--space-3)',
  borderBottom: '1px solid var(--color-border)',
  color: 'var(--color-text)',
};

const loadingWrapperStyles: React.CSSProperties = {
  paddingTop: 'var(--space-12)',
  paddingBottom: 'var(--space-12)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-6)',
};

const loadingHeaderGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: 'var(--space-6)',
};

const errorWrapperStyles: React.CSSProperties = {
  paddingTop: 'var(--space-16)',
  paddingBottom: 'var(--space-16)',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--space-4)',
};

const backBtnStyles: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  borderRadius: 'var(--radius-md)',
  textDecoration: 'none',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-sm)',
};
