import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productsApi } from '@/api/products';
import { save2ownApi } from '@/api/save2own';
import type { Product, ProductVariant, APIError } from '@/types';
import VariantSelector from '@/components/product/VariantSelector';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';

export default function Save2OwnCreateGoalPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const productId = searchParams.get('productId') || '';
  const initialVariantId = searchParams.get('variantId') || '';

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [plan, setPlan] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<APIError | null>(null);

  // Fetch product if productId is in query parameter
  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await productsApi.getById(productId);
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          const matchingVariant = initialVariantId
            ? data.variants.find(v => v.id === initialVariantId)
            : data.variants[0];
          setSelectedVariant(matchingVariant || data.variants[0]);
        }
      } catch (err: any) {
        setError(err);
        toast.error('Failed to load product details for Save2Own.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId, initialVariantId]);

  const formatCurrency = (val: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(parseFloat(val || '0'));
  };

  const handleCreateGoal = async () => {
    if (!product) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        product_id: product.id,
        variant_id: selectedVariant?.id,
        quantity,
        contribution_plan: plan,
      };
      const result = await save2ownApi.createGoal(payload);
      toast.success('Save2Own goal created successfully!');
      navigate(`/save2own/goals/${result.id}`);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to create Save2Own goal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------------
  // Render Entry 1: S2O Explainer Landing Page (No Product Selected)
  // ----------------------------------------------------------
  if (!productId) {
    return (
      <div style={landingWrapperStyles}>
        {/* Hero Section */}
        <section style={heroSectionStyles}>
          <div style={heroTextWrapperStyles}>
            <span style={pillBadgeStyles}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
              <span>Interest-Free Purchase Option</span>
            </span>
            <h1 style={heroTitleStyles}>Save2Own with Zero Stress</h1>
            <p style={heroSubStyles}>
              Don't let budget boundaries stop you. Lock down price security on your favorite items, save over time at your own pace, and own them once your goal is reached.
            </p>
            <div style={ctaRowStyles}>
              <Link to="/products" style={primaryCtaStyles}>Browse Marketplace Products</Link>
              <Link to="/dashboard/save2own" style={secondaryCtaStyles}>View My Active Goals</Link>
            </div>
          </div>
          <div style={heroImageWrapperStyles}>
            <div style={graphicCardStyles}>
              <div style={graphicProgressWrapperStyles}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)', color: 'var(--color-primary)' }}>PROGRESS TRACKER</span>
                <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>75% Saved</span>
                <div style={landingBarBgStyles}>
                  <div style={{ ...landingBarFillStyles, width: '75%' }} />
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Only ₦15,000 remaining to own!</span>
              </div>
            </div>
          </div>
        </section>

        {/* Steps Section */}
        <section style={stepsSectionStyles}>
          <h2 style={sectionHeadingStyles}>How Save2Own Works</h2>
          <div style={stepsGridStyles}>
            <div style={stepCardStyles}>
              <div style={stepCircleStyles}>1</div>
              <h3 style={stepTitleStyles}>Choose Product</h3>
              <p style={stepTextStyles}>Find any eligible item in the marketplace and select the Save2Own option instead of standard checkout.</p>
            </div>
            <div style={stepCardStyles}>
              <div style={stepCircleStyles}>2</div>
              <h3 style={stepTitleStyles}>Define Saving Plan</h3>
              <p style={stepTextStyles}>Select a comfortable frequency (daily, weekly, monthly) and amount that matches your personal budget.</p>
            </div>
            <div style={stepCardStyles}>
              <div style={stepCircleStyles}>3</div>
              <h3 style={stepTitleStyles}>Complete &amp; Own</h3>
              <p style={stepTextStyles}>Make contribution deposits securely. Once target is 100% saved, complete checkout and your item is shipped!</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ----------------------------------------------------------
  // Render Entry 2: Loading State
  // ----------------------------------------------------------
  if (isLoading) {
    return (
      <div className="container" style={formPageWrapperStyles}>
        <Skeleton width="180px" height="24px" />
        <div style={splitLayoutStyles}>
          <Skeleton width="100%" height="280px" borderRadius="var(--radius-lg)" />
          <Skeleton width="100%" height="320px" borderRadius="var(--radius-lg)" />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // Render Entry 3: Product Selected & Goal Creation Flow
  // ----------------------------------------------------------
  const variantPrice = selectedVariant
    ? (selectedVariant.price_override || selectedVariant.price)
    : null;
  const rawActivePrice = variantPrice || product?.base_price || product?.price || '0';
  const activePrice = rawActivePrice || '0';
  const totalPriceVal = (parseFloat(activePrice) || 0) * quantity;
  const formattedTotal = formatCurrency(totalPriceVal.toString());

  const vendorName = product?.vendor
    ? (typeof product.vendor === 'object' ? product.vendor.name : (product.vendor_name || 'Dovi Partner'))
    : (product?.vendor_name || 'Dovi Partner');

  const primaryImage = selectedVariant?.image_url || product?.images?.[0]?.url || '/logo.jpg?v=2';

  return (
    <div className="container" style={formPageWrapperStyles}>
      <Link to="/products" style={backLinkStyles}>&larr; Back to Marketplace</Link>

      <h1 style={formTitleStyles}>Set Up Save2Own Goal</h1>

      {error && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <ApiErrorMessage error={error} />
        </div>
      )}

      {product && (
        <div style={splitLayoutStyles}>
          {/* Left Column: Product Info Card */}
          <div style={leftColCardStyles}>
            <img
              src={primaryImage}
              alt={product.name}
              style={previewImgStyles}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.jpg?v=2';
              }}
            />
            <div style={previewTextStyles}>
              <span style={vendorTagStyles}>Vendor: {vendorName}</span>
              <h2 style={previewTitleStyles}>{product.name}</h2>
              {selectedVariant && (
                <div style={activeVariantBadgeStyles}>
                  {selectedVariant.attributes && typeof selectedVariant.attributes === 'object' ? (
                    Object.entries(selectedVariant.attributes).map(([k, v]) => (
                      <span key={k} style={{ textTransform: 'capitalize' }}>
                        <strong>{k}:</strong> {v}
                      </span>
                    ))
                  ) : (
                    <span>{selectedVariant.name}</span>
                  )}
                </div>
              )}
              <div style={priceContainerStyles}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Unit Price</span>
                <span style={previewPriceStyles}>{formatCurrency(activePrice)}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Goal Settings Form */}
          <div style={rightColCardStyles}>
            <h3 style={settingsHeaderStyles}>Goal Settings</h3>

            {/* Variant Selector */}
            {product.variants && product.variants.length > 0 && (
              <div style={settingsRowStyles}>
                <span style={settingsLabelStyles}>Select Options</span>
                <VariantSelector
                  variants={product.variants}
                  selectedVariant={selectedVariant}
                  onVariantChange={setSelectedVariant}
                />
              </div>
            )}

            {/* Quantity Selector */}
            <div style={settingsRowStyles}>
              <span style={settingsLabelStyles}>Quantity</span>
              <div style={qtyStepperStyles}>
                <button
                  type="button"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  style={stepperBtnStyles}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span style={qtyValStyles}>{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(prev => prev + 1)}
                  style={stepperBtnStyles}
                >
                  +
                </button>
              </div>
            </div>

            {/* Contribution Plan Selection */}
            <div style={settingsRowStyles}>
              <span style={settingsLabelStyles}>Contribution Schedule</span>
              <p style={{ margin: '0 0 var(--space-2) 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Choose how often you intend to save contribution deposits.
              </p>
              <div style={planOptionsGridStyles}>
                {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setPlan(opt)}
                    style={{
                      ...planOptBtnStyles,
                      borderColor: plan === opt ? 'var(--color-primary)' : 'var(--color-border)',
                      backgroundColor: plan === opt ? 'rgba(255, 122, 0, 0.04)' : '#ffffff',
                      color: plan === opt ? 'var(--color-primary)' : 'var(--color-text)',
                      fontWeight: plan === opt ? 'var(--font-bold)' : 'var(--font-medium)',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary details */}
            <div style={goalSummaryCardStyles}>
              <div style={summaryRowStyles}>
                <span style={summaryLabelStyles}>Target Goal Amount:</span>
                <span style={summaryValueStyles}>{formattedTotal}</span>
              </div>
              <div style={summaryRowStyles}>
                <span style={summaryLabelStyles}>Estimated Payment:</span>
                <span style={{ ...summaryValueStyles, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  {plan === 'DAILY' && `${formatCurrency((totalPriceVal / 30).toFixed(2))} / day`}
                  {plan === 'WEEKLY' && `${formatCurrency((totalPriceVal / 10).toFixed(2))} / week`}
                  {plan === 'MONTHLY' && `${formatCurrency((totalPriceVal / 4).toFixed(2))} / month`}
                </span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleCreateGoal}
              disabled={isSubmitting}
              style={{
                ...submitBtnStyles,
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Creating Goal...' : 'Confirm & Start Saving'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const landingWrapperStyles: React.CSSProperties = {
  paddingTop: 'var(--space-8)',
  paddingBottom: 'var(--space-16)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-16)',
};

const heroSectionStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  alignItems: 'center',
  gap: 'var(--space-10)',
};

const heroTextWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
};

const pillBadgeStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-bold)',
  backgroundColor: 'rgba(255, 122, 0, 0.12)',
  color: 'var(--color-primary)',
  padding: '6px 14px',
  borderRadius: 'var(--radius-full)',
  width: 'fit-content',
};

const heroTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-4xl)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  lineHeight: 1.2,
  margin: 0,
};

const heroSubStyles: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  color: 'var(--color-text-muted)',
  lineHeight: 1.6,
  margin: 0,
};

const ctaRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-3)',
  marginTop: 'var(--space-2)',
  flexWrap: 'wrap',
};

const primaryCtaStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: 'var(--radius-full)',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-sm)',
  textDecoration: 'none',
  textAlign: 'center',
};

const secondaryCtaStyles: React.CSSProperties = {
  border: '2px solid var(--color-border)',
  color: 'var(--color-text)',
  padding: '10px 24px',
  borderRadius: 'var(--radius-full)',
  fontWeight: 'var(--font-semibold)',
  fontSize: 'var(--text-sm)',
  textDecoration: 'none',
  textAlign: 'center',
  backgroundColor: '#ffffff',
};

const heroImageWrapperStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const graphicCardStyles: React.CSSProperties = {
  width: '320px',
  padding: 'var(--space-6)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-xl)',
  backgroundColor: '#ffffff',
  boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
  position: 'relative',
};

const graphicProgressWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const landingBarBgStyles: React.CSSProperties = {
  width: '100%',
  height: '10px',
  backgroundColor: 'var(--color-border)',
  borderRadius: 'var(--radius-full)',
  overflow: 'hidden',
};

const landingBarFillStyles: React.CSSProperties = {
  height: '100%',
  background: 'linear-gradient(90deg, var(--color-primary) 0%, #ffb800 100%)',
  borderRadius: 'var(--radius-full)',
};

const stepsSectionStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-8)',
  borderTop: '1px solid var(--color-border)',
  paddingTop: 'var(--space-12)',
};

