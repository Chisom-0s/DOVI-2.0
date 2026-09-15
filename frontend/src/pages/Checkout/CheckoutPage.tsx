import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '@/contexts/CartContext';
import { authApi } from '@/api/auth';
import { checkoutApi } from '@/api/checkout';
import type { Address } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';

// ----------------------------------------------------------
// CheckoutPage — Step 1: Address + Delivery Method
// All data fetched from API. No mock data.
// ----------------------------------------------------------
export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, isLoading: cartLoading } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [deliveryMethods, setDeliveryMethods] = useState<
    Array<{ id: string; name: string; description: string; estimated_days: string; price: string }>
  >([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // "Add New Address" form
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

  // Fetch addresses + delivery methods from API
  const fetchData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [addrsRes, methodsRes] = await Promise.allSettled([
        authApi.getAddresses(),
        checkoutApi.getDeliveryMethods(),
      ]);
      const addrs: Address[] = addrsRes.status === 'fulfilled' && Array.isArray(addrsRes.value) ? addrsRes.value : [];
      const methods = methodsRes.status === 'fulfilled' && Array.isArray(methodsRes.value) ? methodsRes.value : [];
      setAddresses(addrs);
      if (addrs.length > 0) {
        const defaultAddr = addrs.find((a: Address) => a.is_default);
        setSelectedAddressId(defaultAddr?.id || addrs[0].id);
      } else {
        setShowAddForm(true);
      }
      setDeliveryMethods(methods);
      if (methods.length > 0) {
        setSelectedMethodId(methods[0].id);
      }
    } catch {
      toast.error('Could not load checkout data. Please try again.');
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle new address submission
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
      setAddresses(prev => [...prev, newAddr]);
      setSelectedAddressId(newAddr.id);
      setShowAddForm(false);
      setAddrForm({ label: '', full_name: '', phone: '', address_line_1: '', address_line_2: '', city: '', state: '', country: 'Nigeria', postal_code: '', is_default: false });
      toast.success('Address added!');
    } catch {
      toast.error('Failed to add address.');
    } finally {
      setAddingAddr(false);
    }
  };

  // Initialize Checkout Session
  const handleProceed = async () => {
    if (!selectedAddressId || !selectedMethodId) {
      toast.error('Please select a delivery address and shipping method.');
      return;
    }
    setIsSubmitting(true);
    try {
      const session = await checkoutApi.initializeSession({
        delivery_address_id: selectedAddressId,
        delivery_method_id: selectedMethodId,
      });
      navigate(`/checkout/${session.id}`);
    } catch {
      toast.error('Failed to initialize checkout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if empty cart
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

  return (
    <div className="container" style={pageStyles}>
      <h1 style={pageTitleStyles}>Checkout</h1>

      <div className="checkout-layout-grid">
        {/* Main Column */}
        <div style={mainColStyles}>
          {/* STEP 1: Delivery Address */}
          <section style={sectionStyles}>
            <h2 style={sectionTitleStyles}>
              <span style={stepNumberStyles}>1</span>
              Delivery Address
            </h2>

            {isLoadingData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} width="100%" height="60px" borderRadius="var(--radius-md)" />
                ))}
              </div>
            ) : addresses.length === 0 && !showAddForm ? (
              <div style={noAddressStyles}>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                  You don't have any saved addresses yet.
                </p>
                <button onClick={() => setShowAddForm(true)} style={addBtnStyles}>
                  + Add New Address
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
                    + Add New Address
                  </button>
                )}
              </>
            )}

            {/* Add Address Form */}
            {showAddForm && (
              <form onSubmit={handleAddAddress} style={addFormStyles}>
                <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)' }}>New Address</h4>
                <div style={formGridStyles}>
                  <input placeholder="Label (e.g. Home, Office)" value={addrForm.label} onChange={e => setAddrForm(p => ({ ...p, label: e.target.value }))} style={inputStyles} required />
                  <input placeholder="Full Name" value={addrForm.full_name} onChange={e => setAddrForm(p => ({ ...p, full_name: e.target.value }))} style={inputStyles} required />
                  <input placeholder="Phone Number" value={addrForm.phone} onChange={e => setAddrForm(p => ({ ...p, phone: e.target.value }))} style={inputStyles} required />
                  <input placeholder="Address Line 1" value={addrForm.address_line_1} onChange={e => setAddrForm(p => ({ ...p, address_line_1: e.target.value }))} style={inputStyles} required />
                  <input placeholder="Address Line 2 (Optional)" value={addrForm.address_line_2} onChange={e => setAddrForm(p => ({ ...p, address_line_2: e.target.value }))} style={inputStyles} />
                  <input placeholder="City" value={addrForm.city} onChange={e => setAddrForm(p => ({ ...p, city: e.target.value }))} style={inputStyles} required />
                  <input placeholder="State" value={addrForm.state} onChange={e => setAddrForm(p => ({ ...p, state: e.target.value }))} style={inputStyles} required />
                  <input placeholder="Country" value={addrForm.country} onChange={e => setAddrForm(p => ({ ...p, country: e.target.value }))} style={inputStyles} required />
                  <input placeholder="Postal Code (Optional)" value={addrForm.postal_code} onChange={e => setAddrForm(p => ({ ...p, postal_code: e.target.value }))} style={inputStyles} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  <input type="checkbox" checked={addrForm.is_default} onChange={e => setAddrForm(p => ({ ...p, is_default: e.target.checked }))} />
                  Set as default address
                </label>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
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

          {/* STEP 2: Delivery Method */}
          <section style={sectionStyles}>
            <h2 style={sectionTitleStyles}>
              <span style={stepNumberStyles}>2</span>
              Delivery Method
            </h2>

            {isLoadingData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} width="100%" height="50px" borderRadius="var(--radius-md)" />
                ))}
              </div>
            ) : deliveryMethods.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                No delivery methods available.
              </p>
            ) : (
              deliveryMethods.map((method) => (
                <label
                  key={method.id}
                  style={{
                    ...methodCardStyles,
                    borderColor: selectedMethodId === method.id ? 'var(--color-primary)' : 'var(--color-border)',
                    backgroundColor: selectedMethodId === method.id ? 'rgba(103, 58, 183, 0.04)' : '#ffffff',
                  }}
                >
                  <input
                    type="radio"
                    name="delivery_method"
                    checked={selectedMethodId === method.id}
                    onChange={() => setSelectedMethodId(method.id)}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: 'var(--text-sm)' }}>{method.name}</strong>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {method.description} · {method.estimated_days}
                    </p>
                  </div>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', color: 'var(--color-text)' }}>
                    {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(parseFloat(method.price))}
                  </span>
                </label>
              ))
            )}
          </section>
        </div>

        {/* Summary Sidebar */}
        <div style={summaryCardStyles}>
          <h3 style={summaryTitleStyles}>Order Summary</h3>

          {cart && (
            <>
              <div style={summaryRowStyles}>
                <span>{cart.item_count} {cart.item_count === 1 ? 'item' : 'items'}</span>
                <span style={summaryValStyles}>
                  {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(parseFloat(cart.subtotal))}
                </span>
              </div>

              {selectedMethodId && deliveryMethods.length > 0 && (
                <div style={summaryRowStyles}>
                  <span>Delivery</span>
                  <span style={summaryValStyles}>
                    {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(
                      parseFloat(deliveryMethods.find(m => m.id === selectedMethodId)?.price || '0')
                    )}
                  </span>
                </div>
              )}

              <hr style={dividerStyles} />

              <div style={{ ...summaryRowStyles, fontWeight: 'var(--font-bold)' }}>
                <span>Total</span>
                <span style={{ ...summaryValStyles, color: 'var(--color-primary)', fontSize: 'var(--text-lg)' }}>
                  {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(parseFloat(cart.total))}
                </span>
              </div>
            </>
          )}

          <button
            onClick={handleProceed}
            disabled={isSubmitting || !selectedAddressId || !selectedMethodId || isLoadingData}
            style={{
              ...primaryBtnStyles,
              width: '100%',
              height: '44px',
              opacity: (isSubmitting || !selectedAddressId || !selectedMethodId) ? 0.6 : 1,
            }}
          >
            {isSubmitting ? 'Processing...' : 'Continue to Payment'}
          </button>

          <Link to="/cart" style={backLinkStyles}>
            ← Back to Cart
          </Link>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling
