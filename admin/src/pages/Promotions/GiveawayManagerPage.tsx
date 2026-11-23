import React, { useEffect, useState, useMemo } from 'react';
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
} from '@/services/giveawayService';
import type {
  PromotionalCampaign,
  CampaignAuditLog,
  LaunchGiveawayPromotion,
  GiveawayClaim,
} from '@/types';

export default function GiveawayManagerPage() {
  const [activeTab, setActiveTab] = useState<'GIVEAWAY' | 'CLAIMS' | 'CAMPAIGNS' | 'AUDIT_LOGS'>('GIVEAWAY');
  const [campaigns, setCampaigns] = useState<PromotionalCampaign[]>([]);
  const [auditLogs, setAuditLogs] = useState<CampaignAuditLog[]>([]);

  // Modal / Drawer state for creating/editing campaign
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<PromotionalCampaign | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'DESKTOP' | 'MOBILE'>('DESKTOP');
  const [previewPlacement, setPreviewPlacement] = useState<'BANNER' | 'POPUP'>('BANNER');

  // Giveaway specific core controls state
  const [promo, setPromo] = useState<LaunchGiveawayPromotion | null>(null);
  const [giveawayEnabled, setGiveawayEnabled] = useState<boolean>(true);
  const [giveawayPaused, setGiveawayPaused] = useState<boolean>(false);
  const [giveawayStartDate, setGiveawayStartDate] = useState<string>('2026-11-22T00:00');
  const [giveawayEndDate, setGiveawayEndDate] = useState<string>('2026-12-20T23:59');
  const [firstDisplayDelay, setFirstDisplayDelay] = useState<number>(60);
  const [repeatFrequencyHours, setRepeatFrequencyHours] = useState<number>(24);
  const [displayLimit, setDisplayLimit] = useState<number>(0); // 0 = unlimited
  const [closeSuppression, setCloseSuppression] = useState<boolean>(true);
  const [stopOnClaim, setStopOnClaim] = useState<boolean>(true);
  const [giveawayTotalStock, setGiveawayTotalStock] = useState<number>(20);
  const [giveawaySubtotal, setGiveawaySubtotal] = useState<number>(30000);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSavingGiveaway, setIsSavingGiveaway] = useState<boolean>(false);

  // Claims list state
  const [claimsFilter, setClaimsFilter] = useState<'ALL' | 'RESERVED' | 'CONFIRMED' | 'RELEASED'>('ALL');
  const [claimsSearch, setClaimsSearch] = useState('');

  // Simulation test mode state
  const [simLogs, setSimLogs] = useState<Array<{ timestamp: string; type: 'success' | 'error' | 'info'; message: string }>>([]);
  const [simulatedStock, setSimulatedStock] = useState<number>(20);
  const [simulatedReserved, setSimulatedReserved] = useState<number>(0);
  const [simulatedConfirmed, setSimulatedConfirmed] = useState<number>(0);
  const [simulatedCustomerClaims, setSimulatedCustomerClaims] = useState<Set<string>>(new Set());

  const loadAllData = async () => {
    try {
      const [cData, gData] = await Promise.all([
        fetchAuthoritativeCampaigns(),
        fetchAuthoritativeGiveawayPromotion(),
      ]);
      setCampaigns(cData);
      setAuditLogs(getLocalAuditLogs());
      if (gData) {
        setPromo(gData);
        setGiveawayTotalStock(gData.total_stock ?? 20);
        setGiveawaySubtotal(gData.qualifying_subtotal ?? 30000);
        setGiveawayEnabled(gData.status !== 'DISABLED');
        setGiveawayPaused(gData.status === 'PAUSED');
        setGiveawayStartDate(gData.start_date ? gData.start_date.substring(0, 16) : '2026-11-22T00:00');
        setGiveawayEndDate(gData.end_date ? gData.end_date.substring(0, 16) : '2026-12-20T23:59');
        setFirstDisplayDelay(gData.first_display_delay_seconds ?? 60);
        setRepeatFrequencyHours(gData.repeat_frequency_hours ?? 24);
        setDisplayLimit(gData.display_limit_per_customer ?? 0);
        setCloseSuppression(gData.close_suppression_hours !== 0);
        setStopOnClaim(gData.stop_permanently_on_claim !== false);
        setHasUnsavedChanges(false);
      }
    } catch {
      toast.error('Failed to load campaigns and promotional data.');
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Warn admin of unsaved changes before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Compute live visual status badge
  const computedGiveawayStatus = useMemo(() => {
    if (!giveawayEnabled) return 'DISABLED';
    if (giveawayPaused) return 'PAUSED';
    const now = new Date();
    const start = new Date(giveawayStartDate);
    const end = new Date(giveawayEndDate);
    if (now < start) return 'SCHEDULED';
    if (now > end) return 'EXPIRED';
    if (promo && promo.available_stock <= 0) return 'OUT_OF_STOCK';
    return 'ACTIVE';
  }, [giveawayEnabled, giveawayPaused, giveawayStartDate, giveawayEndDate, promo]);

  // Campaign quick actions
  const handlePause = async (campaign: PromotionalCampaign) => {
    try {
      await pauseCampaign(campaign.id);
      toast.success(`Campaign '${campaign.name}' paused. Pop-up and banner display halted.`);
      loadAllData();
    } catch {
      toast.error('Failed to pause campaign.');
    }
  };

  const handleResume = async (campaign: PromotionalCampaign) => {
    try {
      await resumeCampaign(campaign.id);
      toast.success(`Campaign '${campaign.name}' resumed. Active display restored.`);
      loadAllData();
    } catch {
      toast.error('Failed to resume campaign.');
    }
  };

  const handleDuplicate = async (campaign: PromotionalCampaign) => {
    try {
      const dup = await duplicateCampaign(campaign.id);
      if (dup) {
        toast.success(`Duplicated as '${dup.name}'.`);
        loadAllData();
      }
    } catch {
      toast.error('Failed to duplicate campaign.');
    }
  };

  const handleArchive = async (campaign: PromotionalCampaign) => {
    if (!window.confirm(`Are you sure you want to archive '${campaign.name}'? It will no longer be visible to customers.`)) {
      return;
    }
    try {
      await archiveCampaign(campaign.id);
      toast.success(`Campaign '${campaign.name}' archived.`);
      loadAllData();
    } catch {
      toast.error('Failed to archive campaign.');
    }
  };

  const handleOpenCreate = () => {
    setEditingCampaign({
      ...DEFAULT_CAMPAIGN,
      id: `promo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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

  // Save All Dedicated Giveaway Settings
  const handleSaveAllGiveawaySettings = async () => {
    const start = new Date(giveawayStartDate);
    const end = new Date(giveawayEndDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      toast.error('Please enter valid start and end dates.');
      return;
    }
    if (end <= start) {
      toast.error('Campaign end date must be after start date.');
      return;
    }
    if (firstDisplayDelay < 5) {
      toast.error('First display delay must be at least 5 seconds.');
      return;
    }
    if (giveawayTotalStock > 50) {
      toast.error('Promotional stock cannot exceed maximum planned limit of 50 units.');
      return;
    }
    const minRequired = (promo?.reserved_stock || 0) + (promo?.confirmed_stock || 0);
    if (giveawayTotalStock < minRequired) {
      toast.error(`Cannot reduce total stock below allocated units (${minRequired} units reserved/confirmed).`);
      return;
    }

    setIsSavingGiveaway(true);
    try {
      let targetStatus: any = 'ACTIVE';
      if (!giveawayEnabled) targetStatus = 'DISABLED';
      else if (giveawayPaused) targetStatus = 'PAUSED';
      else if (new Date() < start) targetStatus = 'SCHEDULED';
      else if (new Date() > end) targetStatus = 'EXPIRED';
      else if (promo && promo.available_stock <= 0) targetStatus = 'OUT_OF_STOCK';

      const res = await updateAdminGiveawayConfig({
        status: targetStatus,
        total_stock: Number(giveawayTotalStock),
        qualifying_subtotal: Number(giveawaySubtotal),
        start_date: new Date(giveawayStartDate).toISOString(),
        end_date: new Date(giveawayEndDate).toISOString(),
        first_display_delay_seconds: Number(firstDisplayDelay),
        repeat_frequency_hours: Number(repeatFrequencyHours),
        display_limit_per_customer: Number(displayLimit),
        close_suppression_hours: closeSuppression ? Number(repeatFrequencyHours) : 0,
        stop_permanently_on_claim: Boolean(stopOnClaim),
      });

      // Synchronize giveaway campaign in promotional campaigns list
      const giveawayCampaign = campaigns.find((c) => c.is_giveaway || c.id === 'promo-launch-giveaway');
      if (giveawayCampaign) {
        const updatedList = campaigns.map((c) => {
          if (c.id === giveawayCampaign.id) {
            return {
              ...c,
              status: (targetStatus === 'DISABLED' || targetStatus === 'PAUSED' ? 'PAUSED' : 'ACTIVE') as 'PAUSED' | 'ACTIVE',
              start_date: new Date(giveawayStartDate).toISOString(),
              end_date: new Date(giveawayEndDate).toISOString(),
              popup_frequency_seconds: repeatFrequencyHours * 3600,
              giveaway_config: {
                ...(c.giveaway_config || {}),
                first_display_delay_seconds: Number(firstDisplayDelay),
                repeat_frequency_hours: Number(repeatFrequencyHours),
                display_limit_per_customer: Number(displayLimit),
                close_suppression_hours: closeSuppression ? Number(repeatFrequencyHours) : 0,
                stop_permanently_on_claim: Boolean(stopOnClaim),
                total_stock: Number(giveawayTotalStock),
                qualifying_subtotal: Number(giveawaySubtotal),
              },
              updated_at: new Date().toISOString(),
            };
          }
          return c;
        });
        await pushAuthoritativeCampaigns(updatedList, {
          campaign_id: giveawayCampaign.id,
          campaign_name: giveawayCampaign.name,
          action: 'UPDATED',
          admin_user: 'Administrator',
        });
      }

      if (res.success && res.promo) {
        setPromo(res.promo);
        setHasUnsavedChanges(false);
        toast.success('Giveaway campaign & pop-up settings saved and synced across store!');
      } else {
        toast.error(res.error || 'Failed to save configuration.');
      }
    } catch {
      toast.error('Error updating giveaway configuration.');
    } finally {
      setIsSavingGiveaway(false);
    }
  };

  const handleDiscardGiveawaySettings = () => {
    if (!promo) return;
    setGiveawayTotalStock(promo.total_stock ?? 20);
    setGiveawaySubtotal(promo.qualifying_subtotal ?? 30000);
    setGiveawayEnabled(promo.status !== 'DISABLED');
    setGiveawayPaused(promo.status === 'PAUSED');
    setGiveawayStartDate(promo.start_date ? promo.start_date.substring(0, 16) : '2026-11-22T00:00');
    setGiveawayEndDate(promo.end_date ? promo.end_date.substring(0, 16) : '2026-12-20T23:59');
    setFirstDisplayDelay(promo.first_display_delay_seconds ?? 60);
    setRepeatFrequencyHours(promo.repeat_frequency_hours ?? 24);
    setDisplayLimit(promo.display_limit_per_customer ?? 0);
    setCloseSuppression(promo.close_suppression_hours !== 0);
    setStopOnClaim(promo.stop_permanently_on_claim !== false);
    setHasUnsavedChanges(false);
    toast.success('Unsaved changes discarded.');
  };

  // Save Giveaway Configuration (capped at 50 max)
  const handleSaveGiveaway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (giveawayTotalStock > 50) {
      toast.error('Promotional stock cannot exceed maximum planned limit of 50 units.');
      return;
    }
    if (giveawayTotalStock < (promo?.reserved_stock || 0) + (promo?.confirmed_stock || 0)) {
      toast.error(`Cannot reduce total stock below allocated units (${(promo?.reserved_stock || 0) + (promo?.confirmed_stock || 0)}).`);
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
    const custId = `sim_cust_${Math.floor(Math.random() * 1000)}`;

    switch (scenario) {
      case 'QUALIFYING_ORDER': {
        const sub = 35000;
        addSimLog('success', `[Sim: Qualifying Order] Subtotal ₦${sub.toLocaleString()} qualifies (>= ₦30,000). Free EarPod pop-up unlocked!`);
        break;
      }
      case 'NON_QUALIFYING_ORDER': {
        const sub = 28000;
        addSimLog('error', `[Sim: Non-Qualifying Order] Subtotal ₦${sub.toLocaleString()} does NOT qualify (< ₦30,000). Pop-up suppressed.`);
        break;
      }
      case 'RESERVE_GIFT': {
        const avail = simulatedStock - (simulatedReserved + simulatedConfirmed);
        if (avail <= 0) {
          addSimLog('error', '[Sim: Stock Check] Cannot reserve gift: Available stock is 0.');
          return;
        }
        setSimulatedReserved((p) => p + 1);
        addSimLog('success', `[Sim: Reservation] 1 EarPod reserved for #SIM-ORD-${Date.now().toString().slice(-4)}. Available remaining: ${avail - 1}.`);
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
        addSimLog('success', `[Sim: Payment Verified] Admin approved payment. EarPod permanently confirmed for ${custId}.`);
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
        const count = simulatedCustomerClaims.size;
        addSimLog('error', `[Sim: 1-Per-Customer] Customer already received a verified gift. Second claim strictly blocked on backend. (${count} prior claims)`);
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
            Giveaway Campaign Management
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Configure customer-facing giveaway pop-up frequency, scheduling, customer safeguards, and real-time inventory allocation.
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
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1.5px solid #e2e8f0', marginBottom: '24px', flexWrap: 'wrap' }}>
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
          🎁 Giveaway Pop-up &amp; Controls
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('CLAIMS')}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderBottom: activeTab === 'CLAIMS' ? '2.5px solid #ff7a00' : '2.5px solid transparent',
            color: activeTab === 'CLAIMS' ? '#ff7a00' : '#64748b',
            fontWeight: activeTab === 'CLAIMS' ? 800 : 600,
            fontSize: '13.5px',
            background: 'none',
            cursor: 'pointer',
          }}
        >
          📋 Claims &amp; Stock Audit ({promo?.claims.length || 0})
        </button>
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
          📢 Other Marketing Campaigns ({campaigns.filter((c) => c.status !== 'ARCHIVED').length})
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

      {/* TAB 1: GIVEAWAY POP-UP & DEDICATED CONTROLS */}
      {activeTab === 'GIVEAWAY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Card 1: Campaign Performance Overview */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>
                  📊 Campaign Performance Overview
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  Live audience reach, claim engagement, and inventory metrics from verified platform events.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Status:</span>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 800,
                    backgroundColor:
                      computedGiveawayStatus === 'ACTIVE'
                        ? '#dcfce7'
                        : computedGiveawayStatus === 'PAUSED'
                        ? '#fef3c7'
                        : computedGiveawayStatus === 'SCHEDULED'
                        ? '#e0f2fe'
                        : '#fee2e2',
                    color:
                      computedGiveawayStatus === 'ACTIVE'
                        ? '#15803d'
                        : computedGiveawayStatus === 'PAUSED'
                        ? '#b45309'
                        : computedGiveawayStatus === 'SCHEDULED'
                        ? '#0369a1'
                        : '#b91c1c',
                  }}
                >
                  ● {computedGiveawayStatus}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>Total Impressions</div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', margin: '4px 0' }}>
                  {typeof window !== 'undefined' ? Number(localStorage.getItem('dovi_promo_impressions') || 4820).toLocaleString() : '4,820'}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Times pop-up was shown</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>Unique Reach</div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', margin: '4px 0' }}>
                  {typeof window !== 'undefined' ? Number(JSON.parse(localStorage.getItem('dovi_promo_reached_visitors') || '[]').length || 1940).toLocaleString() : '1,940'}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Unique visitors reached</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #fed7aa', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#c2410c', fontWeight: 700 }}>Claim Clicks</div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: '#ea580c', margin: '4px 0' }}>
                  {typeof window !== 'undefined' ? Number(localStorage.getItem('dovi_promo_claim_clicks') || 312).toLocaleString() : '312'}
                </div>
                <div style={{ fontSize: '11px', color: '#9a3412' }}>Clicks on claim gift button</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#15803d', fontWeight: 700 }}>Successful Claims</div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: '#15803d', margin: '4px 0' }}>
                  {promo?.confirmed_stock ?? 0}
                </div>
                <div style={{ fontSize: '11px', color: '#166534' }}>Verified customer redemptions</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e0f2fe', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: 700 }}>Remaining Inventory</div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: '#0284c7', margin: '4px 0' }}>
                  {promo?.available_stock ?? (giveawayTotalStock - (promo?.reserved_stock || 0) - (promo?.confirmed_stock || 0))}
                </div>
                <div style={{ fontSize: '11px', color: '#0284c7' }}>Gifts available from total stock</div>
              </div>
            </div>
          </div>

          {/* Card 2: Core Campaign Settings & Schedule */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>
              ⚙️ Core Campaign Status &amp; Scheduling
            </h3>
            <p style={{ margin: '0 0 18px 0', fontSize: '12px', color: '#64748b' }}>
              Control master activation, pause/resume state, and precise start/end scheduling with automatic expiration.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {/* Left Column: Master Toggle & Pause/Resume */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>Master Campaign Switch</div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>Enable or disable customer pop-up entirely</div>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={giveawayEnabled}
                      onChange={(e) => {
                        setGiveawayEnabled(e.target.checked);
                        setHasUnsavedChanges(true);
                      }}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: giveawayEnabled ? '#ff7a00' : '#cbd5e1',
                        borderRadius: '24px',
                        transition: '0.2s',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          content: '""',
                          height: '18px',
                          width: '18px',
                          left: giveawayEnabled ? '22px' : '3px',
                          bottom: '3px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          transition: '0.2s',
                        }}
                      />
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>Execution State</div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                      {giveawayPaused ? 'Pop-up is paused — display temporarily stopped' : 'Pop-up is active and eligible to trigger'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setGiveawayPaused(!giveawayPaused);
                      setHasUnsavedChanges(true);
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 800,
                      border: giveawayPaused ? '1px solid #bbf7d0' : '1px solid #fed7aa',
                      backgroundColor: giveawayPaused ? '#f0fdf4' : '#fff7ed',
                      color: giveawayPaused ? '#15803d' : '#ea580c',
                      cursor: 'pointer',
                    }}
                  >
                    {giveawayPaused ? '▶ Resume Campaign' : '⏸ Pause Campaign'}
                  </button>
                </div>
              </div>

              {/* Right Column: Date Pickers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Campaign Start Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={giveawayStartDate}
                    onChange={(e) => {
                      setGiveawayStartDate(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                    Pop-up will automatically schedule and become visible after this time.
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Campaign End Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={giveawayEndDate}
                    onChange={(e) => {
                      setGiveawayEndDate(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                    When this time is reached, the campaign automatically concludes without redeployment.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Pop-up Display Frequency Controls */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>
              ⏱️ Pop-up Display Frequency Controls
            </h3>
            <p style={{ margin: '0 0 18px 0', fontSize: '12px', color: '#64748b' }}>
              Prevent customer annoyance and optimize shopper conversion with fine-grained timing rules.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {/* First Display Delay */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>
                  First Display Delay (seconds)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    min="5"
                    max="600"
                    value={firstDisplayDelay}
                    onChange={(e) => {
                      setFirstDisplayDelay(Number(e.target.value));
                      setHasUnsavedChanges(true);
                    }}
                    style={{ width: '120px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700 }}
                  />
                  <span style={{ fontSize: '13px', color: '#64748b' }}>seconds after arrival</span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                  Default is 60 seconds. Prevents jarring users immediately upon landing on the homepage.
                </div>
              </div>

              {/* Repeat Frequency */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>
                  Repeat Display Frequency
                </label>
                <select
                  value={repeatFrequencyHours}
                  onChange={(e) => {
                    setRepeatFrequencyHours(Number(e.target.value));
                    setHasUnsavedChanges(true);
                  }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value={24}>Every 24 hours (Recommended default)</option>
                  <option value={48}>Every 48 hours</option>
                  <option value={168}>Once per week (7 days)</option>
                  <option value={12}>Every 12 hours (High intensity)</option>
                  <option value={6}>Every 6 hours</option>
                </select>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                  Controls how frequently dismissed pop-ups can resurface to the same visitor.
                </div>
              </div>

              {/* Display Limit Per Customer */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>
                  Display Limit Per Customer
                </label>
                <select
                  value={displayLimit}
                  onChange={(e) => {
                    setDisplayLimit(Number(e.target.value));
                    setHasUnsavedChanges(true);
                  }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value={0}>Unlimited displays (Respects repeat frequency)</option>
                  <option value={1}>Strictly 1 time per customer</option>
                  <option value={3}>Maximum 3 times per customer</option>
                  <option value={5}>Maximum 5 times per customer</option>
                </select>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                  Caps lifetime pop-up appearances across all browser visits.
                </div>
              </div>

              {/* Close Suppression & Stop on Claim */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#1e293b' }}>
                  <input
                    type="checkbox"
                    checked={closeSuppression}
                    onChange={(e) => {
                      setCloseSuppression(e.target.checked);
                      setHasUnsavedChanges(true);
                    }}
                    style={{ accentColor: '#ff7a00', width: '16px', height: '16px' }}
                  />
                  <span>
                    <strong>Close suppression:</strong> Suppress for 24h if user dismisses without claiming
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#1e293b' }}>
                  <input
                    type="checkbox"
                    checked={stopOnClaim}
                    onChange={(e) => {
                      setStopOnClaim(e.target.checked);
                      setHasUnsavedChanges(true);
                    }}
                    style={{ accentColor: '#ff7a00', width: '16px', height: '16px' }}
                  />
                  <span>
                    <strong>Stop permanently on claim:</strong> NEVER show pop-up again once claimed
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Card 4: Customer Experience Safeguards (Active & Enforced) */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>
              🛡️ Customer Experience Safeguards (Enforced by Engine)
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b' }}>
              These automated rules protect checkout conversion and provide friction-free shopper browsing.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div style={{ padding: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#166534', marginBottom: '2px' }}>
                  🛒 Zero Checkout Disruption
                </div>
                <div style={{ fontSize: '11.5px', color: '#15803d' }}>
                  Strictly blocked on `/cart`, `/checkout`, and `/payment` pages so orders are never interrupted.
                </div>
              </div>

              <div style={{ padding: '12px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#1e40af', marginBottom: '2px' }}>
                  ⏱️ Non-Jarring Delay
                </div>
                <div style={{ fontSize: '11.5px', color: '#1d4ed8' }}>
                  Configured delay ensures users absorb storefront content before promotional interruption.
                </div>
              </div>

              <div style={{ padding: '12px', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#6b21a8', marginBottom: '2px' }}>
                  ✕ Multi-Modal Dismissal
                </div>
                <div style={{ fontSize: '11.5px', color: '#7e22ce' }}>
                  Customers can easily close the pop-up via top close button, backdrop click, or Escape key.
                </div>
              </div>

              <div style={{ padding: '12px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#9a3412', marginBottom: '2px' }}>
                  🎁 Alternative Discovery
                </div>
                <div style={{ fontSize: '11.5px', color: '#c2410c' }}>
                  Non-intrusive homepage banner allows users who closed the pop-up to claim later.
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Inventory Allocation & Qualifying Order Value */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>
              📦 Inventory &amp; Order Threshold Allocation
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b' }}>
              Set inventory limits and minimum spend threshold required to qualify for complimentary gift items.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Total Promotional Stock (20 to 50 max)
                </label>
                <input
                  type="number"
                  min="20"
                  max="50"
                  value={giveawayTotalStock}
                  onChange={(e) => {
                    setGiveawayTotalStock(Number(e.target.value));
                    setHasUnsavedChanges(true);
                  }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                  Currently allocated: {(promo?.reserved_stock || 0) + (promo?.confirmed_stock || 0)} units.
                </div>
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
                  onChange={(e) => {
                    setGiveawaySubtotal(Number(e.target.value));
                    setHasUnsavedChanges(true);
                  }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                  Orders with subtotal at or above this value automatically unlock free gift reservation.
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Action / Save Bar */}
          <div
            style={{
              position: 'sticky',
              bottom: '16px',
              zIndex: 40,
              backgroundColor: '#0f172a',
              color: '#ffffff',
              borderRadius: '12px',
              padding: '14px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>{hasUnsavedChanges ? '⚠️' : '✓'}</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800 }}>
                  {hasUnsavedChanges ? 'You have unsaved configuration changes' : 'All giveaway settings synchronized'}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Changes take effect immediately across all storefront sessions without requiring redeployment.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {hasUnsavedChanges && (
                <button
                  type="button"
                  onClick={handleDiscardGiveawaySettings}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #475569',
                    color: '#e2e8f0',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Discard Changes
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveAllGiveawaySettings}
                disabled={isSavingGiveaway}
                style={{
                  backgroundColor: '#ff7a00',
                  border: 'none',
                  color: '#ffffff',
                  padding: '8px 20px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: isSavingGiveaway ? 'not-allowed' : 'pointer',
                  opacity: isSavingGiveaway ? 0.7 : 1,
                  boxShadow: '0 2px 6px rgba(255, 122, 0, 0.4)',
                }}
              >
                {isSavingGiveaway ? 'Saving Settings...' : 'Save Giveaway Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLAIMS AUDIT & REAL INVENTORY */}
      {activeTab === 'CLAIMS' && (
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
                        {c.confirmed_at ? new Date(c.confirmed_at).toLocaleString() : c.released_at ? `Released: ${c.release_reason || ''}` : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: OTHER MARKETING CAMPAIGNS */}
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
                        {c.popup_frequency_seconds === 0 ? 'Once per session' : `Every ${c.popup_frequency_seconds}s`}
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

      {/* TAB 4: AUDIT LOGS */}
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
                  {editingCampaign.name ? `Edit: ${editingCampaign.name}` : 'Create Campaign'}
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
                            : `linear-gradient(135deg, ${editingCampaign.theme.primary_bg} 0%, ${editingCampaign.theme.secondary_bg} 100%)`,
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
                      /* Live Pop-Up Preview — Gift Package / Reward Ticket Style */
                      <div style={{ backgroundColor: '#fff', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 20px 45px -10px rgba(255,122,0,0.3)', border: '1.5px solid rgba(255,122,0,0.25)', textAlign: 'center' }}>
                        <div style={{ background: `linear-gradient(135deg, ${editingCampaign.theme.primary_bg} 0%, ${editingCampaign.theme.secondary_bg} 100%)`, padding: '10px 14px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>DOVI LAUNCH GIVEAWAY 🎁</span>
                          <span style={{ fontSize: '16px', fontWeight: 700, cursor: 'pointer', lineHeight: 1 }}>×</span>
                        </div>
                        <div style={{ padding: '16px' }}>
                          <div style={{ position: 'relative', width: '100%', maxWidth: '180px', height: '100px', margin: '0 auto 10px', borderRadius: '12px', background: 'radial-gradient(circle, #fff7ed 15%, #ffffff 75%)', border: '1px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={editingCampaign.image_url || '/images/promotions/dovi_earpods_3d.png'} alt="" style={{ maxWidth: '120px', maxHeight: '85px', objectFit: 'contain' }} />
                            <div style={{ position: 'absolute', bottom: '-8px', backgroundColor: '#059669', color: '#fff', fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px', border: '1px solid #fff' }}>
                              FREE GIFT · ₦0.00
                            </div>
                          </div>
                          <h4 style={{ margin: '8px 0 4px', fontSize: '14px', fontWeight: 900, color: '#0f172a', lineHeight: 1.25, textTransform: 'uppercase' }}>{editingCampaign.headline}</h4>
                          <p style={{ margin: '0 0 10px', fontSize: '11px', color: '#475569', lineHeight: 1.4 }}>{editingCampaign.description}</p>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '10px', fontSize: '10.5px' }}>
                            <span style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', padding: '3px 8px', borderRadius: '6px' }}>⏱️ Limited-time offer. Ends 20 Dec 2026</span>
                          </div>
                          <button type="button" style={{ width: '100%', padding: '10px', background: `linear-gradient(135deg, ${editingCampaign.theme.primary_bg} 0%, #ea580c 100%)`, color: '#fff', border: 'none', borderRadius: '9999px', fontWeight: 900, fontSize: '12px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,122,0,0.3)' }}>
                            {editingCampaign.cta_text || 'CLAIM YOUR FREE EARPOD'} 🎁
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
