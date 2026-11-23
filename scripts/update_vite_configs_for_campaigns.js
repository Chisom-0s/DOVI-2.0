const fs = require('fs');

const files = ['frontend/vite.config.ts', 'admin/vite.config.ts'];

files.forEach((filePath) => {
  let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

  // 1. In merged = { ... }
  const mergedNeedle = `launchGiveaway: incoming.launchGiveaway !== undefined
              ? incoming.launchGiveaway
              : (current.launchGiveaway !== undefined ? current.launchGiveaway : undefined),`;

  const mergedAddition = `
            promotionalCampaigns: incoming.promotionalCampaigns !== undefined
              ? incoming.promotionalCampaigns
              : (current.promotionalCampaigns || undefined),
            campaignAuditLogs: incoming.campaignAuditLogs !== undefined
              ? incoming.campaignAuditLogs
              : (current.campaignAuditLogs || undefined),`;

  if (content.includes(mergedNeedle) && !content.includes('promotionalCampaigns:')) {
    content = content.replace(mergedNeedle, mergedNeedle + mergedAddition);
    console.log('Updated merged in ' + filePath);
  }

  // 2. Add API middleware handler before next() in doviSharedDeliveryDbPlugin
  const apiHandlerCode = `
    // Promotions API endpoints
    if (req.url && req.url.startsWith('/api/v1/promotions/campaigns')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      const store = readStore();
      const campaigns = store.promotionalCampaigns || [
        {
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
          placements: { homepage_banner: true, recurring_popup: true },
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
          },
        }
      ];

      const now = new Date().toISOString();
      const activeOnly = campaigns.filter((c: any) => {
        if (c.status !== 'ACTIVE') return false;
        if (c.start_date && now < c.start_date) return false;
        if (c.end_date && now > c.end_date) return false;
        if (c.is_giveaway && c.giveaway_config && c.giveaway_config.available_stock <= 0) return false;
        return true;
      }).sort((a: any, b: any) => (a.priority || 99) - (b.priority || 99));

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ results: activeOnly }));
      return;
    }
`;

  const nextNeedle = '    next();\n  };';
  if (content.includes(nextNeedle) && !content.includes('/api/v1/promotions/campaigns')) {
    content = content.replace(nextNeedle, apiHandlerCode + '\n' + nextNeedle);
    console.log('Added promotions API handler to ' + filePath);
  }

  fs.writeFileSync(filePath, content, 'utf8');
});