const sectionHeadingStyles: React.CSSProperties = {
  fontSize: 'var(--text-2xl)',
  fontWeight: 'var(--font-bold)',
  textAlign: 'center',
  color: 'var(--color-text)',
  margin: 0,
};

const stepsGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 'var(--space-6)',
};

const stepCardStyles: React.CSSProperties = {
  padding: 'var(--space-6)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--color-bg-subtle)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: 'var(--space-3)',
};

const stepCircleStyles: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--font-bold)',
};

const stepTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  margin: 0,
};

const stepTextStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
  lineHeight: 1.5,
  margin: 0,
};

const formPageWrapperStyles: React.CSSProperties = {
  paddingTop: 'var(--space-6)',
  paddingBottom: 'var(--space-12)',
};

const backLinkStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-primary)',
  fontWeight: 'var(--font-semibold)',
  textDecoration: 'none',
  display: 'inline-block',
  marginBottom: 'var(--space-4)',
};

const formTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-2xl)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  marginBottom: 'var(--space-6)',
  margin: 0,
};

const splitLayoutStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 'var(--space-8)',
  alignItems: 'start',
};

const leftColCardStyles: React.CSSProperties = {
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: '#ffffff',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
};

const previewImgStyles: React.CSSProperties = {
  width: '100%',
  height: '320px',
  objectFit: 'cover',
  backgroundColor: 'var(--color-bg-subtle)',
};

const previewTextStyles: React.CSSProperties = {
  padding: 'var(--space-5)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const vendorTagStyles: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const previewTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  margin: 0,
  lineHeight: 1.4,
};

const activeVariantBadgeStyles: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--space-2)',
  fontSize: '11px',
  backgroundColor: 'var(--color-bg-subtle)',
  padding: '6px 12px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
};

const priceContainerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  marginTop: 'var(--space-2)',
};

const previewPriceStyles: React.CSSProperties = {
  fontSize: 'var(--text-2xl)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-primary)',
};

const rightColCardStyles: React.CSSProperties = {
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: '#ffffff',
  padding: 'var(--space-6)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-5)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
};

const settingsHeaderStyles: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  margin: 0,
  borderBottom: '1px solid var(--color-border)',
  paddingBottom: 'var(--space-2)',
};

const settingsRowStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
};

const settingsLabelStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text)',
};

const qtyStepperStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  width: 'fit-content',
  overflow: 'hidden',
};

const stepperBtnStyles: React.CSSProperties = {
  width: '38px',
  height: '38px',
  backgroundColor: 'var(--color-bg-subtle)',
  color: 'var(--color-text)',
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--font-bold)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color var(--transition-fast)',
  userSelect: 'none',
};

const qtyValStyles: React.CSSProperties = {
  width: '46px',
  textAlign: 'center',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
};

const planOptionsGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 'var(--space-2)',
};

const planOptBtnStyles: React.CSSProperties = {
  padding: '10px',
  borderRadius: 'var(--radius-md)',
  border: '2px solid',
  textAlign: 'center',
  fontSize: 'var(--text-xs)',
  transition: 'all var(--transition-fast)',
  cursor: 'pointer',
};

const goalSummaryCardStyles: React.CSSProperties = {
  padding: 'var(--space-4)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
};

const summaryRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const summaryLabelStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text-muted)',
};

const summaryValueStyles: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
};

const submitBtnStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  padding: '12px',
  borderRadius: 'var(--radius-full)',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-sm)',
  textAlign: 'center',
  width: '100%',
  transition: 'background-color var(--transition-fast)',
  cursor: 'pointer',
};
