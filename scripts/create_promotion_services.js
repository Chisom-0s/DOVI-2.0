const fs = require('fs');

const serviceCode = `import type { PromotionalCampaign, CampaignAuditLog } from '@/types';

export const DEFAULT_CAMPAIGN: PromotionalCampaign = {
  id: 'promo-launch-giveaway',
  name: 'DOVI Launch Giveaway',
  headline: 'SHOP ₦30,000 OR MORE AND GET A FREE EARPOD!',
  description: 'Unlock a complimentary high-definition DOVI Wireless EarPod with charging case on qualifying marketplace orders of ₦30,000 or more.',
  badge_text: 'Launch Giveaway',
  cta_text: 'Shop & Claim Gift',
  cta_url: '/products',
  secondary_text: 'Limited gifts available · Offer ends 20 Dec 2026',
  image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=400&q=80',
  theme: {
    primary_bg: '#ff7a00',
    secondary_bg: '#059669',
    bg_style: 'gradient',
    text_color: '#ffffff',
    button_bg: '#ffffff',
    button_text_color: '#ea580c',
    badge_bg: 'rgba(255, 255, 255, 0.22)',
    badge_text_color: '#ffffff',
    image_position: 'right',
    layout_variant: 'standard',
  },
  placements: {
    homepage_banner: true,
    recurring_popup: true,
  },
  popup_frequency_seconds: 20,
  popup_frequency_label: 'Every 20 seconds',
  status: 'ACTIVE',
  start_date: '2026-11-22T00:00:00Z',
  end_date: '2026-12-20T23:59:59Z',
  priority: 1,
  is_giveaway: true,
  giveaway_config: {
    qualifying_subtotal: 30000,
    initial_stock: 20,
    total_stock: 20,
    max_allowed_stock: 50,
    available_stock: 20,
    reserved_stock: 0,
    confirmed_stock: 0,
    max_per_customer: 1,
    gift_item: {
      id: 'promo-gift-earpod-2026',
      product_id: 'promo-gift-earpod-2026',
      name: 'DOVI Free EarPod (Launch Edition)',
      description: 'Complimentary DOVI Wireless EarPod with high-definition audio and charging case.',
      price: '0.00',
      unit_price: '0.00',
      quantity: 1,
      line_total: '0.00',
      is_promotional_gift: true,
      sku: 'DOV-GIFT-EARPOD-2026',
      image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
    },
    claims: [],
  },
  created_at: '2026-11-22T20:00:00Z',
  updated_at: '2026-11-22T20:00:00Z',
  created_by: 'Administrator',
};

const STORAGE_KEY = 'dovi_promotional_campaigns_db';
const AUDIT_STORAGE_KEY = 'dovi_campaign_audit_logs_db';

export function computeCampaignStatus(campaign: PromotionalCampaign): PromotionalCampaign['status'] {
  if (campaign.status === 'ARCHIVED') return 'ARCHIVED';
  if (campaign.status === 'PAUSED') return 'PAUSED';
  if (campaign.status === 'DRAFT') return 'DRAFT';

  const now = new Date();
  if (campaign.start_date) {
    const start = new Date(campaign.start_date);
    if (!isNaN(start.getTime()) && now < start) return 'SCHEDULED';
  }
  if (campaign.end_date) {
    const end = new Date(campaign.end_date);
    if (!isNaN(end.getTime()) && now > end) return 'EXPIRED';
  }

  if (campaign.is_giveaway && campaign.giveaway_config) {
    if (campaign.giveaway_config.available_stock <= 0) return 'EXPIRED';
  }

  return 'ACTIVE';
}

export function getLocalCampaigns(): PromotionalCampaign[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((c) => ({
          ...c,
          status: computeCampaignStatus(c),
        }));
      }
    }
  } catch {}
  return [{ ...DEFAULT_CAMPAIGN }];
}

export function saveLocalCampaigns(campaigns: PromotionalCampaign[]): void {
  try {
    const evaluated = campaigns.map((c) => ({
      ...c,
      status: computeCampaignStatus(c),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(evaluated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dovi-campaigns-updated', { detail: evaluated }));
    }
  } catch {}
}

export function getLocalAuditLogs(): CampaignAuditLog[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function saveLocalAuditLogs(logs: CampaignAuditLog[]): void {
  try {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs));
  } catch {}
}

export async function fetchAuthoritativeCampaigns(): Promise<PromotionalCampaign[]> {
  try {
    const res = await fetch('/__dovi_delivery_db__');
    if (res.ok) {
      const store = await res.json();
      if (store?.promotionalCampaigns && Array.isArray(store.promotionalCampaigns) && store.promotionalCampaigns.length > 0) {
        const evaluated = store.promotionalCampaigns.map((c: any) => ({
          ...c,
          status: computeCampaignStatus(c),
        }));
        saveLocalCampaigns(evaluated);
        if (store.campaignAuditLogs) {
          saveLocalAuditLogs(store.campaignAuditLogs);
        }
        return evaluated;
      }
    }
  } catch {}

  try {
    const apiRes = await fetch('/api/v1/promotions/campaigns/');
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data?.results && Array.isArray(data.results)) {
        return data.results.map((c: any) => ({
          ...c,
          status: computeCampaignStatus(c),
        }));
      }
    }
  } catch {}

  return getLocalCampaigns();
}

export async function pushAuthoritativeCampaigns(
  campaigns: PromotionalCampaign[],
  auditLogAction?: { campaign_id: string; campaign_name: string; action: string; admin_user?: string; details?: any }
): Promise<void> {
  const evaluated = campaigns.map((c) => ({
    ...c,
    status: computeCampaignStatus(c),
    updated_at: new Date().toISOString(),
  }));

  saveLocalCampaigns(evaluated);

  let logs = getLocalAuditLogs();
  if (auditLogAction) {
    const newLog: CampaignAuditLog = {
      id: \`log-\${Date.now()}-\${Math.random().toString(36).substring(2, 6)}\`,
      campaign_id: auditLogAction.campaign_id,
      campaign_name: auditLogAction.campaign_name,
      action: auditLogAction.action,
      admin_user: auditLogAction.admin_user || 'Administrator',
      details: auditLogAction.details || {},
      timestamp: new Date().toISOString(),
    };
    logs = [newLog, ...logs.slice(0, 199)];
    saveLocalAuditLogs(logs);
  }

  try {
    await fetch('/__dovi_delivery_db__', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        promotionalCampaigns: evaluated,
        campaignAuditLogs: logs,
      }),
    });
  } catch {}
}

export async function pauseCampaign(id: string, adminUser = 'Administrator'): Promise<PromotionalCampaign | null> {
  const campaigns = await fetchAuthoritativeCampaigns();
  const target = campaigns.find((c) => c.id === id);
  if (!target) return null;

  target.status = 'PAUSED';
  target.updated_at = new Date().toISOString();

  await pushAuthoritativeCampaigns(campaigns, {
    campaign_id: target.id,
    campaign_name: target.name,
    action: 'PAUSED',
    admin_user: adminUser,
  });

  return target;
}

export async function resumeCampaign(id: string, adminUser = 'Administrator'): Promise<PromotionalCampaign | null> {
  const campaigns = await fetchAuthoritativeCampaigns();
  const target = campaigns.find((c) => c.id === id);
  if (!target) return null;

  target.status = 'ACTIVE';
  target.updated_at = new Date().toISOString();

  await pushAuthoritativeCampaigns(campaigns, {
    campaign_id: target.id,
    campaign_name: target.name,
    action: 'RESUMED',
    admin_user: adminUser,
  });

  return target;
}

export async function duplicateCampaign(id: string, adminUser = 'Administrator'): Promise<PromotionalCampaign | null> {
  const campaigns = await fetchAuthoritativeCampaigns();
  const source = campaigns.find((c) => c.id === id);
  if (!source) return null;

  const newId = \`promo-\${Date.now()}-\${Math.random().toString(36).substring(2, 6)}\`;
  const duplicated: PromotionalCampaign = {
    ...JSON.parse(JSON.stringify(source)),
    id: newId,
    name: \`\${source.name} (Copy)\`,
    status: 'DRAFT',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: adminUser,
  };

  if (duplicated.is_giveaway && duplicated.giveaway_config) {
    duplicated.giveaway_config.claims = [];
    duplicated.giveaway_config.reserved_stock = 0;
    duplicated.giveaway_config.confirmed_stock = 0;
  }

  campaigns.unshift(duplicated);
  await pushAuthoritativeCampaigns(campaigns, {
    campaign_id: newId,
    campaign_name: duplicated.name,
    action: 'DUPLICATED',
    admin_user: adminUser,
    details: { original_id: source.id },
  });

  return duplicated;
}

export async function archiveCampaign(id: string, adminUser = 'Administrator'): Promise<boolean> {
  const campaigns = await fetchAuthoritativeCampaigns();
  const target = campaigns.find((c) => c.id === id);
  if (!target) return false;

  target.status = 'ARCHIVED';
  target.updated_at = new Date().toISOString();

  await pushAuthoritativeCampaigns(campaigns, {
    campaign_id: target.id,
    campaign_name: target.name,
    action: 'ARCHIVED',
    admin_user: adminUser,
  });

  return true;
}
`;

['frontend/src/services/promotionService.ts', 'admin/src/services/promotionService.ts'].forEach((f) => {
  fs.writeFileSync(f, serviceCode, 'utf8');
  console.log('Created ' + f);
});
