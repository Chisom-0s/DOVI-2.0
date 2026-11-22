const fs = require('fs');

const typesBlock = `
// -------------------------------------------------------------
// Reusable Promotional Campaigns & Banners
// -------------------------------------------------------------
export interface PromotionalTheme {
  primary_bg: string;
  secondary_bg: string;
  bg_style: 'gradient' | 'solid';
  text_color: string;
  button_bg: string;
  button_text_color: string;
  badge_bg: string;
  badge_text_color: string;
  image_position: 'right' | 'left';
  layout_variant: 'standard' | 'compact' | 'minimal';
}

export interface PromotionalPlacements {
  homepage_banner: boolean;
  recurring_popup: boolean;
}

export interface PromotionalCampaign {
  id: string;
  name: string;
  headline: string;
  description: string;
  badge_text: string;
  cta_text: string;
  cta_url: string;
  secondary_text?: string;
  image_url: string;
  theme: PromotionalTheme;
  placements: PromotionalPlacements;
  popup_frequency_seconds: number;
  popup_frequency_label?: string;
  status: 'ACTIVE' | 'PAUSED' | 'SCHEDULED' | 'EXPIRED' | 'DRAFT' | 'ARCHIVED';
  start_date: string;
  end_date: string;
  priority: number;
  is_giveaway?: boolean;
  giveaway_config?: any;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CampaignAuditLog {
  id: string;
  campaign_id: string;
  campaign_name: string;
  action: string;
  admin_user: string;
  details?: Record<string, any>;
  timestamp: string;
}
`;

['frontend/src/types/index.ts', 'admin/src/types/index.ts'].forEach((f) => {
  let content = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
  if (!content.includes('export interface PromotionalCampaign')) {
    content += '\n' + typesBlock;
    fs.writeFileSync(f, content, 'utf8');
    console.log('Added campaign types to ' + f);
  } else {
    console.log('Already in ' + f);
  }
});
