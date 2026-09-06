import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productsApi } from '@/api/products';
import { cartApi } from '@/api/cart';
import type { Product, ProductVariant, ProductSummary } from '@/types';
import ProductImageGallery from '@/components/product/ProductImageGallery';
import VariantSelector from '@/components/product/VariantSelector';
import VendorSection from '@/components/product/VendorSection';
import ProductSpecs from '@/components/product/ProductSpecs';
import ProductDescription from '@/components/product/ProductDescription';
import CustomerReviews from '@/components/product/CustomerReviews';
import ShareButtons from '@/components/product/ShareButtons';
import ProductRow from '@/components/product/ProductRow';
import { Skeleton } from '@/components/common/Skeleton';
import { formatPrice } from '@/utils/currency';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<ProductSummary[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(true);

  // Fetch product detail and related recommendations
  useEffect(() => {
    if (!id) return;

    const fetchDetailData = async () => {
      setIsLoading(true);
      setIsLoadingRelated(true);
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
          setRelatedProducts(related);
        } catch (rErr) {
          console.warn('Could not load related products:', rErr);
          setRelatedProducts([]);
        }
      } catch (err) {
        console.error('Failed to load product detail:', err);
        setProduct(null);
        setSelectedVariant(null);
        toast.error('Product not found or offline.');
      } finally {
        setIsLoading(false);
        setIsLoadingRelated(false);
      }
    };

    fetchDetailData();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAddingToCart(true);

    try {
      await cartApi.addItem({
        product_id: product.id,
        variant_id: selectedVariant ? selectedVariant.id : undefined,
        quantity,
      });
      toast.success(`Added ${product.name} to cart!`);
    } catch (err) {
      console.error('Failed to add to cart:', err);
      toast.error('Could not add to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
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

  if (!product) {
    return (
      <div className="container" style={errorWrapperStyles}>
        <h3>Product details unavailable</h3>
        <p>This item could not be retrieved. It may have been archived or is temporarily offline.</p>
        <Link to="/products" style={backBtnStyles}>Back to Marketplace</Link>
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

  return (
    <div className="container" style={pageWrapperStyles}>
      {/* Breadcrumbs */}
      <div style={breadcrumbsStyles}>
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/products">Marketplace</Link>
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
              disabled={isOutOfStock || isAddingToCart}
              style={{
                ...cartBtnStyles,
                opacity: (isOutOfStock || isAddingToCart) ? 0.6 : 1,
                cursor: (isOutOfStock || isAddingToCart) ? 'not-allowed' : 'pointer',
              }}
            >
              {isAddingToCart ? 'Adding to Cart...' : '🛒 Add to Cart'}
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

          {/* Vendor profile header info */}
          <VendorSection vendor={product.vendor} vendorName={(product as { vendor_name?: string }).vendor_name} />
        </div>
      </div>

      {/* Tabs (Description, Technical Specs, Reviews) */}
      <div style={tabsWrapperStyles}>
        <div style={tabHeadersStyles}>
          <button
            onClick={() => setActiveTab('description')}
            style={{
              ...tabBtnStyles,
              color: activeTab === 'description' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottomColor: activeTab === 'description' ? 'var(--color-primary)' : 'transparent',
            }}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            style={{
              ...tabBtnStyles,
              color: activeTab === 'specs' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottomColor: activeTab === 'specs' ? 'var(--color-primary)' : 'transparent',
            }}
          >
            Specifications
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            style={{
              ...tabBtnStyles,
              color: activeTab === 'reviews' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottomColor: activeTab === 'reviews' ? 'var(--color-primary)' : 'transparent',
            }}
          >
            Reviews ({reviewCount})
          </button>
        </div>

        {/* Lazy load tabs depending on active selections */}
        <div style={tabContentStyles}>
          {activeTab === 'description' && (
            <ProductDescription description={product.description} />
          )}
          {activeTab === 'specs' && (
            <ProductSpecs product={product} />
          )}
          {activeTab === 'reviews' && (
            <CustomerReviews
              productId={product.id}
              averageRating={avgRating}
              reviewCount={reviewCount}
            />
          )}
        </div>
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
  fontSize: '11px',
  fontWeight: 'var(--font-bold)',
  color: '#ffffff',
  backgroundColor: 'var(--color-success)',
  padding: '4px 10px',
  borderRadius: 'var(--radius-full)',
  textTransform: 'uppercase',
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
  height: '42px',
};

const qtyBtnStyles: React.CSSProperties = {
  width: '38px',
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
  paddingHorizontal: 'var(--space-3)',
  minWidth: '32px',
  textAlign: 'center',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
};

const cartBtnStyles: React.CSSProperties = {
  flex: '1',
  height: '42px',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  cursor: 'pointer',
  transition: 'background-color var(--transition-fast)',
  minWidth: '180px',
};

const save2ownBtnStyles: React.CSSProperties = {
  width: '100%',
  height: '42px',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--color-success)',
  color: '#ffffff',
  border: 'none',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  cursor: 'pointer',
  transition: 'background-color var(--transition-fast)',
  boxShadow: '0 4px 12px rgba(39, 174, 96, 0.15)',
};

const tabsWrapperStyles: React.CSSProperties = {
  marginTop: 'var(--space-8)',
  width: '100%',
};

const tabHeadersStyles: React.CSSProperties = {
  display: 'flex',
  borderBottom: '2px solid var(--color-border)',
  gap: 'var(--space-6)',
  overflowX: 'auto',
};

const tabBtnStyles: React.CSSProperties = {
  paddingBottom: 'var(--space-3)',
  borderBottom: '3px solid transparent',
  backgroundColor: 'transparent',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-sm)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
  whiteSpace: 'nowrap',
};

const tabContentStyles: React.CSSProperties = {
  paddingTop: 'var(--space-4)',
  width: '100%',
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
  gridTemplateColumns: '1fr 1fr',
  gap: 'var(--space-8)',
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