// ----------------------------------------------------------
const pageStyles: React.CSSProperties = {
  paddingTop: 'var(--space-6)',
  paddingBottom: 'var(--space-12)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-6)',
};

const pageTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-2xl)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
};

const mainColStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-6)',
};

const sectionStyles: React.CSSProperties = {
  padding: 'var(--space-5)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const sectionTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  margin: 0,
};

const stepNumberStyles: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  fontWeight: 'var(--font-bold)',
  flexShrink: 0,
};

const addressCardStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 'var(--space-3)',
  padding: 'var(--space-3) var(--space-4)',
  border: '2px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
};

const addressSubStyles: React.CSSProperties = {
  margin: 0,
  fontSize: '11px',
  color: 'var(--color-text-muted)',
  lineHeight: 1.4,
};

const noAddressStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--space-3)',
  padding: 'var(--space-6)',
  border: '2px dashed var(--color-border)',
  borderRadius: 'var(--radius-md)',
};

const addBtnStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-primary)',
  fontWeight: 'var(--font-semibold)',
  backgroundColor: 'transparent',
  border: '1px dashed var(--color-primary)',
  borderRadius: 'var(--radius-md)',
  padding: '8px 16px',
  cursor: 'pointer',
  width: 'fit-content',
};

const addFormStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
  padding: 'var(--space-4)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--color-bg-subtle)',
};

const formGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: 'var(--space-3)',
};

const inputStyles: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 'var(--text-xs)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  outline: 'none',
  fontFamily: 'var(--font-sans)',
};

const methodCardStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  padding: 'var(--space-3) var(--space-4)',
  border: '2px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
};

const summaryCardStyles: React.CSSProperties = {
  padding: 'var(--space-6)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--color-bg-subtle)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  height: 'fit-content',
  position: 'sticky',
  top: 'var(--space-4)',
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
  color: 'var(--color-text-muted)',
};

const summaryValStyles: React.CSSProperties = {
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text)',
};

const dividerStyles: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid var(--color-border)',
  margin: 0,
};

const primaryBtnStyles: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-sm)',
  cursor: 'pointer',
  textDecoration: 'none',
  textAlign: 'center',
};

const secondaryBtnStyles: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: 'transparent',
  color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontWeight: 'var(--font-semibold)',
  fontSize: 'var(--text-sm)',
  cursor: 'pointer',
};

const backLinkStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  textDecoration: 'none',
  textAlign: 'center',
  fontWeight: 'var(--font-medium)',
};

const emptyStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--space-3)',
  padding: 'var(--space-16) var(--space-4)',
  textAlign: 'center',
};

const emptyTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--font-bold)',
  margin: 0,
};
