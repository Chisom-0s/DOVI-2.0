import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/api/auth';
import { checkoutApi } from '@/api/checkout';
import { deliveryApi } from '@/api/delivery';
import {
  PARCEL_CLASSIFICATION_LABELS,
  resolveProductDeliveryAttributes,
} from '@/services/deliveryPricingService';
import type {
  Address,
  CartItem,
  DeliveryCalculationResult,
  DeliveryRoute,
} from '@/types';
import { Skeleton } from '@/components/common/Skeleton';

const NIGERIAN_STATES = [
  'Abia',
  'Abuja (FCT)',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { cart, isLoading: cartLoading, addToCart, clearCart } = useCart();

  const directProduct = location.state?.product;
  const directQuantity = location.state?.quantity || 1;
  const directVariant = location.state?.variant;

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [activeRoutes, setActiveRoutes] = useState<DeliveryRoute[]>([]);
  const [destinationState, setDestinationState] = useState<string>('Lagos');
  const [destinationCity, setDestinationCity] = useState<string>('Lagos');
  const [deliveryCalculation, setDeliveryCalculation] = useState<DeliveryCalculationResult | null>(null);
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Address Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingAddr, setAddingAddr] = useState(false);
  const [addrForm, setAddrForm] = useState({
    label: 'Home',
    full_name: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: 'Lagos',
    state: 'Lagos',
    country: 'Nigeria',
    postal_code: '',
    is_default: true,
  });

  // Construct direct buy item if user clicked "Buy Now"
  const directCartItem: CartItem | null = useMemo(() => {
    if (!directProduct) return null;
    const price = directVariant?.price_override ?? directVariant?.price ?? directProduct.base_price ?? directProduct.price ?? 0;
    const total = Number(price) * directQuantity;
    return {
      id: 'direct-buy-item',
      product_id: directProduct.id,
      product: directProduct,
      variant: directVariant,
      quantity: directQuantity,
      unit_price: String(price),
      line_total: String(total),
    };
  }, [directProduct, directQuantity, directVariant]);

  // Combine cart items or direct buy item
  const effectiveItems: CartItem[] = useMemo(() => {
    if (cart?.items && cart.items.length > 0) {
      return cart.items;
    }
    if (directCartItem) {
      return [directCartItem];
    }
    return [];
  }, [cart?.items, directCartItem]);

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
        if (defaultAddr.state) setDestinationState(defaultAddr.state);
        if (defaultAddr.city) setDestinationCity(defaultAddr.city);
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

  // Sync destinationState & destinationCity when user selects a saved address
  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) || null,
    [addresses, selectedAddressId]
  );

  const handleSelectAddress = (addr: Address) => {
    setSelectedAddressId(addr.id);
    if (addr.state) setDestinationState(addr.state);
    if (addr.city) setDestinationCity(addr.city);
  };

  // Recalculate consolidated delivery pricing whenever items or destination changes
  useEffect(() => {
    let cancelled = false;
    if (effectiveItems.length === 0) {
      setDeliveryCalculation(null);
      return;
    }

    setIsCalculatingDelivery(true);
    deliveryApi
      .calculateConsolidatedDelivery(
        effectiveItems,
        destinationState,
        destinationCity,
        'Onitsha'
      )
      .then((res) => {
        if (!cancelled) {
          setDeliveryCalculation(res);
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
  }, [effectiveItems, destinationState, destinationCity]);

  // Available cities for selected state from configured routes
  const configuredCitiesForState = useMemo(() => {
    const normState = destinationState.trim().toLowerCase();
    return activeRoutes.filter(
      (r) =>
        r.destination_state.trim().toLowerCase() === normState ||
        (normState.includes('abuja') && r.destination_state.toLowerCase().includes('abuja'))
    );
  }, [activeRoutes, destinationState]);

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
      setDestinationState(guestAddr.state);
      setDestinationCity(guestAddr.city);
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
      setDestinationState(newAddr.state);
      setDestinationCity(newAddr.city);
      setShowAddForm(false);
      toast.success('Delivery address added!');
    } catch {
      // Fallback local save so checkout is never blocked
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
      setDestinationState(localAddr.state);
      setDestinationCity(localAddr.city);
      setShowAddForm(false);
      toast.success('Delivery address saved!');
    } finally {
      setAddingAddr(false);
    }
  };

  // Handle Proceed to Payment Session (when rates are configured)
  const handleProceedToPayment = async () => {
    if (!isAuthenticated) {
      toast('Please sign in or create an account to finalize your order.', { icon: '🔐' });
      navigate('/login', {
        state: {
          from: '/checkout',
          directBuy: true,
          product: directProduct,
          quantity: directQuantity,
          variant: directVariant,
        },
      });
      return;
    }

    if (!destinationState.trim() || !destinationCity.trim()) {
      toast.error('Please select your delivery destination state and city.');
      return;
    }

    const formattedAddress = selectedAddress
      ? `${selectedAddress.address_line_1}${selectedAddress.address_line_2 ? `, ${selectedAddress.address_line_2}` : ''}, ${destinationCity}, ${destinationState}`
      : addrForm.address_line_1
      ? `${addrForm.address_line_1}, ${destinationCity}, ${destinationState}`
      : `${destinationCity}, ${destinationState}`;

    setIsSubmitting(true);
    try {
      if (directProduct && (!cart?.items || cart.items.length === 0)) {
        try {
          await addToCart(directProduct, directQuantity, {
            variantId: directVariant?.id,
          });
        } catch {}
      }

      const session = await checkoutApi.initializeSession({
        delivery_address_id: selectedAddressId || 'addr_custom',
        delivery_method_id: 'onitsha_consolidated',
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

  // Handle Submit Order for Manual Delivery Quotation (when route/rate is missing or bulky manual quote needed)
  const handleRequestManualQuote = async () => {
    if (!isAuthenticated) {
      toast('Please sign in or create an account to submit your order for delivery quotation.', {
        icon: '🔐',
      });
      navigate('/login', {
        state: {
          from: '/checkout',
          directBuy: true,
          product: directProduct,
          quantity: directQuantity,
          variant: directVariant,
        },
      });
      return;
    }

    if (!deliveryCalculation) return;

    const formattedAddress = selectedAddress
      ? `${selectedAddress.address_line_1}${selectedAddress.address_line_2 ? `, ${selectedAddress.address_line_2}` : ''}, ${destinationCity}, ${destinationState}`
      : addrForm.address_line_1
      ? `${addrForm.address_line_1}, ${destinationCity}, ${destinationState}`
      : `${destinationCity}, ${destinationState}`;

    setIsSubmitting(true);
    try {
      const order = await checkoutApi.submitOrderForManualDeliveryQuote({
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
        items: effectiveItems,
        delivery_calculation: deliveryCalculation,
      });
      await clearCart().catch(() => {});
      toast.success(
        'Order submitted for Delivery Confirmation! Our Onitsha Hub team will confirm your delivery quote shortly.'
      );
      navigate(`/orders/${order.reference}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit order for delivery confirmation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Subtotal & Item Count calculation
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

  if (!cartLoading && effectiveItems.length === 0) {
    return (
      <div className="container" style={pageStyles}>
        <div style={emptyStyles}>
          <span style={{ fontSize: '3rem' }}>🛒</span>
          <h3 style={emptyTitleStyles}>Your cart is empty</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
            Find products and add them to your cart or click Buy Now to checkout directly.
          </p>
          <Link to="/products" style={primaryBtnStyles}>Browse Products</Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (val: string | number | null | undefined) => {
    if (val === null || val === undefined || val === '') return 'Manual Quote Required';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return 'Manual Quote Required';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="container" style={pageStyles}>
      <h1 style={pageTitleStyles}>Checkout — Onitsha Hub Consolidated Delivery</h1>

      <div className="checkout-layout-grid">
        {/* Main Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* STEP 1: Delivery Address & Destination Selection */}
          <section style={sectionCardStyles}>
            <h2 style={sectionTitleStyles}>
              <span style={stepBadgeStyles}>1</span>
              Delivery Address & Destination
            </h2>
            <p style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              All DOVI orders are sourced, quality-checked, consolidated, and dispatched from our <strong>Onitsha Hub</strong>. Select your delivery address and destination to calculate your consolidated delivery fee.
            </p>

            {/* Quick Destination State & City Selector */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>
                📍 Dispatch Origin: <span style={{ color: 'var(--color-primary)' }}>Onitsha Hub (Anambra)</span> &rarr; Select Customer Destination:
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                }}
              >
                <div>
                  <label style={fieldLabelStyles}>Destination State</label>
                  <select
                    value={destinationState}
                    onChange={(e) => {
                      const nextState = e.target.value;
                      setDestinationState(nextState);
                      const matchingRoute = activeRoutes.find(
                        (r) => r.destination_state.toLowerCase() === nextState.toLowerCase()
                      );
                      setDestinationCity(matchingRoute ? matchingRoute.destination_city : nextState);
                    }}
                    style={{ ...inputStyles, width: '100%' }}
                  >
                    {NIGERIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={fieldLabelStyles}>Destination City / Town</label>
                  {configuredCitiesForState.length > 0 ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <select
                        value={destinationCity}
                        onChange={(e) => setDestinationCity(e.target.value)}
                        style={{ ...inputStyles, flex: 1 }}
                      >
                        {configuredCitiesForState.map((r) => (
                          <option key={r.id} value={r.destination_city}>
                            {r.destination_city} ({r.estimated_delivery_days})
                          </option>
                        ))}
                        <option value="__custom__">Other City (Enter manually)...</option>
                      </select>
                      {destinationCity === '__custom__' && (
                        <input
                          type="text"
                          placeholder="Enter city name"
                          onChange={(e) => setDestinationCity(e.target.value)}
                          style={{ ...inputStyles, flex: 1 }}
                        />
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={destinationCity}
                      onChange={(e) => setDestinationCity(e.target.value)}
                      placeholder="Enter destination city"
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
                    placeholder="City"
                    value={addrForm.city}
                    onChange={(e) => {
                      setAddrForm((p) => ({ ...p, city: e.target.value }));
                      setDestinationCity(e.target.value);
                    }}
                    style={inputStyles}
                    required
                  />
                  <select
                    value={addrForm.state}
                    onChange={(e) => {
                      setAddrForm((p) => ({ ...p, state: e.target.value }));
                      setDestinationState(e.target.value);
                    }}
                    style={inputStyles}
                  >
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

          {/* STEP 2: Order Consolidation & Shipment Grouping Breakdown */}
          <section style={sectionCardStyles}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: 'var(--space-3)',
              }}
            >
              <h2 style={{ ...sectionTitleStyles, margin: 0 }}>
                <span style={stepBadgeStyles}>2</span>
                Consolidated Shipment & Delivery Breakdown
              </h2>
              {deliveryCalculation && (
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: '999px',
                    backgroundColor:
                      deliveryCalculation.shipment_count === 1 ? '#dcfce7' : '#dbeafe',
                    color:
                      deliveryCalculation.shipment_count === 1 ? '#166534' : '#1e40af',
                  }}
                >
                  {deliveryCalculation.shipment_count === 1
                    ? '✓ 1 Consolidated Shipment'
                    : `${deliveryCalculation.shipment_count} Separate Shipments`}
                </span>
              )}
            </div>

            {isCalculatingDelivery || !deliveryCalculation ? (
              <Skeleton width="100%" height="140px" borderRadius="var(--radius-md)" />
            ) : (
              <>
                {/* Consolidation Explanation Banner */}
                <div
                  style={{
                    backgroundColor: deliveryCalculation.requires_manual_quote
                      ? '#fffbeb'
                      : deliveryCalculation.shipment_count === 1
                      ? '#f0fdf4'
                      : '#eff6ff',
                    border: `1px solid ${
                      deliveryCalculation.requires_manual_quote
                        ? '#fde68a'
                        : deliveryCalculation.shipment_count === 1
                        ? '#bbf7d0'
                        : '#bfdbfe'
                    }`,
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    fontSize: '13px',
                    color: deliveryCalculation.requires_manual_quote
                      ? '#92400e'
                      : deliveryCalculation.shipment_count === 1
                      ? '#166534'
                      : '#1e3a8a',
                    marginBottom: 'var(--space-4)',
                    lineHeight: 1.5,
                  }}
                >
                  <strong>
                    {deliveryCalculation.requires_manual_quote
                      ? '⚠️ Delivery Confirmation / Manual Quote Required:'
                      : deliveryCalculation.shipment_count === 1
                      ? '📦 Combined Delivery from Onitsha Hub:'
                      : '🚚 Why Separate Shipments Apply:'}
                  </strong>{' '}
                  {deliveryCalculation.consolidation_summary}
                  {deliveryCalculation.manual_quote_reason && (
                    <div style={{ marginTop: '6px', fontWeight: 600 }}>
                      Reason: {deliveryCalculation.manual_quote_reason}
                    </div>
                  )}
                </div>

                {/* Shipment Groups */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {deliveryCalculation.shipment_groups.map((group) => (
                    <div key={group.group_index} style={vendorBlockStyles}>
                      <div style={vendorHeaderStyles}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontSize: 'var(--text-sm)',
                                fontWeight: 'var(--font-bold)',
                                color: 'var(--color-text)',
                              }}
                            >
                              Shipment #{group.group_index} (Onitsha &rarr; {destinationCity}, {destinationState})
                            </span>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '999px',
                                backgroundColor: '#ffedd5',
                                color: '#9a3412',
                              }}
                            >
                              {group.classification_label ||
                                PARCEL_CLASSIFICATION_LABELS[group.shipment_classification]}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                            Transport Arrangement: <strong>{group.transport_arrangement}</strong>
                            {group.combined_weight_kg ? ` · Combined Weight: ${group.combined_weight_kg} kg` : ''}
                            {group.combined_dimensions_cm ? ` · Max Dimensions: ${group.combined_dimensions_cm} cm` : ''}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            Shipment Delivery Fee
                          </div>
                          <div
                            style={{
                              fontSize: 'var(--text-base)',
                              fontWeight: 'var(--font-bold)',
                              color: group.requires_manual_quote ? '#d97706' : 'var(--color-primary)',
                            }}
                          >
                            {group.requires_manual_quote || group.delivery_fee === null
                              ? 'Manual Quote Required'
                              : formatCurrency(group.delivery_fee)}
                          </div>
                        </div>
                      </div>

                      {/* Items in this shipment */}
                      <div style={itemListStyles}>
                        {group.items.map((item) => {
                          const prodAttrs = resolveProductDeliveryAttributes({
                            id: item.product_id,
                            name: item.product_name,
                            delivery_classification: item.delivery_classification,
                          });
                          return (
                            <div key={item.id} style={itemPreviewRowStyles}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text)', fontWeight: 500 }}>
                                  • {item.product_name}
                                  {item.variant_name ? ` (${item.variant_name})` : ''} × {item.quantity}
                                </span>
                                <span
                                  style={{
                                    fontSize: '10px',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: '#f3f4f6',
                                    color: '#4b5563',
                                  }}
                                >
                                  {PARCEL_CLASSIFICATION_LABELS[prodAttrs.delivery_classification]}
                                </span>
                              </div>
                              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)' }}>
                                {formatCurrency(item.unit_price * item.quantity)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Separation / Consolidation explanation for this shipment */}
                      <div
                        style={{
                          marginTop: '10px',
                          paddingTop: '8px',
                          borderTop: '1px dashed var(--color-border)',
                          fontSize: '11px',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        <strong>Shipment Note:</strong> {group.separation_reason}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>

        {/* Order Summary Sidebar */}
        <div style={summaryCardStyles}>
          <h3 style={summaryTitleStyles}>Order & Delivery Summary</h3>

          <div style={summaryRowStyles}>
            <span>
              Product Subtotal ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})
            </span>
            <span style={summaryValStyles}>{formatCurrency(computedSubtotal)}</span>
          </div>

          <div style={summaryRowStyles}>
            <span>Number of Shipments</span>
            <span style={summaryValStyles}>
              {deliveryCalculation
                ? `${deliveryCalculation.shipment_count} ${
                    deliveryCalculation.shipment_count === 1 ? 'Consolidated Shipment' : 'Shipments'
                  }`
                : '1 Shipment'}
            </span>
          </div>

          {/* Per-shipment delivery breakdown when multiple shipments exist */}
          {deliveryCalculation && deliveryCalculation.shipment_count > 1 && (
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                }}
              >
                Per-Shipment Delivery Breakdown
              </span>
              {deliveryCalculation.shipment_groups.map((g) => (
                <div
                  key={g.group_index}
                  style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}
                >
                  <span>
                    Shipment #{g.group_index} ({PARCEL_CLASSIFICATION_LABELS[g.shipment_classification]}):
                  </span>
                  <span style={{ fontWeight: 700 }}>
                    {g.requires_manual_quote || g.delivery_fee === null
                      ? 'Manual Quote'
                      : formatCurrency(g.delivery_fee)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {deliveryCalculation && deliveryCalculation.special_handling_fee > 0 && (
            <div style={summaryRowStyles}>
              <span>Special Handling Charge</span>
              <span style={summaryValStyles}>
                {formatCurrency(deliveryCalculation.special_handling_fee)}
              </span>
            </div>
          )}

          <div style={summaryRowStyles}>
            <span>
              {deliveryCalculation && deliveryCalculation.shipment_count > 1
                ? 'Combined Shipments Delivery Fee'
                : 'Consolidated Delivery Fee'}
            </span>
            <span
              style={{
                ...summaryValStyles,
                color: deliveryCalculation?.requires_manual_quote ? '#d97706' : 'var(--color-text)',
              }}
            >
              {deliveryCalculation?.requires_manual_quote ||
              deliveryCalculation?.total_delivery_fee === null
                ? 'Confirmation Required'
                : formatCurrency(deliveryCalculation?.total_delivery_fee ?? 0)}
            </span>
          </div>

          <hr style={dividerStyles} />

          <div style={{ ...summaryRowStyles, fontWeight: 'var(--font-bold)', fontSize: 'var(--text-lg)' }}>
            <span>Total Payable</span>
            <span style={{ color: 'var(--color-primary)' }}>
              {deliveryCalculation?.requires_manual_quote || deliveryCalculation?.total_payable === null
                ? `${formatCurrency(computedSubtotal)} + Delivery Quote`
                : formatCurrency(deliveryCalculation?.total_payable ?? computedSubtotal)}
            </span>
          </div>

          {/* Action CTA: Normal Checkout vs Manual Delivery Quote Request */}
          {deliveryCalculation?.requires_manual_quote ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'var(--space-2)' }}>
              <div
                style={{
                  fontSize: '12px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  color: '#92400e',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  lineHeight: 1.4,
                }}
              >
                <strong>No Surprises Guarantee:</strong> Because this route or bulky item requires a custom transport arrangement from our Onitsha Hub, we do not guess or charge a fake fee. Submit your order below to receive an exact delivery quotation before you pay.
              </div>
              <button
                type="button"
                onClick={handleRequestManualQuote}
                disabled={isSubmitting}
                style={{
                  ...proceedBtnStyles,
                  backgroundColor: '#d97706',
                  marginTop: 0,
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                {isSubmitting
                  ? 'Submitting for Delivery Quote...'
                  : 'Submit Order for Delivery Fee Confirmation'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={isSubmitting || isCalculatingDelivery || !deliveryCalculation}
              style={{
                ...proceedBtnStyles,
                opacity: isSubmitting || isCalculatingDelivery || !deliveryCalculation ? 0.6 : 1,
              }}
            >
              {isSubmitting
                ? 'Initializing Checkout...'
                : `Proceed to Review & Pay (${formatCurrency(
                    deliveryCalculation?.total_payable ?? computedSubtotal
                  )})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Styles
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
  margin: '0 0 var(--space-4)',
};

const stepBadgeStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-bold)',
};

const fieldLabelStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 700,
  color: '#475569',
  marginBottom: '4px',
  textTransform: 'uppercase',
};

const vendorBlockStyles: React.CSSProperties = {
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-4)',
};

const vendorHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: '8px',
  paddingBottom: 'var(--space-2)',
  borderBottom: '1px dashed var(--color-border)',
  marginBottom: 'var(--space-3)',
};

const itemListStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const itemPreviewRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '8px',
};

const addressCardStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 'var(--space-3)',
  padding: 'var(--space-4)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  marginBottom: 'var(--space-3)',
  cursor: 'pointer',
};

