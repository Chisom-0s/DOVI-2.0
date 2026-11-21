// ============================================================
// DOVI 2.0 — Authoritative Homepage Promotional Placement Service
// Admin-controlled placement for Best Sellers, Trending Now,
// New Arrivals, Hot Sales, Flash Sales, Discounts, Featured Products,
// Save2Own Promo CTA, and Custom Merchandising Sections.
// ============================================================

export interface FlashSaleConfig {
  flash_price: number | null;
  original_price: number | null;
  start_time: string | null; // ISO string
  end_time: string | null;   // ISO string
  is_active: boolean;
}

export interface DiscountConfig {
  discount_price: number | null;
  original_price: number | null;
  start_time: string | null; // ISO string
  end_time: string | null;   // ISO string
  is_active: boolean;
}

export interface ProductHomepagePlacement {
  product_id: string;
  is_best_seller: boolean;
  is_trending: boolean;
  is_new_arrival: boolean;
  is_hot_sale: boolean;
  is_flash_deal: boolean;
  is_discount: boolean;
  is_featured: boolean;
  custom_section_ids?: string[];
  section_orders?: Record<string, number>; // sectionIdOrKey -> 0-based display index
  flash_sale?: FlashSaleConfig | null;
  discount_config?: DiscountConfig | null;
  updated_at: string;
}

export interface MerchandisingSection {
  id: string;
  key: string; // 'BEST_SELLERS' | 'TRENDING_NOW' | 'SPECIAL_PROMO' | 'NEW_ARRIVALS' | 'HOT_SALES' | 'FLASH_DEALS' | 'DISCOUNTS' | 'FEATURED_PRODUCTS' | string
  name: string;
  title: string;
  subtitle: string;
  is_active: boolean;
  sort_order: number;
  display_limit: number;
  product_ids: string[]; // explicit ordered list of product IDs
  is_custom?: boolean;
}

const STORAGE_KEYS = {
  PLACEMENTS: 'dovi_homepage_placements_v2',
  SECTIONS: 'dovi_merchandising_sections_v2',
};

const memoryStore: Record<string, any> = {};

