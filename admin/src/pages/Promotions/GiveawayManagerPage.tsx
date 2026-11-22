import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  fetchAuthoritativeGiveawayPromotion,
  updateAdminGiveawayConfig,
  computeGiveawayStatus,
} from '@/services/giveawayService';
import type {
  LaunchGiveawayPromotion,
  GiveawayClaim,
  GiveawayStatus,
} from '@/types';

export default function GiveawayManagerPage() {
  const [promo, setPromo] = useState<LaunchGiveawayPromotion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Edit fields
  const [status, setStatus] = useState<GiveawayStatus>('ACTIVE');
  const [totalStock, setTotalStock] = useState<number>(20);
  const [qualifyingSubtotal, setQualifyingSubtotal] = useState<number>(30000);
  const [startDate, setStartDate] = useState<string>('2026-11-22T00:00:00Z');
  const [endDate, setEndDate] = useState<string>('2026-12-20T23:59:59Z');
  const [headline, setHeadline] = useState<string>('SHOP ₦30,000 OR MORE AND GET A FREE EARPOD!');

  // Filter for claims table
  const [claimsFilter, setClaimsFilter] = useState<'ALL' | 'RESERVED' | 'CONFIRMED' | 'RELEASED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Simulation test mode state
  const [simLogs, setSimLogs] = useState<Array<{ timestamp: string; type: 'success' | 'error' | 'info'; message: string }>>([]);
  const [simulatedStock, setSimulatedStock] = useState<number>(20);
  const [simulatedReserved, setSimulatedReserved] = useState<number>(0);
  const [simulatedConfirmed, setSimulatedConfirmed] = useState<number>(0);
  const [simulatedCustomerClaims, setSimulatedCustomerClaims] = useState<Set<string>>(new Set());

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAuthoritativeGiveawayPromotion();
      setPromo(data);
      setStatus(data.status);
      setTotalStock(data.total_stock);
      setQualifyingSubtotal(data.qualifying_subtotal);
      setStartDate(data.start_date);
      setEndDate(data.end_date);
      setHeadline(data.headline);
    } catch {
      toast.error('Failed to load giveaway configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalStock > 50) {
      toast.error('Promotional stock cannot exceed maximum planned limit of 50 units.');
      return;
    }
    if (totalStock < (promo?.reserved_stock || 0) + (promo?.confirmed_stock || 0)) {
      toast.error(`Cannot reduce total stock below currently allocated units (${(promo?.reserved_stock || 0) + (promo?.confirmed_stock || 0)}).`);
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateAdminGiveawayConfig({
        status,
        total_stock: Number(totalStock),
        qualifying_subtotal: Number(qualifyingSubtotal),
        start_date: startDate,
        end_date: endDate,
        headline,
      });

      if (res.success && res.promo) {
        setPromo(res.promo);
        toast.success('Launch Giveaway configuration saved successfully!');
      } else {
        toast.error(res.error || 'Failed to save configuration.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating giveaway configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const addSimLog = (type: 'success' | 'error' | 'info', message: string) => {
    setSimLogs((prev) => [
      { timestamp: new Date().toLocaleTimeString(), type, message },
      ...prev.slice(0, 49),
    ]);
  };

  // Safe simulation test scenarios (Part E: Never alters real production data)
  const runSimulation = (scenario: string) => {
    const custId = `test_cust_${Math.floor(Math.random() * 1000)}`;

    switch (scenario) {
      case 'QUALIFYING_ORDER': {
        const subtotal = 35000;
        if (subtotal >= qualifyingSubtotal) {
          addSimLog('success', `[Sim: Qualifying Order] Subtotal ₦${subtotal.toLocaleString()} qualifies (>= ₦${qualifyingSubtotal.toLocaleString()}). Free EarPod pop-up unlocked!`);
        }
        break;
      }
      case 'NON_QUALIFYING_ORDER': {
        const subtotal = 28000;
        if (subtotal < qualifyingSubtotal) {
          addSimLog('error', `[Sim: Non-Qualifying Order] Subtotal ₦${subtotal.toLocaleString()} does NOT qualify. Need ₦${(qualifyingSubtotal - subtotal).toLocaleString()} more.`);
        }
        break;
      }
      case 'RESERVE_GIFT': {
        const avail = simulatedStock - (simulatedReserved + simulatedConfirmed);
        if (avail <= 0) {
          addSimLog('error', `[Sim: Stock Check] Cannot reserve gift. Available stock is 0.`);
          return;
        }
        setSimulatedReserved((p) => p + 1);
        addSimLog('success', `[Sim: Gift Reserved] 1 EarPod reserved for order #SIM-ORD-${Date.now().toString().slice(-4)}. Available stock: ${avail - 1}.`);
        break;
      }
      case 'PAYMENT_VERIFIED': {
        if (simulatedReserved <= 0) {
          addSimLog('error', `[Sim: Verification] No active reservation found to confirm.`);
          return;
        }
        setSimulatedReserved((p) => Math.max(0, p - 1));
        setSimulatedConfirmed((p) => p + 1);
        setSimulatedCustomerClaims((prev) => new Set([...prev, custId]));
        addSimLog('success', `[Sim: Payment Verified] Admin verified payment. EarPod permanently confirmed for customer ${custId}.`);
        break;
      }
      case 'PAYMENT_REJECTED': {
        if (simulatedReserved <= 0) {
          addSimLog('error', `[Sim: Rejection] No active reservation to release.`);
          return;
        }
        setSimulatedReserved((p) => Math.max(0, p - 1));
        addSimLog('info', `[Sim: Payment Rejected] Admin rejected transfer. Reservation safely released back to available pool.`);
        break;
      }
      case 'SESSION_EXPIRED': {
        if (simulatedReserved <= 0) {
          addSimLog('error', `[Sim: Expiry] No active reservation to release.`);
          return;
        }
        setSimulatedReserved((p) => Math.max(0, p - 1));
        addSimLog('info', `[Sim: 60-Min Expiry] Payment session expired unpaid. Reservation released back to pool.`);
        break;
      }
      case 'ORDER_CANCELLED': {
        if (simulatedReserved <= 0) {
          addSimLog('error', `[Sim: Cancel] No active reservation to release.`);
          return;
        }
        setSimulatedReserved((p) => Math.max(0, p - 1));
        addSimLog('info', `[Sim: Order Cancelled] Customer cancelled order before verification. Gift released back to available pool.`);
        break;
      }
      case 'STOCK_EXHAUSTED': {
        setSimulatedStock(20);
        setSimulatedConfirmed(20);
        setSimulatedReserved(0);
        addSimLog('error', `[Sim: Stock Exhaustion] All 20 gifts confirmed. Promotion auto-transitions to OUT_OF_STOCK.`);
        break;
      }
      case 'DUPLICATE_CLAIM': {
        const count = simulatedCustomerClaims.size;
        addSimLog('error', `[Sim: 1-Per-Customer] Customer (${count > 0 ? 'prior claimant' : custId}) already received a verified gift. Second claim strictly blocked on backend.`);
        break;
      }
      case 'PROMOTION_EXPIRED': {
        addSimLog('info', `[Sim: Expiry] Date reaches 21 December 2026. Status evaluates to EXPIRED, banner auto-hides.`);
        break;
      }
      case 'ADMIN_DISABLED': {
        addSimLog('info', `[Sim: Disabled] Admin toggled status to DISABLED. All new claims and pop-ups blocked.`);
        break;
      }
      case 'RESET_SIMULATION': {
        setSimulatedStock(20);
        setSimulatedReserved(0);
        setSimulatedConfirmed(0);
        setSimulatedCustomerClaims(new Set());
        setSimLogs([]);
        toast.success('Simulation sandbox reset! Zero mock records in database.');
        break;
      }
    }
  };

  const effectiveStatus = promo ? computeGiveawayStatus(promo) : 'ACTIVE';

  const statusColors: Record<GiveawayStatus, { bg: string; text: string }> = {
    ACTIVE: { bg: '#dcfce7', text: '#15803d' },
    SCHEDULED: { bg: '#fef3c7', text: '#b45309' },
    OUT_OF_STOCK: { bg: '#fee2e2', text: '#b91c1c' },
    EXPIRED: { bg: '#f3f4f6', text: '#4b5563' },
    DISABLED: { bg: '#f1f5f9', text: '#64748b' },
  };

  const filteredClaims = (promo?.claims || []).filter((c: GiveawayClaim) => {
    if (claimsFilter !== 'ALL' && c.status !== claimsFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchRef = c.order_reference.toLowerCase().includes(q);
      const matchCust = (c.customer_name || '').toLowerCase().includes(q) || (c.customer_email || '').toLowerCase().includes(q);
      return matchRef || matchCust;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div style={{ padding: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800 }}>DOVI Launch Giveaway</h1>
        <p style={{ color: '#64748b' }}>Loading promotional configuration...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#111827', margin: 0 }}>
              🎁 DOVI Launch Giveaway Management
            </h1>
            <span
              style={{
                backgroundColor: statusColors[effectiveStatus].bg,
                color: statusColors[effectiveStatus].text,
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'uppercase',
              }}
            >
              {effectiveStatus.replace(/_/g, ' ')}
            </span>
          </div>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '6px 0 0' }}>
            Manage the launch EarPod giveaway promotion, monitor promotional stock allocations, view claimed gifts, and run safe sandbox simulations.
          </p>
        </div>

        <button
          onClick={loadData}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            border: '1px solid #d1d5db',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          🔄 Refresh Status
        </button>
      </div>

      {/* METRIC COUNTER CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div style={metricCardStyles}>
          <span style={metricLabelStyles}>Total Planned Stock</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={metricValueStyles}>{promo?.total_stock || 20}</span>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>/ 50 max</span>
          </div>
          <span style={metricSubtextStyles}>Initial 20 · Up to 50 max</span>
        </div>

        <div style={metricCardStyles}>
          <span style={{ ...metricLabelStyles, color: '#059669' }}>Available Gifts</span>
          <span style={{ ...metricValueStyles, color: '#059669' }}>{promo?.available_stock ?? 20}</span>
          <span style={metricSubtextStyles}>Ready to claim by customers</span>
        </div>

        <div style={metricCardStyles}>
          <span style={{ ...metricLabelStyles, color: '#d97706' }}>Reserved Gifts</span>
          <span style={{ ...metricValueStyles, color: '#d97706' }}>{promo?.reserved_stock || 0}</span>
          <span style={metricSubtextStyles}>In active checkout / pending payment</span>
        </div>

        <div style={metricCardStyles}>
          <span style={{ ...metricLabelStyles, color: '#2563eb' }}>Confirmed Gifts</span>
          <span style={{ ...metricValueStyles, color: '#2563eb' }}>{promo?.confirmed_stock || 0}</span>
          <span style={metricSubtextStyles}>Payment verified by admin</span>
        </div>

        <div style={metricCardStyles}>
          <span style={{ ...metricLabelStyles, color: '#6b7280' }}>Released Reservations</span>
          <span style={{ ...metricValueStyles, color: '#6b7280' }}>{promo?.released_reservations_count || 0}</span>
          <span style={metricSubtextStyles}>Returned to pool on expiry/cancel</span>
        </div>
      </div>

      {/* CONFIGURATION & EDIT FORM */}
      <div style={cardStyles}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px', color: '#1f2937' }}>
          ⚙️ Promotion Configuration
        </h2>

        <form onSubmit={handleSaveChanges} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div>
              <label style={labelStyles}>Promotion Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as GiveawayStatus)}
                style={inputStyles}
              >
                <option value="ACTIVE">Active (Live to Qualifying Customers)</option>
                <option value="DISABLED">Disabled (Temporarily Suspended)</option>
                <option value="SCHEDULED">Scheduled (Pending Start Date)</option>
              </select>
            </div>

            <div>
              <label style={labelStyles}>Promotional Stock (20 to 50 Max)</label>
              <input
                type="number"
                min={(promo?.reserved_stock || 0) + (promo?.confirmed_stock || 0)}
                max={50}
                value={totalStock}
                onChange={(e) => setTotalStock(Number(e.target.value))}
                style={inputStyles}
                required
              />
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Allocated: {(promo?.reserved_stock || 0) + (promo?.confirmed_stock || 0)} · Max limit: 50 units
              </span>
            </div>

            <div>
              <label style={labelStyles}>Qualifying Product Subtotal (₦)</label>
              <input
                type="number"
                min={1000}
                step={500}
                value={qualifyingSubtotal}
                onChange={(e) => setQualifyingSubtotal(Number(e.target.value))}
                style={inputStyles}
                required
              />
              <span style={{ fontSize: '11px', color: '#64748b' }}>Excludes delivery fees and gifts</span>
            </div>

            <div>
              <label style={labelStyles}>Promotion End Date (Default: 20 Dec 2026)</label>
              <input
                type="text"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={inputStyles}
                placeholder="2026-12-20T23:59:59Z"
                required
              />
            </div>
          </div>

          <div>
            <label style={labelStyles}>Customer-Facing Headline</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              style={inputStyles}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                backgroundColor: '#ff7a00',
                color: '#ffffff',
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              {isSaving ? 'Saving Changes...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>

      {/* PART E: SAFE TESTING & SIMULATION LABORATORY */}
      <div style={{ ...cardStyles, marginTop: '24px', border: '2px dashed #93c5fd', backgroundColor: '#eff6ff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#1e40af' }}>
              🧪 Safe Promotion Simulation Sandbox (Testing Mode)
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#3b82f6' }}>
              Test orders and simulations execute in an isolated sandbox and NEVER consume real promotional stock.
            </p>
          </div>
          <button
            onClick={() => runSimulation('RESET_SIMULATION')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#dbeafe',
              border: '1px solid #bfdbfe',
              color: '#1e40af',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Clear Simulation Sandbox
          </button>
        </div>

        {/* Simulation Buttons Grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => runSimulation('QUALIFYING_ORDER')} style={simBtnStyles}>
            1. Qualifying Order (₦35k)
          </button>
          <button onClick={() => runSimulation('NON_QUALIFYING_ORDER')} style={simBtnStyles}>
            2. Non-Qualifying Order (₦28k)
          </button>
          <button onClick={() => runSimulation('RESERVE_GIFT')} style={simBtnStyles}>
            3. Reserve Gift
          </button>
          <button onClick={() => runSimulation('PAYMENT_VERIFIED')} style={simBtnStyles}>
            4. Verify Payment (Confirm)
          </button>
          <button onClick={() => runSimulation('PAYMENT_REJECTED')} style={simBtnStyles}>
            5. Reject Payment (Release)
          </button>
          <button onClick={() => runSimulation('SESSION_EXPIRED')} style={simBtnStyles}>
            6. Session Expiry (Release)
          </button>
          <button onClick={() => runSimulation('ORDER_CANCELLED')} style={simBtnStyles}>
            7. Cancel Order (Release)
          </button>
          <button onClick={() => runSimulation('DUPLICATE_CLAIM')} style={simBtnStyles}>
            8. Duplicate Claim Check
          </button>
          <button onClick={() => runSimulation('STOCK_EXHAUSTED')} style={simBtnStyles}>
            9. Stock Exhaustion
          </button>
          <button onClick={() => runSimulation('PROMOTION_EXPIRED')} style={simBtnStyles}>
            10. End Date Expiry
          </button>
          <button onClick={() => runSimulation('ADMIN_DISABLED')} style={simBtnStyles}>
            11. Admin Disabling
          </button>
        </div>

        {/* Simulation Output Log Window */}
        <div
          style={{
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '12px',
            fontFamily: 'monospace',
            maxHeight: '160px',
            overflowY: 'auto',
          }}
        >
          {simLogs.length === 0 ? (
            <span style={{ color: '#94a3b8' }}>Click any simulation button above to test giveaway scenarios in real time...</span>
          ) : (
            simLogs.map((l, i) => (
              <div key={i} style={{ color: l.type === 'error' ? '#f87171' : l.type === 'success' ? '#4ade80' : '#93c5fd', marginBottom: '4px' }}>
                [{l.timestamp}] {l.message}
              </div>
            ))
          )}
        </div>
      </div>

      {/* CLAIMED GIFTS AUDIT TABLE */}
      <div style={{ ...cardStyles, marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#1f2937' }}>
              📋 Claimed Gifts &amp; Allocations Audit Trail
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
              Full transparency of reserved, confirmed, and released gift allocations with associated order references.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search order ref / customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
            />

            <select
              value={claimsFilter}
              onChange={(e) => setClaimsFilter(e.target.value as any)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
            >
              <option value="ALL">All Claims</option>
              <option value="RESERVED">Reserved</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="RELEASED">Released</option>
            </select>
          </div>
        </div>

        {filteredClaims.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8' }}>
            <span>No giveaway claims recorded yet. Claims will appear here automatically as qualifying customers checkout.</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left', color: '#6b7280' }}>
                  <th style={{ padding: '10px 12px' }}>Order Ref</th>
                  <th style={{ padding: '10px 12px' }}>Customer</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px' }}>Reserved At</th>
                  <th style={{ padding: '10px 12px' }}>Confirmed At</th>
                  <th style={{ padding: '10px 12px' }}>Released At / Reason</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((claim: GiveawayClaim) => (
                  <tr key={claim.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#ff7a00' }}>
                      <a href={`/orders?search=${claim.order_reference}`} style={{ color: '#ff7a00', textDecoration: 'none' }}>
                        #{claim.order_reference}
                      </a>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600 }}>{claim.customer_name || 'Customer'}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>{claim.customer_email || claim.customer_phone || 'Account verified'}</div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 800,
                          backgroundColor:
                            claim.status === 'CONFIRMED' ? '#dcfce7' : claim.status === 'RESERVED' ? '#fef3c7' : '#f1f5f9',
                          color:
                            claim.status === 'CONFIRMED' ? '#15803d' : claim.status === 'RESERVED' ? '#b45309' : '#64748b',
                        }}
                      >
                        {claim.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#64748b' }}>
                      {new Date(claim.reserved_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#64748b' }}>
                      {claim.confirmed_at ? new Date(claim.confirmed_at).toLocaleString() : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#64748b' }}>
                      {claim.released_at ? (
                        <div>
                          <div>{new Date(claim.released_at).toLocaleString()}</div>
                          <div style={{ fontSize: '11px', color: '#ef4444' }}>{claim.release_reason || 'Released'}</div>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const cardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '24px',
  border: '1px solid #e5e7eb',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};

const metricCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '18px 20px',
  border: '1px solid #e5e7eb',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

const metricLabelStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#4b5563',
  textTransform: 'uppercase',
  letterSpacing: '0.025em',
};

const metricValueStyles: React.CSSProperties = {
  fontSize: '26px',
  fontWeight: 900,
  color: '#111827',
  lineHeight: 1,
  margin: '4px 0',
};

const metricSubtextStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#9ca3af',
};

const labelStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 700,
  color: '#374151',
  marginBottom: '6px',
};

const inputStyles: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '14px',
  backgroundColor: '#ffffff',
  boxSizing: 'border-box',
};

const simBtnStyles: React.CSSProperties = {
  padding: '7px 12px',
  borderRadius: '6px',
  backgroundColor: '#ffffff',
  border: '1px solid #93c5fd',
  color: '#1d4ed8',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
};
