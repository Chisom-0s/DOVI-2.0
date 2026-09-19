import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { deliveryApi } from '@/api/delivery';
import type { DeliveryGroup } from '@/types';

export default function VendorOrderManager() {
  const [deliveryGroups, setDeliveryGroups] = useState<DeliveryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [selectedGroup, setSelectedGroup] = useState<DeliveryGroup | null>(null);

  // Modal State for Dispatching
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [trackingRef, setTrackingRef] = useState('');
  const [vendorNotes, setVendorNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDeliveryGroups = async () => {
    setIsLoading(true);
    try {
      const res = await deliveryApi.list();
      setDeliveryGroups(res.results || []);
    } catch {
      // Fallback if list endpoint returns raw array
      try {
        const { data } = await (await import('@/api/client')).default.get('/api/v1/delivery/');
        setDeliveryGroups(Array.isArray(data) ? data : (data.results || []));
      } catch (err: any) {
        toast.error('Failed to load merchant fulfillment groups.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryGroups();
  }, []);

  const filteredGroups = useMemo(() => {
    if (activeTab === 'ALL') return deliveryGroups;
    if (activeTab === 'PICKUP') return deliveryGroups.filter((g) => g.method === 'PICKUP');
    if (activeTab === 'VENDOR_ARRANGED') return deliveryGroups.filter((g) => g.method === 'VENDOR_ARRANGED');
    if (activeTab === 'READY') return deliveryGroups.filter((g) => g.status === 'READY_FOR_PICKUP' || g.status === 'READY_FOR_DELIVERY');
    if (activeTab === 'IN_TRANSIT') return deliveryGroups.filter((g) => g.status === 'IN_TRANSIT');
    if (activeTab === 'COMPLETED') return deliveryGroups.filter((g) => g.status === 'COMPLETED' || g.status === 'DELIVERED' || g.status === 'PICKED_UP');
    return deliveryGroups;
  }, [deliveryGroups, activeTab]);

  const handleMarkReady = async (groupId: string) => {
    setIsSubmitting(true);
    try {
      await deliveryApi.markReady(groupId);
      toast.success('Order marked ready for pickup/delivery!');
      fetchDeliveryGroups();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPickup = async (groupId: string) => {
    setIsSubmitting(true);
    try {
      await deliveryApi.confirmPickup(groupId);
      toast.success('Handover confirmed! Order marked as Picked Up.');
      fetchDeliveryGroups();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to confirm handover.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDispatchModal = (group: DeliveryGroup) => {
    setSelectedGroup(group);
    setTrackingRef(group.tracking_reference || '');
    setVendorNotes(group.vendor_notes || '');
    setShowDispatchModal(true);
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    setIsSubmitting(true);
    try {
      await deliveryApi.dispatch(selectedGroup.id, {
        tracking_reference: trackingRef,
        vendor_notes: vendorNotes,
      });
      toast.success('Order dispatched into transit!');
      setShowDispatchModal(false);
      fetchDeliveryGroups();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to dispatch order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: string | number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(
      typeof val === 'string' ? parseFloat(val) : val
    );

  return (
    <div style={wrapperStyles}>
      <div>
        <h2 style={titleStyles}>Merchant Order Fulfillment</h2>
        <p style={subtitleStyles}>
          Manage pickup handovers, dispatch vendor-arranged deliveries, and update customer tracking.
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={tabsRowStyles}>
        {[
          { id: 'ALL', label: 'All Orders' },
          { id: 'PICKUP', label: '📍 Store Pickups' },
          { id: 'VENDOR_ARRANGED', label: '🚚 Vendor Deliveries' },
          { id: 'READY', label: 'Ready Orders' },
          { id: 'IN_TRANSIT', label: 'In Transit' },
          { id: 'COMPLETED', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...tabBtnStyles,
              borderColor: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
              color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: activeTab === tab.id ? 'var(--font-bold)' : 'var(--font-normal)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Fulfillment Table */}
      <div style={tableWrapperStyles}>
        {isLoading ? (
          <div style={loadingStyles}>Loading fulfillment orders...</div>
        ) : filteredGroups.length === 0 ? (
          <div style={emptyStyles}>No fulfillment groups found matching the current filter.</div>
        ) : (
          <table style={tableStyles}>
            <thead>
              <tr style={tableHeaderRowStyles}>
                <th style={thStyles}>ORDER REF</th>
                <th style={thStyles}>METHOD</th>
                <th style={thStyles}>RECIPIENT / PICKUP</th>
                <th style={thStyles}>STATUS</th>
                <th style={thStyles}>FEE</th>
                <th style={{ ...thStyles, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((g) => (
                <tr key={g.id} style={tableRowStyles}>
                  <td style={tdRefStyles}>
                    <strong>#{g.order_reference || g.order}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {g.items?.length || 0} item(s)
                    </div>
                  </td>
                  <td style={tdStyles}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 'var(--font-semibold)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-md)',
                        background: g.method === 'PICKUP' ? 'rgba(103, 58, 183, 0.08)' : 'rgba(46, 213, 115, 0.08)',
                        color: g.method === 'PICKUP' ? 'var(--color-primary)' : 'var(--color-success)',
                      }}
                    >
                      {g.method === 'PICKUP' ? '📍 Store Pickup' : '🚚 Vendor Delivery'}
                    </span>
                  </td>
                  <td style={tdBuyerStyles}>
                    {g.method === 'PICKUP' ? (
                      <div>
                        <strong>Pickup Store Snapshot:</strong>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {g.pickup_city ? `${g.pickup_city}, ${g.pickup_state}` : 'Vendor Store Location'}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <strong>{g.recipient_name || 'Customer'}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {g.delivery_city ? `${g.delivery_city}, ${g.delivery_state}` : g.delivery_address}
                        </div>
                      </div>
                    )}
                  </td>
                  <td style={tdStyles}>
                    <span style={statusBadgeStyles(g.status)}>
                      {g.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={tdAmountStyles}>
                    {g.delivery_fee && parseFloat(g.delivery_fee) > 0
                      ? formatCurrency(g.delivery_fee)
                      : 'Free'}
                  </td>
                  <td style={{ ...tdStyles, textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      {/* Action buttons based on current method and state */}
                      {g.method === 'PICKUP' && g.status === 'PENDING' && (
                        <button
                          onClick={() => handleMarkReady(g.id)}
                          disabled={isSubmitting}
                          style={primaryActionBtn}
                        >
                          Mark Ready for Pickup
                        </button>
                      )}

                      {g.method === 'PICKUP' && g.status === 'READY_FOR_PICKUP' && (
                        <button
                          onClick={() => handleConfirmPickup(g.id)}
                          disabled={isSubmitting}
                          style={successActionBtn}
                        >
                          Confirm Handover
                        </button>
                      )}

                      {g.method === 'VENDOR_ARRANGED' && g.status === 'PENDING' && (
                        <button
                          onClick={() => handleMarkReady(g.id)}
                          disabled={isSubmitting}
                          style={primaryActionBtn}
                        >
                          Mark Ready for Delivery
                        </button>
                      )}

                      {g.method === 'VENDOR_ARRANGED' && (g.status === 'PENDING' || g.status === 'READY_FOR_DELIVERY') && (
                        <button
                          onClick={() => handleOpenDispatchModal(g)}
                          disabled={isSubmitting}
                          style={primaryActionBtn}
                        >
                          Dispatch (In Transit)
                        </button>
                      )}

                      {(g.status === 'COMPLETED' || g.status === 'PICKED_UP' || g.status === 'DELIVERED') && (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', fontWeight: 'var(--font-medium)' }}>
                          ✓ Fulfilled
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Dispatch Modal */}
      {showDispatchModal && (
        <div style={modalBackdropStyles}>
          <form onSubmit={handleDispatchSubmit} style={modalContentStyles}>
            <h3 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)' }}>
              Dispatch Delivery #{selectedGroup?.order_reference}
            </h3>
            <p style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              Enter courier tracking reference or logistics details for the customer.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)' }}>Tracking Reference / Courier ID</label>
                <input
                  type="text"
                  placeholder="e.g. GIG-908123 or Courier Driver Name"
                  value={trackingRef}
                  onChange={(e) => setTrackingRef(e.target.value)}
                  style={inputStyles}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)' }}>Vendor Notes (Optional)</label>
                <textarea
                  placeholder="e.g. Package dispatched via local rider."
                  value={vendorNotes}
                  onChange={(e) => setVendorNotes(e.target.value)}
                  style={{ ...inputStyles, height: '60px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowDispatchModal(false)} style={cancelBtnStyles}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} style={primaryActionBtn}>
                  {isSubmitting ? 'Dispatching...' : 'Confirm Dispatch'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// Helpers
function statusBadgeStyles(status: string): React.CSSProperties {
  switch (status) {
    case 'READY_FOR_PICKUP':
    case 'READY_FOR_DELIVERY':
    case 'IN_TRANSIT':
      return {
        display: 'inline-block',
        fontSize: '11px',
        fontWeight: 'var(--font-bold)',
        padding: '2px 8px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(103, 58, 183, 0.12)',
        color: 'var(--color-primary)',
      };
    case 'PICKED_UP':
    case 'DELIVERED':
    case 'COMPLETED':
      return {
        display: 'inline-block',
        fontSize: '11px',
        fontWeight: 'var(--font-bold)',
        padding: '2px 8px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(46, 213, 115, 0.12)',
        color: 'var(--color-success)',
      };
    case 'CANCELLED':
    case 'FAILED':
      return {
        display: 'inline-block',
        fontSize: '11px',
        fontWeight: 'var(--font-bold)',
        padding: '2px 8px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(231, 76, 60, 0.12)',
        color: 'var(--color-danger)',
      };
    default:
      return {
        display: 'inline-block',
        fontSize: '11px',
        fontWeight: 'var(--font-medium)',
        padding: '2px 8px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-bg-subtle)',
        color: 'var(--color-text-muted)',
      };
  }
}

// Styles
const wrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-5)',
  padding: 'var(--space-6)',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-bold)',
  margin: 0,
};

const subtitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  margin: '4px 0 0',
};

const tabsRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-2)',
  borderBottom: '1px solid var(--color-border)',
  overflowX: 'auto',
  paddingBottom: 'var(--space-1)',
};

const tabBtnStyles: React.CSSProperties = {
  padding: '8px 14px',
  background: 'none',
  border: 'none',
  borderBottom: '2px solid transparent',
  fontSize: 'var(--text-xs)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const tableWrapperStyles: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  overflow: 'hidden',
};

const tableStyles: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
};

const tableHeaderRowStyles: React.CSSProperties = {
  background: 'var(--color-bg-subtle)',
  borderBottom: '1px solid var(--color-border)',
};

const thStyles: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '11px',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text-muted)',
};

const tableRowStyles: React.CSSProperties = {
  borderBottom: '1px solid var(--color-border)',
};

const tdStyles: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 'var(--text-xs)',
};

const tdRefStyles: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 'var(--text-xs)',
};

const tdBuyerStyles: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 'var(--text-xs)',
};

const tdAmountStyles: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-bold)',
};

const primaryActionBtn: React.CSSProperties = {
  padding: '6px 12px',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontSize: '11px',
  fontWeight: 'var(--font-bold)',
  cursor: 'pointer',
};

const successActionBtn: React.CSSProperties = {
  padding: '6px 12px',
  backgroundColor: '#2ed573',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontSize: '11px',
  fontWeight: 'var(--font-bold)',
  cursor: 'pointer',
};

const cancelBtnStyles: React.CSSProperties = {
  padding: '6px 12px',
  background: 'transparent',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontSize: '11px',
  cursor: 'pointer',
};

const loadingStyles: React.CSSProperties = {
  padding: 'var(--space-8)',
  textAlign: 'center',
  color: 'var(--color-text-muted)',
  fontSize: 'var(--text-xs)',
};

const emptyStyles: React.CSSProperties = {
  padding: 'var(--space-8)',
  textAlign: 'center',
  color: 'var(--color-text-muted)',
  fontSize: 'var(--text-xs)',
};

const modalBackdropStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalContentStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  padding: 'var(--space-5)',
  borderRadius: 'var(--radius-lg)',
  width: '100%',
  maxWidth: '440px',
};

const inputStyles: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  fontSize: 'var(--text-xs)',
  marginTop: '4px',
};
