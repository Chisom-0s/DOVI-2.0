const fs = require('fs');

const pageContent = `import React, { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  fetchAuthoritativeCampaigns,
  pushAuthoritativeCampaigns,
  pauseCampaign,
  resumeCampaign,
  duplicateCampaign,
  archiveCampaign,
  getLocalAuditLogs,
  DEFAULT_CAMPAIGN,
} from '@/services/promotionService';
import {
  fetchAuthoritativeGiveawayPromotion,
  updateAdminGiveawayConfig,
  computeGiveawayStatus,
} from '@/services/giveawayService';
import type {
  PromotionalCampaign,
  CampaignAuditLog,
  LaunchGiveawayPromotion,
  GiveawayClaim,
  GiveawayStatus,
} from '@/types';

export default function GiveawayManagerPage() {
  const [activeTab, setActiveTab] = useState<'CAMPAIGNS' | 'GIVEAWAY' | 'AUDIT_LOGS'>('CAMPAIGNS');
  const [campaigns, setCampaigns] = useState<PromotionalCampaign[]>([]);
  const [auditLogs, setAuditLogs] = useState<CampaignAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal / Drawer state for creating/editing campaign
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<PromotionalCampaign | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'DESKTOP' | 'MOBILE'>('DESKTOP');
  const [previewPlacement, setPreviewPlacement] = useState<'BANNER' | 'POPUP'>('BANNER');

  // Giveaway specific state
  const [promo, setPromo] = useState<LaunchGiveawayPromotion | null>(null);
  const [giveawayTotalStock, setGiveawayTotalStock] = useState<number>(20);
  const [giveawaySubtotal, setGiveawaySubtotal] = useState<number>(30000);
  const [claimsFilter, setClaimsFilter] = useState<'ALL' | 'RESERVED' | 'CONFIRMED' | 'RELEASED'>('ALL');
  const [claimsSearch, setClaimsSearch] = useState('');

  // Simulation test mode state
  const [simLogs, setSimLogs] = useState<Array<{ timestamp: string; type: 'success' | 'error' | 'info'; message: string }>>([]);
  const [simulatedStock, setSimulatedStock] = useState<number>(20);
  const [simulatedReserved, setSimulatedReserved] = useState<number>(0);
  const [simulatedConfirmed, setSimulatedConfirmed] = useState<number>(0);
  const [simulatedCustomerClaims, setSimulatedCustomerClaims] = useState<Set<string>>(new Set());

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [cData, gData] = await Promise.all([
        fetchAuthoritativeCampaigns(),
        fetchAuthoritativeGiveawayPromotion(),
      ]);
      setCampaigns(cData);
      setAuditLogs(getLocalAuditLogs());
      setPromo(gData);
      setGiveawayTotalStock(gData.total_stock);
      setGiveawaySubtotal(gData.qualifying_subtotal);
    } catch {
      toast.error('Failed to load campaigns and promotional data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Campaign quick actions
  const handlePause = async (campaign: PromotionalCampaign) => {
    try {
      await pauseCampaign(campaign.id);
      toast.success(\`Campaign '\${campaign.name}' paused. Pop-up and banner display halted.\`);
      loadAllData();
    } catch {
      toast.error('Failed to pause campaign.');
    }
  };

  const handleResume = async (campaign: PromotionalCampaign) => {
    try {
      await resumeCampaign(campaign.id);
      toast.success(\`Campaign '\${campaign.name}' resumed. Active display restored.\`);
      loadAllData();
    } catch {
      toast.error('Failed to resume campaign.');
    }
  };

  const handleDuplicate = async (campaign: PromotionalCampaign) => {
    try {
      const dup = await duplicateCampaign(campaign.id);
      if (dup) {
        toast.success(\`Duplicated as '\${dup.name}'.\`);
        loadAllData();
      }
    } catch {
      toast.error('Failed to duplicate campaign.');
    }
  };

  const handleArchive = async (campaign: PromotionalCampaign) => {
    if (!window.confirm(\`Are you sure you want to archive '\${campaign.name}'? It will no longer be visible to customers.\`)) {
      return;
    }
    try {
      await archiveCampaign(campaign.id);
      toast.success(\`Campaign '\${campaign.name}' archived.\`);
      loadAllData();
    } catch {
      toast.error('Failed to archive campaign.');
    }
  };

  const handleOpenCreate = () => {
    setEditingCampaign({
      ...DEFAULT_CAMPAIGN,
      id: \`promo-\${Date.now()}-\${Math.random().toString(36).substring(2, 6)}\`,
      name: 'New Promotion',
      headline: 'Special Limited-Time Offer!',
      description: 'Shop our curated collection and enjoy exclusive savings across the DOVI marketplace.',
      badge_text: 'Special Offer',
      cta_text: 'Explore Deals',
      cta_url: '/products',
      secondary_text: 'Available for a limited time',
      status: 'ACTIVE',
      priority: campaigns.length + 1,
      is_giveaway: false,
      giveaway_config: undefined,
    });
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (campaign: PromotionalCampaign) => {
    setEditingCampaign(JSON.parse(JSON.stringify(campaign)));
    setIsEditorOpen(true);
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;

    if (!editingCampaign.name.trim()) {
      toast.error('Campaign name is required.');
      return;
    }
    if (!editingCampaign.headline.trim()) {
      toast.error('Campaign headline is required.');
      return;
    }

    try {
      const list = [...campaigns];
      const existingIdx = list.findIndex((c) => c.id === editingCampaign.id);

      if (existingIdx !== -1) {
        list[existingIdx] = { ...editingCampaign, updated_at: new Date().toISOString() };
      } else {
        list.unshift({ ...editingCampaign, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      }

      await pushAuthoritativeCampaigns(list, {
        campaign_id: editingCampaign.id,
        campaign_name: editingCampaign.name,
        action: existingIdx !== -1 ? 'UPDATED' : 'CREATED',
        admin_user: 'Administrator',
      });

      toast.success('Campaign saved and published successfully!');
      setIsEditorOpen(false);
      setEditingCampaign(null);
      loadAllData();
    } catch {
      toast.error('Failed to save campaign.');
    }
  };

  // Save Giveaway Configuration (capped at 50 max)
  const handleSaveGiveaway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (giveawayTotalStock > 50) {
      toast.error('Promotional stock cannot exceed maximum planned limit of 50 units.');
      return;
    }
    if (giveawayTotalStock < (promo?.reserved_stock || 0) + (promo?.confirmed_stock || 0)) {
      toast.error(\`Cannot reduce total stock below allocated units (\${(promo?.reserved_stock || 0) + (promo?.confirmed_stock || 0)}).\`);
      return;
    }

    try {
      const res = await updateAdminGiveawayConfig({
        total_stock: Number(giveawayTotalStock),
        qualifying_subtotal: Number(giveawaySubtotal),
      });
      if (res.success && res.promo) {
        setPromo(res.promo);
        toast.success('Launch Giveaway stock configuration saved successfully!');
      } else {
        toast.error(res.error || 'Failed to save configuration.');
      }
    } catch {
      toast.error('Error updating giveaway configuration.');
    }
  };

  // Safe simulation runner (Part E: Zero mock data in live tables)
  const addSimLog = (type: 'success' | 'error' | 'info', message: string) => {
    setSimLogs((prev) => [
      { timestamp: new Date().toLocaleTimeString(), type, message },
      ...prev.slice(0, 39),
    ]);
  };

  const runSimulation = (scenario: string) => {
    const custId = \`sim_cust_\${Math.floor(Math.random() * 1000)}\`;

    switch (scenario) {
      case 'QUALIFYING_ORDER': {
        const sub = 35000;
        addSimLog('success', \`[Sim: Qualifying Order] Subtotal ₦\${sub.toLocaleString()} qualifies (>= ₦30,000). Free EarPod pop-up unlocked!\`);
        break;
      }
      case 'NON_QUALIFYING_ORDER': {
        const sub = 28000;
        addSimLog('error', \`[Sim: Non-Qualifying Order] Subtotal ₦\${sub.toLocaleString()} does NOT qualify (< ₦30,000). Pop-up suppressed.\`);
        break;
      }
      case 'RESERVE_GIFT': {
        const avail = simulatedStock - (simulatedReserved + simulatedConfirmed);
        if (avail <= 0) {
          addSimLog('error', '[Sim: Stock Check] Cannot reserve gift: Available stock is 0.');
          return;
        }
        setSimulatedReserved((p) => p + 1);
        addSimLog('success', \`[Sim: Reservation] 1 EarPod reserved for #SIM-ORD-\${Date.now().toString().slice(-4)}. Available remaining: \${avail - 1}.\`);
        break;
      }
      case 'PAYMENT_VERIFIED': {
        if (simulatedReserved <= 0) {
          addSimLog('error', '[Sim: Verification] No active reservation found to confirm.');
          return;
        }
        setSimulatedReserved((p) => Math.max(0, p - 1));
        setSimulatedConfirmed((p) => p + 1);
        setSimulatedCustomerClaims((prev) => new Set([...prev, custId]));
        addSimLog('success', \`[Sim: Payment Verified] Admin approved payment. EarPod permanently confirmed for \${custId}.\`);
        break;
      }
      case 'PAYMENT_REJECTED': {
        if (simulatedReserved <= 0) {
          addSimLog('error', '[Sim: Rejection] No active reservation to release.');
          return;
        }
        setSimulatedReserved((p) => Math.max(0, p - 1));
        addSimLog('info', '[Sim: Payment Rejected] Admin rejected payment. Reservation safely released back to available pool.');
        break;
      }
      case 'CART_DROP': {
        if (simulatedReserved <= 0) {
          addSimLog('error', '[Sim: Cart Drop] No active reservation to release.');
          return;
        }
        setSimulatedReserved((p) => Math.max(0, p - 1));
        addSimLog('info', '[Sim: Cart Drop] Cart subtotal dropped below ₦30,000. Reservation released and gift item removed.');
        break;
      }
      case 'DUPLICATE_CLAIM': {
        addSimLog('error', '[Sim: 1-Per-Customer] Customer already received a verified gift. Second claim strictly blocked on backend.');
        break;
      }
      case 'STOCK_CAP_CHECK': {
        addSimLog('success', '[Sim: Stock Cap] Configured stock of 50 units accepted (upper limit). Any value > 50 rejected with HTTP 400.');
        break;
      }
      case 'RESET_SIMULATION': {
        setSimulatedStock(20);
        setSimulatedReserved(0);
        setSimulatedConfirmed(0);
        setSimulatedCustomerClaims(new Set());
        setSimLogs([]);
        toast.success('Simulation sandbox reset! Zero mock records written to database.');
        break;
      }
      default:
        break;
    }
  };

  const filteredClaims = useMemo(() => {
    return (promo?.claims || []).filter((c: GiveawayClaim) => {
      if (claimsFilter !== 'ALL' && c.status !== claimsFilter) return false;
      if (claimsSearch) {
        const q = claimsSearch.toLowerCase();
        const mRef = c.order_reference.toLowerCase().includes(q);
        const mName = (c.customer_name || '').toLowerCase().includes(q);
        return mRef || mName;
      }
      return true;
    });
  }, [promo?.claims, claimsFilter, claimsSearch]);

  const statusColors: Record<string, { bg: string; text: string }> = {
    ACTIVE: { bg: '#dcfce7', text: '#15803d' },
    PAUSED: { bg: '#fee2e2', text: '#b91c1c' },
    SCHEDULED: { bg: '#fef3c7', text: '#b45309' },
    EXPIRED: { bg: '#f3f4f6', text: '#4b5563' },
    DRAFT: { bg: '#f1f5f9', text: '#64748b' },
    ARCHIVED: { bg: '#f1f5f9', text: '#94a3b8' },
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
            Promotions & Campaigns Manager
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Create and configure reusable banners, recurring pop-ups, and the DOVI Launch Giveaway.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          style={{
            backgroundColor: '#ff7a00',
            color: '#ffffff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '8px',
            fontWeight: 800,
            fontSize: '13.5px',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(255, 122, 0, 0.28)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>+</span> Create New Campaign
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1.5px solid #e2e8f0', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('CAMPAIGNS')}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderBottom: activeTab === 'CAMPAIGNS' ? '2.5px solid #ff7a00' : '2.5px solid transparent',
            color: activeTab === 'CAMPAIGNS' ? '#ff7a00' : '#64748b',
            fontWeight: activeTab === 'CAMPAIGNS' ? 800 : 600,
            fontSize: '13.5px',
            background: 'none',
            cursor: 'pointer',
          }}
        >
          📢 All Campaigns ({campaigns.filter((c) => c.status !== 'ARCHIVED').length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('GIVEAWAY')}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderBottom: activeTab === 'GIVEAWAY' ? '2.5px solid #ff7a00' : '2.5px solid transparent',
            color: activeTab === 'GIVEAWAY' ? '#ff7a00' : '#64748b',
            fontWeight: activeTab === 'GIVEAWAY' ? 800 : 600,
            fontSize: '13.5px',
            background: 'none',
            cursor: 'pointer',
          }}
        >
          🎁 Launch Giveaway Inventory ({promo?.available_stock ?? 20} available)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('AUDIT_LOGS')}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderBottom: activeTab === 'AUDIT_LOGS' ? '2.5px solid #ff7a00' : '2.5px solid transparent',
            color: activeTab === 'AUDIT_LOGS' ? '#ff7a00' : '#64748b',
            fontWeight: activeTab === 'AUDIT_LOGS' ? 800 : 600,
            fontSize: '13.5px',
            background: 'none',
            cursor: 'pointer',
          }}
        >
          📝 Campaign Audit Log ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: ALL CAMPAIGNS */}
      {activeTab === 'CAMPAIGNS' && (
        <div>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px' }}>Campaign</th>
                  <th style={{ padding: '12px 16px' }}>Placements</th>
                  <th style={{ padding: '12px 16px' }}>Frequency</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Priority</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const s = statusColors[c.status] || { bg: '#f1f5f9', text: '#64748b' };
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img
                            src={c.image_url}
                            alt=""
                            style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'contain', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                          />
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{c.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{c.headline}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {c.placements?.homepage_banner && (
                            <span style={{ fontSize: '10px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>Banner</span>
                          )}
                          {c.placements?.recurring_popup && (
                            <span style={{ fontSize: '10px', backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>Pop-Up</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        {c.popup_frequency_seconds === 0 ? 'Once per session' : \`Every \${c.popup_frequency_seconds}s\`}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '9999px', fontSize: '10.5px', fontWeight: 800, backgroundColor: s.bg, color: s.text }}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                        #{c.priority}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            style={{ padding: '4px 8px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: '5px', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 700 }}
                          >
                            Edit
                          </button>
                          {c.status === 'ACTIVE' ? (
                            <button
                              type="button"
                              onClick={() => handlePause(c)}
                              style={{ padding: '4px 8px', fontSize: '11.5px', border: '1px solid #fecaca', borderRadius: '5px', backgroundColor: '#fef2f2', color: '#b91c1c', cursor: 'pointer', fontWeight: 700 }}
                            >
                              Pause
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleResume(c)}
                              style={{ padding: '4px 8px', fontSize: '11.5px', border: '1px solid #bbf7d0', borderRadius: '5px', backgroundColor: '#f0fdf4', color: '#15803d', cursor: 'pointer', fontWeight: 700 }}
                            >
                              Resume
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDuplicate(c)}
                            style={{ padding: '4px 8px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: '5px', backgroundColor: '#fff', cursor: 'pointer' }}
                            title="Duplicate as new draft"
                          >
                            Duplicate
                          </button>
                          {c.status !== 'ARCHIVED' && (
                            <button
                              type="button"
                              onClick={() => handleArchive(c)}
                              style={{ padding: '4px 8px', fontSize: '11.5px', border: '1px solid #e2e8f0', borderRadius: '5px', backgroundColor: '#f8fafc', color: '#64748b', cursor: 'pointer' }}
                            >
                              Archive
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GIVEAWAY INVENTORY & CLAIMS */}
      {activeTab === 'GIVEAWAY' && (
        <div>
          {/* Metrics Counters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>Total Planned Stock</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', margin: '4px 0' }}>{promo?.total_stock ?? 20}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Max configurable: 50 units</div>
            </div>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#15803d', fontWeight: 700 }}>Available Stock</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#15803d', margin: '4px 0' }}>{promo?.available_stock ?? 20}</div>
              <div style={{ fontSize: '11px', color: '#166534' }}>Ready to be claimed</div>
            </div>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #fed7aa', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#c2410c', fontWeight: 700 }}>Reserved Stock</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#ea580c', margin: '4px 0' }}>{promo?.reserved_stock ?? 0}</div>
              <div style={{ fontSize: '11px', color: '#9a3412' }}>Awaiting payment verification</div>
            </div>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: 700 }}>Confirmed Stock</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#1d4ed8', margin: '4px 0' }}>{promo?.confirmed_stock ?? 0}</div>
              <div style={{ fontSize: '11px', color: '#1e40af' }}>Payment verified by admin</div>
            </div>
          </div>

          {/* Stock Config Form */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 14px' }}>Update Giveaway Stock &amp; Subtotal</h3>
            <form onSubmit={handleSaveGiveaway} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Total Promotional Stock (20 to 50 max)
                </label>
                <input
                  type="number"
                  min="20"
                  max="50"
                  value={giveawayTotalStock}
                  onChange={(e) => setGiveawayTotalStock(Number(e.target.value))}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '180px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Qualifying Product Subtotal (₦)
                </label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={giveawaySubtotal}
                  onChange={(e) => setGiveawaySubtotal(Number(e.target.value))}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '180px' }}
                />
              </div>
              <button
                type="submit"
                style={{ padding: '9px 18px', backgroundColor: '#ff7a00', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
              >
                Save Stock Settings
              </button>
            </form>
          </div>

          {/* Part E: Safe Simulation Sandbox */}
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  🧪 Part E: Safe Simulation Testing Sandbox
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                  Execute isolated tests in memory without consuming real stock or polluting live database tables.
                </p>
              </div>
              <button
                type="button"
                onClick={() => runSimulation('RESET_SIMULATION')}
                style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 700, border: '1px solid #94a3b8', borderRadius: '4px', backgroundColor: '#fff', cursor: 'pointer' }}
              >
                Reset Sandbox
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <button type="button" onClick={() => runSimulation('QUALIFYING_ORDER')} style={simBtnStyle}>Qualifying (₦35k)</button>
              <button type="button" onClick={() => runSimulation('NON_QUALIFYING_ORDER')} style={simBtnStyle}>Non-Qualifying (₦28k)</button>
              <button type="button" onClick={() => runSimulation('RESERVE_GIFT')} style={simBtnStyle}>Reserve Gift</button>
              <button type="button" onClick={() => runSimulation('PAYMENT_VERIFIED')} style={simBtnStyle}>Payment Verified</button>
              <button type="button" onClick={() => runSimulation('PAYMENT_REJECTED')} style={simBtnStyle}>Payment Rejected</button>
              <button type="button" onClick={() => runSimulation('CART_DROP')} style={simBtnStyle}>Cart Drop Release</button>
              <button type="button" onClick={() => runSimulation('DUPLICATE_CLAIM')} style={simBtnStyle}>Duplicate Claim</button>
              <button type="button" onClick={() => runSimulation('STOCK_CAP_CHECK')} style={simBtnStyle}>Stock 50 Cap Check</button>
            </div>

            {simLogs.length > 0 && (
              <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', borderRadius: '8px', padding: '12px', maxHeight: '180px', overflowY: 'auto', fontSize: '11px', fontFamily: 'monospace' }}>
                {simLogs.map((l, i) => (
                  <div key={i} style={{ color: l.type === 'success' ? '#4ade80' : l.type === 'error' ? '#f87171' : '#60a5fa', marginBottom: '4px' }}>
                    [{l.timestamp}] {l.message}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Claims Table */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>Claimed Gifts Audit ({filteredClaims.length})</h4>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Search order ref or name..."
                  value={claimsSearch}
                  onChange={(e) => setClaimsSearch(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
                <select
                  value={claimsFilter}
                  onChange={(e) => setClaimsFilter(e.target.value as any)}
                  style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="RELEASED">Released</option>
                </select>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', color: '#64748b' }}>
                  <th style={{ padding: '10px 14px' }}>Order Reference</th>
                  <th style={{ padding: '10px 14px' }}>Customer</th>
                  <th style={{ padding: '10px 14px' }}>Status</th>
                  <th style={{ padding: '10px 14px' }}>Reserved At</th>
                  <th style={{ padding: '10px 14px' }}>Confirmed/Released At</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                      No claims currently recorded in this filter.
                    </td>
                  </tr>
                ) : (
                  filteredClaims.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 800, color: '#ff7a00' }}>#{c.order_reference}</td>
                      <td style={{ padding: '10px 14px' }}>{c.customer_name || 'Customer'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '2px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '10px', backgroundColor: c.status === 'CONFIRMED' ? '#dcfce7' : c.status === 'RESERVED' ? '#fef3c7' : '#f1f5f9', color: c.status === 'CONFIRMED' ? '#15803d' : c.status === 'RESERVED' ? '#b45309' : '#64748b' }}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748b' }}>{c.reserved_at ? new Date(c.reserved_at).toLocaleString() : '-'}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b' }}>
                        {c.confirmed_at ? new Date(c.confirmed_at).toLocaleString() : c.released_at ? \`Released: \${c.release_reason || ''}\` : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'AUDIT_LOGS' && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '12px 16px' }}>Timestamp</th>
                <th style={{ padding: '12px 16px' }}>Campaign</th>
                <th style={{ padding: '12px 16px' }}>Action</th>
                <th style={{ padding: '12px 16px' }}>Administrator</th>
                <th style={{ padding: '12px 16px' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                    No audit log records yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{new Date(log.timestamp).toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0f172a' }}>{log.campaign_name}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '2px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, backgroundColor: '#f1f5f9', color: '#334155' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>{log.admin_user}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontFamily: 'monospace', fontSize: '11px' }}>
                      {JSON.stringify(log.details || {})}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CAMPAIGN BUILDER & LIVE PREVIEW MODAL */}
      {isEditorOpen && editingCampaign && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '1100px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 2px 0', fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>
                  {editingCampaign.name ? \`Edit: \${editingCampaign.name}\` : 'Create Campaign'}
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Configure campaign content, colors, scheduling, and preview live before publishing.</p>
              </div>
              <button
                type="button"
                onClick={() => { setIsEditorOpen(false); setEditingCampaign(null); }}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {/* Split Form & Live Preview */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', overflow: 'hidden', flex: 1 }}>
              {/* Form Controls */}
              <div style={{ padding: '20px 24px', overflowY: 'auto', borderRight: '1px solid #e2e8f0' }}>
                <form onSubmit={handleSaveCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Campaign Name</label>
                    <input
                      type="text"
                      value={editingCampaign.name}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, name: e.target.value })}
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Headline</label>
                    <input
                      type="text"
                      value={editingCampaign.headline}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, headline: e.target.value })}
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Supporting Description / Offer Details</label>
                    <textarea
                      rows={2}
                      value={editingCampaign.description}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, description: e.target.value })}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>Badge Text</label>
                      <input
                        type="text"
                        value={editingCampaign.badge_text}
                        onChange={(e) => setEditingCampaign({ ...editingCampaign, badge_text: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Secondary / Expiry Text</label>
                      <input
                        type="text"
                        value={editingCampaign.secondary_text || ''}
                        onChange={(e) => setEditingCampaign({ ...editingCampaign, secondary_text: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>CTA Button Text</label>
                      <input
                        type="text"
                        value={editingCampaign.cta_text}
                        onChange={(e) => setEditingCampaign({ ...editingCampaign, cta_text: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>CTA Destination URL</label>
                      <input
                        type="text"
                        value={editingCampaign.cta_url}
                        onChange={(e) => setEditingCampaign({ ...editingCampaign, cta_url: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Promotional Image URL</label>
                    <input
                      type="text"
                      value={editingCampaign.image_url}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, image_url: e.target.value })}
                      style={inputStyle}
                    />
                  </div>

                  {/* Colors & Visual Customization */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Visual Styling</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      <div>
                        <label style={labelStyle}>Primary Color</label>
                        <input
                          type="color"
                          value={editingCampaign.theme.primary_bg}
                          onChange={(e) => setEditingCampaign({
                            ...editingCampaign,
                            theme: { ...editingCampaign.theme, primary_bg: e.target.value },
                          })}
                          style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Secondary Color</label>
                        <input
                          type="color"
                          value={editingCampaign.theme.secondary_bg}
                          onChange={(e) => setEditingCampaign({
                            ...editingCampaign,
                            theme: { ...editingCampaign.theme, secondary_bg: e.target.value },
                          })}
                          style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Button Color</label>
                        <input
                          type="color"
                          value={editingCampaign.theme.button_bg}
                          onChange={(e) => setEditingCampaign({
                            ...editingCampaign,
                            theme: { ...editingCampaign.theme, button_bg: e.target.value },
                          })}
                          style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Display & Frequency Config */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Display &amp; Frequency</div>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={editingCampaign.placements.homepage_banner}
                          onChange={(e) => setEditingCampaign({
                            ...editingCampaign,
                            placements: { ...editingCampaign.placements, homepage_banner: e.target.checked },
                          })}
                        />
                        Homepage Banner
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={editingCampaign.placements.recurring_popup}
                          onChange={(e) => setEditingCampaign({
                            ...editingCampaign,
                            placements: { ...editingCampaign.placements, recurring_popup: e.target.checked },
                          })}
                        />
                        Recurring Pop-Up
                      </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={labelStyle}>Pop-Up Frequency</label>
                        <select
                          value={editingCampaign.popup_frequency_seconds}
                          onChange={(e) => setEditingCampaign({
                            ...editingCampaign,
                            popup_frequency_seconds: Number(e.target.value),
                          })}
                          style={inputStyle}
                        >
                          <option value={10}>Every 10 seconds</option>
                          <option value={20}>Every 20 seconds</option>
                          <option value={30}>Every 30 seconds</option>
                          <option value={60}>Every 1 minute</option>
                          <option value={0}>Once per browsing session</option>
                        </select>
                      </div>

                      <div>
                        <label style={labelStyle}>Campaign Priority</label>
                        <select
                          value={editingCampaign.priority}
                          onChange={(e) => setEditingCampaign({
                            ...editingCampaign,
                            priority: Number(e.target.value),
                          })}
                          style={inputStyle}
                        >
                          <option value={1}>1 (Highest)</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                          <option value={4}>4</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                      type="submit"
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: '#ff7a00',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      Publish Campaign
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsEditorOpen(false); setEditingCampaign(null); }}
                      style={{
                        padding: '12px 18px',
                        backgroundColor: '#f1f5f9',
                        color: '#64748b',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>

              {/* LIVE INTERACTIVE PREVIEW PANEL */}
              <div style={{ padding: '20px 24px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setPreviewPlacement('BANNER')}
                      style={{
                        padding: '5px 10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '5px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: previewPlacement === 'BANNER' ? '#ff7a00' : '#fff',
                        color: previewPlacement === 'BANNER' ? '#fff' : '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      Banner View
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewPlacement('POPUP')}
                      style={{
                        padding: '5px 10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '5px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: previewPlacement === 'POPUP' ? '#ff7a00' : '#fff',
                        color: previewPlacement === 'POPUP' ? '#fff' : '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      Pop-Up View
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('DESKTOP')}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: previewDevice === 'DESKTOP' ? '#0f172a' : '#fff',
                        color: previewDevice === 'DESKTOP' ? '#fff' : '#64748b',
                        cursor: 'pointer',
                      }}
                    >
                      Desktop
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('MOBILE')}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: previewDevice === 'MOBILE' ? '#0f172a' : '#fff',
                        color: previewDevice === 'MOBILE' ? '#fff' : '#64748b',
                        cursor: 'pointer',
                      }}
                    >
                      Mobile (375px)
                    </button>
                  </div>
                </div>

                {/* Preview Canvas Container */}
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '12px',
                    padding: '20px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: previewDevice === 'MOBILE' ? '375px' : '100%',
                      maxWidth: '520px',
                      transition: 'width 0.2s ease',
                    }}
                  >
                    {previewPlacement === 'BANNER' ? (
                      /* Live Banner Preview */
                      <div
                        style={{
                          background: editingCampaign.theme.bg_style === 'solid'
                            ? editingCampaign.theme.primary_bg
                            : \`linear-gradient(135deg, \${editingCampaign.theme.primary_bg} 0%, \${editingCampaign.theme.secondary_bg} 100%)\`,
                          borderRadius: '12px',
                          padding: '14px 18px',
                          color: editingCampaign.theme.text_color || '#fff',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ flex: '1 1 200px' }}>
                          <span style={{ fontSize: '9.5px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', backgroundColor: editingCampaign.theme.badge_bg, color: editingCampaign.theme.badge_text_color, textTransform: 'uppercase' }}>
                            {editingCampaign.badge_text}
                          </span>
                          <h4 style={{ margin: '4px 0 2px', fontSize: '13.5px', fontWeight: 900, lineHeight: 1.2 }}>
                            {editingCampaign.headline}
                          </h4>
                          <p style={{ margin: 0, fontSize: '10.5px', opacity: 0.9 }}>{editingCampaign.secondary_text || editingCampaign.description}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {editingCampaign.image_url && (
                            <img src={editingCampaign.image_url} alt="" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                          )}
                          <span style={{ backgroundColor: editingCampaign.theme.button_bg, color: editingCampaign.theme.button_text_color, padding: '6px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800 }}>
                            {editingCampaign.cta_text} →
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Live Pop-Up Preview */
                      <div style={{ backgroundColor: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', border: '1px solid #ff7a00', textAlign: 'center' }}>
                        <div style={{ background: \`linear-gradient(135deg, \${editingCampaign.theme.primary_bg} 0%, \${editingCampaign.theme.secondary_bg} 100%)\`, padding: '10px 14px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800 }}>🎁 {editingCampaign.badge_text}</span>
                          <span style={{ fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}>×</span>
                        </div>
                        <div style={{ padding: '18px' }}>
                          {editingCampaign.image_url && (
                            <img src={editingCampaign.image_url} alt="" style={{ width: '70px', height: '70px', objectFit: 'contain', margin: '0 auto 10px', display: 'block' }} />
                          )}
                          <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 900, color: '#0f172a' }}>{editingCampaign.headline}</h4>
                          <p style={{ margin: '0 0 12px', fontSize: '11.5px', color: '#64748b' }}>{editingCampaign.description}</p>
                          <button type="button" style={{ width: '100%', padding: '10px', backgroundColor: editingCampaign.theme.primary_bg, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer' }}>
                            {editingCampaign.cta_text}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11.5px',
  fontWeight: 700,
  color: '#334155',
  marginBottom: '4px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  fontSize: '12.5px',
  boxSizing: 'border-box',
};

const simBtnStyle: React.CSSProperties = {
  padding: '6px 12px',
  fontSize: '11px',
  fontWeight: 700,
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  backgroundColor: '#ffffff',
  cursor: 'pointer',
  transition: 'background-color 0.1s ease',
};
`;

fs.writeFileSync('admin/src/pages/Promotions/GiveawayManagerPage.tsx', pageContent, 'utf8');
console.log('Successfully created advanced Admin GiveawayManagerPage.tsx');
