const fs = require('fs');
const filePath = 'frontend/src/pages/Checkout/CheckoutPage.tsx';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add import
if (!content.includes("from '@/contexts/GiveawayContext';")) {
  content = content.replace(
    "import { useAuth } from '@/contexts/AuthContext';",
    "import { useAuth } from '@/contexts/AuthContext';\nimport { useGiveaway } from '@/contexts/GiveawayContext';"
  );
  console.log('Added useGiveaway import');
}

// 2. Add giveaway hook & states inside component
const hookTarget = `  const { isAuthenticated, user } = useAuth();
  const { cart, isLoading: cartLoading, selectedItemIds, selectedCartSnapshot } = useCart();`;

const hookAddition = `  const { isAuthenticated, user } = useAuth();
  const { cart, isLoading: cartLoading, selectedItemIds, selectedCartSnapshot } = useCart();
  const {
    promotion: giveawayPromo,
    isActive: isGiveawayActive,
    isOutOfStock: isGiveawayOutOfStock,
    checkEligibility: checkGiveawayEligibility,
    claimGift,
  } = useGiveaway();

  const [claimedGift, setClaimedGift] = useState<any>(null);
  const [showGiveawayModal, setShowGiveawayModal] = useState<boolean>(false);
  const [dismissedGiveawayModal, setDismissedGiveawayModal] = useState<boolean>(false);`;

if (content.includes(hookTarget) && !content.includes('claimedGift, setClaimedGift')) {
  content = content.replace(hookTarget, hookAddition);
  console.log('Added giveaway state hooks');
}

// 3. Add auto-detection useEffect right after computedSubtotal
const effectTarget = `  const deliveryFee = deliveryCalculation && deliveryCalculation.total_delivery_fee !== null ? deliveryCalculation.total_delivery_fee : null;
  const totalPayable = deliveryFee !== null ? Number((computedSubtotal + deliveryFee).toFixed(2)) : null;`;

const effectAddition = `  const deliveryFee = deliveryCalculation && deliveryCalculation.total_delivery_fee !== null ? deliveryCalculation.total_delivery_fee : null;
  const totalPayable = deliveryFee !== null ? Number((computedSubtotal + deliveryFee).toFixed(2)) : null;

  // Auto-detect DOVI Launch Giveaway eligibility
  useEffect(() => {
    const minQualifying = giveawayPromo?.qualifying_subtotal || 30000;
    if (!computedSubtotal || computedSubtotal < minQualifying) {
      if (claimedGift) {
        setClaimedGift(null);
        toast('Promotional EarPod removed because product subtotal is below ₦30,000.', { icon: 'ℹ️' });
      }
      // Re-arm modal if customer dropped below threshold
      setDismissedGiveawayModal(false);
      return;
    }

    // Subtotal >= 30,000: Auto trigger modal if not yet claimed or dismissed
    if (
      !claimedGift &&
      !dismissedGiveawayModal &&
      isGiveawayActive &&
      !isGiveawayOutOfStock
    ) {
      const elig = checkGiveawayEligibility(computedSubtotal);
      if (elig.eligible) {
        setShowGiveawayModal(true);
      }
    }
  }, [
    computedSubtotal,
    claimedGift,
    dismissedGiveawayModal,
    isGiveawayActive,
    isGiveawayOutOfStock,
    checkGiveawayEligibility,
    giveawayPromo,
  ]);`;

if (content.includes(effectTarget) && !content.includes('// Auto-detect DOVI Launch Giveaway eligibility')) {
  content = content.replace(effectTarget, effectAddition);
  console.log('Added auto-detection useEffect');
}

