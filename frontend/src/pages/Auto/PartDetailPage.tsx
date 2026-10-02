import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import AutoSubNav from '@/components/auto/AutoSubNav';
import AutoComingSoon from '@/components/auto/AutoComingSoon';
import { autoApi } from '@/api/auto';
import { useCart } from '@/contexts/CartContext';
import type { AutoPart } from '@/types';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { NoInternetBanner } from '@/components/common/NoInternetBanner';
import toast from 'react-hot-toast';

export default function PartDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();

  const [part, setPart] = useState<AutoPart | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Cart quantity stepper state
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Compatibility checker states
  const [checkMake, setCheckMake] = useState('');
  const [checkModel, setCheckModel] = useState('');
  const [checkYear, setCheckYear] = useState<number | ''>('');
  const [compatStatus, setCompatStatus] = useState<'UNCHECKED' | 'FIT' | 'MISMATCH'>('UNCHECKED');

  // Independent image loading state
  const [partImageLoaded, setPartImageLoaded] = useState(false);
  const partImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const fetchPartDetail = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await autoApi.getPart(id);
        setPart(data);
        setError(null);
        setActiveImageIndex(0);
      } catch (err) {
        console.error('Failed to load part details:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPartDetail();
  }, [id]);

  const handleCompatibilityCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!part || !checkMake || !checkModel || !checkYear) return;

    const makeInput = checkMake.trim().toLowerCase();
    const modelInput = checkModel.trim().toLowerCase();
    const yearInput = Number(checkYear);

    // If there is no compatibility configurations, check if it fits all
    if (!part.compatible_vehicles || part.compatible_vehicles.length === 0) {
      setCompatStatus('FIT');
      toast.success('Universal Fit: Compatible with all vehicles!');
      return;
    }

    // Check against array of compatible vehicles
    const isCompatible = part.compatible_vehicles.some((vehicle) => {
      const matchMake = vehicle.make.toLowerCase() === makeInput;
      const matchModel = vehicle.model.toLowerCase() === modelInput;
      const matchYear = yearInput >= vehicle.year_from && yearInput <= vehicle.year_to;
      return matchMake && matchModel && matchYear;
    });

    if (isCompatible) {
      setCompatStatus('FIT');
      toast.success('Compatible: This part fits your vehicle!');
    } else {
      setCompatStatus('MISMATCH');
      toast.error('Not Compatible: This part does not fit your vehicle.');
    }
  };

  const handleAddToCart = async () => {
    if (!part) return;

    try {
      setIsAddingToCart(true);
      await addToCart(part.id, quantity, undefined, {
        name: part.name,
        price: part.price,
        image_url: part.primary_image_url || (part.images && part.images[0]?.url),
      });
      toast.success(`${part.name} added to cart!`);
    } catch (err) {
      console.error('Failed to add part to cart:', err);
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
          <LoadingSpinner label="Loading part specifications..." />
        </div>
      </div>
    );
  }

  if (error || !part) {
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
      <AutoComingSoon sectionName="Car Parts" backPath="/auto/parts" backLabel="Back to Parts" />
    );
  }

  const hasImages = part.images && part.images.length > 0;
  const currentImage = hasImages
    ? part.images[activeImageIndex]?.url
    : part.primary_image_url;

  // Reset image loading state when the active image source changes
  useEffect(() => {
    setPartImageLoaded(false);
    const img = partImgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setPartImageLoaded(true);
    }
  }, [currentImage]);

  return (
    <div style={containerStyles}>
      <AutoSubNav />

      <div style={detailWrapperStyles}>
        {/* Navigation Breadcrumbs */}
        <div style={breadcrumbStyles}>
          <Link to="/auto" style={breadcrumbLinkStyles}>Auto</Link> &gt;{' '}
          <Link to="/auto/parts" style={breadcrumbLinkStyles}>Parts</Link> &gt;{' '}
          <span style={breadcrumbCurrentStyles}>{part.name}</span>
        </div>

        {/* Main Columns Grid Layout */}
        <div style={layoutGridStyles}>
          {/* Left Column: Gallery & Compatibility Table */}
          <div style={leftColStyles}>
            <div style={galleryStyles}>
              <div style={mainImgWrapperStyles}>
                {/* Shimmer skeleton while image is loading */}
                {currentImage && !partImageLoaded && (
                  <div style={partImageSkeletonStyles}>
                    <div style={partShimmerStyles} />
                  </div>
                )}
                {currentImage ? (
                  <img
                    ref={partImgRef}
                    src={currentImage}
                    alt={part.name}
                    style={{
                      ...mainImgStyles,
                      opacity: partImageLoaded ? 1 : 0,
                      transition: partImageLoaded ? 'opacity 0.3s ease-in' : 'none',
                    }}
                    onLoad={() => setPartImageLoaded(true)}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      setPartImageLoaded(true);
                    }}
                  />
                ) : (
                  <div style={placeholderImgStyles}>⚙️</div>
                )}
                <span style={partTypeBadgeStyles}>{part.part_type}</span>
              </div>

              {/* Thumbnails strip */}
              {hasImages && part.images.length > 1 && (
                <div style={thumbnailListStyles}>
                  {part.images.map((img, idx) => (
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

            {/* Compatibility Checking Tool */}
            <div style={checkerBoxStyles}>
              <h2 style={sectionTitleStyles}>Check Compatibility</h2>
              <p style={checkerSubStyles}>Confirm if this part fits your vehicle before ordering:</p>

              <form onSubmit={handleCompatibilityCheck} style={checkerFormStyles}>
                <div style={formGridStyles}>
                  <div style={formGroupStyles}>
                    <label style={formLabelStyles}>Make</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Toyota"
                      style={formInputStyles}
                      value={checkMake}
                      onChange={(e) => {
                        setCheckMake(e.target.value);
                        setCompatStatus('UNCHECKED');
                      }}
                    />
                  </div>
                  <div style={formGroupStyles}>
                    <label style={formLabelStyles}>Model</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Corolla"
                      style={formInputStyles}
                      value={checkModel}
                      onChange={(e) => {
                        setCheckModel(e.target.value);
                        setCompatStatus('UNCHECKED');
                      }}
                    />
                  </div>
                  <div style={formGroupStyles}>
                    <label style={formLabelStyles}>Year</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 2018"
                      style={formInputStyles}
                      value={checkYear}
                      onChange={(e) => {
                        setCheckYear(e.target.value ? parseInt(e.target.value) : '');
                        setCompatStatus('UNCHECKED');
                      }}
                    />
                  </div>
                </div>
                <button type="submit" style={checkerBtnStyles}>
                  Verify Fitment
                </button>
              </form>

              {/* Checker Visual Responses */}
              {compatStatus === 'FIT' && (
                <div style={compatFitAlertStyles}>
                  <span>✓</span>
                  <span>COMPATIBLE: This part fits your {checkYear} {checkMake} {checkModel}!</span>
                </div>
              )}
              {compatStatus === 'MISMATCH' && (
                <div style={compatMismatchAlertStyles}>
                  <span>✕</span>
                  <span>NOT COMPATIBLE: This part does not fit your {checkYear} {checkMake} {checkModel}.</span>
                </div>
              )}
            </div>

            {/* Compatibility Detail Table */}
            {part.compatible_vehicles && part.compatible_vehicles.length > 0 && (
              <div style={tableContainerStyles}>
                <h3 style={tableHeadingStyles}>Compatible Vehicles</h3>
                <table style={tableStyles}>
                  <thead>
                    <tr style={tableHeaderRowStyles}>
                      <th style={thStyles}>Vehicle Make</th>
                      <th style={thStyles}>Model</th>
                      <th style={thStyles}>Year Fitment Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {part.compatible_vehicles.map((v, i) => (
                      <tr key={i} style={tableRowStyles}>
                        <td style={tdStyles}>{v.make}</td>
                        <td style={tdStyles}>{v.model}</td>
                        <td style={tdStyles}>
                          {v.year_from} &ndash; {v.year_to}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Column: Price, Stock, Stepper, Cart, Description */}
          <div style={rightColStyles}>
            {/* Purchase Details Card */}
            <div style={purchaseCardStyles}>
              <span style={partNumberTextStyles}>Part #: {part.part_number}</span>
              <h1 style={titleStyles}>{part.name}</h1>
              <span style={badgeStyles}>{part.condition}</span>

              <div style={priceContainerStyles}>
                <span style={priceLabelTextStyles}>Unit Price</span>
                <span style={priceStyles}>₦{parseFloat(part.price).toLocaleString()}</span>
              </div>

              {/* Quantity Stepper & Stock status */}
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
                      disabled={quantity >= part.stock_quantity}
                      onClick={() => setQuantity((q) => Math.min(q + 1, part.stock_quantity))}
                    >
                      &#43;
                    </button>
                  </div>

                  {part.stock_quantity > 0 ? (
                    <span style={stockStatusGreenStyles}>
                      In Stock ({part.stock_quantity} units available)
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
                  cursor: part.stock_quantity === 0 || isAddingToCart ? 'not-allowed' : 'pointer',
                  opacity: part.stock_quantity === 0 ? 0.6 : 1,
                }}
                disabled={part.stock_quantity === 0 || isAddingToCart}
                onClick={handleAddToCart}
              >
                {isAddingToCart ? 'Adding...' : 'Add to Cart 🛒'}
              </button>
            </div>

            {/* Part Description */}
            <div style={descBoxStyles}>
              <h2 style={sectionTitleStyles}>Part Description</h2>
              <p style={descTextStyles}>{part.description || 'No description available for this part.'}</p>
            </div>

            {/* Vendor Information Card */}
            <div style={vendorCardStyles}>
              <h3 style={cardHeadingStyles}>Vendor Info</h3>
              <div style={vendorInfoRowStyles}>
                <div style={vendorLogoPlaceholderStyles}>
                  {part.vendor?.name?.charAt(0) || 'V'}
                </div>
                <div>
                  <h4 style={vendorNameStyles}>{part.vendor?.name || 'Trusted Vendor'}</h4>
                  <div style={vendorRatingStyles}>
                    <span style={{ color: '#ffb600' }}>★</span>{' '}
                    <span>{part.vendor?.rating || '4.6'}</span>
                    <span style={reviewCountStyles}>({part.vendor?.review_count || 12} reviews)</span>
                  </div>
                  <p style={vendorLocationStyles}>📍 {part.vendor?.location || 'Lagos, Nigeria'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Injected keyframes for image shimmer animation */}
      <style>{`
        @keyframes part-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
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

const partImageSkeletonStyles: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundColor: '#e5e7eb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  zIndex: 1,
};

const partShimmerStyles: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
  animation: 'part-shimmer 1.5s ease-in-out infinite',
};

const partTypeBadgeStyles: React.CSSProperties = {
  position: 'absolute',
  top: '16px',
  left: '16px',
  backgroundColor: '#111827',
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

const checkerBoxStyles: React.CSSProperties = {
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
  marginBottom: '16px',
  borderBottom: '2px solid #f3f4f6',
  paddingBottom: '12px',
};

const checkerSubStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm, 0.875rem)',
  color: 'var(--color-text-muted, #6b7280)',
  marginBottom: '20px',
};

const checkerFormStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const formGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: '16px',
};

const formGroupStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const formLabelStyles: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  color: 'var(--color-text-muted, #6b7280)',
  letterSpacing: '0.5px',
};

const formInputStyles: React.CSSProperties = {
  padding: '10px 12px',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: '8px',
  fontSize: 'var(--text-sm, 0.875rem)',
  outline: 'none',
  backgroundColor: '#f9fafb',
};

const checkerBtnStyles: React.CSSProperties = {
  padding: '12px 24px',
  backgroundColor: '#111827',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 700,
  fontSize: '14px',
  cursor: 'pointer',
  alignSelf: 'flex-start',
};

const compatFitAlertStyles: React.CSSProperties = {
  marginTop: '20px',
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
  backgroundColor: '#edfdf6',
  border: '1px solid #cbf8e3',
  color: 'var(--color-success, #27ae60)',
  padding: '14px 16px',
  borderRadius: '8px',
  fontSize: 'var(--text-sm, 0.875rem)',
  fontWeight: 600,
};

const compatMismatchAlertStyles: React.CSSProperties = {
  marginTop: '20px',
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
  backgroundColor: '#fdf2f2',
  border: '1px solid #fde2e2',
  color: 'var(--color-danger, #ef4444)',
  padding: '14px 16px',
  borderRadius: '8px',
  fontSize: 'var(--text-sm, 0.875rem)',
  fontWeight: 600,
};

const tableContainerStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: 'var(--radius-xl, 16px)',
  padding: '24px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
  overflowX: 'auto',
};

const tableHeadingStyles: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 800,
  color: '#1f2937',
  marginBottom: '16px',
};

const tableStyles: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
};

const tableHeaderRowStyles: React.CSSProperties = {
  borderBottom: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb',
};

const thStyles: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: '11px',
  fontWeight: 700,
  color: '#4b5563',
  textTransform: 'uppercase',
};

const tableRowStyles: React.CSSProperties = {
  borderBottom: '1px solid #f3f4f6',
};

const tdStyles: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 'var(--text-sm, 0.875rem)',
  color: '#1f2937',
};

const purchaseCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: 'var(--radius-xl, 16px)',
  padding: '32px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
};

const partNumberTextStyles: React.CSSProperties = {
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

const badgeStyles: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 700,
  backgroundColor: '#f3f4f6',
  color: '#4b5563',
  padding: '2px 8px',
  borderRadius: '4px',
  textTransform: 'uppercase',
  display: 'inline-block',
  marginBottom: '24px',
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
