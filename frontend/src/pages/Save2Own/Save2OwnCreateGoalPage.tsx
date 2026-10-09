import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productsApi } from '@/api/products';
import { save2ownApi } from '@/api/save2own';
import { notificationsApi } from '@/api/notifications';
import { useAuth } from '@/contexts/AuthContext';
import { getProductImageUrl, getProductFallbackImage } from '@/utils/image';
import type { Product, ProductVariant, APIError, Save2OwnEligibilityResponse } from '@/types';
import VariantSelector from '@/components/product/VariantSelector';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';

export default function Save2OwnCreateGoalPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const productId = searchParams.get('productId') || '';
  const initialVariantId = searchParams.get('variantId') || '';

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [plan, setPlan] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<APIError | null>(null);

  // Eligibility & One Active Goal Enforcement
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(true);
  const [eligibility, setEligibility] = useState<Save2OwnEligibilityResponse | null>(null);

  // Participant Identity Registration Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Lagos');
  const [state, setState] = useState('Lagos');
  const [country, setCountry] = useState('Nigeria');
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [termsAcknowledged, setTermsAcknowledged] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prefill default user contact details if available
  useEffect(() => {
    if (user) {
      if (!fullName) {
        const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
        if (name) setFullName(name);
      }
      if (!email && user.email) setEmail(user.email);
      if (!phone && user.phone) {
        setPhone(user.phone);
        if (!whatsappNumber) setWhatsappNumber(user.phone);
      }
    }
  }, [user]);

  // Check active goal eligibility
  useEffect(() => {
    let isMounted = true;
    const checkEligibility = async () => {
      setIsCheckingEligibility(true);
      try {
        const res = await save2ownApi.checkEligibility();
        if (isMounted) {
          setEligibility(res);
        }
      } catch (err) {
        console.warn('Could not verify eligibility (user might not be logged in yet):', err);
      } finally {
        if (isMounted) setIsCheckingEligibility(false);
      }
    };

    checkEligibility();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

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
            ? data.variants.find((v) => v.id === initialVariantId)
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

  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'number' ? val : parseFloat(val || '0');
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload a valid image file (JPG or PNG).');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Selfie image must be less than 10MB.');
        return;
      }
      setSelfieFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setSelfiePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSelfie = () => {
    setSelfieFile(null);
    setSelfiePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateGoal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!product) return;

    // Check Active Goal Block
    if (eligibility && !eligibility.can_create_goal) {
      toast.error('You already have an active Save2Own goal. Only one active goal is permitted.');
      return;
    }

    // Validation
    if (!fullName.trim()) {
      toast.error('Please enter your full legal name.');
      return;
    }
    if (!email.trim()) {
      toast.error('Please enter your email address.');
      return;
    }
    if (!phone.trim()) {
      toast.error('Please enter your phone number.');
      return;
    }
    if (!whatsappNumber.trim()) {
      toast.error('Please enter your WhatsApp phone number.');
      return;
    }
    if (!address.trim()) {
      toast.error('Please enter your residential address.');
      return;
    }
    if (!city.trim()) {
      toast.error('Please enter your city.');
      return;
    }
    if (!state.trim()) {
      toast.error('Please enter your state.');
      return;
    }
    if (!selfieFile) {
      toast.error('A selfie photograph is mandatory to register for Save2Own.');
      return;
    }
    if (!termsAcknowledged) {
      toast.error('You must acknowledge that your registered name and identity will be locked.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('product_id', product.id);
      if (selectedVariant?.id) {
        formData.append('variant_id', selectedVariant.id);
      }
      formData.append('quantity', String(quantity));
      formData.append('contribution_plan', plan);

      // Participant Details
      formData.append('full_name', fullName.trim());
      formData.append('email', email.trim().toLowerCase());
      formData.append('phone', phone.trim());
      formData.append('whatsapp_number', whatsappNumber.trim());
      formData.append('residential_address', address.trim());
      formData.append('city', city.trim());
      formData.append('state', state.trim());
      formData.append('country', country.trim() || 'Nigeria');
      formData.append('terms_acknowledged', 'true');
      formData.append('selfie', selfieFile);

      const result = await save2ownApi.createGoal(formData);

      // Auto-activate the goal
      try {
        await save2ownApi.activate(result.id);
      } catch {
        // Goal may already be active
      }

      try {
        await notificationsApi.create(
          'Save2Own Goal Registered & Locked',
          `Your goal for ${product.name} is active. Identity information is securely locked.`,
          'SUCCESS'
        );
      } catch {}

      toast.success('Save2Own goal registered! Identity information is locked.');
      navigate(`/save2own/goals/${result.id}`);
    } catch (err: any) {
      setError(err);
      const apiErr = err as APIError;
      const errMsg = apiErr?.message || '';

      if (
        errMsg.toLowerCase().includes('unexpected') ||
        errMsg.toLowerCase().includes('server error') ||
        apiErr?.code === 'SERVER_ERROR'
      ) {
        try {
          const check = await save2ownApi.checkEligibility();
          if (!check.can_create_goal && check.active_goal) {
            setEligibility(check);
            toast.error('You already have an active Save2Own goal. Only one active goal is permitted.');
            navigate(`/save2own/goals/${check.active_goal.id}`);
            return;
          }
        } catch {}
      }

      if (apiErr?.details && typeof apiErr.details === 'object' && 'active_goal' in apiErr.details) {
        toast.error('You already have an active Save2Own goal.');
      } else {
        toast.error(apiErr?.message || 'Failed to register Save2Own goal.');
      }
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
              <Link to="/save2own/goals" style={secondaryCtaStyles}>View My Save2Own Goals</Link>
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
              <h3 style={stepTitleStyles}>Register &amp; Lock Identity</h3>
              <p style={stepTextStyles}>Provide your verified legal name and mandatory selfie. Identity is locked to secure your financial agreement.</p>
            </div>
            <div style={stepCardStyles}>
              <div style={stepCircleStyles}>3</div>
              <h3 style={stepTitleStyles}>Bank Transfer Contributions</h3>
              <p style={stepTextStyles}>Transfer directly into the dedicated Dovi Save2Own bank account. Admin verifies each deposit.</p>
            </div>
            <div style={stepCardStyles}>
              <div style={stepCircleStyles}>4</div>
              <h3 style={stepTitleStyles}>Complete &amp; Own</h3>
              <p style={stepTextStyles}>Once target is 100% saved, your order is automatically generated and your product is dispatched!</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ----------------------------------------------------------
  // Render Entry 2: Loading State
  // ----------------------------------------------------------
  if (isLoading || isCheckingEligibility) {
    return (
      <div className="container" style={formPageWrapperStyles}>
        <Skeleton width="180px" height="24px" />
        <div style={splitLayoutStyles}>
          <Skeleton width="100%" height="320px" borderRadius="var(--radius-lg)" />
          <Skeleton width="100%" height="450px" borderRadius="var(--radius-lg)" />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // Render Entry 3: BLOCKED BY ACTIVE GOAL
  // ----------------------------------------------------------
  if (eligibility && !eligibility.can_create_goal && eligibility.active_goal) {
    const activeGoal = eligibility.active_goal;
    const activeProd = activeGoal.product;
    const savedAmount = parseFloat(activeGoal.total_contributed || '0');
    const targetAmount = parseFloat(activeGoal.target_amount || '1');
    const progress = Math.min(100, Math.round((savedAmount / targetAmount) * 100));

    return (
      <div className="container" style={formPageWrapperStyles}>
        <Link to="/products" style={backLinkStyles}>&larr; Back to Marketplace</Link>

        <div style={activeGoalBlockContainerStyles}>
          <div style={blockIconBadgeStyles}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>

          <h1 style={blockTitleStyles}>Active Save2Own Goal in Progress</h1>
          <p style={blockSubStyles}>
            You already have an active Save2Own goal (<strong>{activeGoal.reference_code || 'In Progress'}</strong>).
            To ensure responsible financial planning and strict audit compliance, Dovi allows <strong>only one active Save2Own goal per customer</strong>.
          </p>

          {/* Active Goal Summary Card */}
          <div style={activeGoalCardStyles}>
            <div style={activeGoalProductRowStyles}>
              {activeProd?.primary_image_url ? (
                <img
                  src={activeProd.primary_image_url}
                  alt={activeProd.name}
                  style={activeGoalThumbStyles}
                />
              ) : (
                <div style={activeGoalThumbPlaceholderStyles}>S2O</div>
              )}
              <div style={{ flex: 1 }}>
                <span style={activeGoalStatusBadgeStyles}>{activeGoal.status}</span>
                <h3 style={{ margin: '4px 0', fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)' }}>
                  {activeProd?.name || 'Current Item'}
                </h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  Ref: {activeGoal.reference_code}
                </span>
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Saved: <strong>{formatCurrency(savedAmount)}</strong></span>
                <span style={{ fontWeight: 'var(--font-bold)', color: 'var(--color-primary)' }}>{progress}%</span>
              </div>
              <div style={progressTrackStyles}>
                <div style={{ ...progressBarStyles, width: `${progress}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                <span>Target: {formatCurrency(targetAmount)}</span>
                <span>Remaining: {formatCurrency(Math.max(0, targetAmount - savedAmount))}</span>
              </div>
            </div>
          </div>

          <div style={blockExplanationBoxStyles}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span style={{ fontSize: 'var(--text-xs)', lineHeight: 1.5 }}>
              Your current Save2Own goal must reach an eligible terminal state (completed or cancelled) before another one can be started. You can continue contributing to your goal right now.
            </span>
          </div>

          <div style={blockActionsRowStyles}>
            <button
              type="button"
              onClick={() => navigate(`/save2own/goals/${activeGoal.id}`)}
              style={continueActiveGoalBtnStyles}
            >
              Continue to Existing Save2Own Goal &rarr;
            </button>
            <Link to="/products" style={browseProductsSecondaryBtnStyles}>
              Browse Other Marketplace Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // Render Entry 4: Eligible & Ready to Register Goal
  // ----------------------------------------------------------
  const variantPrice = selectedVariant
    ? (selectedVariant.price_override || selectedVariant.price)
    : null;
  const rawActivePrice = variantPrice || product?.base_price || product?.price || '0';
  const activePrice = rawActivePrice || '0';
  const totalPriceVal = (parseFloat(activePrice) || 0) * quantity;
  const formattedTotal = formatCurrency(totalPriceVal);

  const vendorName = product?.vendor
    ? (typeof product.vendor === 'object' ? product.vendor.name : (product.vendor_name || 'Dovi Partner'))
    : (product?.vendor_name || 'Dovi Partner');

  const fallbackImg = product ? getProductFallbackImage(product) : '/logo.jpg?v=2';
  const primaryImage = (product ? getProductImageUrl(product) : null) || selectedVariant?.image_url || fallbackImg;

  return (
    <div className="container" style={formPageWrapperStyles}>
      <Link to="/products" style={backLinkStyles}>&larr; Back to Marketplace</Link>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div>
          <h1 style={formTitleStyles}>Save2Own Registration &amp; Agreement</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            Collect customer information, lock identity, and set up your direct bank transfer savings goal.
          </p>
        </div>
        <div style={eligibilityPillStyles}>
          <span style={eligibilityDotStyles} />
          <span>Eligible for Save2Own</span>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <ApiErrorMessage error={error} />
        </div>
      )}

      {product && (
        <form onSubmit={handleCreateGoal} style={splitLayoutStyles}>
          {/* Left Column: Product Summary & Goal Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={leftColCardStyles}>
              <img
                src={primaryImage}
                alt={product.name}
                style={previewImgStyles}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = fallbackImg;
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

            {/* Goal Plan Controls */}
            <div style={rightColCardStyles}>
              <h3 style={settingsHeaderStyles}>1. Savings Goal Configuration</h3>

              {/* Variant Selector */}
              {product.variants && product.variants.length > 0 && (
                <div style={settingsRowStyles}>
                  <span style={settingsLabelStyles}>Select Variant / Option</span>
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
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    style={stepperBtnStyles}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span style={qtyValStyles}>{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => prev + 1)}
                    style={stepperBtnStyles}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Contribution Schedule */}
              <div style={settingsRowStyles}>
                <span style={settingsLabelStyles}>Contribution Frequency</span>
                <p style={{ margin: '0 0 var(--space-2) 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  How often you plan to make bank transfer deposits.
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
                        backgroundColor: plan === opt ? 'rgba(255, 122, 0, 0.06)' : '#ffffff',
                        color: plan === opt ? 'var(--color-primary)' : 'var(--color-text)',
                        fontWeight: plan === opt ? 'var(--font-bold)' : 'var(--font-medium)',
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Details */}
              <div style={goalSummaryCardStyles}>
                <div style={summaryRowStyles}>
                  <span style={summaryLabelStyles}>Target Goal Amount:</span>
                  <span style={summaryValueStyles}>{formattedTotal}</span>
                </div>
                <div style={summaryRowStyles}>
                  <span style={summaryLabelStyles}>Estimated Installment:</span>
                  <span style={{ ...summaryValueStyles, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    {plan === 'DAILY' && `${formatCurrency((totalPriceVal / 30).toFixed(2))} / day`}
                    {plan === 'WEEKLY' && `${formatCurrency((totalPriceVal / 10).toFixed(2))} / week`}
                    {plan === 'MONTHLY' && `${formatCurrency((totalPriceVal / 4).toFixed(2))} / month`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Customer Information & Identity Lock */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={rightColCardStyles}>
              <h3 style={settingsHeaderStyles}>2. Customer Identity Information</h3>
              <p style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                All fields are required. This information is legally tied to your Save2Own purchase agreement.
              </p>

              {/* Real Name Warning Banner */}
              <div style={realNameWarningBannerStyles}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)', color: '#92400e' }}>
                      REAL LEGAL NAME &amp; IDENTITY LOCK NOTICE
                    </h4>
                    <p style={{ margin: 0, fontSize: '11px', color: '#78350f', lineHeight: 1.45 }}>
                      <strong>Use your real legal name.</strong> The name and details registered for Save2Own are <strong>locked after registration</strong> and cannot normally be changed without administrative authorization and processing fees.
                    </p>
                    <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#78350f', lineHeight: 1.45 }}>
                      <strong>Bank Account Match:</strong> The name on the bank account used for your Save2Own contributions should match the name registered on your Save2Own account. Transfers from an account with a different name may require additional verification.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-3)' }}>
                <div>
                  <label style={fieldLabelStyles}>
                    Full Legal Name <span style={requiredAsteriskStyles}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Chisom Victor Okoye"
                    style={textInputStyles}
                  />
                  <span style={inputHelpStyles}>Enter your legal name as it appears on your bank account &amp; valid ID.</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label style={fieldLabelStyles}>
                      Email Address <span style={requiredAsteriskStyles}>*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. victor@example.com"
                      style={textInputStyles}
                    />
                  </div>
                  <div>
                    <label style={fieldLabelStyles}>
                      Phone Number <span style={requiredAsteriskStyles}>*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +234 801 234 5678"
                      style={textInputStyles}
                    />
                  </div>
                </div>

                <div>
                  <label style={fieldLabelStyles}>
                    WhatsApp Number <span style={requiredAsteriskStyles}>*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="e.g. +234 801 234 5678"
                    style={textInputStyles}
                  />
                  <span style={inputHelpStyles}>Used for instant payment receipt alerts and shipment delivery coordination.</span>
                </div>

                <div>
                  <label style={fieldLabelStyles}>
                    Residential Address <span style={requiredAsteriskStyles}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Flat 4B, 15 Marina Boulevard, Victoria Island"
                    style={textInputStyles}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)' }}>
                  <div>
                    <label style={fieldLabelStyles}>
                      City <span style={requiredAsteriskStyles}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={textInputStyles}
                    />
                  </div>
                  <div>
                    <label style={fieldLabelStyles}>
                      State <span style={requiredAsteriskStyles}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      style={textInputStyles}
                    />
                  </div>
                  <div>
                    <label style={fieldLabelStyles}>
                      Country <span style={requiredAsteriskStyles}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      style={textInputStyles}
                    />
                  </div>
                </div>

                {/* Mandatory Selfie Photograph */}
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <label style={fieldLabelStyles}>
                    Selfie Photograph <span style={requiredAsteriskStyles}>* (MANDATORY)</span>
                  </label>
                  <p style={{ margin: '0 0 var(--space-2) 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    A clear photo of your face is required for identity verification and fraud prevention. It is permanently stored and locked.
                  </p>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    capture="user"
                    onChange={handleSelfieChange}
                    style={{ display: 'none' }}
                  />

                  {selfiePreview ? (
                    <div style={selfiePreviewBoxStyles}>
                      <img src={selfiePreview} alt="Selfie preview" style={selfieImgStyles} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)', color: 'var(--color-success)' }}>
                          &#10003; Selfie Captured Successfully
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {selfieFile?.name} ({( (selfieFile?.size || 0) / 1024).toFixed(1)} KB)
                        </span>
                        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: '4px' }}>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            style={selfieRetakeBtnStyles}
                          >
                            Retake Photo
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveSelfie}
                            style={selfieRemoveBtnStyles}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={selfieUploadDropzoneStyles}
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                      </svg>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)', color: 'var(--color-text)' }}>
                        Take Selfie or Upload Photo
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        PNG, JPG up to 10MB. Must be a clear picture of your face.
                      </span>
                    </div>
                  )}
                </div>

                {/* Identity Lock Acknowledgment Checkbox */}
                <div style={acknowledgementBoxStyles}>
                  <label style={acknowledgementLabelStyles}>
                    <input
                      type="checkbox"
                      required
                      checked={termsAcknowledged}
                      onChange={(e) => setTermsAcknowledged(e.target.checked)}
                      style={checkboxStyles}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--color-text)', lineHeight: 1.45 }}>
                      <strong>I confirm and acknowledge that:</strong>
                      <br />• The information provided above is my true, accurate legal identity.
                      <br />• I am using my real name, which will match the bank account used for payments.
                      <br />• My registered Save2Own identity information will be <strong>permanently locked</strong> upon registration and cannot be edited without admin authorization.
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !termsAcknowledged || !selfieFile}
                style={{
                  ...submitBtnStyles,
                  marginTop: 'var(--space-4)',
                  opacity: isSubmitting || !termsAcknowledged || !selfieFile ? 0.6 : 1,
                  cursor: isSubmitting || !termsAcknowledged || !selfieFile ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? 'Registering & Locking Identity...' : 'Confirm Identity & Start Save2Own Goal'}
              </button>
            </div>
          </div>
        </form>
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
};

const heroSectionStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-8)',
  marginBottom: 'var(--space-16)',
  flexWrap: 'wrap',
};

const heroTextWrapperStyles: React.CSSProperties = {
  flex: '1 1 450px',
  maxWidth: '600px',
};

const pillBadgeStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 14px',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'rgba(255, 122, 0, 0.08)',
  color: 'var(--color-primary)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-bold)',
  marginBottom: 'var(--space-4)',
};

const heroTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-4xl)',
  fontWeight: 'var(--font-extrabold)',
  lineHeight: 1.15,
  marginBottom: 'var(--space-4)',
  letterSpacing: '-0.02em',
};

const heroSubStyles: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  color: 'var(--color-text-muted)',
  lineHeight: 1.6,
  marginBottom: 'var(--space-6)',
};

const ctaRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-3)',
  flexWrap: 'wrap',
};

const primaryCtaStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '12px 24px',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-sm)',
  textDecoration: 'none',
  transition: 'background-color var(--transition-fast)',
};

const secondaryCtaStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '12px 24px',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--color-bg-subtle)',
  color: 'var(--color-text)',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-sm)',
  textDecoration: 'none',
  border: '1px solid var(--color-border)',
};

const heroImageWrapperStyles: React.CSSProperties = {
  flex: '1 1 320px',
  display: 'flex',
  justifyContent: 'center',
};

const graphicCardStyles: React.CSSProperties = {
  padding: 'var(--space-6)',
  backgroundColor: '#ffffff',
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--color-border)',
  boxShadow: 'var(--shadow-lg)',
  width: '100%',
  maxWidth: '380px',
};

const graphicProgressWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
};

const landingBarBgStyles: React.CSSProperties = {
  height: '10px',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--color-bg-subtle)',
  overflow: 'hidden',
};

const landingBarFillStyles: React.CSSProperties = {
  height: '100%',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--color-primary)',
};

const stepsSectionStyles: React.CSSProperties = {
  borderTop: '1px solid var(--color-border)',
  paddingTop: 'var(--space-12)',
};

const sectionHeadingStyles: React.CSSProperties = {
  fontSize: 'var(--text-2xl)',
  fontWeight: 'var(--font-bold)',
  textAlign: 'center',
  marginBottom: 'var(--space-8)',
};

const stepsGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 'var(--space-6)',
};

const stepCardStyles: React.CSSProperties = {
  padding: 'var(--space-6)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
};

const stepCircleStyles: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-base)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 'var(--space-3)',
};

const stepTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-bold)',
  marginBottom: 'var(--space-2)',
};

const stepTextStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  lineHeight: 1.5,
};

const formPageWrapperStyles: React.CSSProperties = {
  paddingTop: 'var(--space-6)',
  paddingBottom: 'var(--space-16)',
};

const backLinkStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  textDecoration: 'none',
  display: 'inline-block',
  marginBottom: 'var(--space-4)',
};

const formTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-2xl)',
  fontWeight: 'var(--font-extrabold)',
  margin: 0,
};

const eligibilityPillStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'rgba(16, 185, 129, 0.1)',
  color: '#065f46',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-bold)',
};

const eligibilityDotStyles: React.CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: '#10b981',
};

const splitLayoutStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(300px, 380px) 1fr',
  gap: 'var(--space-6)',
  alignItems: 'start',
};

const leftColCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  overflow: 'hidden',
  boxShadow: 'var(--shadow-sm)',
};

const previewImgStyles: React.CSSProperties = {
  width: '100%',
  height: '220px',
  objectFit: 'cover',
};

const previewTextStyles: React.CSSProperties = {
  padding: 'var(--space-4)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
};

const vendorTagStyles: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--color-text-muted)',
  fontWeight: 'var(--font-medium)',
};

const previewTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-bold)',
  margin: 0,
};

const activeVariantBadgeStyles: React.CSSProperties = {
  display: 'inline-flex',
  gap: '8px',
  fontSize: '11px',
  padding: '4px 8px',
  borderRadius: 'var(--radius-sm)',
  backgroundColor: 'var(--color-bg-subtle)',
  color: 'var(--color-text-muted)',
};

const priceContainerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  marginTop: 'var(--space-2)',
  paddingTop: 'var(--space-2)',
  borderTop: '1px solid var(--color-border)',
};

const previewPriceStyles: React.CSSProperties = {
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-extrabold)',
  color: 'var(--color-text)',
};

const rightColCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  padding: 'var(--space-6)',
  boxShadow: 'var(--shadow-sm)',
};

const settingsHeaderStyles: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-bold)',
  margin: '0 0 var(--space-4) 0',
  paddingBottom: 'var(--space-2)',
  borderBottom: '1px solid var(--color-border)',
};

const settingsRowStyles: React.CSSProperties = {
  marginBottom: 'var(--space-4)',
};

const settingsLabelStyles: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-bold)',
  marginBottom: 'var(--space-2)',
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
  border: 'none',
  cursor: 'pointer',
};

const qtyValStyles: React.CSSProperties = {
  width: '46px',
  textAlign: 'center',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
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
};

const submitBtnStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  padding: '14px',
  borderRadius: 'var(--radius-full)',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-sm)',
  textAlign: 'center',
  width: '100%',
  border: 'none',
  transition: 'background-color var(--transition-fast)',
};

const realNameWarningBannerStyles: React.CSSProperties = {
  backgroundColor: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-3)',
  marginBottom: 'var(--space-4)',
};

const fieldLabelStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 'var(--font-bold)',
  marginBottom: '4px',
  color: 'var(--color-text)',
};

const requiredAsteriskStyles: React.CSSProperties = {
  color: '#ef4444',
};

const textInputStyles: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: 'var(--text-xs)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  backgroundColor: '#ffffff',
  color: 'var(--color-text)',
  outline: 'none',
};

const inputHelpStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  color: 'var(--color-text-muted)',
  marginTop: '2px',
};

const selfieUploadDropzoneStyles: React.CSSProperties = {
  border: '2px dashed var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-4)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  cursor: 'pointer',
  backgroundColor: 'var(--color-bg-subtle)',
  textAlign: 'center',
  transition: 'border-color var(--transition-fast)',
};

const selfiePreviewBoxStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  padding: 'var(--space-3)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid #10b981',
  backgroundColor: 'rgba(16, 185, 129, 0.04)',
};

const selfieImgStyles: React.CSSProperties = {
  width: '72px',
  height: '72px',
  borderRadius: 'var(--radius-md)',
  objectFit: 'cover',
  border: '2px solid #10b981',
};

const selfieRetakeBtnStyles: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: '10px',
  fontWeight: 'var(--font-bold)',
  backgroundColor: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
};

const selfieRemoveBtnStyles: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: '10px',
  fontWeight: 'var(--font-bold)',
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  color: '#dc2626',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
};

const acknowledgementBoxStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-bg-subtle)',
  padding: 'var(--space-3)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  marginTop: 'var(--space-2)',
};

const acknowledgementLabelStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  cursor: 'pointer',
};

const checkboxStyles: React.CSSProperties = {
  width: '18px',
  height: '18px',
  marginTop: '2px',
  accentColor: 'var(--color-primary)',
  cursor: 'pointer',
};

// Blocked screen styles
const activeGoalBlockContainerStyles: React.CSSProperties = {
  maxWidth: '580px',
  margin: 'var(--space-8) auto',
  textAlign: 'center',
  padding: 'var(--space-8)',
  backgroundColor: '#ffffff',
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--color-border)',
  boxShadow: 'var(--shadow-md)',
};

const blockIconBadgeStyles: React.CSSProperties = {
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  backgroundColor: '#fef3c7',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 'var(--space-4)',
};

const blockTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-extrabold)',
  margin: '0 0 var(--space-2) 0',
};

const blockSubStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  lineHeight: 1.6,
  marginBottom: 'var(--space-6)',
};

const activeGoalCardStyles: React.CSSProperties = {
  textAlign: 'left',
  padding: 'var(--space-4)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border)',
  marginBottom: 'var(--space-4)',
};

const activeGoalProductRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-3)',
  alignItems: 'center',
};

const activeGoalThumbStyles: React.CSSProperties = {
  width: '56px',
  height: '56px',
  borderRadius: 'var(--radius-md)',
  objectFit: 'cover',
};

const activeGoalThumbPlaceholderStyles: React.CSSProperties = {
  width: '56px',
  height: '56px',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--color-border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-xs)',
};

const activeGoalStatusBadgeStyles: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '10px',
  fontWeight: 'var(--font-bold)',
  padding: '2px 6px',
  borderRadius: 'var(--radius-sm)',
  backgroundColor: 'rgba(255, 122, 0, 0.1)',
  color: 'var(--color-primary)',
};

const progressTrackStyles: React.CSSProperties = {
  height: '6px',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--color-border)',
  overflow: 'hidden',
};

const progressBarStyles: React.CSSProperties = {
  height: '100%',
  backgroundColor: 'var(--color-primary)',
  borderRadius: 'var(--radius-full)',
};

const blockExplanationBoxStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  textAlign: 'left',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-3)',
  color: 'var(--color-text-muted)',
  marginBottom: 'var(--space-6)',
};

const blockActionsRowStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
};

const continueActiveGoalBtnStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  padding: '12px 20px',
  borderRadius: 'var(--radius-full)',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-sm)',
  border: 'none',
  cursor: 'pointer',
};

const browseProductsSecondaryBtnStyles: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  fontSize: 'var(--text-xs)',
  textDecoration: 'none',
  padding: '8px',
};