// 4. Update handleProceedToPayment to pass promotional gift item in cart_snapshot and reserve gift
const sessionTarget = `    setIsSubmitting(true);
    try {
      const session = await checkoutApi.initializeSession({
        delivery_address_id: selectedAddressId || activeAddress?.id || 'addr_custom',
        delivery_method_id: 'dovi_direct_delivery',
        delivery_method: 'DOVI Direct Delivery',
        destination_state: effectiveState,
        destination_city: effectiveCity,
        destination_address: formattedAddress,
        recipient_name: effectiveFullName,
        recipient_phone: effectivePhone,
        delivery_calculation: deliveryCalculation || undefined,
        cart_snapshot: selectedCartSnapshot,
        delivery_address: activeAddress || undefined,
      });
      navigate(\`/checkout/\${session.id}\`);`;

const sessionReplacement = `    setIsSubmitting(true);
    try {
      let finalSnapshot = selectedCartSnapshot ? { ...selectedCartSnapshot } : {
        id: \`cart_\${Date.now()}\`,
        items: [...effectiveItems],
        subtotal: computedSubtotal,
        item_count: effectiveItems.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (claimedGift) {
        const giftItemEntry: any = {
          id: claimedGift.id || 'promo-gift-earpod-2026',
          product_id: claimedGift.product_id || 'promo-gift-earpod-2026',
          product_name: claimedGift.name || 'DOVI Free EarPod (Launch Edition)',
          name: claimedGift.name || 'DOVI Free EarPod (Launch Edition)',
          unit_price: '0.00',
          price: '0.00',
          quantity: 1,
          line_total: '0.00',
          is_promotional_gift: true,
          sku: claimedGift.sku || 'DOV-GIFT-EARPOD-2026',
          image_url: claimedGift.image_url,
          product: {
            id: claimedGift.product_id || 'promo-gift-earpod-2026',
            name: claimedGift.name || 'DOVI Free EarPod (Launch Edition)',
            price: '0.00',
            images: [{ image_url: claimedGift.image_url }],
          },
        };
        finalSnapshot = {
          ...finalSnapshot,
          items: [...(finalSnapshot.items || []), giftItemEntry],
        };
      }

      const session = await checkoutApi.initializeSession({
        delivery_address_id: selectedAddressId || activeAddress?.id || 'addr_custom',
        delivery_method_id: 'dovi_direct_delivery',
        delivery_method: 'DOVI Direct Delivery',
        destination_state: effectiveState,
        destination_city: effectiveCity,
        destination_address: formattedAddress,
        recipient_name: effectiveFullName,
        recipient_phone: effectivePhone,
        delivery_calculation: deliveryCalculation || undefined,
        cart_snapshot: finalSnapshot,
        delivery_address: activeAddress || undefined,
      });

      if (claimedGift && session) {
        try {
          await claimGift(session.order_reference || session.id, computedSubtotal);
        } catch {}
      }

      navigate(\`/checkout/\${session.id}\`);`;

if (content.includes(sessionTarget)) {
  content = content.replace(sessionTarget, sessionReplacement);
  console.log('Updated session initialization with giveaway gift injection');
} else {
  console.error('Failed to match sessionTarget');
}

// 5. In Step 2 Ordered Products review, render claimed gift item
const step2Target = `            {/* Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>`;

const step2Replacement = `            {/* Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {claimedGift && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#f0fdf4',
                    border: '1.5px solid #22c55e',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={claimedGift.image_url || 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80'}
                      alt={claimedGift.name}
                      style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#14532d' }}>
                          {claimedGift.name}
                        </span>
                        <span style={{ backgroundColor: '#15803d', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                          FREE GIFT
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#166534', marginTop: '2px' }}>
                        DOVI Launch Giveaway · Complimentary EarPod with HD Audio
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#15803d' }}>
                    FREE (₦0.00)
                  </div>
                </div>
              )}`;

if (content.includes(step2Target) && !content.includes('claimedGift && (')) {
  content = content.replace(step2Target, step2Replacement);
  console.log('Added claimed gift to Step 2 Ordered Products list');
}

// 6. In Price Breakdown summary, render DOVI Launch Giveaway line
const summaryTarget = `          {/* Delivery Fee */}
          <div style={summaryRowStyles}>
            <span style={{ color: '#4b5563' }}>Delivery Fee</span>`;