// ============================================================
// 18 Seeded Products Placements
// Pre-populates all 18 existing catalog products into appropriate
// sections so that no section is empty and all products are represented.
// ============================================================
export const DEFAULT_SEEDED_PLACEMENTS: Record<string, ProductHomepagePlacement> = {
  "7a16b38e-6767-4d3e-b95e-1ea5e5df233e": {
    "product_id": "7a16b38e-6767-4d3e-b95e-1ea5e5df233e",
    "is_best_seller": false,
    "is_trending": true,
    "is_new_arrival": true,
    "is_hot_sale": false,
    "is_flash_deal": true,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": {
      "flash_price": 16500,
      "original_price": 20000,
      "start_time": "2026-01-01T00:00:00.000Z",
      "end_time": "2028-12-31T23:59:59.000Z",
      "is_active": true
    },
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "ddace081-9389-4712-acbe-6119235170f7": {
    "product_id": "ddace081-9389-4712-acbe-6119235170f7",
    "is_best_seller": false,
    "is_trending": false,
    "is_new_arrival": true,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "6ee1f16e-519d-405f-a51d-5ed854f43183": {
    "product_id": "6ee1f16e-519d-405f-a51d-5ed854f43183",
    "is_best_seller": false,
    "is_trending": false,
    "is_new_arrival": true,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "7e250987-7681-4929-94bb-c98b8b1ab1d8": {
    "product_id": "7e250987-7681-4929-94bb-c98b8b1ab1d8",
    "is_best_seller": false,
    "is_trending": false,
    "is_new_arrival": true,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "5377d1b8-681f-4287-81d9-9bf5166710b1": {
    "product_id": "5377d1b8-681f-4287-81d9-9bf5166710b1",
    "is_best_seller": false,
    "is_trending": false,
    "is_new_arrival": true,
    "is_hot_sale": false,
    "is_flash_deal": true,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": {
      "flash_price": 4800,
      "original_price": 6000,
      "start_time": "2026-01-01T00:00:00.000Z",
      "end_time": "2028-12-31T23:59:59.000Z",
      "is_active": true
    },
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "9416fc60-6406-4a31-8034-5eae9fdbbbc2": {
    "product_id": "9416fc60-6406-4a31-8034-5eae9fdbbbc2",
    "is_best_seller": false,
    "is_trending": false,
    "is_new_arrival": true,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "1c9f0f9d-4ede-4c28-b172-291c3666eabe": {
    "product_id": "1c9f0f9d-4ede-4c28-b172-291c3666eabe",
    "is_best_seller": false,
    "is_trending": false,
    "is_new_arrival": true,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "50e2ad33-2b73-4f24-a0d0-9c0192fd7d5a": {
    "product_id": "50e2ad33-2b73-4f24-a0d0-9c0192fd7d5a",
    "is_best_seller": false,
    "is_trending": false,
    "is_new_arrival": true,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "70be236f-2a9c-40df-aab4-df2cd543bbdd": {
    "product_id": "70be236f-2a9c-40df-aab4-df2cd543bbdd",
    "is_best_seller": false,
    "is_trending": false,
    "is_new_arrival": true,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "303d5c30-e0a3-40f9-9502-20fd5c7b0d63": {
    "product_id": "303d5c30-e0a3-40f9-9502-20fd5c7b0d63",
    "is_best_seller": false,
    "is_trending": true,
    "is_new_arrival": true,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": true,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": {
      "discount_price": 11500,
      "original_price": 13500,
      "start_time": "2026-01-01T00:00:00.000Z",
      "end_time": "2028-12-31T23:59:59.000Z",
      "is_active": true
    },
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "60914cc8-6a2c-4447-9328-56c35830dc0e": {
    "product_id": "60914cc8-6a2c-4447-9328-56c35830dc0e",
    "is_best_seller": false,
    "is_trending": false,
    "is_new_arrival": true,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "c3402452-d849-436a-b6fa-25437c6685a4": {
    "product_id": "c3402452-d849-436a-b6fa-25437c6685a4",
    "is_best_seller": false,
    "is_trending": false,
    "is_new_arrival": true,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "2aacc640-b6a0-4e88-abe6-a898b9d23c5e": {
    "product_id": "2aacc640-b6a0-4e88-abe6-a898b9d23c5e",
    "is_best_seller": false,
    "is_trending": false,
    "is_new_arrival": true,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": true,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": {
      "discount_price": 54000,
      "original_price": 61000,
      "start_time": "2026-01-01T00:00:00.000Z",
      "end_time": "2028-12-31T23:59:59.000Z",
      "is_active": true
    },
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "9cd28f6e-65ad-400d-bf72-f5a7c00872bb": {
    "product_id": "9cd28f6e-65ad-400d-bf72-f5a7c00872bb",
    "is_best_seller": false,
    "is_trending": false,
    "is_new_arrival": true,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "4c21a5de-b0ff-4144-88ed-a83f45d4cbc2": {
    "product_id": "4c21a5de-b0ff-4144-88ed-a83f45d4cbc2",
    "is_best_seller": false,
    "is_trending": false,
    "is_new_arrival": true,
    "is_hot_sale": false,
    "is_flash_deal": true,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": {
      "flash_price": 9900,
      "original_price": 12000,
      "start_time": "2026-01-01T00:00:00.000Z",
      "end_time": "2028-12-31T23:59:59.000Z",
      "is_active": true
    },
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "45d9616d-4af0-491b-b0d5-9b185404732f": {
    "product_id": "45d9616d-4af0-491b-b0d5-9b185404732f",
    "is_best_seller": false,
    "is_trending": false,
    "is_new_arrival": true,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": true,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "4afb3918-78db-4ab3-ab3a-960ecba22ef0": {
    "product_id": "4afb3918-78db-4ab3-ab3a-960ecba22ef0",
    "is_best_seller": false,
    "is_trending": false,
    "is_new_arrival": true,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": true,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "1bd12327-27c9-4899-aaff-4d5d71f7bb81": {
    "product_id": "1bd12327-27c9-4899-aaff-4d5d71f7bb81",
    "is_best_seller": false,
    "is_trending": false,
    "is_new_arrival": true,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "a3870b94-c866-4436-b1e1-51b678ab2b02": {
    "product_id": "a3870b94-c866-4436-b1e1-51b678ab2b02",
    "is_best_seller": false,
    "is_trending": false,
    "is_new_arrival": true,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "1a66824d-70d1-49b8-ad56-0a023c47b178": {
    "product_id": "1a66824d-70d1-49b8-ad56-0a023c47b178",
    "is_best_seller": false,
    "is_trending": false,
    "is_new_arrival": true,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": true,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "ba918e86-320b-4f72-9f2d-0fbf72544f7c": {
    "product_id": "ba918e86-320b-4f72-9f2d-0fbf72544f7c",
    "is_best_seller": false,
    "is_trending": false,
    "is_new_arrival": false,
    "is_hot_sale": true,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "01d426fa-51b2-40fb-add6-9dcdcd010926": {
    "product_id": "01d426fa-51b2-40fb-add6-9dcdcd010926",
    "is_best_seller": false,
    "is_trending": false,
    "is_new_arrival": false,
    "is_hot_sale": true,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "18103f4e-64e8-498f-b317-28d5f5dbc6bd": {
    "product_id": "18103f4e-64e8-498f-b317-28d5f5dbc6bd",
    "is_best_seller": false,
    "is_trending": true,
    "is_new_arrival": false,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "27d4b0cd-0e28-403f-9437-7f250b14fc4f": {
    "product_id": "27d4b0cd-0e28-403f-9437-7f250b14fc4f",
    "is_best_seller": false,
    "is_trending": true,
    "is_new_arrival": false,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "81e58fb1-05fb-4e70-8ffe-206aa97a5a30": {
    "product_id": "81e58fb1-05fb-4e70-8ffe-206aa97a5a30",
    "is_best_seller": false,
    "is_trending": true,
    "is_new_arrival": false,
    "is_hot_sale": false,
    "is_flash_deal": true,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": {
      "flash_price": 22000,
      "original_price": 26500,
      "start_time": "2026-01-01T00:00:00.000Z",
      "end_time": "2028-12-31T23:59:59.000Z",
      "is_active": true
    },
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "2eade133-3eb4-4900-83b1-39f3fc1b9cb4": {
    "product_id": "2eade133-3eb4-4900-83b1-39f3fc1b9cb4",
    "is_best_seller": false,
    "is_trending": true,
    "is_new_arrival": false,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": true,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": {
      "discount_price": 35000,
      "original_price": 40000,
      "start_time": "2026-01-01T00:00:00.000Z",
      "end_time": "2028-12-31T23:59:59.000Z",
      "is_active": true
    },
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "74993487-eee2-4648-925c-53e3beaf5429": {
    "product_id": "74993487-eee2-4648-925c-53e3beaf5429",
    "is_best_seller": false,
    "is_trending": true,
    "is_new_arrival": false,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "0e264f70-0c62-4cbe-b4f3-006c6aed0a58": {
    "product_id": "0e264f70-0c62-4cbe-b4f3-006c6aed0a58",
    "is_best_seller": false,
    "is_trending": true,
    "is_new_arrival": false,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "7bdaccc2-0a7c-4a30-9626-03e84c144128": {
    "product_id": "7bdaccc2-0a7c-4a30-9626-03e84c144128",
    "is_best_seller": false,
    "is_trending": false,
    "is_new_arrival": false,
    "is_hot_sale": true,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "cf389abf-4eca-41f5-aa19-6f0046482139": {
    "product_id": "cf389abf-4eca-41f5-aa19-6f0046482139",
    "is_best_seller": true,
    "is_trending": false,
    "is_new_arrival": false,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "675dcfa8-cede-4398-93fe-26ebf3c5bf2a": {
    "product_id": "675dcfa8-cede-4398-93fe-26ebf3c5bf2a",
    "is_best_seller": false,
    "is_trending": false,
    "is_new_arrival": false,
    "is_hot_sale": true,
    "is_flash_deal": false,
    "is_discount": true,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": {
      "discount_price": 32000,
      "original_price": 37000,
      "start_time": "2026-01-01T00:00:00.000Z",
      "end_time": "2028-12-31T23:59:59.000Z",
      "is_active": true
    },
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "04d1916c-5dc3-4d37-9247-a6a37be3ba1e": {
    "product_id": "04d1916c-5dc3-4d37-9247-a6a37be3ba1e",
    "is_best_seller": false,
    "is_trending": false,
    "is_new_arrival": false,
    "is_hot_sale": true,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": true,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "27e513ea-8080-4b57-98a9-6b1d02ca0427": {
    "product_id": "27e513ea-8080-4b57-98a9-6b1d02ca0427",
    "is_best_seller": false,
    "is_trending": false,
    "is_new_arrival": false,
    "is_hot_sale": true,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": true,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "350a679b-746a-4102-9710-2599dcd3aeb0": {
    "product_id": "350a679b-746a-4102-9710-2599dcd3aeb0",
    "is_best_seller": true,
    "is_trending": false,
    "is_new_arrival": false,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": true,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "3318868a-1e34-43f4-888e-c9d63d373509": {
    "product_id": "3318868a-1e34-43f4-888e-c9d63d373509",
    "is_best_seller": true,
    "is_trending": false,
    "is_new_arrival": false,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": true,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": {
      "discount_price": 31000,
      "original_price": 35500,
      "start_time": "2026-01-01T00:00:00.000Z",
      "end_time": "2028-12-31T23:59:59.000Z",
      "is_active": true
    },
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "2967f4f6-bf01-4001-bfb5-df287afabd56": {
    "product_id": "2967f4f6-bf01-4001-bfb5-df287afabd56",
    "is_best_seller": true,
    "is_trending": false,
    "is_new_arrival": false,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": true,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "23a9ba40-294a-4c8b-bef5-f0e1fa92abaa": {
    "product_id": "23a9ba40-294a-4c8b-bef5-f0e1fa92abaa",
    "is_best_seller": false,
    "is_trending": true,
    "is_new_arrival": false,
    "is_hot_sale": false,
    "is_flash_deal": true,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": {
      "flash_price": 21500,
      "original_price": 25000,
      "start_time": "2026-01-01T00:00:00.000Z",
      "end_time": "2028-12-31T23:59:59.000Z",
      "is_active": true
    },
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "0cd35e98-6eda-467d-8528-1ce1e8948f0f": {
    "product_id": "0cd35e98-6eda-467d-8528-1ce1e8948f0f",
    "is_best_seller": true,
    "is_trending": false,
    "is_new_arrival": false,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": true,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "8fe9e4bb-dc2a-43e7-aa37-06727bc7dd71": {
    "product_id": "8fe9e4bb-dc2a-43e7-aa37-06727bc7dd71",
    "is_best_seller": false,
    "is_trending": true,
    "is_new_arrival": false,
    "is_hot_sale": true,
    "is_flash_deal": true,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": {
      "flash_price": 12900,
      "original_price": 15700,
      "start_time": "2026-01-01T00:00:00.000Z",
      "end_time": "2028-12-31T23:59:59.000Z",
      "is_active": true
    },
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "40f3493f-d9ce-420b-b2ec-e79ce0b2f9ef": {
    "product_id": "40f3493f-d9ce-420b-b2ec-e79ce0b2f9ef",
    "is_best_seller": true,
    "is_trending": false,
    "is_new_arrival": false,
    "is_hot_sale": true,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "3d2350c1-8325-4a02-b554-d24b650ad901": {
    "product_id": "3d2350c1-8325-4a02-b554-d24b650ad901",
    "is_best_seller": false,
    "is_trending": false,
    "is_new_arrival": false,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": true,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": {
      "discount_price": 26000,
      "original_price": 30000,
      "start_time": "2026-01-01T00:00:00.000Z",
      "end_time": "2028-12-31T23:59:59.000Z",
      "is_active": true
    },
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "66d4c89f-ea43-4fb3-904e-7de1ea7577e9": {
    "product_id": "66d4c89f-ea43-4fb3-904e-7de1ea7577e9",
    "is_best_seller": false,
    "is_trending": true,
    "is_new_arrival": false,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": true,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": {
      "discount_price": 295000,
      "original_price": 320000,
      "start_time": "2026-01-01T00:00:00.000Z",
      "end_time": "2028-12-31T23:59:59.000Z",
      "is_active": true
    },
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "9b1920db-b6d5-47e5-8a12-1d7b09d1ad6d": {
    "product_id": "9b1920db-b6d5-47e5-8a12-1d7b09d1ad6d",
    "is_best_seller": true,
    "is_trending": false,
    "is_new_arrival": false,
    "is_hot_sale": false,
    "is_flash_deal": true,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": {
      "flash_price": 36500,
      "original_price": 42000,
      "start_time": "2026-01-01T00:00:00.000Z",
      "end_time": "2028-12-31T23:59:59.000Z",
      "is_active": true
    },
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "97487f6d-f8fa-4ed0-b74f-b9c86b9fc8fa": {
    "product_id": "97487f6d-f8fa-4ed0-b74f-b9c86b9fc8fa",
    "is_best_seller": false,
    "is_trending": false,
    "is_new_arrival": false,
    "is_hot_sale": true,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "38897758-8093-46e3-a005-63a4581e3bb7": {
    "product_id": "38897758-8093-46e3-a005-63a4581e3bb7",
    "is_best_seller": false,
    "is_trending": false,
    "is_new_arrival": false,
    "is_hot_sale": true,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "a0871326-206d-4888-b7af-df8b5f6d182a": {
    "product_id": "a0871326-206d-4888-b7af-df8b5f6d182a",
    "is_best_seller": false,
    "is_trending": true,
    "is_new_arrival": false,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "915504e3-a5eb-46ce-be83-f7ece5e5707a": {
    "product_id": "915504e3-a5eb-46ce-be83-f7ece5e5707a",
    "is_best_seller": true,
    "is_trending": false,
    "is_new_arrival": false,
    "is_hot_sale": false,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": true,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "a36c024a-77e4-4582-be28-b85aab404bfc": {
    "product_id": "a36c024a-77e4-4582-be28-b85aab404bfc",
    "is_best_seller": false,
    "is_trending": false,
    "is_new_arrival": false,
    "is_hot_sale": true,
    "is_flash_deal": false,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": null,
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  },
  "0023fd0f-715d-4578-94ad-e84efb1f3ba8": {
    "product_id": "0023fd0f-715d-4578-94ad-e84efb1f3ba8",
    "is_best_seller": true,
    "is_trending": false,
    "is_new_arrival": false,
    "is_hot_sale": false,
    "is_flash_deal": true,
    "is_discount": false,
    "is_featured": false,
    "flash_sale": {
      "flash_price": 13200,
      "original_price": 15700,
      "start_time": "2026-01-01T00:00:00.000Z",
      "end_time": "2028-12-31T23:59:59.000Z",
      "is_active": true
    },
    "discount_config": null,
    "updated_at": "2026-11-21T10:00:00.000Z"
  }
};

// ============================================================
// Core Merchandising Sections
// ============================================================
export const DEFAULT_CORE_SECTIONS: MerchandisingSection[] = [
  {
    "id": "sec-best-sellers",
    "key": "BEST_SELLERS",
    "name": "Best Sellers",
    "title": "Best Sellers",
    "subtitle": "Top performing products curated by DOVI",
    "is_active": true,
    "sort_order": 1,
    "display_limit": 24,
    "product_ids": [
      "0cd35e98-6eda-467d-8528-1ce1e8948f0f",
      "40f3493f-d9ce-420b-b2ec-e79ce0b2f9ef",
      "9b1920db-b6d5-47e5-8a12-1d7b09d1ad6d",
      "0023fd0f-715d-4578-94ad-e84efb1f3ba8",
      "350a679b-746a-4102-9710-2599dcd3aeb0",
      "3318868a-1e34-43f4-888e-c9d63d373509",
      "2967f4f6-bf01-4001-bfb5-df287afabd56",
      "cf389abf-4eca-41f5-aa19-6f0046482139",
      "915504e3-a5eb-46ce-be83-f7ece5e5707a"
    ],
    "is_custom": false
  },
  {
    "id": "sec-trending",
    "key": "TRENDING_NOW",
    "name": "Trending Now",
    "title": "Trending Now",
    "subtitle": "High demand picks selected for today",
    "is_active": true,
    "sort_order": 2,
    "display_limit": 24,
    "product_ids": [
      "7a16b38e-6767-4d3e-b95e-1ea5e5df233e",
      "81e58fb1-05fb-4e70-8ffe-206aa97a5a30",
      "27d4b0cd-0e28-403f-9437-7f250b14fc4f",
      "18103f4e-64e8-498f-b317-28d5f5dbc6bd",
      "2eade133-3eb4-4900-83b1-39f3fc1b9cb4",
      "74993487-eee2-4648-925c-53e3beaf5429",
      "0e264f70-0c62-4cbe-b4f3-006c6aed0a58",
      "23a9ba40-294a-4c8b-bef5-f0e1fa92abaa",
      "303d5c30-e0a3-40f9-9502-20fd5c7b0d63",
      "8fe9e4bb-dc2a-43e7-aa37-06727bc7dd71",
      "66d4c89f-ea43-4fb3-904e-7de1ea7577e9",
      "a0871326-206d-4888-b7af-df8b5f6d182a"
    ],
    "is_custom": false
  },
  {
    "id": "sec-special-promo",
    "key": "SPECIAL_PROMO",
    "name": "Special Promo",
    "title": "Unlock Save2Own Benefits",
    "subtitle": "Contribute in bits towards purchasing high-value items without any interest.",
    "is_active": true,
    "sort_order": 3,
    "display_limit": 1,
    "product_ids": [],
    "is_custom": false
  },
  {
    "id": "sec-new-arrivals",
    "key": "NEW_ARRIVALS",
    "name": "New Arrivals",
    "title": "New Arrivals",
    "subtitle": "Fresh additions to the DOVI marketplace",
    "is_active": true,
    "sort_order": 4,
    "display_limit": 24,
    "product_ids": [
      "7a16b38e-6767-4d3e-b95e-1ea5e5df233e",
      "ddace081-9389-4712-acbe-6119235170f7",
      "6ee1f16e-519d-405f-a51d-5ed854f43183",
      "7e250987-7681-4929-94bb-c98b8b1ab1d8",
      "5377d1b8-681f-4287-81d9-9bf5166710b1",
      "9416fc60-6406-4a31-8034-5eae9fdbbbc2",
      "1c9f0f9d-4ede-4c28-b172-291c3666eabe",
      "50e2ad33-2b73-4f24-a0d0-9c0192fd7d5a",
      "70be236f-2a9c-40df-aab4-df2cd543bbdd",
      "303d5c30-e0a3-40f9-9502-20fd5c7b0d63",
      "60914cc8-6a2c-4447-9328-56c35830dc0e",
      "c3402452-d849-436a-b6fa-25437c6685a4",
      "2aacc640-b6a0-4e88-abe6-a898b9d23c5e",
      "9cd28f6e-65ad-400d-bf72-f5a7c00872bb",
      "4c21a5de-b0ff-4144-88ed-a83f45d4cbc2",
      "45d9616d-4af0-491b-b0d5-9b185404732f",
      "4afb3918-78db-4ab3-ab3a-960ecba22ef0",
      "1bd12327-27c9-4899-aaff-4d5d71f7bb81",
      "a3870b94-c866-4436-b1e1-51b678ab2b02",
      "1a66824d-70d1-49b8-ad56-0a023c47b178"
    ],
    "is_custom": false
  },
  {
    "id": "sec-hot-sales",
    "key": "HOT_SALES",
    "name": "Hot Sales",
    "title": "Hot Sales",
    "subtitle": "Great deals on popular products",
    "is_active": true,
    "sort_order": 5,
    "display_limit": 24,
    "product_ids": [
      "8fe9e4bb-dc2a-43e7-aa37-06727bc7dd71",
      "40f3493f-d9ce-420b-b2ec-e79ce0b2f9ef",
      "97487f6d-f8fa-4ed0-b74f-b9c86b9fc8fa",
      "38897758-8093-46e3-a005-63a4581e3bb7",
      "a36c024a-77e4-4582-be28-b85aab404bfc",
      "675dcfa8-cede-4398-93fe-26ebf3c5bf2a",
      "04d1916c-5dc3-4d37-9247-a6a37be3ba1e",
      "27e513ea-8080-4b57-98a9-6b1d02ca0427",
      "7bdaccc2-0a7c-4a30-9626-03e84c144128",
      "ba918e86-320b-4f72-9f2d-0fbf72544f7c",
      "01d426fa-51b2-40fb-add6-9dcdcd010926"
    ],
    "is_custom": false
  },
  {
    "id": "sec-flash-deals",
    "key": "FLASH_DEALS",
    "name": "Flash Sales",
    "title": "Flash Sales",
    "subtitle": "Limited-time special prices — ending soon!",
    "is_active": true,
    "sort_order": 6,
    "display_limit": 24,
    "product_ids": [
      "7a16b38e-6767-4d3e-b95e-1ea5e5df233e",
      "5377d1b8-681f-4287-81d9-9bf5166710b1",
      "23a9ba40-294a-4c8b-bef5-f0e1fa92abaa",
      "8fe9e4bb-dc2a-43e7-aa37-06727bc7dd71",
      "0023fd0f-715d-4578-94ad-e84efb1f3ba8",
      "9b1920db-b6d5-47e5-8a12-1d7b09d1ad6d",
      "4c21a5de-b0ff-4144-88ed-a83f45d4cbc2",
      "81e58fb1-05fb-4e70-8ffe-206aa97a5a30"
    ],
    "is_custom": false
  },
  {
    "id": "sec-discounts",
    "key": "DISCOUNTS",
    "name": "Discounts",
    "title": "Discounts",
    "subtitle": "Exclusive markdowns and limited-time discounts",
    "is_active": true,
    "sort_order": 7,
    "display_limit": 24,
    "product_ids": [
      "3318868a-1e34-43f4-888e-c9d63d373509",
      "3d2350c1-8325-4a02-b554-d24b650ad901",
      "66d4c89f-ea43-4fb3-904e-7de1ea7577e9",
      "7a16b38e-6767-4d3e-b95e-1ea5e5df233e",
      "2eade133-3eb4-4900-83b1-39f3fc1b9cb4",
      "675dcfa8-cede-4398-93fe-26ebf3c5bf2a",
      "303d5c30-e0a3-40f9-9502-20fd5c7b0d63",
      "2aacc640-b6a0-4e88-abe6-a898b9d23c5e"
    ],
    "is_custom": false
  },
  {
    "id": "sec-featured",
    "key": "FEATURED_PRODUCTS",
    "name": "Featured Products",
    "title": "Featured Products",
    "subtitle": "Hand-picked essentials curated for you",
    "is_active": true,
    "sort_order": 8,
    "display_limit": 24,
    "product_ids": [
      "0cd35e98-6eda-467d-8528-1ce1e8948f0f",
      "915504e3-a5eb-46ce-be83-f7ece5e5707a",
      "350a679b-746a-4102-9710-2599dcd3aeb0",
      "2967f4f6-bf01-4001-bfb5-df287afabd56",
      "1a66824d-70d1-49b8-ad56-0a023c47b178",
      "45d9616d-4af0-491b-b0d5-9b185404732f",
      "4afb3918-78db-4ab3-ab3a-960ecba22ef0",
      "04d1916c-5dc3-4d37-9247-a6a37be3ba1e",
      "27e513ea-8080-4b57-98a9-6b1d02ca0427"
    ],
    "is_custom": false
  }
];

function readLocal<T>(key: string, fallback: T): T {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        if (key === STORAGE_KEYS.SECTIONS && Array.isArray(parsed) && parsed.length < (fallback as any[]).length) {
          return fallback;
        }
        if (key === STORAGE_KEYS.PLACEMENTS && parsed && Object.keys(parsed).length < Object.keys(fallback as any).length) {
          return { ...(fallback as any), ...parsed };
        }
        return parsed;
      }
    }
  } catch {}
  if (memoryStore[key] !== undefined) {
    try {
      return JSON.parse(JSON.stringify(memoryStore[key]));
    } catch {
      return memoryStore[key];
    }
  }
  return fallback;
}

function writeLocal<T>(key: string, value: T): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent('dovi-homepage-placements-updated'));
      window.dispatchEvent(new CustomEvent('dovi-merchandising-updated'));
    }
  } catch {}
  try {
    memoryStore[key] = JSON.parse(JSON.stringify(value));
  } catch {
    memoryStore[key] = value;
  }
}

/**
 * Checks whether a configured Flash Sale is currently active and within its valid time window.
 */
export function isFlashSaleActiveNow(flashSale?: FlashSaleConfig | null, asOfDate: Date = new Date()): boolean {
  if (!flashSale) return false;
  if (flashSale.is_active === false) return false;
  if (!flashSale.flash_price || flashSale.flash_price <= 0) return false;
  if (flashSale.original_price && flashSale.flash_price >= flashSale.original_price) return false;

  const now = asOfDate.getTime();
  if (flashSale.start_time) {
    const start = new Date(flashSale.start_time).getTime();
    if (!isNaN(start) && now < start) return false;
  }
  if (flashSale.end_time) {
    const end = new Date(flashSale.end_time).getTime();
    if (!isNaN(end) && now > end) return false;
  }

  return true;
}

/**
 * Checks whether a configured Discount is currently active and within its valid time window.
 */
export function isDiscountActiveNow(discount?: DiscountConfig | null, asOfDate: Date = new Date()): boolean {
  if (!discount) return false;
  if (discount.is_active === false) return false;
  if (!discount.discount_price || discount.discount_price <= 0) return false;
  if (discount.original_price && discount.discount_price >= discount.original_price) return false;

  const now = asOfDate.getTime();
  if (discount.start_time) {
    const start = new Date(discount.start_time).getTime();
    if (!isNaN(start) && now < start) return false;
  }
  if (discount.end_time) {
    const end = new Date(discount.end_time).getTime();
    if (!isNaN(end) && now > end) return false;
  }

  return true;
}

/**
 * Extracts homepage merchandising metadata embedded in a product's description HTML comment.
 */
export function parseHomepageMetadataFromDescription(description?: string | null): Partial<ProductHomepagePlacement> | null {
  if (!description) return null;
  const match = description.match(/<!--\s*DOVI_HOMEPAGE:\s*(\{[\s\S]*?\})\s*-->/i);
  if (!match || !match[1]) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

/**
 * Injects homepage metadata into a product description.
 */
export function injectHomepageMetadataIntoDescription(
  description: string = '',
  placement: Partial<ProductHomepagePlacement>
): string {
  const cleaned = (description || '').replace(/\s*<!--\s*DOVI_HOMEPAGE:\s*\{[\s\S]*?\}\s*-->\s*/gi, '').trim();
  const payload = JSON.stringify({
    is_best_seller: Boolean(placement.is_best_seller),
    is_trending: Boolean(placement.is_trending),
    is_new_arrival: Boolean(placement.is_new_arrival),
    is_hot_sale: Boolean(placement.is_hot_sale),
    is_flash_deal: Boolean(placement.is_flash_deal),
    is_discount: Boolean(placement.is_discount),
    is_featured: Boolean(placement.is_featured),
    custom_section_ids: placement.custom_section_ids || [],
    section_orders: placement.section_orders || {},
    flash_sale: placement.flash_sale || null,
    discount_config: placement.discount_config || null,
    updated_at: placement.updated_at || new Date().toISOString(),
  });
  return `${cleaned}\n\n<!-- DOVI_HOMEPAGE: ${payload} -->`.trim();
}

/**
 * Gets the current placement configuration for a product.
 */
export function getProductHomepagePlacement(productOrId: { id?: string; description?: string } | string): ProductHomepagePlacement | null {
  const productId = typeof productOrId === 'string' ? productOrId : productOrId?.id;
  const desc = typeof productOrId === 'object' ? productOrId?.description : null;

  const fromDesc = parseHomepageMetadataFromDescription(desc);
  const storeMap = readLocal<Record<string, ProductHomepagePlacement>>(STORAGE_KEYS.PLACEMENTS, DEFAULT_SEEDED_PLACEMENTS);
  const fromStore = productId ? storeMap[String(productId)] : null;

  if (fromDesc && fromStore) {
    const descTime = new Date(fromDesc.updated_at || 0).getTime();
    const storeTime = new Date(fromStore.updated_at || 0).getTime();
    return descTime >= storeTime
      ? {
          product_id: String(productId || ''),
          is_best_seller: Boolean(fromDesc.is_best_seller),
          is_trending: Boolean(fromDesc.is_trending),
          is_new_arrival: Boolean(fromDesc.is_new_arrival),
          is_hot_sale: Boolean(fromDesc.is_hot_sale),
          is_flash_deal: Boolean(fromDesc.is_flash_deal),
          is_discount: Boolean(fromDesc.is_discount),
          is_featured: Boolean(fromDesc.is_featured),
          custom_section_ids: fromDesc.custom_section_ids || [],
          section_orders: fromDesc.section_orders || {},
          flash_sale: fromDesc.flash_sale || null,
          discount_config: fromDesc.discount_config || null,
          updated_at: fromDesc.updated_at || new Date().toISOString(),
        }
      : fromStore;
  }

  if (fromDesc) {
    return {
      product_id: String(productId || ''),
      is_best_seller: Boolean(fromDesc.is_best_seller),
      is_trending: Boolean(fromDesc.is_trending),
      is_new_arrival: Boolean(fromDesc.is_new_arrival),
      is_hot_sale: Boolean(fromDesc.is_hot_sale),
      is_flash_deal: Boolean(fromDesc.is_flash_deal),
      is_discount: Boolean(fromDesc.is_discount),
      is_featured: Boolean(fromDesc.is_featured),
      custom_section_ids: fromDesc.custom_section_ids || [],
      section_orders: fromDesc.section_orders || {},
      flash_sale: fromDesc.flash_sale || null,
      discount_config: fromDesc.discount_config || null,
      updated_at: fromDesc.updated_at || new Date().toISOString(),
    };
  }

  return fromStore || null;
}

/**
 * Saves homepage placement for a product and synchronizes to local and server stores.
 */
export async function saveProductHomepagePlacement(
  productId: string,
  placement: Omit<ProductHomepagePlacement, 'product_id' | 'updated_at'>
): Promise<ProductHomepagePlacement> {
  const idStr = String(productId).trim();
  const map = readLocal<Record<string, ProductHomepagePlacement>>(STORAGE_KEYS.PLACEMENTS, DEFAULT_SEEDED_PLACEMENTS);
  const record: ProductHomepagePlacement = {
    product_id: idStr,
    is_best_seller: Boolean(placement.is_best_seller),
    is_trending: Boolean(placement.is_trending),
    is_new_arrival: Boolean(placement.is_new_arrival),
    is_hot_sale: Boolean(placement.is_hot_sale),
    is_flash_deal: Boolean(placement.is_flash_deal),
    is_discount: Boolean(placement.is_discount),
    is_featured: Boolean(placement.is_featured),
    custom_section_ids: placement.custom_section_ids || [],
    section_orders: placement.section_orders || {},
    flash_sale: placement.flash_sale || null,
    discount_config: placement.discount_config || null,
    updated_at: new Date().toISOString(),
  };

  map[idStr] = record;
  writeLocal(STORAGE_KEYS.PLACEMENTS, map);

  // Sync to section product_ids lists
  syncPlacementToSections(record);

  // Sync to shared server store
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      await fetch('/__dovi_delivery_db__', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homepagePlacements: map,
          homepageSections: listMerchandisingSections(),
        }),
      });
    } catch {}
  }

  return record;
}

/**
 * Keep section product_ids in sync with individual product placement toggles.
 */
function syncPlacementToSections(placement: ProductHomepagePlacement) {
  const sections = listMerchandisingSections();
  const pid = placement.product_id;
  let modified = false;

  const keyMap: Record<string, boolean> = {
    BEST_SELLERS: placement.is_best_seller,
    TRENDING_NOW: placement.is_trending,
    NEW_ARRIVALS: placement.is_new_arrival,
    HOT_SALES: placement.is_hot_sale,
    FLASH_DEALS: placement.is_flash_deal,
    DISCOUNTS: placement.is_discount,
    FEATURED_PRODUCTS: placement.is_featured,
  };

  for (const s of sections) {
    if (keyMap[s.key] !== undefined) {
      const shouldInclude = keyMap[s.key];
      const has = s.product_ids.includes(pid);
      if (shouldInclude && !has) {
        s.product_ids.push(pid);
        modified = true;
      } else if (!shouldInclude && has) {
        s.product_ids = s.product_ids.filter((id) => id !== pid);
        modified = true;
      }
    } else if (s.is_custom) {
      const shouldInclude = placement.custom_section_ids?.includes(s.id) || placement.custom_section_ids?.includes(s.key);
      const has = s.product_ids.includes(pid);
      if (shouldInclude && !has) {
        s.product_ids.push(pid);
        modified = true;
      } else if (!shouldInclude && has) {
        s.product_ids = s.product_ids.filter((id) => id !== pid);
        modified = true;
      }
    }
  }

  if (modified) {
    writeLocal(STORAGE_KEYS.SECTIONS, sections);
  }
}

// ============================================================
// MERCHANDISING SECTIONS MANAGEMENT
// ============================================================

/**
 * Returns all configured merchandising sections (8 core + custom).
 */
export function listMerchandisingSections(): MerchandisingSection[] {
  const stored = readLocal<MerchandisingSection[]>(STORAGE_KEYS.SECTIONS, []);
  if (!stored || stored.length === 0) {
    writeLocal(STORAGE_KEYS.SECTIONS, DEFAULT_CORE_SECTIONS);
    return JSON.parse(JSON.stringify(DEFAULT_CORE_SECTIONS));
  }

  // Ensure all core sections exist
  const existingKeys = new Set(stored.map((s) => s.key));
  let added = false;
  for (const core of DEFAULT_CORE_SECTIONS) {
    if (!existingKeys.has(core.key)) {
      stored.push(JSON.parse(JSON.stringify(core)));
      added = true;
    }
  }

  if (added) {
    stored.sort((a, b) => a.sort_order - b.sort_order);
    writeLocal(STORAGE_KEYS.SECTIONS, stored);
  }

  return stored.sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * Saves a section definition (update title, subtitle, active, display_limit, sort_order, etc.).
 */
export async function saveMerchandisingSection(section: MerchandisingSection): Promise<MerchandisingSection> {
  const sections = listMerchandisingSections();
  const idx = sections.findIndex((s) => s.id === section.id || s.key === section.key);
  if (idx >= 0) {
    sections[idx] = { ...sections[idx], ...section };
  } else {
    sections.push(section);
  }

  sections.sort((a, b) => a.sort_order - b.sort_order);
  writeLocal(STORAGE_KEYS.SECTIONS, sections);
  await persistMerchandisingToServer(sections);
  return section;
}

/**
 * Creates a new custom section.
 */
export async function createCustomSection(data: {
  name: string;
  title: string;
  subtitle?: string;
  display_limit?: number;
  sort_order?: number;
  is_active?: boolean;
}): Promise<MerchandisingSection> {
  const sections = listMerchandisingSections();
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const id = `sec-custom-${Date.now()}`;
  const maxOrder = sections.reduce((max, s) => Math.max(max, s.sort_order), 0);

  const newSection: MerchandisingSection = {
    id,
    key: `CUSTOM_${slug.toUpperCase()}_${Date.now()}`,
    name: data.name,
    title: data.title || data.name,
    subtitle: data.subtitle || '',
    is_active: data.is_active !== false,
    sort_order: data.sort_order ?? maxOrder + 1,
    display_limit: data.display_limit ?? 8,
    product_ids: [],
    is_custom: true,
  };

  sections.push(newSection);
  sections.sort((a, b) => a.sort_order - b.sort_order);
  writeLocal(STORAGE_KEYS.SECTIONS, sections);
  await persistMerchandisingToServer(sections);
  return newSection;
}

/**
 * Deletes a custom section.
 */
export async function deleteCustomSection(sectionIdOrKey: string): Promise<boolean> {
  const sections = listMerchandisingSections();
  const target = sections.find((s) => s.id === sectionIdOrKey || s.key === sectionIdOrKey);
  if (!target || !target.is_custom) return false;

  const filtered = sections.filter((s) => s.id !== target.id && s.key !== target.key);
  writeLocal(STORAGE_KEYS.SECTIONS, filtered);

  // Clean custom section ID from all product placements
  const placements = readLocal<Record<string, ProductHomepagePlacement>>(STORAGE_KEYS.PLACEMENTS, DEFAULT_SEEDED_PLACEMENTS);
  let placementsModified = false;
  for (const pid of Object.keys(placements)) {
    const p = placements[pid];
    if (p.custom_section_ids && (p.custom_section_ids.includes(target.id) || p.custom_section_ids.includes(target.key))) {
      p.custom_section_ids = p.custom_section_ids.filter((id) => id !== target.id && id !== target.key);
      placementsModified = true;
    }
  }
  if (placementsModified) {
    writeLocal(STORAGE_KEYS.PLACEMENTS, placements);
  }

  await persistMerchandisingToServer(filtered);
  return true;
}

/**
 * Assigns a product to a section at a specific position.
 */
export async function assignProductToSection(sectionIdOrKey: string, productId: string, position?: number): Promise<void> {
  const sections = listMerchandisingSections();
  const s = sections.find((x) => x.id === sectionIdOrKey || x.key === sectionIdOrKey);
  if (!s) return;

  const pid = String(productId).trim();
  s.product_ids = s.product_ids.filter((id) => id !== pid);
  if (position !== undefined && position >= 0 && position < s.product_ids.length) {
    s.product_ids.splice(position, 0, pid);
  } else {
    s.product_ids.push(pid);
  }

  writeLocal(STORAGE_KEYS.SECTIONS, sections);

  // Sync to placement record for product
  const placement = getProductHomepagePlacement(pid) || {
    product_id: pid,
    is_best_seller: false,
    is_trending: false,
    is_new_arrival: false,
    is_hot_sale: false,
    is_flash_deal: false,
    is_discount: false,
    is_featured: false,
    updated_at: new Date().toISOString(),
  };

  if (s.key === 'BEST_SELLERS') placement.is_best_seller = true;
  if (s.key === 'TRENDING_NOW') placement.is_trending = true;
  if (s.key === 'NEW_ARRIVALS') placement.is_new_arrival = true;
  if (s.key === 'HOT_SALES') placement.is_hot_sale = true;
  if (s.key === 'FLASH_DEALS') placement.is_flash_deal = true;
  if (s.key === 'DISCOUNTS') placement.is_discount = true;
  if (s.key === 'FEATURED_PRODUCTS') placement.is_featured = true;
  if (s.is_custom) {
    const customs = new Set(placement.custom_section_ids || []);
    customs.add(s.id);
    placement.custom_section_ids = Array.from(customs);
  }

  await saveProductHomepagePlacement(pid, placement);
  await persistMerchandisingToServer(sections);
}

/**
 * Removes a product from a section.
 */
export async function removeProductFromSection(sectionIdOrKey: string, productId: string): Promise<void> {
  const sections = listMerchandisingSections();
  const s = sections.find((x) => x.id === sectionIdOrKey || x.key === sectionIdOrKey);
  if (!s) return;

  const pid = String(productId).trim();
  s.product_ids = s.product_ids.filter((id) => id !== pid);
  writeLocal(STORAGE_KEYS.SECTIONS, sections);

  // Sync to placement record for product
  const placement = getProductHomepagePlacement(pid);
  if (placement) {
    if (s.key === 'BEST_SELLERS') placement.is_best_seller = false;
    if (s.key === 'TRENDING_NOW') placement.is_trending = false;
    if (s.key === 'NEW_ARRIVALS') placement.is_new_arrival = false;
    if (s.key === 'HOT_SALES') placement.is_hot_sale = false;
    if (s.key === 'FLASH_DEALS') placement.is_flash_deal = false;
    if (s.key === 'DISCOUNTS') placement.is_discount = false;
    if (s.key === 'FEATURED_PRODUCTS') placement.is_featured = false;
    if (s.is_custom && placement.custom_section_ids) {
      placement.custom_section_ids = placement.custom_section_ids.filter((id) => id !== s.id && id !== s.key);
    }
    await saveProductHomepagePlacement(pid, placement);
  }

  await persistMerchandisingToServer(sections);
}

/**
 * Reorders products in a section given a new ordered array of product IDs.
 */
export async function reorderProductsInSection(sectionIdOrKey: string, productIds: string[]): Promise<void> {
  const sections = listMerchandisingSections();
  const s = sections.find((x) => x.id === sectionIdOrKey || x.key === sectionIdOrKey);
  if (!s) return;

  s.product_ids = [...productIds];
  writeLocal(STORAGE_KEYS.SECTIONS, sections);
  await persistMerchandisingToServer(sections);
}

/**
 * Updates the display limit for a section.
 */
export async function updateSectionLimit(sectionIdOrKey: string, limit: number): Promise<void> {
  const sections = listMerchandisingSections();
  const s = sections.find((x) => x.id === sectionIdOrKey || x.key === sectionIdOrKey);
  if (!s) return;

  s.display_limit = Math.max(1, limit);
  writeLocal(STORAGE_KEYS.SECTIONS, sections);
  await persistMerchandisingToServer(sections);
}

/**
 * Toggles a section's active status.
 */
export async function toggleSectionActive(sectionIdOrKey: string, isActive: boolean): Promise<void> {
  const sections = listMerchandisingSections();
  const s = sections.find((x) => x.id === sectionIdOrKey || x.key === sectionIdOrKey);
  if (!s) return;

  s.is_active = isActive;
  writeLocal(STORAGE_KEYS.SECTIONS, sections);
  await persistMerchandisingToServer(sections);
}

/**
 * Reorders the top-level section display sequence.
 */
export async function reorderSections(orderedSectionIds: string[]): Promise<void> {
  const sections = listMerchandisingSections();
  const idMap = new Map(sections.map((s) => [s.id, s]));

  const reordered: MerchandisingSection[] = [];
  orderedSectionIds.forEach((id, idx) => {
    const s = idMap.get(id);
    if (s) {
      s.sort_order = idx + 1;
      reordered.push(s);
      idMap.delete(id);
    }
  });

  // Append remaining
  let currentOrder = reordered.length + 1;
  idMap.forEach((s) => {
    s.sort_order = currentOrder++;
    reordered.push(s);
  });

  writeLocal(STORAGE_KEYS.SECTIONS, reordered);
  await persistMerchandisingToServer(reordered);
}

async function persistMerchandisingToServer(sections: MerchandisingSection[]) {
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      await fetch('/__dovi_delivery_db__', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homepageSections: sections }),
      });
    } catch {}
  }
}

/**
 * Synchronizes placement map and merchandising sections with shared server store.
 */
export async function syncHomepagePlacementsFromServer(): Promise<Record<string, ProductHomepagePlacement>> {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') {
    return readLocal<Record<string, ProductHomepagePlacement>>(STORAGE_KEYS.PLACEMENTS, DEFAULT_SEEDED_PLACEMENTS);
  }
  try {
    const res = await fetch('/__dovi_delivery_db__', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      const serverPlacements = data?.homepagePlacements;
      if (serverPlacements && typeof serverPlacements === 'object') {
        const local = readLocal<Record<string, ProductHomepagePlacement>>(STORAGE_KEYS.PLACEMENTS, DEFAULT_SEEDED_PLACEMENTS);
        const merged = { ...local, ...serverPlacements };
        writeLocal(STORAGE_KEYS.PLACEMENTS, merged);
      }
      const serverSections = data?.homepageSections;
      if (Array.isArray(serverSections) && serverSections.length > 0) {
        writeLocal(STORAGE_KEYS.SECTIONS, serverSections);
      }
    }
  } catch {}
  return readLocal<Record<string, ProductHomepagePlacement>>(STORAGE_KEYS.PLACEMENTS, DEFAULT_SEEDED_PLACEMENTS);
}

export const serializeProductDescriptionWithHomepage = injectHomepageMetadataIntoDescription;
