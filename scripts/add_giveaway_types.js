const fs = require('fs');
const path = require('path');

const typesDeclaration = `

// ==========================================
// DOVI LAUNCH GIVEAWAY PROMOTIONAL TYPES
// ==========================================
export type GiveawayStatus = 'SCHEDULED' | 'ACTIVE' | 'OUT_OF_STOCK' | 'EXPIRED' | 'DISABLED';

export type GiveawayClaimStatus = 'RESERVED' | 'CONFIRMED' | 'RELEASED';

export interface GiveawayGiftItem {
  id: string;
  product_id?: string;
  name: string;
  description?: string;
  price: string;
  unit_price: string;
  quantity?: number;
  line_total?: string;
  is_promotional_gift: boolean;
  sku: string;
  image_url: string;
}

export interface GiveawayClaim {
  id: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  order_reference: string;
  order_id?: string;
  status: GiveawayClaimStatus;
  reserved_at: string;
  confirmed_at?: string | null;
  released_at?: string | null;
  release_reason?: string | null;
  is_test?: boolean;
}

export interface LaunchGiveawayPromotion {
  id: string;
  name: string;
  headline: string;
  subheadline: string;
  status: GiveawayStatus;
  qualifying_subtotal: number;
  gift_item: GiveawayGiftItem;
  initial_stock: number;
  total_stock: number;
  max_allowed_stock: number;
  available_stock: number;
  reserved_stock: number;
  confirmed_stock: number;
  released_reservations_count: number;
  start_date: string;
  end_date: string;
  max_per_customer: number;
  claims: GiveawayClaim[];
  updated_at: string;
}
`;

['frontend/src/types/index.ts', 'admin/src/types/index.ts'].forEach((f) => {
  const p = path.resolve(f);
  if (fs.existsSync(p)) {
    let c = fs.readFileSync(p, 'utf8');
    if (!c.includes('LaunchGiveawayPromotion')) {
      c += typesDeclaration;
      fs.writeFileSync(p, c, 'utf8');
      console.log('Appended giveaway types to ' + f);
    } else {
      console.log('Already present in ' + f);
    }
  }
});
