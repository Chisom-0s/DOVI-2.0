import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/api/auth';
import { checkoutApi } from '@/api/checkout';
import { deliveryApi } from '@/api/delivery';
import {
  NIGERIAN_STATES,
  resolveCanonicalStateName,
  listConfiguredCitiesForState,
  selectDestinationState,
  canonicalCityKey,
} from '@/services/deliveryPricingService';
import type {
  Address,
  CartItem,
  DeliveryCalculationResult,
  DeliveryRoute,
} from '@/types';
import { Skeleton } from '@/components/common/Skeleton';

const DOVI_SUPPORT_WHATSAPP = '2347014109517';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { cart, isLoading: cartLoading } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [activeRoutes, setActiveRoutes] = useState<DeliveryRoute[]>([]);
  const [destinationState, setDestinationState] = useState<string>('');
  const [destinationCity, setDestinationCity] = useState<string>('');
  // Guard so asynchronous address loads never overwrite user's intentional selection
  const userChoseDestinationRef = useRef(false);
  const [customCityMode, setCustomCityMode] = useState(false);
  const [deliveryCalculation, setDeliveryCalculation] = useState<DeliveryCalculationResult | null>(null);
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manual agreed delivery fee state (when customer arranges delivery via WhatsApp)
  const [agreedFeeInput, setAgreedFeeInput] = useState<string>('');
  const [showAgreedFeeBox, setShowAgreedFeeBox] = useState<boolean>(false);
  const [confirmedCustomFee, setConfirmedCustomFee] = useState<number | null>(null);

  // New Address Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingAddr, setAddingAddr] = useState(false);
  const [addrForm, setAddrForm] = useState({
    label: 'Home',
    full_name: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    country: 'Nigeria',
    postal_code: '',
    is_default: true,
  });

  // Items from cart (strictly cart-based checkout, no direct-buy bypass)
  const effectiveItems: CartItem[] = useMemo(() => {
    return cart?.items || [];
  }, [cart?.items]);

  // Fetch routes and addresses
  const fetchData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const routes = await deliveryApi.getActiveRoutes();
      setActiveRoutes(routes);

      if (!isAuthenticated) {
        setShowAddForm(true);
        setIsLoadingData(false);
        return;
      }

      const addrs = await authApi.getAddresses();
      setAddresses(addrs);
      if (addrs.length > 0) {
        const defaultAddr = addrs.find((a: Address) => a.is_default) || addrs[0];
        setSelectedAddressId(defaultAddr.id);
        if (!userChoseDestinationRef.current) {
          applyDestination(defaultAddr.state, defaultAddr.city);
        }
      } else {
        setShowAddForm(true);
      }
    } catch {
      setShowAddForm(true);
    } finally {
      setIsLoadingData(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh active routes when window regains focus so admin changes are immediately seen
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        deliveryApi.getActiveRoutes().then(setActiveRoutes).catch(() => {});
      }
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) || null,
    [addresses, selectedAddressId]
  );

  function applyDestination(rawState: string | null | undefined, rawCity: string | null | undefined) {
    const canonicalState = resolveCanonicalStateName(rawState) || (rawState || '').trim();
    const city = (rawCity || '').trim();
    setDestinationState(canonicalState);
    setDestinationCity(city);
    setCustomCityMode(false);
    setConfirmedCustomFee(null);
  }

  const handleStateChange = (nextState: string) => {
    userChoseDestinationRef.current = true;
    const next = selectDestinationState(nextState);
    setDestinationState(next.state);
    setDestinationCity(next.city);
    setCustomCityMode(false);
    setConfirmedCustomFee(null);
    setAddrForm((p) => ({ ...p, state: next.state, city: next.city }));
  };

  const handleCityChange = (nextCity: string) => {
    userChoseDestinationRef.current = true;
    setDestinationCity(nextCity);
    setConfirmedCustomFee(null);
    setAddrForm((p) => ({ ...p, city: nextCity }));
  };

  const handleSelectAddress = (addr: Address) => {
    userChoseDestinationRef.current = true;
    setSelectedAddressId(addr.id);
    applyDestination(addr.state, addr.city);
  };

  const hasDestination = Boolean(destinationState.trim() && destinationCity.trim());

  // Recalculate delivery pricing whenever destination, cart items, or active routes change
  useEffect(() => {
    let cancelled = false;
    if (effectiveItems.length === 0 || !hasDestination) {
      setDeliveryCalculation(null);
      setIsCalculatingDelivery(false);
      return;
    }

    setDeliveryCalculation(null);
    setIsCalculatingDelivery(true);
    deliveryApi
      .calculateConsolidatedDelivery(
        effectiveItems,
        destinationState,
        destinationCity,
        ''
      )
      .then((res) => {
        if (!cancelled) {
          // If customer has a confirmed custom fee arranged with admin via WhatsApp, apply it
          if (confirmedCustomFee !== null && res) {
            const updatedPayable = Number((res.product_subtotal + confirmedCustomFee).toFixed(2));
            setDeliveryCalculation({
              ...res,
              total_delivery_fee: confirmedCustomFee,
              total_payable: updatedPayable,
              requires_manual_quote: false,
              consolidation_summary: `Direct delivery to ${destinationCity}, ${destinationState} (Arranged Delivery Fee: ₦${confirmedCustomFee.toLocaleString()}).`,
            });
          } else {
            setDeliveryCalculation(res);
          }
        }
      })
      .catch((err) => {
        console.error('Delivery calculation error:', err);
      })
      .finally(() => {
        if (!cancelled) setIsCalculatingDelivery(false);
      });

    return () => {
      cancelled = true;
    };
  }, [effectiveItems, destinationState, destinationCity, hasDestination, activeRoutes, confirmedCustomFee]);

  // Configured (active) cities for the currently selected state ONLY
  const configuredCitiesForState = useMemo(
    () => listConfiguredCitiesForState(activeRoutes, destinationState),
    [activeRoutes, destinationState]
  );

  const selectedCityOptionValue = useMemo(() => {
    if (customCityMode) return '__custom__';
    if (!destinationCity) return '';
    const match = configuredCitiesForState.find(
      (r) => canonicalCityKey(r.destination_city) === canonicalCityKey(destinationCity)
    );
    return match ? match.destination_city : '__custom__';
  }, [customCityMode, destinationCity, configuredCitiesForState]);

  // Add Address Handler
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrForm.state.trim() || !addrForm.city.trim() || !addrForm.address_line_1.trim()) {
      toast.error('Please enter your street address, city, and state.');
      return;
    }

    if (!isAuthenticated) {
      const localId = `addr_${Date.now()}`;
      const guestAddr: Address = {
        id: localId,
        label: addrForm.label || 'Home',
        full_name: addrForm.full_name,
        phone: addrForm.phone,
        address_line_1: addrForm.address_line_1,
        address_line_2: addrForm.address_line_2 || null,
        city: addrForm.city,
        state: addrForm.state,
        country: addrForm.country,
        postal_code: addrForm.postal_code || null,
        is_default: true,
      };
      setAddresses((prev) => [...prev, guestAddr]);
      setSelectedAddressId(localId);
      userChoseDestinationRef.current = true;
      applyDestination(guestAddr.state, guestAddr.city);
      setShowAddForm(false);
      toast.success('Delivery address saved for this order!');
      return;
    }

    setAddingAddr(true);
    try {
      const newAddr = await authApi.addAddress({
        label: addrForm.label || 'Home',
        full_name: addrForm.full_name,
        phone: addrForm.phone,
        address_line_1: addrForm.address_line_1,
        address_line_2: addrForm.address_line_2 || undefined,
        city: addrForm.city,
        state: addrForm.state,
        country: addrForm.country,
        postal_code: addrForm.postal_code || undefined,
        is_default: addrForm.is_default,
      });
      setAddresses((prev) => [...prev, newAddr]);
      setSelectedAddressId(newAddr.id);
      userChoseDestinationRef.current = true;
      applyDestination(newAddr.state, newAddr.city);
      setShowAddForm(false);
      toast.success('Delivery address added!');
    } catch {
      const localId = `addr_${Date.now()}`;
      const localAddr: Address = {
        id: localId,
        label: addrForm.label || 'Home',
        full_name: addrForm.full_name,
        phone: addrForm.phone,
        address_line_1: addrForm.address_line_1,
        address_line_2: addrForm.address_line_2 || null,
        city: addrForm.city,
        state: addrForm.state,
        country: addrForm.country,
        postal_code: addrForm.postal_code || null,
        is_default: true,
      };
      setAddresses((prev) => [...prev, localAddr]);
      setSelectedAddressId(localId);
      userChoseDestinationRef.current = true;
      applyDestination(localAddr.state, localAddr.city);
      setShowAddForm(false);
      toast.success('Delivery address saved!');
    } finally {
      setAddingAddr(false);
    }
  };

  // Handle Proceed to Payment Session (when delivery fee is confirmed)
  const handleProceedToPayment = async () => {
    if (!isAuthenticated) {
      toast('Please sign in or create an account to finalize your order.', { icon: '🔐' });
      navigate('/login', {
        state: { from: '/checkout' },
      });
      return;
    }

    if (!destinationState.trim() || !destinationCity.trim()) {
      toast.error('Please select your delivery destination state and city.');
      return;
    }

    if (!deliveryCalculation || deliveryCalculation.total_delivery_fee === null || deliveryCalculation.requires_manual_quote) {
      toast.error('Delivery fee has not yet been confirmed for this destination. Please arrange delivery via WhatsApp.');
      return;
    }

    const formattedAddress = selectedAddress
      ? `${selectedAddress.address_line_1}${selectedAddress.address_line_2 ? `, ${selectedAddress.address_line_2}` : ''}, ${destinationCity}, ${destinationState}`
      : addrForm.address_line_1
      ? `${addrForm.address_line_1}, ${destinationCity}, ${destinationState}`
      : `${destinationCity}, ${destinationState}`;

    setIsSubmitting(true);
    try {
      const session = await checkoutApi.initializeSession({
        delivery_address_id: selectedAddressId || 'addr_custom',
        delivery_method_id: 'dovi_direct_delivery',
        delivery_method: 'DOVI Direct Delivery',
        destination_state: destinationState,
        destination_city: destinationCity,
        destination_address: formattedAddress,
        recipient_name:
          selectedAddress?.full_name ||
          addrForm.full_name ||
          `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
          user?.email ||
          'Customer',
        recipient_phone: selectedAddress?.phone || addrForm.phone || user?.phone_number || '',
        delivery_calculation: deliveryCalculation || undefined,
        cart_snapshot: cart || undefined,
        delivery_address: selectedAddress || undefined,
      });
      navigate(`/checkout/${session.id}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to initialize checkout session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle customer applying agreed delivery fee from WhatsApp support
  const handleApplyAgreedFee = () => {
    const val = parseFloat(agreedFeeInput.replace(/,/g, '').trim());
    if (isNaN(val) || val < 0) {
      toast.error('Please enter a valid agreed delivery fee amount.');
      return;
    }
    setConfirmedCustomFee(val);
    toast.success(`Agreed delivery fee of ₦${val.toLocaleString()} applied! You can now proceed to payment.`);
    setShowAgreedFeeBox(false);
  };

  // Subtotal calculation
  const totalItemCount = useMemo(() => {
    if (effectiveItems.length > 0) {
      return effectiveItems.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
    }
    return cart?.item_count || 0;
  }, [effectiveItems, cart]);

  const computedSubtotal = useMemo(() => {
    if (deliveryCalculation && deliveryCalculation.product_subtotal > 0) {
      return deliveryCalculation.product_subtotal;
    }
    return effectiveItems.reduce((acc, it) => {
      const lineTot = Number(it.line_total || Number(it.unit_price || 0) * (it.quantity || 1));
      return acc + lineTot;
    }, 0);
  }, [deliveryCalculation, effectiveItems]);

  const deliveryFee = deliveryCalculation && deliveryCalculation.total_delivery_fee !== null ? deliveryCalculation.total_delivery_fee : null;
  const totalPayable = deliveryFee !== null ? Number((computedSubtotal + deliveryFee).toFixed(2)) : null;

  // Empty Cart View
  if (!cartLoading && effectiveItems.length === 0) {
    return (
      <div className="container" style={pageStyles}>
        <div style={emptyStyles}>
          <span style={{ fontSize: '3rem' }}>🛒</span>
          <h3 style={emptyTitleStyles}>Your cart is empty</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
            Please add products to your cart before proceeding to checkout.
          </p>
          <Link to="/products" style={primaryBtnStyles}>Browse Products</Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (val: string | number | null | undefined) => {
    if (val === null || val === undefined || val === '') return 'Fee Not Configured';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return 'Fee Not Configured';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(num);
  };

  // WhatsApp Message Preparation
  const cartRefText = cart?.id ? ` (Cart Reference: ${cart.id})` : '';
  const whatsAppMessage = `Hello DOVI Support, I want to place an order, but my delivery location is not currently listed. My location is ${destinationCity || '[Town/City]'}, ${destinationState || '[State]'}${cartRefText}. Please help me arrange delivery and confirm the delivery fee.`;
  const whatsAppUrl = `https://wa.me/${DOVI_SUPPORT_WHATSAPP}?text=${encodeURIComponent(whatsAppMessage)}`;

  const isDestinationUnconfigured = hasDestination && deliveryCalculation && (deliveryCalculation.requires_manual_quote || deliveryFee === null);

  return (
    <div className="container" style={pageStyles}>
      <h1 style={pageTitleStyles}>Checkout — Direct Delivery</h1>

      <div className="checkout-layout-grid">
        {/* Main Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* STEP 1: Delivery Address & Destination Selection */}
          <section style={sectionCardStyles}>
            <h2 style={sectionTitleStyles}>
              <span style={stepBadgeStyles}>1</span>
              Delivery Address &amp; Destination
            </h2>
            <p style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              DOVI handles sourcing and arranges direct delivery to your selected destination. Select your destination state and town to retrieve the admin-configured delivery fee.
            </p>

            {/* Destination State & Town Selector */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>
                📍 Select Your Delivery Destination:
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                }}
              >
                <div>
                  <label style={fieldLabelStyles}>Destination State *</label>
                  <select
                    value={destinationState}
                    onChange={(e) => handleStateChange(e.target.value)}
                    style={{ ...inputStyles, width: '100%' }}
                  >
                    <option value="">Select state...</option>
                    {NIGERIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={fieldLabelStyles}>Destination Town / City *</label>
                  {!destinationState ? (
                    <input
                      type="text"
                      disabled
                      value=""
                      placeholder="Select a state first"
                      style={{ ...inputStyles, width: '100%' }}
                    />
                  ) : configuredCitiesForState.length > 0 ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <select
                        key={destinationState}
                        value={selectedCityOptionValue}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === '__custom__') {
                            userChoseDestinationRef.current = true;
                            setCustomCityMode(true);
                            setDestinationCity('');
                          } else {
                            setCustomCityMode(false);
                            handleCityChange(v);
                          }
                        }}
                        style={{ ...inputStyles, flex: 1 }}
                      >
                        <option value="">Select town / city...</option>
                        {configuredCitiesForState.map((r) => (
                          <option key={r.id} value={r.destination_city}>
                            {r.destination_city}
                            {r.estimated_delivery_days ? ` (${r.estimated_delivery_days})` : ''}
                          </option>
                        ))}
                        <option value="__custom__">Other City / Unlisted Location...</option>
                      </select>
                      {selectedCityOptionValue === '__custom__' && (
                        <input
                          type="text"
                          placeholder="Enter town / city name"
                          value={destinationCity}
                          onChange={(e) => handleCityChange(e.target.value)}
                          style={{ ...inputStyles, flex: 1 }}
                        />
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={destinationCity}
                      onChange={(e) => handleCityChange(e.target.value)}
                      placeholder="Enter destination town / city"
                      style={{ ...inputStyles, width: '100%' }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Saved Addresses */}
            {isLoadingData ? (
              <Skeleton width="100%" height="80px" borderRadius="var(--radius-md)" />
            ) : (
              <>
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    style={{
                      ...addressCardStyles,
                      borderColor: selectedAddressId === addr.id ? 'var(--color-primary)' : 'var(--color-border)',
                      backgroundColor: selectedAddressId === addr.id ? 'rgba(255, 122, 0, 0.04)' : '#ffffff',
                    }}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressId === addr.id}
                      onChange={() => handleSelectAddress(addr)}
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    <div>
                      <strong style={{ fontSize: 'var(--text-sm)' }}>
                        {addr.label}{addr.is_default ? ' (Default)' : ''}
                      </strong>
                      <p style={addressSubStyles}>
                        {addr.full_name} · {addr.phone}
                      </p>
                      <p style={addressSubStyles}>
                        {addr.address_line_1}{addr.address_line_2 ? `, ${addr.address_line_2}` : ''}, {addr.city}, {addr.state}
                      </p>
                    </div>
                  </label>
                ))}

                {!showAddForm && (
                  <button type="button" onClick={() => setShowAddForm(true)} style={addBtnStyles}>
                    + Add New Delivery Address
                  </button>
                )}
              </>
            )}

            {/* Add Address Form */}
            {showAddForm && (
              <form onSubmit={handleAddAddress} style={addFormStyles}>
                <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)' }}>
                  Enter Delivery Address Details
                </h4>
                <div style={formGridStyles}>
                  <input
                    placeholder="Label (Home, Office)"
                    value={addrForm.label}
                    onChange={(e) => setAddrForm((p) => ({ ...p, label: e.target.value }))}
                    style={inputStyles}
                    required
                  />
                  <input
                    placeholder="Recipient Full Name"
                    value={addrForm.full_name}
                    onChange={(e) => setAddrForm((p) => ({ ...p, full_name: e.target.value }))}
                    style={inputStyles}
                    required
                  />
                  <input
                    placeholder="Recipient Phone Number"
                    value={addrForm.phone}
                    onChange={(e) => setAddrForm((p) => ({ ...p, phone: e.target.value }))}
                    style={inputStyles}
                    required
                  />
                  <input
                    placeholder="Street Address Line 1"
                    value={addrForm.address_line_1}
                    onChange={(e) => setAddrForm((p) => ({ ...p, address_line_1: e.target.value }))}
                    style={inputStyles}
                    required
                  />
                  <input
                    placeholder="Landmark / Address Line 2 (Optional)"
                    value={addrForm.address_line_2}
                    onChange={(e) => setAddrForm((p) => ({ ...p, address_line_2: e.target.value }))}
                    style={inputStyles}
                  />
                  <input
                    placeholder="City / Town"
                    value={addrForm.city}
                    onChange={(e) => {
                      handleCityChange(e.target.value);
                      setCustomCityMode(false);
                    }}
                    style={inputStyles}
                    required
                  />
                  <select
                    value={addrForm.state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    style={inputStyles}
                    required
                  >
                    <option value="">Select state...</option>
                    {NIGERIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                  <button type="submit" disabled={addingAddr} style={primaryBtnStyles}>
                    {addingAddr ? 'Saving...' : 'Use This Address'}
                  </button>
                  {addresses.length > 0 && (
                    <button type="button" onClick={() => setShowAddForm(false)} style={secondaryBtnStyles}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </section>

          {/* STEP 2: Delivery Route Status & Products Review */}
          <section style={sectionCardStyles}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <h2 style={{ ...sectionTitleStyles, margin: 0 }}>
                <span style={stepBadgeStyles}>2</span>
                Ordered Products ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})
              </h2>
            </div>

            {/* Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {effectiveItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={item.product?.primary_image_url || (item as any).imageUrl || '/logo.jpg?v=2'}
                      alt={item.product?.name || 'Item'}
                      style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo.jpg?v=2';
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                        {item.product?.name || 'Item'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                        {item.variant ? ` · Variant: ${typeof item.variant === 'object' ? (item.variant as any).name : item.variant}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                    {formatCurrency(Number(item.unit_price || 0) * (item.quantity || 1))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Order Summary & Pricing Sidebar */}
        <div style={summaryCardStyles}>
          <h3 style={summaryTitleStyles}>Price Breakdown</h3>

          {/* Product Subtotal */}
          <div style={summaryRowStyles}>
            <span style={{ color: '#4b5563' }}>Product Subtotal</span>
            <span style={summaryValStyles}>{formatCurrency(computedSubtotal)}</span>
          </div>

          {/* Delivery Fee */}
          <div style={summaryRowStyles}>
            <span style={{ color: '#4b5563' }}>Delivery Fee</span>
            <span
              style={{
                ...summaryValStyles,
                color: deliveryFee !== null ? '#047857' : '#d97706',
              }}
            >
              {deliveryFee !== null ? formatCurrency(deliveryFee) : 'Not Configured'}
            </span>
          </div>

          <hr style={dividerStyles} />

          {/* Total Amount Payable */}
          <div style={{ ...summaryRowStyles, fontSize: '16px', fontWeight: 800 }}>
            <span style={{ color: '#111827' }}>Total Amount Payable</span>
            <span style={{ color: 'var(--color-primary)' }}>
              {totalPayable !== null ? formatCurrency(totalPayable) : `${formatCurrency(computedSubtotal)} + Delivery`}
            </span>
          </div>

          {/* Destination Status Message & Action CTA */}
          {!hasDestination ? (
            <div
              style={{
                padding: '12px',
                backgroundColor: '#f1f5f9',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#64748b',
                textAlign: 'center',
                marginTop: '12px',
              }}
            >
              Select your destination state and town above to view your delivery fee.
            </div>
          ) : isCalculatingDelivery ? (
            <div style={{ marginTop: '14px' }}>
              <Skeleton width="100%" height="48px" borderRadius="8px" />
            </div>
          ) : isDestinationUnconfigured ? (
            /* Unconfigured Destination: Display WhatsApp Arrangement Option */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              <div
                style={{
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  fontSize: '12px',
                  color: '#92400e',
                  lineHeight: 1.5,
                }}
              >
                <strong>Delivery to {destinationCity}, {destinationState} has not yet been configured.</strong>
                <p style={{ margin: '4px 0 0' }}>
                  DOVI does not assign an estimated or fake delivery fee. Please contact our support team on WhatsApp to arrange direct delivery and confirm your delivery fee before payment.
                </p>
              </div>

              {/* Prominent WhatsApp Option */}
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: '#25D366',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '14px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  boxShadow: '0 2px 6px rgba(37, 211, 102, 0.3)',
                  transition: 'opacity 0.15s ease',
                }}
              >
                <span>💬</span> Arrange Delivery via WhatsApp
              </a>

              {/* Collapsible Form for entering confirmed agreed fee */}
              {!showAgreedFeeBox ? (
                <button
                  type="button"
                  onClick={() => setShowAgreedFeeBox(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6b7280',
                    fontSize: '12px',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: '4px 0',
                    textAlign: 'center',
                  }}
                >
                  Already arranged fee with DOVI Support? Enter agreed fee
                </button>
              ) : (
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                    Agreed Delivery Fee (₦)
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="number"
                      placeholder="e.g. 3500"
                      value={agreedFeeInput}
                      onChange={(e) => setAgreedFeeInput(e.target.value)}
                      style={{ ...inputStyles, flex: 1, padding: '8px 10px' }}
                    />
                    <button
                      type="button"
                      onClick={handleApplyAgreedFee}
                      style={{
                        backgroundColor: '#ff7a00',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Configured Destination: Active Proceed to Payment Button */
            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={isSubmitting || isCalculatingDelivery || totalPayable === null}
              style={{
                ...proceedBtnStyles,
                marginTop: '16px',
                opacity: isSubmitting || isCalculatingDelivery || totalPayable === null ? 0.6 : 1,
              }}
            >
              {isSubmitting
                ? 'Initializing Payment...'
                : `Proceed to Pay (${formatCurrency(totalPayable)})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const pageStyles: React.CSSProperties = {
  paddingTop: 'var(--space-6)',
  paddingBottom: 'var(--space-12)',
};

const pageTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-2xl)',
  fontWeight: 'var(--font-bold)',
  marginBottom: 'var(--space-6)',
};

const sectionCardStyles: React.CSSProperties = {
  background: '#ffffff',
  padding: 'var(--space-5)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
};

const sectionTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-bold)',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  marginBottom: 'var(--space-2)',
};

const stepBadgeStyles: React.CSSProperties = {
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-bold)',
};

const fieldLabelStyles: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text)',
  marginBottom: 'var(--space-1)',
};

const inputStyles: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  fontSize: 'var(--text-sm)',
  outline: 'none',
};

const addressCardStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 'var(--space-3)',
  padding: 'var(--space-3) var(--space-4)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  cursor: 'pointer',
  marginBottom: 'var(--space-2)',
  transition: 'border-color 0.15s, background-color 0.15s',
};

const addressSubStyles: React.CSSProperties = {
  margin: '2px 0 0',
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
};

const addBtnStyles: React.CSSProperties = {
  background: 'none',
  border: '1px dashed var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-3)',
  width: '100%',
  cursor: 'pointer',
  color: 'var(--color-primary)',
  fontWeight: 'var(--font-semibold)',
  fontSize: 'var(--text-sm)',
  marginTop: 'var(--space-2)',
};

const addFormStyles: React.CSSProperties = {
  marginTop: 'var(--space-4)',
  padding: 'var(--space-4)',
  backgroundColor: 'var(--color-bg-subtle)',
  borderRadius: 'var(--radius-md)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const formGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 'var(--space-3)',
};

const primaryBtnStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  padding: '10px 20px',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-sm)',
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const secondaryBtnStyles: React.CSSProperties = {
  backgroundColor: '#f3f4f6',
  color: '#4b5563',
  border: '1px solid #d1d5db',
  borderRadius: 'var(--radius-md)',
  padding: '10px 16px',
  fontWeight: 'var(--font-semibold)',
  fontSize: 'var(--text-sm)',
  cursor: 'pointer',
};

const summaryCardStyles: React.CSSProperties = {
  background: '#ffffff',
  padding: 'var(--space-5)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  height: 'fit-content',
};

const summaryTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--font-bold)',
  marginBottom: 'var(--space-4)',
  color: '#111827',
};

const summaryRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 'var(--space-3)',
  fontSize: 'var(--text-sm)',
};

const summaryValStyles: React.CSSProperties = {
  fontWeight: 'var(--font-bold)',
};

const dividerStyles: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid var(--color-border)',
  margin: 'var(--space-3) 0',
};

const proceedBtnStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  padding: '14px',
  width: '100%',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-base)',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
  boxShadow: '0 2px 8px rgba(255, 122, 0, 0.25)',
};

const emptyStyles: React.CSSProperties = {
  textAlign: 'center',
  padding: 'var(--space-12) 0',
  background: '#ffffff',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
};

const emptyTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-bold)',
  margin: 'var(--space-3) 0 var(--space-2)',
};
