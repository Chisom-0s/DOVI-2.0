import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import AutoSubNav from '@/components/auto/AutoSubNav';
import AutoComingSoon from '@/components/auto/AutoComingSoon';
import { autoApi } from '@/api/auto';
import { useCart } from '@/contexts/CartContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { NoInternetBanner } from '@/components/common/NoInternetBanner';
import toast from 'react-hot-toast';

export default function AccessoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();

  const [accessory, setAccessory] = useState<any>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Cart quantity stepper state
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    const fetchAccessoryDetail = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await autoApi.getAccessory(id);
        setAccessory(data);
        setError(null);
        setActiveImageIndex(0);
      } catch (err) {
        console.error('Failed to load accessory details:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAccessoryDetail();
  }, [id]);

  const handleAddToCart = async () => {
    if (!accessory) return;

    try {
      setIsAddingToCart(true);
      await addToCart(accessory.id, quantity, undefined, {
        name: accessory.name,
        price: accessory.price,
        image_url: accessory.primary_image_url || accessory.images?.[0]?.url,
      });
      toast.success(`${accessory.name} added to cart!`);
    } catch (err) {
      console.error('Failed to add accessory to cart:', err);
      toast.error('Unable to add item to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (isLoading) {
    return (
      <div style={containerStyles}>
        <AutoSubNav />
        <div style={loadingContainerStyles}>
          <LoadingSpinner label="Loading accessory details..." />
        </div>
      </div>
    );
  }

  if (error || !accessory) {
    if (!navigator.onLine || error?.code === 'NETWORK_ERROR' || error?.message?.toLowerCase().includes('internet signal')) {
      return (
        <div style={containerStyles}>
          <AutoSubNav />
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 16px' }}>
            <NoInternetBanner onRetry={() => window.location.reload()} />
          </div>
        </div>
      );
    }
    return (
      <AutoComingSoon sectionName="Accessories" backPath="/auto/accessories" backLabel="Back to Accessories" />
    );
  }

  const hasImages = accessory.images && accessory.images.length > 0;
  const currentImage = hasImages
    ? accessory.images[activeImageIndex]?.url
    : accessory.primary_image_url;

  return (
    <div style={containerStyles}>
      <AutoSubNav />

      <div style={detailWrapperStyles}>
        {/* Navigation Breadcrumbs */}
        <div style={breadcrumbStyles}>
          <Link to="/auto" style={breadcrumbLinkStyles}>Auto</Link> &gt;{' '}
          <Link to="/auto/accessories" style={breadcrumbLinkStyles}>Accessories</Link> &gt;{' '}
          <span style={breadcrumbCurrentStyles}>{accessory.name}</span>
        </div>

        {/* Main Content Layout Columns */}
        <div style={layoutGridStyles}>
          {/* Left Column: Image Viewer */}
          <div style={leftColStyles}>
            <div style={galleryStyles}>
              <div style={mainImgWrapperStyles}>
                {currentImage ? (
                  <img src={currentImage} alt={accessory.name} style={mainImgStyles} />
                ) : (
                  <div style={placeholderImgStyles}>🔌</div>
                )}
                <span style={categoryBadgeStyles}>
                  {accessory.sub_category?.replace('_', ' ')}
                </span>
              </div>

              {/* Thumbnails strip */}
              {hasImages && accessory.images.length > 1 && (
                <div style={thumbnailListStyles}>
                  {accessory.images.map((img: any, idx: number) => (
                    <button
                      key={img.id}
                      style={{
                        ...thumbnailBtnStyles,
                        border: activeImageIndex === idx ? '2px solid var(--color-primary, #ff7a00)' : '2px solid transparent',
                      }}
                      onClick={() => setActiveImageIndex(idx)}
                    >
                      <img src={img.url} alt="thumbnail" style={thumbnailImgStyles} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Accessory Specifications */}
            <div style={specsBoxStyles}>
              <h2 style={sectionTitleStyles}>Specifications</h2>
              <div style={specsGridStyles}>
                <div style={specRowStyles}>
                  <span style={specLabelStyles}>Category</span>
                  <span style={specValStyles}>{accessory.sub_category?.replace('_', ' ')}</span>
                </div>
                <div style={specRowStyles}>
                  <span style={specLabelStyles}>Stock Quantity</span>
                  <span style={specValStyles}>{accessory.stock_quantity} units</span>
                </div>
                <div style={specRowStyles}>
                  <span style={specLabelStyles}>Vendor</span>
                  <span style={specValStyles}>{accessory.vendor?.name || 'Trusted Vendor'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Checkout Controls, Descriptions */}
          <div style={rightColStyles}>
            {/* Summary Purchase Box */}
            <div style={purchaseCardStyles}>
              <span style={categoryTextStyles}>{accessory.sub_category?.replace('_', ' ')}</span>
              <h1 style={titleStyles}>{accessory.name}</h1>

              <div style={priceContainerStyles}>
                <span style={priceLabelTextStyles}>Unit Price</span>
                <span style={priceStyles}>₦{parseFloat(accessory.price).toLocaleString()}</span>
              </div>

              {/* Quantity Stepper & Stock indicator */}
              <div style={stepperContainerStyles}>
                <label style={formLabelStyles}>Quantity</label>
                <div style={stepperInnerStyles}>
                  <div style={stepperBoxStyles}>
                    <button
                      type="button"
                      style={stepperBtnStyles}
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(q - 1, 1))}
                    >
                      &minus;
                    </button>
                    <span style={stepperValStyles}>{quantity}</span>
                    <button
                      type="button"
                      style={stepperBtnStyles}
                      disabled={quantity >= accessory.stock_quantity}
                      onClick={() => setQuantity((q) => Math.min(q + 1, accessory.stock_quantity))}
                    >
                      &#43;
                    </button>
                  </div>

                  {accessory.stock_quantity > 0 ? (
                    <span style={stockStatusGreenStyles}>
                      In Stock ({accessory.stock_quantity} available)
                    </span>
                  ) : (
                    <span style={stockStatusRedStyles}>Out of Stock</span>
                  )}
                </div>
              </div>

              {/* Cart CTA */}
              <button
                style={{
                  ...cartBtnStyles,
                  cursor: accessory.stock_quantity === 0 || isAddingToCart ? 'not-allowed' : 'pointer',
                  opacity: accessory.stock_quantity === 0 ? 0.6 : 1,
                }}
                disabled={accessory.stock_quantity === 0 || isAddingToCart}
                onClick={handleAddToCart}
              >
                {isAddingToCart ? (
                  'Adding...'
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <span>Add to Cart</span>
                  </span>
                )}
              </button>
            </div>

            {/* Accessory Description */}
            <div style={descBoxStyles}>
              <h2 style={sectionTitleStyles}>Accessory Description</h2>
              <p style={descTextStyles}>
                {accessory.description || 'No description available for this accessory.'}
              </p>
            </div>

            {/* Vendor Details */}
            <div style={vendorCardStyles}>
              <h3 style={cardHeadingStyles}>Vendor Information</h3>
              <div style={vendorInfoRowStyles}>
                <div style={vendorLogoPlaceholderStyles}>
                  {accessory.vendor?.name?.charAt(0) || 'V'}
                </div>
                <div>
                  <h4 style={vendorNameStyles}>{accessory.vendor?.name || 'Trusted Seller'}</h4>
                  <div style={vendorRatingStyles}>
                    <span style={{ color: '#ffb600' }}>★</span>{' '}
                    <span>{accessory.vendor?.rating || '4.5'}</span>
                    <span style={reviewCountStyles}>({accessory.vendor?.review_count || 8} reviews)</span>
                  </div>
                  <p style={vendorLocationStyles}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span style={{ verticalAlign: 'middle' }}>{accessory.vendor?.location || 'Lagos, Nigeria'}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  minHeight: '100vh',
  fontFamily: 'var(--font-sans)',
};

const loadingContainerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '120px 24px',
};



const detailWrapperStyles: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '24px var(--space-4, 16px) 64px var(--space-4, 16px)',
  width: '100%',
};

const breadcrumbStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs, 0.75rem)',
  color: 'var(--color-text-muted, #6b7280)',
  marginBottom: '24px',
};

