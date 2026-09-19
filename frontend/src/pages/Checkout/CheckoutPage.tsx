import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '@/contexts/CartContext';
import { authApi } from '@/api/auth';
import { checkoutApi } from '@/api/checkout';
import type { Address, CartItem, DeliveryMethodType, VendorDeliverySelection } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';

interface VendorGroup {
  vendor_id: string;
  vendor_name: string;
  city?: string;
  state?: string;
  pickup_address?: string;
  items: CartItem[];
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, isLoading: cartLoading } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [vendorDeliveryMethods, setVendorDeliveryMethods] = useState<Record<string, DeliveryMethodType>>({});
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Address Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingAddr, setAddingAddr] = useState(false);
  const [addrForm, setAddrForm] = useState({
    label: '',
    full_name: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    country: 'Nigeria',
    postal_code: '',
    is_default: false,
  });

  // Group items by vendor
  const vendorGroups: VendorGroup[] = useMemo(() => {
    if (!cart?.items) return [];
    const map = new Map<string, VendorGroup>();
    cart.items.forEach((item) => {
      const prod = item.product || (item as any);
      const vId = prod.vendor?.id || 'vendor_store';
      const vName = prod.vendor?.name || prod.vendor_name || 'Vendor Store';
      if (!map.has(vId)) {
        map.set(vId, {
          vendor_id: vId,
          vendor_name: vName,
          items: [],
        });
      }
      map.get(vId)!.items.push(item);
    });
    return Array.from(map.values());
  }, [cart]);

  // Set default selection per vendor
  useEffect(() => {
    if (vendorGroups.length > 0) {
      setVendorDeliveryMethods((prev) => {
        const next = { ...prev };
        vendorGroups.forEach((g) => {
          if (!next[g.vendor_id]) {
            next[g.vendor_id] = 'VENDOR_ARRANGED';
          }
        });
        return next;
      });
    }
  }, [vendorGroups]);

  // Fetch addresses
  const fetchData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const addrs = await authApi.getAddresses();
      setAddresses(addrs);
      if (addrs.length > 0) {
        const defaultAddr = addrs.find((a: Address) => a.is_default);
        setSelectedAddressId(defaultAddr?.id || addrs[0].id);
      } else {
        setShowAddForm(true);
      }
    } catch {
      toast.error('Could not load checkout addresses. Please try again.');
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add Address Handler
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingAddr(true);
    try {
      const newAddr = await authApi.addAddress({
        label: addrForm.label,
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
      setShowAddForm(false);
      setAddrForm({
        label: '',
        full_name: '',
        phone: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        country: 'Nigeria',
        postal_code: '',
        is_default: false,
      });
      toast.success('Address added successfully!');
    } catch {
      toast.error('Failed to add address.');
    } finally {
      setAddingAddr(false);
    }
  };

  const setMethodForVendor = (vendorId: string, method: DeliveryMethodType) => {
    setVendorDeliveryMethods((prev) => ({
      ...prev,
      [vendorId]: method,
    }));
  };

  // Check if any vendor requires a delivery address
  const requiresDeliveryAddress = useMemo(() => {
    return Object.values(vendorDeliveryMethods).some((m) => m === 'VENDOR_ARRANGED');
  }, [vendorDeliveryMethods]);

  // Handle proceed to payment session
  const handleProceed = async () => {
    if (requiresDeliveryAddress && !selectedAddressId) {
      toast.error('Please select a delivery address for vendor-arranged delivery items.');
      return;
    }

    const vendorSelections: VendorDeliverySelection[] = vendorGroups.map((g) => ({
      vendor_id: g.vendor_id,
      method: vendorDeliveryMethods[g.vendor_id] || 'VENDOR_ARRANGED',
      delivery_address_id:
        vendorDeliveryMethods[g.vendor_id] === 'VENDOR_ARRANGED' ? selectedAddressId : undefined,
    }));

    setIsSubmitting(true);
    try {
      const session = await checkoutApi.initializeSession({
        delivery_address_id: selectedAddressId || undefined,
        vendor_delivery_selections: vendorSelections,
      });
      navigate(`/checkout/${session.id}`);
    } catch {
      // Fallback compatibility with single address/method endpoint
      try {
        const session = await checkoutApi.initializeSession({
          delivery_address_id: selectedAddressId,
          delivery_method_id: 'standard',
        });
        navigate(`/checkout/${session.id}`);
      } catch (err: any) {
        toast.error(err?.message || 'Failed to initialize checkout. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cartLoading && (!cart || cart.items.length === 0)) {
    return (
      <div className="container" style={pageStyles}>
        <div style={emptyStyles}>
          <span style={{ fontSize: '3rem' }}>🛒</span>
          <h3 style={emptyTitleStyles}>Your cart is empty</h3>
          <Link to="/products" style={primaryBtnStyles}>Browse Products</Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (val: string | number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(
      typeof val === 'string' ? parseFloat(val) : val
    );

  return (
    <div className="container" style={pageStyles}>
      <h1 style={pageTitleStyles}>Checkout</h1>

      <div className="checkout-layout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-6)' }}>
        {/* Main Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* STEP 1: Delivery Method per Vendor */}
          <section style={sectionCardStyles}>
            <h2 style={sectionTitleStyles}>
              <span style={stepBadgeStyles}>1</span>
              Vendor Delivery Methods
            </h2>
            <p style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              Dovi is a multi-vendor marketplace. Select how you want to receive items from each store.
            </p>

            {isLoadingData ? (
              <Skeleton width="100%" height="120px" borderRadius="var(--radius-md)" />
            ) : (
              vendorGroups.map((group) => {
                const currentMethod = vendorDeliveryMethods[group.vendor_id] || 'VENDOR_ARRANGED';
                return (
                  <div key={group.vendor_id} style={vendorBlockStyles}>
                    <div style={vendorHeaderStyles}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)', color: 'var(--color-primary)' }}>
                        STORE: {group.vendor_name}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    {/* Store items preview */}
                    <div style={itemListStyles}>
                      {group.items.map((item) => (
                        <div key={item.id} style={itemPreviewRowStyles}>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}>
                            • {item.product?.name || (item as any).name || 'Product'} (x{item.quantity})
                          </span>
                          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)' }}>
                            {formatCurrency(item.line_total || (item as any).total_price || 0)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Method Radio Options */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
                      {/* Pick Up */}
                      <label
                        style={{
                          ...optionCardStyles,
                          borderColor: currentMethod === 'PICKUP' ? 'var(--color-primary)' : 'var(--color-border)',
                          backgroundColor: currentMethod === 'PICKUP' ? 'rgba(103, 58, 183, 0.04)' : '#ffffff',
                        }}
                      >
                        <input
                          type="radio"
                          name={`delivery_${group.vendor_id}`}
                          checked={currentMethod === 'PICKUP'}
                          onChange={() => setMethodForVendor(group.vendor_id, 'PICKUP')}
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                        <div>
                          <strong style={{ fontSize: 'var(--text-sm)', display: 'block' }}>📍 Store Pick Up</strong>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            Free (₦0) · Collect from {group.vendor_name}
                          </span>
                          {currentMethod === 'PICKUP' && (
                            <p style={pickupNoteStyles}>
                              Vendor pickup location details will be displayed after order placement.
                            </p>
                          )}
                        </div>
                      </label>

                      {/* Vendor Arranged Delivery */}
                      <label
                        style={{
                          ...optionCardStyles,
                          borderColor: currentMethod === 'VENDOR_ARRANGED' ? 'var(--color-primary)' : 'var(--color-border)',
                          backgroundColor: currentMethod === 'VENDOR_ARRANGED' ? 'rgba(103, 58, 183, 0.04)' : '#ffffff',
                        }}
                      >
                        <input
                          type="radio"
                          name={`delivery_${group.vendor_id}`}
                          checked={currentMethod === 'VENDOR_ARRANGED'}
                          onChange={() => setMethodForVendor(group.vendor_id, 'VENDOR_ARRANGED')}
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                        <div>
                          <strong style={{ fontSize: 'var(--text-sm)', display: 'block' }}>🚚 Vendor Delivery</strong>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            Arranged directly by merchant
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                );
              })
            )}
          </section>

          {/* STEP 2: Delivery Address (Required if any vendor has VENDOR_ARRANGED) */}
          <section style={{ ...sectionCardStyles, opacity: requiresDeliveryAddress ? 1 : 0.65 }}>
            <h2 style={sectionTitleStyles}>
              <span style={stepBadgeStyles}>2</span>
              Delivery Address
              {!requiresDeliveryAddress && (
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-normal)', color: 'var(--color-text-muted)', marginLeft: 'var(--space-2)' }}>
                  (Not required for pickup)
                </span>
              )}
            </h2>

            {isLoadingData ? (
              <Skeleton width="100%" height="80px" borderRadius="var(--radius-md)" />
            ) : addresses.length === 0 && !showAddForm ? (
              <div style={noAddressStyles}>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                  No saved addresses found.
                </p>
                <button onClick={() => setShowAddForm(true)} style={addBtnStyles}>
                  + Add Delivery Address
                </button>
              </div>
            ) : (
              <>
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    style={{
                      ...addressCardStyles,
                      borderColor: selectedAddressId === addr.id ? 'var(--color-primary)' : 'var(--color-border)',
                      backgroundColor: selectedAddressId === addr.id ? 'rgba(103, 58, 183, 0.04)' : '#ffffff',
                    }}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
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
                  <button onClick={() => setShowAddForm(true)} style={addBtnStyles}>
                    + Add Delivery Address
                  </button>
                )}
              </>
            )}

            {/* Add Address Form Modal / Drawer */}
            {showAddForm && (
              <form onSubmit={handleAddAddress} style={addFormStyles}>
                <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)' }}>New Address</h4>
                <div style={formGridStyles}>
                  <input placeholder="Label (Home, Office)" value={addrForm.label} onChange={(e) => setAddrForm((p) => ({ ...p, label: e.target.value }))} style={inputStyles} required />
                  <input placeholder="Full Name" value={addrForm.full_name} onChange={(e) => setAddrForm((p) => ({ ...p, full_name: e.target.value }))} style={inputStyles} required />
                  <input placeholder="Phone Number" value={addrForm.phone} onChange={(e) => setAddrForm((p) => ({ ...p, phone: e.target.value }))} style={inputStyles} required />
                  <input placeholder="Address Line 1" value={addrForm.address_line_1} onChange={(e) => setAddrForm((p) => ({ ...p, address_line_1: e.target.value }))} style={inputStyles} required />
                  <input placeholder="Address Line 2 (Optional)" value={addrForm.address_line_2} onChange={(e) => setAddrForm((p) => ({ ...p, address_line_2: e.target.value }))} style={inputStyles} />
                  <input placeholder="City" value={addrForm.city} onChange={(e) => setAddrForm((p) => ({ ...p, city: e.target.value }))} style={inputStyles} required />
                  <input placeholder="State" value={addrForm.state} onChange={(e) => setAddrForm((p) => ({ ...p, state: e.target.value }))} style={inputStyles} required />
                  <input placeholder="Country" value={addrForm.country} onChange={(e) => setAddrForm((p) => ({ ...p, country: e.target.value }))} style={inputStyles} required />
                  <input placeholder="Postal Code (Optional)" value={addrForm.postal_code} onChange={(e) => setAddrForm((p) => ({ ...p, postal_code: e.target.value }))} style={inputStyles} />
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                  <button type="submit" disabled={addingAddr} style={primaryBtnStyles}>
                    {addingAddr ? 'Saving...' : 'Save Address'}
                  </button>
                  <button type="button" onClick={() => setShowAddForm(false)} style={secondaryBtnStyles}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>

        {/* Order Summary Sidebar */}
        <div style={summaryCardStyles}>
          <h3 style={summaryTitleStyles}>Order Summary</h3>

          {cart && (
            <>
              <div style={summaryRowStyles}>
                <span>Subtotal ({cart.item_count} items)</span>
                <span style={summaryValStyles}>{formatCurrency(cart.subtotal)}</span>
              </div>

              {/* Vendor Delivery Summary Breakdown */}
              <div style={{ margin: 'var(--space-3) 0', padding: 'var(--space-3)', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '11px', fontWeight: 'var(--font-bold)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Fulfillment Breakdown
                </span>
                {vendorGroups.map((g) => {
                  const m = vendorDeliveryMethods[g.vendor_id] || 'VENDOR_ARRANGED';
                  return (
                    <div key={g.vendor_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{g.vendor_name} ({m === 'PICKUP' ? 'Pickup' : 'Vendor Delivery'}):</span>
                      <span style={{ fontWeight: 'var(--font-semibold)' }}>{m === 'PICKUP' ? 'Free' : 'Calculated'}</span>
                    </div>
                  );
                })}
              </div>

              <hr style={dividerStyles} />

              <div style={{ ...summaryRowStyles, fontWeight: 'var(--font-bold)', fontSize: 'var(--text-lg)' }}>
                <span>Total Amount</span>
                <span style={{ color: 'var(--color-primary)' }}>{formatCurrency(cart.subtotal)}</span>
              </div>

              <button
                onClick={handleProceed}
                disabled={isSubmitting || (requiresDeliveryAddress && !selectedAddressId)}
                style={{ ...proceedBtnStyles, opacity: isSubmitting || (requiresDeliveryAddress && !selectedAddressId) ? 0.6 : 1 }}
              >
                {isSubmitting ? 'Initializing Checkout...' : 'Proceed to Review & Pay'}
              </button>
            </>
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

const vendorBlockStyles: React.CSSProperties = {
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-4)',
  marginBottom: 'var(--space-4)',
};

const vendorHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: 'var(--space-2)',
  borderBottom: '1px dashed var(--color-border)',
  marginBottom: 'var(--space-3)',
};

const itemListStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const itemPreviewRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const optionCardStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 'var(--space-2)',
  padding: 'var(--space-3)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  cursor: 'pointer',
  transition: 'border-color 0.2s, background-color 0.2s',
};

const pickupNoteStyles: React.CSSProperties = {
  margin: '4px 0 0',
  fontSize: '10px',
  color: 'var(--color-primary)',
  fontWeight: 'var(--font-medium)',
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

const noAddressStyles: React.CSSProperties = {
  padding: 'var(--space-4)',
  border: '1px dashed var(--color-border)',
  borderRadius: 'var(--radius-md)',
  textAlign: 'center',
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
  gridTemplateColumns: '1fr 1fr',
  gap: 'var(--space-2)',
};

const inputStyles: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  fontSize: 'var(--text-xs)',
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