const summaryReplacement = `          {/* DOVI Launch Giveaway Free EarPod line */}
          {claimedGift && (
            <div style={summaryRowStyles}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ color: '#15803d', fontWeight: 600 }}>DOVI Launch Giveaway</span>
                <span style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px' }}>
                  FREE
                </span>
              </div>
              <span style={{ ...summaryValStyles, color: '#15803d', fontWeight: 700 }}>₦0.00</span>
            </div>
          )}

          {/* Delivery Fee */}
          <div style={summaryRowStyles}>
            <span style={{ color: '#4b5563' }}>Delivery Fee</span>`;

if (content.includes(summaryTarget) && !content.includes('DOVI Launch Giveaway Free EarPod line')) {
  content = content.replace(summaryTarget, summaryReplacement);
  console.log('Added promotional line to Order Summary');
}

// 7. Add Promotional Pop-up Modal at bottom of CheckoutPage return
const modalMarkup = `
      {/* DOVI Launch Giveaway Promotional Pop-Up Modal */}
      {showGiveawayModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backdropFilter: 'blur(3px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowGiveawayModal(false);
              setDismissedGiveawayModal(true);
            }
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '2px solid #ff7a00',
              animation: 'doviFadeIn 0.2s ease-out',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                backgroundColor: '#ff7a00',
                color: '#ffffff',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🎁</span>
                <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Exclusive Launch Reward
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowGiveawayModal(false);
                  setDismissedGiveawayModal(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '22px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  lineHeight: 1,
                  padding: 0,
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 20px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#111827', margin: '0 0 8px', lineHeight: 1.3 }}>
                SHOP ₦30,000 OR MORE AND GET A FREE EARPOD!
              </h3>
              <p style={{ fontSize: '13px', color: '#4b5563', margin: '0 0 16px', lineHeight: 1.5 }}>
                Congratulations! Your product subtotal is <strong>₦{computedSubtotal.toLocaleString()}</strong>. You have unlocked a complimentary DOVI Wireless EarPod with high-definition audio!
              </p>

              {/* Gift Item Card Preview */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  backgroundColor: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  textAlign: 'left',
                  marginBottom: '20px',
                }}
              >
                <img
                  src={giveawayPromo?.gift_item?.image_url || 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80'}
                  alt="DOVI Free EarPod"
                  style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    {giveawayPromo?.gift_item?.name || 'DOVI Free EarPod (Launch Edition)'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Includes portable wireless charging case & crystal-clear mic
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 900, color: '#15803d' }}>
                      ₦0.00
                    </span>
                    <span style={{ backgroundColor: '#15803d', color: '#fff', fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                      FREE GIFT
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setClaimedGift(giveawayPromo?.gift_item || {
                      id: 'promo-gift-earpod-2026',
                      product_id: 'promo-gift-earpod-2026',
                      name: 'DOVI Free EarPod (Launch Edition)',
                      sku: 'DOV-GIFT-EARPOD-2026',
                      image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
                    });
                    setShowGiveawayModal(false);
                    toast.success('Complimentary Free EarPod added to your order!');
                  }}
                  style={{
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    border: 'none',
                    padding: '13px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(21, 128, 61, 0.3)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Claim Free EarPod
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowGiveawayModal(false);
                    setDismissedGiveawayModal(true);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#6b7280',
                    border: 'none',
                    padding: '8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  No thanks, continue without gift
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
`;

const pageEndTarget = `    </div>
  );
}

// Inline CSS Styles Object`;

if (content.includes(pageEndTarget) && !content.includes('DOVI Launch Giveaway Promotional Pop-Up Modal')) {
  content = content.replace(pageEndTarget, modalMarkup + '\n' + pageEndTarget);
  console.log('Added Promotional Pop-Up Modal to CheckoutPage');
} else {
  console.error('Failed to match pageEndTarget');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated CheckoutPage.tsx');
