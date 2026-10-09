import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { save2ownApi } from '@/api/save2own';
import { productsApi } from '@/api/products';
import { getProductImageUrl, getProductFallbackImage } from '@/utils/image';
import type { Save2OwnGoal, PaymentAccount, Product, ProductVariant, APIError } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import VariantSelector from '@/components/product/VariantSelector';
import { NoInternetBanner } from '@/components/common/NoInternetBanner';

export default function Save2OwnGoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [goal, setGoal] = useState<Save2OwnGoal | null>(null);
  const [bankAccount, setBankAccount] = useState<PaymentAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionPending, setIsActionPending] = useState(false);
  const [error, setError] = useState<APIError | null>(null);

  // Contribution Modal / State (Direct Bank Transfer)
  const [contribAmount, setContribAmount] = useState('');
  const [transferReference, setTransferReference] = useState('');
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showContribModal, setShowContribModal] = useState(false);

  // Edit Modal / State (Product, Variant, Qty)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editVariant, setEditVariant] = useState<ProductVariant | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [isEditProductLoading, setIsEditProductLoading] = useState(false);

  // Confirmation Modals
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);

  // Cancellation / Refund Destination State
  const [cancelReason, setCancelReason] = useState('');
  const [cancelBankName, setCancelBankName] = useState('');
  const [cancelAccountNumber, setCancelAccountNumber] = useState('');
  const [cancelAccountName, setCancelAccountName] = useState('');

  // Refund details
  const [refundStatus, setRefundStatus] = useState<any>(null);

  // Participant Identity & Admin Unlock State
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showEditIdentityModal, setShowEditIdentityModal] = useState(false);
  const [unlockCodeInput, setUnlockCodeInput] = useState('');
  const [verifiedCode, setVerifiedCode] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isUpdatingIdentity, setIsUpdatingIdentity] = useState(false);

  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editReason, setEditReason] = useState('');

  const fetchGoalDetails = useCallback(async (showSkeleton = true) => {
    if (!id) return;
    if (showSkeleton) setIsLoading(true);
    setError(null);
    try {
      const [goalData, activeAccount] = await Promise.all([
        save2ownApi.getGoal(id),
        save2ownApi.getActivePaymentAccount('save2own').catch(() => null),
      ]);
      setGoal(goalData);
      setBankAccount(activeAccount);

      if (goalData.installment_amount) {
        setContribAmount(goalData.installment_amount);
      }

      // If status is REFUND_PENDING, fetch refund status details
      if (goalData.status === 'REFUND_PENDING') {
        const refundData = await save2ownApi.getRefundStatus(id).catch(() => null);
        setRefundStatus(refundData);
      }
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load Save2Own goal details.');
    } finally {
      if (showSkeleton) setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchGoalDetails();
  }, [fetchGoalDetails]);

  // Handle URL payment verification callback
  useEffect(() => {
    const checkVerify = async () => {
      const verifyRef = searchParams.get('verifyRef');
      const paymentRef = searchParams.get('payment_ref');
      if (verifyRef || paymentRef) {
        toast.loading('Verifying your payment contribution...');
        // Clear search params to prevent loop
        setSearchParams({}, { replace: true });

        // Wait 3 seconds, then poll/fetch
        setTimeout(async () => {
          try {
            await fetchGoalDetails(false);
            toast.dismiss();
            toast.success('Contribution status updated!');
          } catch {
            toast.dismiss();
          }
        }, 3000);
      }
    };
    if (goal) {
      checkVerify();
    }
  }, [goal, searchParams, setSearchParams, fetchGoalDetails]);

  const formatCurrency = (val: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(parseFloat(val || '0'));
  };

  // ----------------------------------------------------------
  // Goal Action Handlers
  // ----------------------------------------------------------
  const handlePause = async () => {
    if (!id) return;
    setIsActionPending(true);
    try {
      await save2ownApi.pause(id);
      toast.success('Goal paused successfully.');
      setShowPauseModal(false);
      await fetchGoalDetails(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to pause goal.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleActivate = async () => {
    if (!id) return;
    setIsActionPending(true);
    try {
      await save2ownApi.activate(id);
      toast.success('Goal activated successfully!');
      await fetchGoalDetails(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to activate goal.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleResume = async () => {
    if (!id) return;
    setIsActionPending(true);
    try {
      await save2ownApi.resume(id);
      toast.success('Goal resumed successfully!');
      await fetchGoalDetails(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to resume goal.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleCancel = async () => {
    if (!id || !goal) return;
    const savedNum = parseFloat(String(goal.confirmed_balance ?? goal.saved_amount ?? 0));
    const hasFunds = !isNaN(savedNum) && savedNum > 0;

    if (hasFunds && (!cancelBankName.trim() || !cancelAccountNumber.trim() || !cancelAccountName.trim())) {
      toast.error('Please enter your destination bank details so we can process your refund.');
      return;
    }

    setIsActionPending(true);
    try {
      await save2ownApi.cancel(id, {
        reason: cancelReason.trim() || 'Goal cancelled by customer.',
        customer_bank_name: cancelBankName.trim() || undefined,
        customer_account_number: cancelAccountNumber.trim() || undefined,
        customer_account_name: cancelAccountName.trim() || undefined,
      });
      toast.success(
        hasFunds
          ? 'Goal cancelled. Your refund has been submitted to the queue for admin approval & payout!'
          : 'Goal cancelled successfully.'
      );
      setShowCancelModal(false);
      await fetchGoalDetails(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel goal.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleCheckout = async () => {
    if (!id) return;
    setIsActionPending(true);
    try {
      const result = await save2ownApi.checkout(id);
      toast.success('Save2Own goal checked out successfully!');
      if (result?.order_reference) {
        navigate(`/orders/${result.order_reference}`);
      } else {
        navigate('/dashboard/orders');
      }
    } catch (err: any) {
      toast.error(err.message || 'Checkout failed. Please try again.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleAcknowledgePrice = async () => {
    if (!id || !goal) return;
    setIsActionPending(true);
    try {
      // Transition from PRICE_CHANGED back to ACTIVE by sending empty patch or update
      await save2ownApi.updateGoal(id, { quantity: goal.quantity });
      toast.success('Acknowledged price change. Goal is active.');
      await fetchGoalDetails(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to acknowledge price change.');
    } finally {
      setIsActionPending(false);
    }
  };

  // ----------------------------------------------------------
  // Contribution Handlers (Direct Bank Transfer)
  // ----------------------------------------------------------
  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const openContribModal = () => {
    if (goal) {
      const defaultAmount =
        goal.installment_amount ||
        (goal.remaining_amount && parseFloat(goal.remaining_amount) > 0
          ? goal.remaining_amount
          : goal.target_amount
          ? Math.ceil(parseFloat(goal.target_amount) / 10).toString()
          : '');
      setContribAmount(defaultAmount);
      setTransferReference('');
      setPaymentProofFile(null);
      setPaymentProofPreview(null);
    }
    setShowContribModal(true);
  };

  const handleContributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !contribAmount || parseFloat(contribAmount) <= 0) {
      toast.error('Please enter a valid contribution amount.');
      return;
    }
    setIsActionPending(true);
    try {
      await save2ownApi.contribute(id, {
        amount: contribAmount,
        transfer_reference: transferReference.trim() || undefined,
        payment_proof: paymentProofFile || undefined,
      });
      toast.success('Transfer submitted! Your contribution is pending verification.');
      setShowContribModal(false);
      setPaymentProofFile(null);
      setPaymentProofPreview(null);
      setTransferReference('');
      await fetchGoalDetails(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit transfer.');
    } finally {
      setIsActionPending(false);
    }
  };

  // ----------------------------------------------------------
  // Edit Goal Settings Handlers (Product, Variant, Qty)
  // ----------------------------------------------------------
  const openEditModal = async () => {
    if (!goal) return;
    setShowEditModal(true);
    setIsEditProductLoading(true);
    try {
      if (goal.product?.id) {
        const fullProduct = await productsApi.getById(goal.product.id);
        setEditProduct(fullProduct);
        setEditQuantity(goal.quantity);
        if (goal.variant && fullProduct.variants) {
          const matching = fullProduct.variants.find(v => v.id === goal.variant?.id);
          setEditVariant(matching || null);
        }
      }
    } catch {
      toast.error('Failed to load product configurations.');
      setShowEditModal(false);
    } finally {
      setIsEditProductLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!id || !goal) return;
    setIsActionPending(true);
    try {
      const payload = {
        variant_id: editVariant?.id || undefined,
        quantity: editQuantity,
      };
      await save2ownApi.updateGoal(id, payload);
      toast.success('Goal updated successfully.');
      setShowEditModal(false);
      await fetchGoalDetails(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update goal configurations.');
    } finally {
      setIsActionPending(false);
    }
  };

  // ----------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------
  const getStatusBadgeStyles = (status: string): React.CSSProperties => {
    let backgroundColor = 'rgba(107, 114, 128, 0.12)';
    let color = 'var(--color-text-muted)';

    switch (status) {
      case 'ACTIVE':
        backgroundColor = 'rgba(39, 174, 96, 0.12)';
        color = 'var(--color-success)';
        break;
      case 'PAUSED':
        backgroundColor = 'rgba(255, 159, 67, 0.12)';
        color = 'var(--color-warning)';
        break;
      case 'COMPLETED':
        backgroundColor = 'rgba(103, 58, 183, 0.12)';
        color = '#673ab7';
        break;
      case 'CANCELLED':
      case 'PRODUCT_UNAVAILABLE':
      case 'SUSPENDED':
        backgroundColor = 'rgba(239, 68, 68, 0.12)';
        color = 'var(--color-danger)';
        break;
      case 'PRICE_CHANGED':
      case 'PAYMENT_REVIEW':
      case 'REFUND_PENDING':
        backgroundColor = 'rgba(255, 159, 67, 0.12)';
        color = 'var(--color-warning)';
        break;
    }

    return {
      backgroundColor,
      color,
      padding: '6px 12px',
      borderRadius: 'var(--radius-sm)',
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--font-bold)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      display: 'inline-block',
    };
  };

  const handleVerifyUnlockCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !unlockCodeInput.trim()) return;

    setIsVerifyingCode(true);
    try {
      const code = unlockCodeInput.trim().toUpperCase();
      const res = await save2ownApi.verifyUnlockCode(id, code);
      setVerifiedCode(code);
      setShowUnlockModal(false);

      // Pre-fill identity editing inputs
      const p = res.participant || goal?.participant;
      if (p) {
        setEditFullName(p.full_name || '');
        setEditPhone(p.phone || '');
        setEditWhatsapp(p.whatsapp_number || '');
        setEditAddress(p.address || '');
        setEditCity(p.city || '');
        setEditState(p.state || '');
      }
      setEditReason('');
      setShowEditIdentityModal(true);

      // Refresh goal in state with new unlock status
      if (goal) {
        setGoal({
          ...goal,
          participant: res.participant,
        });
      }

      toast.success(
        res.message || 'Unlock code verified! Temporary edit window is now open.'
      );
    } catch (err: any) {
      toast.error(err?.message || 'Invalid, expired, or already used unlock code.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleUpdateIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!editFullName.trim()) {
      toast.error('Legal full name is required.');
      return;
    }
    if (!editReason.trim()) {
      toast.error('Please state the reason for updating this registered identity.');
      return;
    }

    setIsUpdatingIdentity(true);
    try {
      await save2ownApi.updateParticipantIdentity(id, {
        code: verifiedCode,
        full_name: editFullName.trim(),
        phone: editPhone.trim(),
        whatsapp_number: editWhatsapp.trim(),
        residential_address: editAddress.trim(),
        city: editCity.trim(),
        state: editState.trim(),
        reason: editReason.trim(),
      });

      setShowEditIdentityModal(false);
      toast.success('Save2Own identity information updated and permanently re-locked.');
      await fetchGoalDetails(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update identity information.');
    } finally {
      setIsUpdatingIdentity(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container" style={pageWrapperStyles}>
        <Skeleton width="150px" height="20px" />
        <div style={{ marginTop: 'var(--space-2)' }}>
          <Skeleton width="300px" height="32px" />
        </div>
        <div style={gridWrapperStyles}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Skeleton width="100%" height="220px" borderRadius="var(--radius-lg)" />
            <Skeleton width="100%" height="150px" borderRadius="var(--radius-lg)" />
          </div>
          <Skeleton width="100%" height="300px" borderRadius="var(--radius-lg)" />
        </div>
      </div>
    );
  }

  if (error || !goal) {
    if (!navigator.onLine || error?.code === 'NETWORK_ERROR' || error?.message?.toLowerCase().includes('internet signal')) {
      return (
        <div className="container" style={pageWrapperStyles}>
          <NoInternetBanner onRetry={() => fetchGoalDetails(true)} />
        </div>
      );
    }
    return (
      <div className="container" style={pageWrapperStyles}>
        <Link to="/dashboard/save2own" style={backLinkStyles}>&larr; Back to Goals</Link>
        <div style={{ textAlign: 'center', padding: 'var(--space-12) 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}>⚠️</div>
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>Couldn't fetch item</h3>
          <p style={{ color: 'var(--color-text-muted)', margin: 'var(--space-2) 0 var(--space-4) 0' }}>
            We couldn't retrieve this goal item from the database.
          </p>
          <button onClick={() => fetchGoalDetails(true)} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  const formattedTarget = formatCurrency(goal.target_amount);
  const formattedContributed = formatCurrency(goal.total_contributed);
  const formattedRemaining = formatCurrency(goal.remaining_amount);

  return (
    <div className="container" style={pageWrapperStyles}>
      <div style={topNavRowStyles}>
        <Link to="/dashboard/save2own" style={backLinkStyles}>&larr; Back to Goals</Link>
        <span style={getStatusBadgeStyles(goal.status)}>{goal.status.replace('_', ' ')}</span>
      </div>

      {/* Goal Status Message Banners */}
      {goal.status === 'PRODUCT_UNAVAILABLE' && (
        <div style={alertBannerStyles('var(--color-danger)')}>
          <strong>⚠️ Product Unavailable:</strong> This product or variant is currently unavailable. Please select another variant or choose a new product for your goal.
          <button type="button" onClick={openEditModal} style={alertBannerActionStyles}>
            Configure Goal &rarr;
          </button>
        </div>
      )}

      {goal.status === 'PRICE_CHANGED' && (
        <div style={alertBannerStyles('var(--color-warning)')}>
          <strong>⚠️ Target Price Changed:</strong> The vendor has updated the price of this item.
          <div style={{ marginTop: 'var(--space-2)', display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-xs)' }}>
            <span>Original Target: <strong>{formattedTarget}</strong></span>
          </div>
          <button type="button" onClick={handleAcknowledgePrice} disabled={isActionPending} style={alertBannerActionStyles}>
            Accept New Price &amp; Activate &rarr;
          </button>
        </div>
      )}

      {goal.status === 'PAYMENT_REVIEW' && (
        <div style={alertBannerStyles('var(--color-warning)')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }}>
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <strong>Under Review:</strong> A recent contribution payment is currently under verification review by system admins. Active contributions are temporarily paused.
        </div>
      )}

      {goal.status === 'REFUND_PENDING' && (
        <div style={alertBannerStyles('var(--color-warning)')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }}>
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          <strong>Refund Pending:</strong> Your cancellation request is approved and contributions are queued for refund.
          {refundStatus && (
            <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
              <span>Refund Status: <strong>{refundStatus.status}</strong></span>
              {refundStatus.admin_note && <p style={{ margin: '4px 0 0 0' }}>Notes: {refundStatus.admin_note}</p>}
            </div>
          )}
        </div>
      )}

      {goal.status === 'SUSPENDED' && (
        <div style={alertBannerStyles('var(--color-danger)')}>
          <strong>🚫 Suspended Goal:</strong> This Save2Own goal has been suspended by administration. Contributions are blocked. Please contact support.
        </div>
      )}

      <div style={gridWrapperStyles}>
        {/* Left Column: Progress Tracker + Product Info */}
        <div style={leftColStyles}>
          {/* Progress Card */}
          <div style={cardStyles}>
            <h3 style={cardTitleStyles}>Progress Tracker</h3>

            <div style={progressWrapperStyles}>
              <div style={progressBarBgStyles}>
                <div style={{ ...progressBarFillStyles, width: `${Math.min(goal.progress_percentage, 100)}%` }} />
              </div>
              <div style={progressPercentRowStyles}>
                <span style={progressPercentLabelStyles}>{goal.progress_percentage}% Completed</span>
                <span style={remainingAmountLabelStyles}>{formattedRemaining} left</span>
              </div>
            </div>

            <div style={financialDetailsGridStyles}>
              <div style={financialItemStyles}>
                <span style={financialLabelStyles}>Contributed</span>
                <span style={financialValueStyles}>{formattedContributed}</span>
              </div>
              <div style={financialItemStyles}>
                <span style={financialLabelStyles}>Target Goal</span>
                <span style={financialValueStyles}>{formattedTarget}</span>
              </div>
              {goal.target_date && (
                <div style={financialItemStyles}>
                  <span style={financialLabelStyles}>Estimated Date</span>
                  <span style={financialValueStyles}>
                    {new Date(goal.target_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}
            </div>

            {/* Action CTAs */}
            <div style={actionRowStyles}>
              {goal.status === 'DRAFT' && (
                <button type="button" onClick={handleActivate} disabled={isActionPending} style={primaryActionBtnStyles}>
                  Activate Saving Goal
                </button>
              )}

              {goal.status === 'ACTIVE' && (
                <>
                  <button type="button" onClick={openContribModal} style={primaryActionBtnStyles}>
                    Make Contribution
                  </button>
                  <button type="button" onClick={() => setShowPauseModal(true)} style={secondaryActionBtnStyles}>
                    Pause
                  </button>
                  <button type="button" onClick={() => setShowCancelModal(true)} style={dangerActionBtnStyles}>
                    Cancel Goal
                  </button>
                </>
              )}

              {goal.status === 'PAUSED' && (
                <>
                  <button type="button" onClick={handleResume} disabled={isActionPending} style={primaryActionBtnStyles}>
                    Resume Saving
                  </button>
                  <button type="button" onClick={() => setShowCancelModal(true)} style={dangerActionBtnStyles}>
                    Cancel Goal
                  </button>
                </>
              )}

              {goal.status === 'COMPLETED' && (
                <button type="button" onClick={handleCheckout} disabled={isActionPending} style={checkoutActionBtnStyles}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="6"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                  </svg>
                  <span>Complete Checkout &amp; Order</span>
                </button>
              )}
            </div>
          </div>

          {/* Product Detail Card */}
          <div style={cardStyles}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={cardTitleStyles}>Product Target</h3>
              {(goal.status === 'ACTIVE' || goal.status === 'PAUSED') && (
                <button type="button" onClick={openEditModal} style={editConfigLinkStyles}>
                  Change Goal Settings
                </button>
              )}
            </div>
            <div style={productRowStyles}>
              <img
                src={goal.variant?.image_url || (goal.product ? getProductImageUrl(goal.product) : null) || '/logo.jpg?v=2'}
                alt={goal.product?.name || 'Goal Product'}
                style={productImgStyles}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = goal.product
                    ? getProductFallbackImage(goal.product)
                    : '/logo.jpg?v=2';
                }}
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 'var(--font-bold)', textTransform: 'uppercase' }}>
                  Vendor: {goal.product?.vendor?.name || goal.product?.vendor_name || 'Dovi Partner'}
                </span>
                {goal.product?.id ? (
                  <Link to={`/products/${goal.product.id}`} style={productNameLinkStyles}>
                    {goal.product.name}
                  </Link>
                ) : (
                  <span style={{ ...productNameLinkStyles, cursor: 'default' }}>
                    {goal.product?.name || 'Goal Product'}
                  </span>
                )}
                {goal.variant && (
                  <div style={variantWrapperStyles}>
                    {goal.variant.attributes && typeof goal.variant.attributes === 'object' ? (
                      Object.entries(goal.variant.attributes).map(([k, v]) => (
                        <span key={k} style={variantTagStyles}>
                          {k}: {v}
                        </span>
                      ))
                    ) : (
                      <span style={variantTagStyles}>{goal.variant.name || 'Selected Variant'}</span>
                    )}
                  </div>
                )}
                <span style={qtyDisplayStyles}>Quantity: <strong>{goal.quantity}</strong></span>
              </div>
            </div>
          </div>

          {/* Save2Own Participant Identity Card */}
          <div style={cardStyles}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🔒</span>
                <h3 style={{ ...cardTitleStyles, margin: 0 }}>Save2Own Participant Identity</h3>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: goal.participant?.identity_locked ? 'rgba(15, 23, 42, 0.08)' : 'rgba(16, 185, 129, 0.12)',
                  color: goal.participant?.identity_locked ? 'var(--color-text)' : '#059669',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {goal.participant?.identity_locked ? '🔒 IDENTITY LOCKED' : '🔓 EDIT WINDOW OPEN'}
              </span>
            </div>

            <div
              style={{
                padding: 'var(--space-3)',
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: 'var(--text-xs)',
                lineHeight: 1.6,
                marginBottom: 'var(--space-3)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Registered Legal Name:</span>
                <strong style={{ color: 'var(--color-text)' }}>{goal.participant?.full_name || 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Email:</span>
                <span>{goal.participant?.email || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Phone / WhatsApp:</span>
                <span>{goal.participant?.phone || 'N/A'} / {goal.participant?.whatsapp_number || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Location:</span>
                <span>{goal.participant?.city || 'Lagos'}, {goal.participant?.state || 'Lagos'}, {goal.participant?.country || 'Nigeria'}</span>
              </div>
            </div>

            {goal.participant?.identity_locked ? (
              <div>
                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    color: 'var(--color-text-muted)',
                    marginBottom: 'var(--space-3)',
                  }}
                >
                  🛡️ <strong>Save2Own information locked.</strong> You cannot edit your registered Save2Own information directly. If you need a legal correction, contact Dovi Support to request an authorized unlock code.
                </div>
                <button
                  type="button"
                  onClick={() => setShowUnlockModal(true)}
                  style={{
                    width: '100%',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  🔑 Enter Save2Own Edit Code
                </button>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid #a7f3d0',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    color: '#065f46',
                    marginBottom: 'var(--space-3)',
                  }}
                >
                  ⏱️ <strong>Temporary Edit Window Active!</strong> Window expires at{' '}
                  {goal.participant?.identity_unlock_expires_at
                    ? new Date(goal.participant.identity_unlock_expires_at).toLocaleTimeString()
                    : '30 minutes'}
                  . Editing will automatically re-lock upon submission.
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditIdentityModal(true)}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-primary)',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  ✏️ Edit Save2Own Identity Information
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Timelines & History */}
        <div style={rightColStyles}>
          {/* Contribution History Timeline */}
          <div style={cardStyles}>
            <h3 style={cardTitleStyles}>Contribution History</h3>
            {goal.contributions && goal.contributions.length > 0 ? (
              <div style={timelineWrapperStyles}>
                {goal.contributions.map((c) => {
                  const isConfirmed = c.status === 'CONFIRMED' || c.payment_status === 'SUCCESSFUL';
                  const isRejected = c.status === 'REJECTED' || c.payment_status === 'FAILED';
                  const statusLabel = isConfirmed
                    ? 'CONFIRMED'
                    : isRejected
                    ? 'REJECTED'
                    : 'PENDING VERIFICATION';

                  return (
                    <div key={c.id} style={timelineRowStyles}>
                      <div
                        style={{
                          ...timelineDotStyles(isConfirmed ? 'SUCCESSFUL' : isRejected ? 'FAILED' : 'PENDING'),
                          backgroundColor: isConfirmed ? '#10b981' : isRejected ? '#ef4444' : '#f59e0b',
                        }}
                      />
                      <div style={timelineContentStyles}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px' }}>
                          <span style={timelineAmountStyles}>{formatCurrency(c.amount)}</span>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                              backgroundColor: isConfirmed
                                ? 'rgba(16, 185, 129, 0.12)'
                                : isRejected
                                ? 'rgba(239, 68, 68, 0.12)'
                                : 'rgba(245, 158, 11, 0.15)',
                              color: isConfirmed ? '#059669' : isRejected ? '#dc2626' : '#d97706',
                            }}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        <div style={timelineMetaRowStyles}>
                          <span>Ref: {c.transfer_reference || c.payment_reference || 'N/A'}</span>
                          <span>{new Date(c.created_at).toLocaleString()}</span>
                        </div>
                        {c.bank_name_snapshot && (
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                            Paid to: <strong>{c.bank_name_snapshot}</strong> ({c.account_number_snapshot})
                          </div>
                        )}
                        {c.payment_proof && (
                          <div style={{ fontSize: '11px', marginTop: '3px' }}>
                            <a
                              href={c.payment_proof}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
                            >
                              📎 View Payment Receipt
                            </a>
                          </div>
                        )}
                        {c.rejection_reason && (
                          <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px', fontWeight: 500 }}>
                            Rejection Reason: {c.rejection_reason}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center', padding: 'var(--space-4) 0' }}>
                No contributions made yet.
              </p>
            )}
          </div>

          {/* Product/Target Changes History */}
          {goal.product_changes && goal.product_changes.length > 0 && (
            <div style={cardStyles}>
              <h3 style={cardTitleStyles}>Goal History Events</h3>
              <div style={changeListWrapperStyles}>
                {goal.product_changes.map((ch) => (
                  <div key={ch.id} style={changeItemStyles}>
                    <span style={changeDateStyles}>{new Date(ch.changed_at).toLocaleDateString()}</span>
                    <div style={changeMetaStyles}>
                      {ch.old_product?.id !== ch.new_product?.id ? (
                        <p style={{ margin: 0 }}>
                          Product changed from <strong>{ch.old_product?.name || 'Previous Product'}</strong> to <strong>{ch.new_product?.name || 'New Product'}</strong>.
                        </p>
                      ) : (
                        <p style={{ margin: 0 }}>Product details configuration updated.</p>
                      )}
                      {ch.old_target !== ch.new_target && (
                        <p style={{ margin: '4px 0 0 0' }}>
                          Target amount updated from <strong>{formatCurrency(ch.old_target)}</strong> to <strong>{formatCurrency(ch.new_target)}</strong>.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------------
          MODAL: Make Contribution
          ---------------------------------------------------------- */}
      {showContribModal && (
        <div style={modalBackdropStyles}>
          <div style={{ ...modalContentStyles, maxWidth: '540px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>🏦</span>
                <div>
                  <h3 style={{ ...modalTitleStyles, margin: 0, fontSize: '18px' }}>SAVE2OWN BANK TRANSFER</h3>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Dedicated Direct Commerce Account</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowContribModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                ✕
              </button>
            </div>

            {/* Dedicated Save2Own Bank Account Details Card */}
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                marginBottom: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Bank Name
                </span>
                <span style={{ fontSize: '13px', fontWeight: 'var(--font-bold)', color: 'var(--color-text)' }}>
                  {bankAccount?.bank_name || 'Dovi Partner Bank'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Account Name
                </span>
                <span style={{ fontSize: '13px', fontWeight: 'var(--font-bold)', color: 'var(--color-text)' }}>
                  {bankAccount?.account_name || 'DOVI DIRECT / SAVE2OWN'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, display: 'block' }}>
                    Account Number
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 'var(--font-extrabold)', letterSpacing: '1px', color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                    {bankAccount?.account_number || '0123456789'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(bankAccount?.account_number || '', 'Account Number')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: copiedField === 'Account Number' ? '#10b981' : 'var(--color-primary)',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {copiedField === 'Account Number' ? '✓ Copied' : 'Copy Number'}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, display: 'block' }}>
                    Transfer Reference / Narration
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 'var(--font-bold)', color: 'var(--color-text)', fontFamily: 'monospace' }}>
                    {goal.reference_code || `S2O-${goal.id.slice(0, 8).toUpperCase()}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(goal.reference_code || `S2O-${goal.id.slice(0, 8).toUpperCase()}`, 'Transfer Reference')}
                  style={{
                    padding: '5px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: copiedField === 'Transfer Reference' ? '#10b981' : 'rgba(255, 122, 0, 0.12)',
                    color: copiedField === 'Transfer Reference' ? '#ffffff' : 'var(--color-primary)',
                    border: '1px solid var(--color-primary)',
                    cursor: 'pointer',
                  }}
                >
                  {copiedField === 'Transfer Reference' ? '✓ Copied' : 'Copy Ref'}
                </button>
              </div>

              {bankAccount?.instructions && (
                <div style={{ marginTop: 'var(--space-1)', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'rgba(255, 159, 67, 0.1)', borderRadius: 'var(--radius-sm)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  📌 <strong>Instructions:</strong> {bankAccount.instructions}
                </div>
              )}
            </div>

            {/* Section 15: Payment Account Name Warning */}
            <div
              style={{
                padding: 'var(--space-3)',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                marginBottom: 'var(--space-4)',
              }}
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>⚠️</span>
              <div>
                <h5 style={{ margin: '0 0 2px 0', fontSize: '11px', fontWeight: 'var(--font-bold)', color: '#92400e' }}>
                  PAYMENT ACCOUNT NAME REQUIREMENT
                </h5>
                <p style={{ margin: 0, fontSize: '11px', color: '#78350f', lineHeight: 1.45 }}>
                  <strong>IMPORTANT:</strong> The account name used to make your Save2Own transfer should match the name registered on your Save2Own account (<strong>{goal.participant?.full_name || 'your registered name'}</strong>).
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#92400e' }}>
                  Transfers from an account with a different name may require additional manual verification by administration.
                </p>
              </div>
            </div>

            <form onSubmit={handleContributeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-1)' }}>
                  <label style={modalLabelStyles}>Amount to Save (NGN) *</label>
                  {goal.installment_amount && (
                    <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 'var(--font-semibold)' }}>
                      Schedule: ₦{parseFloat(goal.installment_amount).toLocaleString()}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Enter amount transferred"
                  value={contribAmount}
                  onChange={(e) => setContribAmount(e.target.value)}
                  style={modalInputStyles}
                />
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
                  {goal.installment_amount && (
                    <button
                      type="button"
                      onClick={() => setContribAmount(goal.installment_amount || '')}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: contribAmount === goal.installment_amount ? 'rgba(255, 122, 0, 0.12)' : 'var(--color-surface)',
                        border: `1px solid ${contribAmount === goal.installment_amount ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        color: contribAmount === goal.installment_amount ? 'var(--color-primary)' : 'var(--color-text)',
                        cursor: 'pointer',
                        fontWeight: 'var(--font-medium)',
                      }}
                    >
                      ⚡ Scheduled: ₦{parseFloat(goal.installment_amount).toLocaleString()}
                    </button>
                  )}
                  {goal.remaining_amount && parseFloat(goal.remaining_amount) > 0 && (
                    <button
                      type="button"
                      onClick={() => setContribAmount(goal.remaining_amount)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: contribAmount === goal.remaining_amount ? 'rgba(255, 122, 0, 0.12)' : 'var(--color-surface)',
                        border: `1px solid ${contribAmount === goal.remaining_amount ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        color: contribAmount === goal.remaining_amount ? 'var(--color-primary)' : 'var(--color-text)',
                        cursor: 'pointer',
                        fontWeight: 'var(--font-medium)',
                      }}
                    >
                      Pay Full Remaining: ₦{parseFloat(goal.remaining_amount).toLocaleString()}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label style={modalLabelStyles}>Sender Bank Narration / Reference (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Sender Name or Bank Transaction Ref"
                  value={transferReference}
                  onChange={(e) => setTransferReference(e.target.value)}
                  style={modalInputStyles}
                />
              </div>

              <div>
                <label style={modalLabelStyles}>Payment Receipt / Proof (Optional)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setPaymentProofFile(file);
                    if (file && file.type.startsWith('image/')) {
                      setPaymentProofPreview(URL.createObjectURL(file));
                    } else {
                      setPaymentProofPreview(null);
                    }
                  }}
                  style={{ ...modalInputStyles, padding: '8px' }}
                />
                {paymentProofPreview && (
                  <div style={{ marginTop: 'var(--space-2)' }}>
                    <img src={paymentProofPreview} alt="Receipt preview" style={{ maxHeight: '90px', borderRadius: '4px', border: '1px solid var(--color-border)' }} />
                  </div>
                )}
              </div>

              <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', borderRadius: 'var(--radius-sm)', padding: '10px', fontSize: '11px', color: '#1d4ed8', lineHeight: 1.4 }}>
                ℹ️ Status will be set to <strong>Pending Verification</strong> until our finance admin verifies the credit. Your goal balance will automatically update once confirmed.
              </div>

              <div style={modalActionsStyles}>
                <button
                  type="button"
                  onClick={() => {
                    setShowContribModal(false);
                    setPaymentProofFile(null);
                    setPaymentProofPreview(null);
                  }}
                  style={modalCancelBtnStyles}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionPending}
                  style={{
                    ...modalSubmitBtnStyles,
                    backgroundColor: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {isActionPending ? 'Submitting Transfer...' : "I've Made the Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------
          MODAL: Pause Goal
          ---------------------------------------------------------- */}
      {showPauseModal && (
        <div style={modalBackdropStyles}>
          <div style={modalContentStyles}>
            <h3 style={modalTitleStyles}>Pause Goal Contributions</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: '0 0 var(--space-4) 0' }}>
              Are you sure you want to pause contributions for this goal? You can resume your goal at any time.
            </p>
            <div style={modalActionsStyles}>
              <button type="button" onClick={() => setShowPauseModal(false)} style={modalCancelBtnStyles}>
                Close
              </button>
              <button type="button" onClick={handlePause} disabled={isActionPending} style={modalSubmitBtnStyles}>
                Confirm Pause
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------
          MODAL: Cancel Goal (Refund Queue)
          ---------------------------------------------------------- */}
      {showCancelModal && (
        <div style={modalBackdropStyles}>
          <div style={modalContentStyles}>
            <h3 style={modalTitleStyles}>Cancel Goal</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: '0 0 var(--space-4) 0' }}>
              Are you sure you want to cancel this goal? Any contributions made will be queued for refund automatically. This action is irreversible.
            </p>
            <div style={modalActionsStyles}>
              <button type="button" onClick={() => setShowCancelModal(false)} style={modalCancelBtnStyles}>
                Go Back
              </button>
              <button type="button" onClick={handleCancel} disabled={isActionPending} style={modalDangerSubmitBtnStyles}>
                Yes, Cancel Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------
          MODAL: Goal Configuration (Change Options/Qty)
          ---------------------------------------------------------- */}
      {showEditModal && (
        <div style={modalBackdropStyles}>
          <div style={{ ...modalContentStyles, maxWidth: '520px' }}>
            <h3 style={modalTitleStyles}>Goal Configurations</h3>

            {isEditProductLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: 'var(--space-4) 0' }}>
                <Skeleton width="100%" height="80px" />
                <Skeleton width="100%" height="40px" />
              </div>
            ) : (
              editProduct && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {/* Variant selector */}
                  {editProduct.variants && editProduct.variants.length > 0 && (
                    <div>
                      <label style={modalLabelStyles}>Variant Attributes</label>
                      <VariantSelector
                        variants={editProduct.variants}
                        selectedVariant={editVariant}
                        onVariantChange={setEditVariant}
                      />
                    </div>
                  )}

                  {/* Quantity selector */}
                  <div>
                    <label style={modalLabelStyles}>Quantity</label>
                    <div style={qtyStepperStyles}>
                      <button
                        type="button"
                        onClick={() => setEditQuantity(prev => Math.max(1, prev - 1))}
                        style={stepperBtnStyles}
                        disabled={editQuantity <= 1}
                      >
                        -
                      </button>
                      <span style={qtyValStyles}>{editQuantity}</span>
                      <button
                        type="button"
                        onClick={() => setEditQuantity(prev => prev + 1)}
                        style={stepperBtnStyles}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div style={modalActionsStyles}>
                    <button type="button" onClick={() => setShowEditModal(false)} style={modalCancelBtnStyles}>
                      Cancel
                    </button>
                    <button type="button" onClick={handleEditSubmit} disabled={isActionPending} style={modalSubmitBtnStyles}>
                      Save Configurations
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------
          MODAL: Enter Save2Own Unlock Code
          ---------------------------------------------------------- */}
      {showUnlockModal && (
        <div style={modalBackdropStyles}>
          <div style={{ ...modalContentStyles, maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🔑</span>
                <h3 style={{ ...modalTitleStyles, margin: 0 }}>Enter Save2Own Edit Code</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUnlockModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 'var(--space-4)' }}>
              Your Save2Own identity information is permanently locked to this financial agreement. If an administrator authorized a legal correction, enter your one-time unlock code below to open a temporary 30-minute editing window.
            </p>

            <form onSubmit={handleVerifyUnlockCode} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={modalLabelStyles}>Save2Own Unlock Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S2O-ABC123"
                  value={unlockCodeInput}
                  onChange={(e) => setUnlockCodeInput(e.target.value.toUpperCase())}
                  style={{
                    ...modalInputStyles,
                    fontFamily: 'monospace',
                    letterSpacing: '2px',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                  }}
                />
                <span style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  One-time use code generated and authorized by Dovi administrators.
                </span>
              </div>

              <div style={modalActionsStyles}>
                <button
                  type="button"
                  onClick={() => setShowUnlockModal(false)}
                  style={modalCancelBtnStyles}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingCode || !unlockCodeInput.trim()}
                  style={{
                    ...modalSubmitBtnStyles,
                    backgroundColor: 'var(--color-primary)',
                    opacity: isVerifyingCode || !unlockCodeInput.trim() ? 0.6 : 1,
                  }}
                >
                  {isVerifyingCode ? 'Verifying Code...' : 'Verify Code & Open Edit Window'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------
          MODAL: Edit Save2Own Identity (Temporary Window)
          ---------------------------------------------------------- */}
      {showEditIdentityModal && (
        <div style={modalBackdropStyles}>
          <div style={{ ...modalContentStyles, maxWidth: '540px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>✏️</span>
                <h3 style={{ ...modalTitleStyles, margin: 0 }}>Authorized Identity Correction</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditIdentityModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                ✕
              </button>
            </div>

            <div style={{
              padding: '8px 12px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              color: '#92400e',
              marginBottom: 'var(--space-4)',
              lineHeight: 1.45,
            }}>
              ⚖️ <strong>Permanent Audit Trail:</strong> All changes made here are recorded in the permanent audit ledger with previous and new values, authorization reference (Code: <code>{verifiedCode}</code>), and timestamps. The record will immediately re-lock upon submission.
            </div>

            <form onSubmit={handleUpdateIdentitySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label style={modalLabelStyles}>Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  style={modalInputStyles}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                <div>
                  <label style={modalLabelStyles}>Phone Number</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    style={modalInputStyles}
                  />
                </div>
                <div>
                  <label style={modalLabelStyles}>WhatsApp Number</label>
                  <input
                    type="tel"
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(e.target.value)}
                    style={modalInputStyles}
                  />
                </div>
              </div>

              <div>
                <label style={modalLabelStyles}>Residential Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  style={modalInputStyles}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                <div>
                  <label style={modalLabelStyles}>City</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    style={modalInputStyles}
                  />
                </div>
                <div>
                  <label style={modalLabelStyles}>State</label>
                  <input
                    type="text"
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    style={modalInputStyles}
                  />
                </div>
              </div>

              <div>
                <label style={modalLabelStyles}>Reason for Identity Correction *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Legal surname correction after official name update"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  style={{
                    ...modalInputStyles,
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={modalActionsStyles}>
                <button
                  type="button"
                  onClick={() => setShowEditIdentityModal(false)}
                  style={modalCancelBtnStyles}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingIdentity || !editFullName.trim() || !editReason.trim()}
                  style={{
                    ...modalSubmitBtnStyles,
                    backgroundColor: 'var(--color-primary)',
                    opacity: isUpdatingIdentity || !editFullName.trim() || !editReason.trim() ? 0.6 : 1,
                  }}
                >
                  {isUpdatingIdentity ? 'Submitting & Re-locking...' : 'Submit & Re-lock Identity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const pageWrapperStyles: React.CSSProperties = {
  paddingTop: 'var(--space-4)',
  paddingBottom: 'var(--space-12)',
};

const topNavRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 'var(--space-4)',
};

const backLinkStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-primary)',
  fontWeight: 'var(--font-semibold)',
  textDecoration: 'none',
  display: 'inline-block',
};

const alertBannerStyles = (color: string): React.CSSProperties => ({
  width: '100%',
  padding: 'var(--space-4)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: `${color}10`,
  border: `1px solid ${color}40`,
  color: 'var(--color-text)',
  fontSize: 'var(--text-sm)',
  marginBottom: 'var(--space-5)',
  lineHeight: 1.5,
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-1)',
  alignItems: 'flex-start',
});

const alertBannerActionStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-primary)',
  fontWeight: 'var(--font-bold)',
  border: 'none',
  background: 'none',
  padding: '6px 0 0 0',
  cursor: 'pointer',
};

const gridWrapperStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 'var(--space-6)',
  alignItems: 'start',
};

const leftColStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-6)',
};

const rightColStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-6)',
};

const cardStyles: React.CSSProperties = {
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: '#ffffff',
  padding: 'var(--space-5)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
};

const cardTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  margin: 0,
};

const progressWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
};

const progressBarBgStyles: React.CSSProperties = {
  width: '100%',
  height: '12px',
  backgroundColor: 'var(--color-border)',
  borderRadius: 'var(--radius-full)',
  overflow: 'hidden',
  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
};

const progressBarFillStyles: React.CSSProperties = {
  height: '100%',
  background: 'linear-gradient(90deg, var(--color-primary) 0%, #ffb800 100%)',
  borderRadius: 'var(--radius-full)',
  transition: 'width var(--transition-slow) ease-out',
  boxShadow: '0 0 8px rgba(255, 122, 0, 0.4)',
};

const progressPercentRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-bold)',
};

const progressPercentLabelStyles: React.CSSProperties = {
  color: 'var(--color-primary)',
};

const remainingAmountLabelStyles: React.CSSProperties = {
  color: 'var(--color-text-muted)',
};

const financialDetailsGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 'var(--space-2)',
  paddingTop: 'var(--space-2)',
  borderTop: '1px solid var(--color-border)',
};

const financialItemStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const financialLabelStyles: React.CSSProperties = {
  fontSize: '9px',
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  fontWeight: 'var(--font-semibold)',
};

const financialValueStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
};

const actionRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-2)',
  marginTop: 'var(--space-2)',
  flexWrap: 'wrap',
};

const primaryActionBtnStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  padding: '10px 20px',
  borderRadius: 'var(--radius-full)',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-xs)',
  transition: 'background-color var(--transition-fast)',
  flex: 1,
  minWidth: '120px',
  textAlign: 'center',
};

const secondaryActionBtnStyles: React.CSSProperties = {
  border: '2px solid var(--color-border)',
  color: 'var(--color-text)',
  padding: '8px 20px',
  borderRadius: 'var(--radius-full)',
  fontWeight: 'var(--font-semibold)',
  fontSize: 'var(--text-xs)',
  transition: 'all var(--transition-fast)',
  backgroundColor: '#ffffff',
  flex: 1,
  minWidth: '80px',
  textAlign: 'center',
};

const dangerActionBtnStyles: React.CSSProperties = {
  border: '2px solid var(--color-danger)',
  color: 'var(--color-danger)',
  padding: '8px 20px',
  borderRadius: 'var(--radius-full)',
  fontWeight: 'var(--font-semibold)',
  fontSize: 'var(--text-xs)',
  transition: 'all var(--transition-fast)',
  backgroundColor: '#ffffff',
  flex: 1,
  minWidth: '80px',
  textAlign: 'center',
};

const checkoutActionBtnStyles: React.CSSProperties = {
  ...primaryActionBtnStyles,
  background: 'linear-gradient(135deg, #673ab7 0%, #9c27b0 100%)',
  boxShadow: '0 4px 15px rgba(103, 58, 183, 0.3)',
};

const editConfigLinkStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-primary)',
  fontWeight: 'var(--font-semibold)',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
};

const productRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-4)',
};

const productImgStyles: React.CSSProperties = {
  width: '80px',
  height: '80px',
  objectFit: 'cover',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-bg-subtle)',
};

const productNameLinkStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  textDecoration: 'none',
  lineHeight: 1.4,
};

const variantWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--space-1)',
};

const variantTagStyles: React.CSSProperties = {
  fontSize: '10px',
  backgroundColor: 'var(--color-bg-subtle)',
  color: 'var(--color-text-muted)',
  padding: '3px 8px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  textTransform: 'capitalize',
};

const qtyDisplayStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  marginTop: '2px',
};

const timelineWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  paddingLeft: 'var(--space-4)',
  borderLeft: '2px solid var(--color-border)',
  gap: 'var(--space-4)',
  marginLeft: 'var(--space-2)',
};

const timelineRowStyles: React.CSSProperties = {
  display: 'flex',
  position: 'relative',
  alignItems: 'flex-start',
};

const timelineDotStyles = (status: string): React.CSSProperties => {
  let backgroundColor = 'var(--color-text-muted)';
  if (status === 'SUCCESSFUL') backgroundColor = 'var(--color-success)';
  else if (status === 'FAILED') backgroundColor = 'var(--color-danger)';
  else if (status === 'PENDING') backgroundColor = 'var(--color-warning)';

  return {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor,
    position: 'absolute',
    left: '-23px',
    top: '4px',
    border: '2px solid #ffffff',
  };
};

const timelineContentStyles: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const timelineAmountStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
};


const timelineMetaRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '10px',
  color: 'var(--color-text-muted)',
};

const changeListWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const changeItemStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  borderBottom: '1px solid var(--color-border)',
  paddingBottom: 'var(--space-3)',
};

const changeDateStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text-muted)',
};

const changeMetaStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text)',
  lineHeight: 1.4,
};

const modalBackdropStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 999,
  padding: 'var(--space-4)',
};

const modalContentStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: 'var(--radius-lg)',
  width: '100%',
  maxWidth: '440px',
  padding: 'var(--space-6)',
  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
};

const modalTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  margin: '0 0 var(--space-4) 0',
  borderBottom: '1px solid var(--color-border)',
  paddingBottom: 'var(--space-2)',
};

const modalLabelStyles: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text-muted)',
  marginBottom: 'var(--space-1)',
};

const modalInputStyles: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  fontSize: 'var(--text-sm)',
  marginBottom: 'var(--space-3)',
  outline: 'none',
};


const modalActionsStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 'var(--space-2)',
  marginTop: 'var(--space-4)',
};

const modalCancelBtnStyles: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--color-border)',
  backgroundColor: '#ffffff',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  cursor: 'pointer',
};

const modalSubmitBtnStyles: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--color-primary)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-bold)',
  color: '#ffffff',
  cursor: 'pointer',
};

const modalDangerSubmitBtnStyles: React.CSSProperties = {
  ...modalSubmitBtnStyles,
  backgroundColor: 'var(--color-danger)',
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
