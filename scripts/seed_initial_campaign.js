const fs = require('fs');
const path = 'backend/delivery_store.json';

if (fs.existsSync(path)) {
  const store = JSON.parse(fs.readFileSync(path, 'utf8'));

  const defaultGiveaway = {
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
    giveaway_config: store.launchGiveaway || {
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

  if (!store.promotionalCampaigns || store.promotionalCampaigns.length === 0) {
    store.promotionalCampaigns = [defaultGiveaway];
  } else {
    // Ensure the launch giveaway has full structure
    const idx = store.promotionalCampaigns.findIndex((c) => c.id === 'promo-launch-giveaway');
    if (idx === -1) {
      store.promotionalCampaigns.unshift(defaultGiveaway);
    }
  }

  if (!store.campaignAuditLogs) {
    store.campaignAuditLogs = [
      {
        id: 'log-seed-001',
        campaign_id: 'promo-launch-giveaway',
        campaign_name: 'DOVI Launch Giveaway',
        action: 'INITIALIZED',
        admin_user: 'System',
        details: { headline: defaultGiveaway.headline, stock: 20, end_date: '2026-12-20' },
        timestamp: '2026-11-22T20:00:00Z',
      },
    ];
  }

  fs.writeFileSync(path, JSON.stringify(store, null, 2), 'utf8');
  console.log('Seeded promotionalCampaigns into delivery_store.json successfully');
}