const breadcrumbLinkStyles: React.CSSProperties = {
  textDecoration: 'none',
  color: 'inherit',
  fontWeight: 500,
};

const breadcrumbCurrentStyles: React.CSSProperties = {
  color: 'var(--color-text, #1f2937)',
  fontWeight: 700,
};

const layoutGridStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '32px',
};

const leftColStyles: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '32px',
};

const rightColStyles: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const galleryStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: 'var(--radius-xl, 16px)',
  padding: '16px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
};

const mainImgWrapperStyles: React.CSSProperties = {
  position: 'relative',
  height: '320px',
  backgroundColor: '#e5e7eb',
  borderRadius: 'var(--radius-lg, 12px)',
  overflow: 'hidden',
};

const mainImgStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const placeholderImgStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '96px',
  color: '#9ca3af',
};

const categoryBadgeStyles: React.CSSProperties = {
  position: 'absolute',
  top: '16px',
  left: '16px',
  backgroundColor: 'rgba(17, 24, 39, 0.7)',
  color: '#ffffff',
  fontSize: '10px',
  fontWeight: 700,
  padding: '4px 10px',
  borderRadius: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const thumbnailListStyles: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  marginTop: '16px',
  overflowX: 'auto',
  paddingBottom: '8px',
};

const thumbnailBtnStyles: React.CSSProperties = {
  width: '80px',
  height: '60px',
  borderRadius: '8px',
  overflow: 'hidden',
  cursor: 'pointer',
  padding: 0,
  backgroundColor: '#e5e7eb',
  flexShrink: 0,
};

const thumbnailImgStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const specsBoxStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: 'var(--radius-xl, 16px)',
  padding: '32px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
};

const sectionTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-lg, 1.125rem)',
  fontWeight: 800,
  color: '#1f2937',
  marginBottom: '20px',
  borderBottom: '2px solid #f3f4f6',
  paddingBottom: '12px',
};

const specsGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '16px 32px',
};

const specRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 0',
  borderBottom: '1px solid #f3f4f6',
};

const specLabelStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs, 0.75rem)',
  color: 'var(--color-text-muted, #6b7280)',
  fontWeight: 500,
};

const specValStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm, 0.875rem)',
  color: '#1f2937',
  fontWeight: 700,
};

const purchaseCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: 'var(--radius-xl, 16px)',
  padding: '32px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
};

const categoryTextStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  color: 'var(--color-text-muted, #6b7280)',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: '8px',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-xl, 1.25rem)',
  fontWeight: 900,
  color: '#1f2937',
  marginBottom: '12px',
  lineHeight: 1.3,
};

const priceContainerStyles: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  padding: '16px 20px',
  borderRadius: '12px',
  marginBottom: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const priceLabelTextStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  textTransform: 'uppercase',
  color: 'var(--color-text-muted, #6b7280)',
};

const priceStyles: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 900,
  color: '#1f2937',
};

const stepperContainerStyles: React.CSSProperties = {
  marginBottom: '28px',
};

const stepperInnerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  marginTop: '8px',
};

const stepperBoxStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: '#ffffff',
};

const stepperBtnStyles: React.CSSProperties = {
  width: '36px',
  height: '36px',
  border: 'none',
  background: 'none',
  fontSize: '18px',
  fontWeight: 600,
  color: '#4b5563',
  cursor: 'pointer',
  transition: 'background-color 100ms ease',
};

const stepperValStyles: React.CSSProperties = {
  padding: '0 12px',
  fontSize: '14px',
  fontWeight: 700,
  color: '#1f2937',
  minWidth: '24px',
  textAlign: 'center',
};

const stockStatusGreenStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs, 0.75rem)',
  color: 'var(--color-success, #27ae60)',
  fontWeight: 600,
};

const stockStatusRedStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs, 0.75rem)',
  color: 'var(--color-danger, #ef4444)',
  fontWeight: 600,
};

const cartBtnStyles: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  backgroundColor: 'var(--color-primary, #ff7a00)',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 700,
  fontSize: '15px',
  boxShadow: '0 4px 12px rgba(255, 122, 0, 0.25)',
};

const descBoxStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: 'var(--radius-xl, 16px)',
  padding: '32px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
};

const descTextStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm, 0.875rem)',
  color: '#4b5563',
  lineHeight: 1.6,
};

const vendorCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: 'var(--radius-xl, 16px)',
  padding: '24px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
};

const cardHeadingStyles: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 800,
  color: '#1f2937',
  marginBottom: '16px',
};

const vendorInfoRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  alignItems: 'center',
};

const vendorLogoPlaceholderStyles: React.CSSProperties = {
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 122, 0, 0.1)',
  color: 'var(--color-primary, #ff7a00)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '24px',
  fontWeight: 900,
};

const vendorNameStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm, 0.875rem)',
  fontWeight: 700,
  color: '#1f2937',
  marginBottom: '2px',
};

const vendorRatingStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs, 0.75rem)',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  color: '#4b5563',
  marginBottom: '4px',
};

const reviewCountStyles: React.CSSProperties = {
  color: 'var(--color-text-muted, #6b7280)',
};

const vendorLocationStyles: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--color-text-muted, #6b7280)',
};

const formLabelStyles: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  color: 'var(--color-text-muted, #6b7280)',
  letterSpacing: '0.5px',
};