const addressSubStyles: React.CSSProperties = {
  margin: '2px 0 0',
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
};

const addBtnStyles: React.CSSProperties = {
  marginTop: 'var(--space-2)',
  background: 'none',
  border: 'none',
  color: 'var(--color-primary)',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-xs)',
  cursor: 'pointer',
};

const addFormStyles: React.CSSProperties = {
  marginTop: 'var(--space-4)',
  padding: 'var(--space-4)',
  background: 'var(--color-bg-subtle)',
  borderRadius: 'var(--radius-md)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const formGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 'var(--space-2)',
};

const inputStyles: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  fontSize: 'var(--text-xs)',
  backgroundColor: '#ffffff',
};

const primaryBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontWeight: 'var(--font-semibold)',
  fontSize: 'var(--text-xs)',
  cursor: 'pointer',
  textDecoration: 'none',
};

const secondaryBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: 'transparent',
  color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-xs)',
  cursor: 'pointer',
};

const summaryCardStyles: React.CSSProperties = {
  background: '#ffffff',
  padding: 'var(--space-5)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  alignSelf: 'start',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const summaryTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-bold)',
  margin: 0,
};

const summaryRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 'var(--text-sm)',
};

const summaryValStyles: React.CSSProperties = {
  fontWeight: 'var(--font-semibold)',
};

const dividerStyles: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid var(--color-border)',
  margin: 'var(--space-2) 0',
};

const proceedBtnStyles: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-sm)',
  cursor: 'pointer',
  marginTop: 'var(--space-3)',
};

const emptyStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: 'var(--space-12)',
  gap: 'var(--space-3)',
};

const emptyTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-bold)',
  margin: 0,
};
