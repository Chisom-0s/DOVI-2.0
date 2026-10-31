import type {
  Category,
  Subcategory,
  Product,
  ProductSummary,
  ProductCategoryAssignment,
} from '@/types';

// ============================================================================
// DOVI OFFICIAL 12 MAIN CATEGORIES & 74 INITIAL SUBCATEGORIES (SECTIONS 3 & 5)
// ============================================================================

export interface MainCategorySeed {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  display_order: number;
  subcategories: Array<{
    id: string;
    name: string;
    slug: string;
    display_order: number;
  }>;
}

export const OFFICIAL_12_CATEGORIES_SEED: MainCategorySeed[] = [
  {
    id: 'cat-fashion-clothing',
    name: 'Fashion & Clothing',
    slug: 'fashion-clothing',
    icon: '👗',
    description: "Men's, women's, and traditional apparel, shirts, trousers, dresses, and everyday fashion.",
    display_order: 1,
    subcategories: [
      { id: 'sub-mens-clothing', name: "Men's Clothing", slug: 'mens-clothing', display_order: 1 },
      { id: 'sub-womens-clothing', name: "Women's Clothing", slug: 'womens-clothing', display_order: 2 },
      { id: 'sub-shirts-tops', name: 'Shirts & Tops', slug: 'shirts-tops', display_order: 3 },
      { id: 'sub-trousers-jeans', name: 'Trousers & Jeans', slug: 'trousers-jeans', display_order: 4 },
      { id: 'sub-dresses', name: 'Dresses', slug: 'dresses', display_order: 5 },
      { id: 'sub-skirts', name: 'Skirts', slug: 'skirts', display_order: 6 },
      { id: 'sub-underwear-sleepwear', name: 'Underwear & Sleepwear', slug: 'underwear-sleepwear', display_order: 7 },
      { id: 'sub-traditional-wear', name: 'Traditional Wear', slug: 'traditional-wear', display_order: 8 },
    ],
  },
  {
    id: 'cat-shoes-footwear',
    name: 'Shoes & Footwear',
    slug: 'shoes-footwear',
    icon: '👟',
    description: 'Sneakers, sandals, slippers, formal shoes, heels, and boots for every occasion.',
    display_order: 2,
    subcategories: [
      { id: 'sub-sneakers', name: 'Sneakers', slug: 'sneakers', display_order: 1 },
      { id: 'sub-sandals', name: 'Sandals', slug: 'sandals', display_order: 2 },
      { id: 'sub-slippers', name: 'Slippers', slug: 'slippers', display_order: 3 },
      { id: 'sub-formal-shoes', name: 'Formal Shoes', slug: 'formal-shoes', display_order: 4 },
      { id: 'sub-heels', name: 'Heels', slug: 'heels', display_order: 5 },
      { id: 'sub-boots', name: 'Boots', slug: 'boots', display_order: 6 },
    ],
  },
  {
    id: 'cat-beauty-personal-care',
    name: 'Beauty & Personal Care',
    slug: 'beauty-personal-care',
    icon: '💄',
    description: 'Skincare, makeup, haircare, perfumes, body care, and personal hygiene essentials.',
    display_order: 3,
    subcategories: [
      { id: 'sub-skincare', name: 'Skincare', slug: 'skincare', display_order: 1 },
      { id: 'sub-makeup', name: 'Makeup', slug: 'makeup', display_order: 2 },
      { id: 'sub-haircare', name: 'Haircare', slug: 'haircare', display_order: 3 },
      { id: 'sub-perfumes-fragrances', name: 'Perfumes & Fragrances', slug: 'perfumes-fragrances', display_order: 4 },
      { id: 'sub-body-care', name: 'Body Care', slug: 'body-care', display_order: 5 },
      { id: 'sub-personal-hygiene', name: 'Personal Hygiene', slug: 'personal-hygiene', display_order: 6 },
    ],
  },
  {
    id: 'cat-phones-electronics',
    name: 'Phones & Electronics',
    slug: 'phones-electronics',
    icon: '📱',
    description: 'Smartphones, laptops, tablets, headphones, chargers, and electronic accessories.',
    display_order: 4,
    subcategories: [
      { id: 'sub-smartphones', name: 'Smartphones', slug: 'smartphones', display_order: 1 },
      { id: 'sub-laptops', name: 'Laptops', slug: 'laptops', display_order: 2 },
      { id: 'sub-tablets', name: 'Tablets', slug: 'tablets', display_order: 3 },
      { id: 'sub-headphones-audio', name: 'Headphones & Audio', slug: 'headphones-audio', display_order: 4 },
      { id: 'sub-chargers-cables', name: 'Chargers & Cables', slug: 'chargers-cables', display_order: 5 },
      { id: 'sub-phone-accessories', name: 'Phone Accessories', slug: 'phone-accessories', display_order: 6 },
      { id: 'sub-electronics-accessories', name: 'Electronics Accessories', slug: 'electronics-accessories', display_order: 7 },
    ],
  },
  {
    id: 'cat-home-kitchen',
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    icon: '🍳',
    description: 'Kitchen utensils, cookware, home appliances, cleaning supplies, and storage.',
    display_order: 5,
    subcategories: [
      { id: 'sub-kitchen-utensils', name: 'Kitchen Utensils', slug: 'kitchen-utensils', display_order: 1 },
      { id: 'sub-cookware', name: 'Cookware', slug: 'cookware', display_order: 2 },
      { id: 'sub-home-appliances', name: 'Home Appliances', slug: 'home-appliances', display_order: 3 },
      { id: 'sub-cleaning-supplies', name: 'Cleaning Supplies', slug: 'cleaning-supplies', display_order: 4 },
      { id: 'sub-storage-organization', name: 'Storage & Organization', slug: 'storage-organization', display_order: 5 },
      { id: 'sub-home-essentials', name: 'Home Essentials', slug: 'home-essentials', display_order: 6 },
    ],
  },
  {
    id: 'cat-furniture-home-decor',
    name: 'Furniture & Home Decor',
    slug: 'furniture-home-decor',
    icon: '🛋️',
    description: 'Chairs, tables, beds, sofas, shelves, lighting, and interior home decorations.',
    display_order: 6,
    subcategories: [
      { id: 'sub-chairs', name: 'Chairs', slug: 'chairs', display_order: 1 },
      { id: 'sub-tables', name: 'Tables', slug: 'tables', display_order: 2 },
      { id: 'sub-beds', name: 'Beds', slug: 'beds', display_order: 3 },
      { id: 'sub-sofas', name: 'Sofas', slug: 'sofas', display_order: 4 },
      { id: 'sub-shelves-storage', name: 'Shelves & Storage', slug: 'shelves-storage', display_order: 5 },
      { id: 'sub-home-decorations', name: 'Home Decorations', slug: 'home-decorations', display_order: 6 },
      { id: 'sub-lighting', name: 'Lighting', slug: 'lighting', display_order: 7 },
    ],
  },
  {
    id: 'cat-watches-accessories',
    name: 'Watches & Accessories',
    slug: 'watches-accessories',
    icon: '⌚',
    description: 'Wristwatches, jewelry, sunglasses, belts, wallets, and fashion accessories.',
    display_order: 7,
    subcategories: [
      { id: 'sub-wristwatches', name: 'Wristwatches', slug: 'wristwatches', display_order: 1 },
      { id: 'sub-jewelry', name: 'Jewelry', slug: 'jewelry', display_order: 2 },
      { id: 'sub-sunglasses', name: 'Sunglasses', slug: 'sunglasses', display_order: 3 },
      { id: 'sub-belts', name: 'Belts', slug: 'belts', display_order: 4 },
      { id: 'sub-wallets', name: 'Wallets', slug: 'wallets', display_order: 5 },
      { id: 'sub-fashion-accessories', name: 'Fashion Accessories', slug: 'fashion-accessories', display_order: 6 },
    ],
  },
  {
    id: 'cat-sports-fitness',
    name: 'Sports & Fitness',
    slug: 'sports-fitness',
    icon: '🏋️',
    description: 'Sportswear, gym equipment, fitness accessories, sports shoes, and outdoor gear.',
    display_order: 8,
    subcategories: [
      { id: 'sub-sportswear', name: 'Sportswear', slug: 'sportswear', display_order: 1 },
      { id: 'sub-gym-equipment', name: 'Gym Equipment', slug: 'gym-equipment', display_order: 2 },
      { id: 'sub-fitness-accessories', name: 'Fitness Accessories', slug: 'fitness-accessories', display_order: 3 },
      { id: 'sub-sports-shoes', name: 'Sports Shoes', slug: 'sports-shoes', display_order: 4 },
      { id: 'sub-outdoor-equipment', name: 'Outdoor Equipment', slug: 'outdoor-equipment', display_order: 5 },
    ],
  },
  {
    id: 'cat-automotive-motor',
    name: 'Automotive & Motor Accessories',
    slug: 'automotive-motor-accessories',
    icon: '🛞',
    description: 'Car accessories, motorcycle accessories, spare parts, maintenance gear, and helmets.',
    display_order: 9,
    subcategories: [
      { id: 'sub-car-accessories', name: 'Car Accessories', slug: 'car-accessories', display_order: 1 },
      { id: 'sub-motorcycle-accessories', name: 'Motorcycle Accessories', slug: 'motorcycle-accessories', display_order: 2 },
      { id: 'sub-motor-spare-parts', name: 'Motor Spare Parts', slug: 'motor-spare-parts', display_order: 3 },
      { id: 'sub-vehicle-maintenance-accessories', name: 'Vehicle Maintenance Accessories', slug: 'vehicle-maintenance-accessories', display_order: 4 },
      { id: 'sub-helmets-safety-gear', name: 'Helmets & Safety Gear', slug: 'helmets-safety-gear', display_order: 5 },
    ],
  },
  {
    id: 'cat-books-stationery',
    name: 'Books & Stationery',
    slug: 'books-stationery',
    icon: '📚',
    description: 'Books, notebooks, pens, writing materials, school supplies, and office stationery.',
    display_order: 10,
    subcategories: [
      { id: 'sub-books', name: 'Books', slug: 'books', display_order: 1 },
      { id: 'sub-notebooks', name: 'Notebooks', slug: 'notebooks', display_order: 2 },
      { id: 'sub-pens-writing-materials', name: 'Pens & Writing Materials', slug: 'pens-writing-materials', display_order: 3 },
      { id: 'sub-school-supplies', name: 'School Supplies', slug: 'school-supplies', display_order: 4 },
      { id: 'sub-office-supplies', name: 'Office Supplies', slug: 'office-supplies', display_order: 5 },
    ],
  },
  {
    id: 'cat-baby-kids',
    name: 'Baby & Kids',
    slug: 'baby-kids',
    icon: '🧸',
    description: 'Baby clothing, kids clothing, toys, baby care, feeding accessories, and essentials.',
    display_order: 11,
    subcategories: [
      { id: 'sub-baby-clothing', name: 'Baby Clothing', slug: 'baby-clothing', display_order: 1 },
      { id: 'sub-kids-clothing', name: 'Kids Clothing', slug: 'kids-clothing', display_order: 2 },
      { id: 'sub-toys', name: 'Toys', slug: 'toys', display_order: 3 },
      { id: 'sub-baby-care', name: 'Baby Care', slug: 'baby-care', display_order: 4 },
      { id: 'sub-feeding-accessories', name: 'Feeding Accessories', slug: 'feeding-accessories', display_order: 5 },
      { id: 'sub-kids-accessories', name: 'Kids Accessories', slug: 'kids-accessories', display_order: 6 },
    ],
  },
  {
    id: 'cat-travel-bags',
    name: 'Travel & Bags',
    slug: 'travel-bags',
    icon: '🧳',
    description: 'Backpacks, travel bags, luggage, handbags, school bags, and travel accessories.',
    display_order: 12,
    subcategories: [
      { id: 'sub-backpacks', name: 'Backpacks', slug: 'backpacks', display_order: 1 },
      { id: 'sub-travel-bags', name: 'Travel Bags', slug: 'travel-bags-sub', display_order: 2 },
      { id: 'sub-luggage', name: 'Luggage', slug: 'luggage', display_order: 3 },
      { id: 'sub-handbags', name: 'Handbags', slug: 'handbags', display_order: 4 },
      { id: 'sub-school-bags', name: 'School Bags', slug: 'school-bags', display_order: 5 },
      { id: 'sub-travel-accessories', name: 'Travel Accessories', slug: 'travel-accessories', display_order: 6 },
    ],
  },
];

// Legacy category slug/name/ID -> New Main Category & optional default Subcategory mapping
export const LEGACY_CATEGORY_MAP: Record<
  string,
  { categoryId: string; categorySlug: string; subcategoryId?: string }
> = {
  // Fashion & Clothing
  fashion: { categoryId: 'cat-fashion-clothing', categorySlug: 'fashion-clothing' },
  'fashion & apparel': { categoryId: 'cat-fashion-clothing', categorySlug: 'fashion-clothing' },
  'fashion-apparel': { categoryId: 'cat-fashion-clothing', categorySlug: 'fashion-clothing' },
  'fashion-clothing': { categoryId: 'cat-fashion-clothing', categorySlug: 'fashion-clothing' },
  clothing: { categoryId: 'cat-fashion-clothing', categorySlug: 'fashion-clothing' },
  apparel: { categoryId: 'cat-fashion-clothing', categorySlug: 'fashion-clothing' },

  // Shoes & Footwear
  shoes: { categoryId: 'cat-shoes-footwear', categorySlug: 'shoes-footwear' },
  'shoes-footwear': { categoryId: 'cat-shoes-footwear', categorySlug: 'shoes-footwear' },
  footwear: { categoryId: 'cat-shoes-footwear', categorySlug: 'shoes-footwear' },

  // Beauty & Personal Care
  'beauty-health': { categoryId: 'cat-beauty-personal-care', categorySlug: 'beauty-personal-care' },
  'beauty & health': { categoryId: 'cat-beauty-personal-care', categorySlug: 'beauty-personal-care' },
  'beauty-personal-care': { categoryId: 'cat-beauty-personal-care', categorySlug: 'beauty-personal-care' },
  beauty: { categoryId: 'cat-beauty-personal-care', categorySlug: 'beauty-personal-care' },

  // Phones & Electronics
  electronics: { categoryId: 'cat-phones-electronics', categorySlug: 'phones-electronics', subcategoryId: 'sub-electronics-accessories' },
  gadgets: { categoryId: 'cat-phones-electronics', categorySlug: 'phones-electronics', subcategoryId: 'sub-electronics-accessories' },
  'phones-tablets': { categoryId: 'cat-phones-electronics', categorySlug: 'phones-electronics', subcategoryId: 'sub-smartphones' },
  'phones & tablets': { categoryId: 'cat-phones-electronics', categorySlug: 'phones-electronics', subcategoryId: 'sub-smartphones' },
  'cat-phones': { categoryId: 'cat-phones-electronics', categorySlug: 'phones-electronics', subcategoryId: 'sub-smartphones' },
  computers: { categoryId: 'cat-phones-electronics', categorySlug: 'phones-electronics', subcategoryId: 'sub-laptops' },
  'cat-computers': { categoryId: 'cat-phones-electronics', categorySlug: 'phones-electronics', subcategoryId: 'sub-laptops' },
  'audio-video': { categoryId: 'cat-phones-electronics', categorySlug: 'phones-electronics', subcategoryId: 'sub-headphones-audio' },
  'audio & video': { categoryId: 'cat-phones-electronics', categorySlug: 'phones-electronics', subcategoryId: 'sub-headphones-audio' },
  'audio & music': { categoryId: 'cat-phones-electronics', categorySlug: 'phones-electronics', subcategoryId: 'sub-headphones-audio' },
  'cat-audio': { categoryId: 'cat-phones-electronics', categorySlug: 'phones-electronics', subcategoryId: 'sub-headphones-audio' },
  gaming: { categoryId: 'cat-phones-electronics', categorySlug: 'phones-electronics', subcategoryId: 'sub-electronics-accessories' },
  'cat-gaming': { categoryId: 'cat-phones-electronics', categorySlug: 'phones-electronics', subcategoryId: 'sub-electronics-accessories' },
  'phones-electronics': { categoryId: 'cat-phones-electronics', categorySlug: 'phones-electronics' },

  // Home & Kitchen
  'home-kitchen': { categoryId: 'cat-home-kitchen', categorySlug: 'home-kitchen' },
  'home & kitchen': { categoryId: 'cat-home-kitchen', categorySlug: 'home-kitchen' },
  'smart-home': { categoryId: 'cat-home-kitchen', categorySlug: 'home-kitchen', subcategoryId: 'sub-home-appliances' },
  'smart home': { categoryId: 'cat-home-kitchen', categorySlug: 'home-kitchen', subcategoryId: 'sub-home-appliances' },

  // Furniture & Home Decor
  'furniture-home-decor': { categoryId: 'cat-furniture-home-decor', categorySlug: 'furniture-home-decor' },
  furniture: { categoryId: 'cat-furniture-home-decor', categorySlug: 'furniture-home-decor' },

  // Watches & Accessories
  'watches-accessories': { categoryId: 'cat-watches-accessories', categorySlug: 'watches-accessories' },
  watches: { categoryId: 'cat-watches-accessories', categorySlug: 'watches-accessories', subcategoryId: 'sub-wristwatches' },
  accessories: { categoryId: 'cat-watches-accessories', categorySlug: 'watches-accessories', subcategoryId: 'sub-fashion-accessories' },

  // Sports & Fitness
  'sports-outdoors': { categoryId: 'cat-sports-fitness', categorySlug: 'sports-fitness' },
  'sports & outdoors': { categoryId: 'cat-sports-fitness', categorySlug: 'sports-fitness' },
  'sports-fitness': { categoryId: 'cat-sports-fitness', categorySlug: 'sports-fitness' },

  // Automotive & Motor Accessories
  automotive: { categoryId: 'cat-automotive-motor', categorySlug: 'automotive-motor-accessories', subcategoryId: 'sub-car-accessories' },
  'automotive-motor-accessories': { categoryId: 'cat-automotive-motor', categorySlug: 'automotive-motor-accessories' },
  'auto-cars': { categoryId: 'cat-automotive-motor', categorySlug: 'automotive-motor-accessories', subcategoryId: 'sub-car-accessories' },
  'cat-auto': { categoryId: 'cat-automotive-motor', categorySlug: 'automotive-motor-accessories', subcategoryId: 'sub-car-accessories' },

  // Books & Stationery
  books: { categoryId: 'cat-books-stationery', categorySlug: 'books-stationery', subcategoryId: 'sub-books' },
  'books & media': { categoryId: 'cat-books-stationery', categorySlug: 'books-stationery', subcategoryId: 'sub-books' },
  'books-stationery': { categoryId: 'cat-books-stationery', categorySlug: 'books-stationery' },

  // Baby & Kids
  'toys-games': { categoryId: 'cat-baby-kids', categorySlug: 'baby-kids', subcategoryId: 'sub-toys' },
  'toys & games': { categoryId: 'cat-baby-kids', categorySlug: 'baby-kids', subcategoryId: 'sub-toys' },
  'baby-kids': { categoryId: 'cat-baby-kids', categorySlug: 'baby-kids' },

  // Travel & Bags
  'travel-bags': { categoryId: 'cat-travel-bags', categorySlug: 'travel-bags' },
  bags: { categoryId: 'cat-travel-bags', categorySlug: 'travel-bags' },
};

const STORAGE_KEYS = {
  CATEGORIES: 'dovi_categories_v2_store',
  PRODUCT_CATEGORY_ASSIGNMENTS: 'dovi_product_category_assignments_v2',
};

export interface CategoryAdminActor {
  id?: string | null;
  email: string;
  name?: string | null;
  role?: string | null;
}

export function assertAuthorizedCategoryAdmin(actor?: CategoryAdminActor | null): void {
  if (!actor || !actor.email) {
    const err = new Error('Authentication required: Only authorized administrators can manage categories and subcategories.');
    (err as any).status = 401;
    throw err;
  }
  if (actor.role && actor.role !== 'ADMIN') {
    const err = new Error('403 FORBIDDEN: Only authorized administrators with ADMIN role can create, edit, reorder, activate, deactivate, or delete categories and subcategories.');
    (err as any).status = 403;
    throw err;
  }
}

export function slugifyCategoryName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildSeedCategoryTree(): Category[] {
  const now = '2026-01-01T00:00:00.000Z';
  return OFFICIAL_12_CATEGORIES_SEED.map((main) => {
    const children: Category[] = main.subcategories.map((sub) => ({
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      description: null,
      icon: null,
      icon_url: null,
      parent: main.id,
      display_order: sub.display_order,
      is_active: true,
      children: [],
      product_count: 0,
      updated_at: now,
    }));

    const subcategories: Subcategory[] = children.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parent_id: main.id,
      parent_name: main.name,
      parent_slug: main.slug,
      description: c.description || null,
      display_order: c.display_order || 1,
      is_active: c.is_active !== false,
      product_count: 0,
      updated_at: now,
    }));

    return {
      id: main.id,
      name: main.name,
      slug: main.slug,
      description: main.description,
      icon: main.icon,
      icon_url: null,
      parent: null,
      display_order: main.display_order,
      is_active: true,
      children,
      subcategories,
      subcategory_count: children.length,
      product_count: 0,
      updated_at: now,
    };
  });
}

function readLocal<T>(key: string, fallback: T): T {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw) as T;
      }
    }
  } catch {}
  return fallback;
}

function writeLocal<T>(key: string, value: T): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent('dovi-categories-updated'));
    }
  } catch {}
}

async function pushCategoryStoreToServer(payload: {
  categories?: Category[];
  productCategoryAssignments?: Record<string, ProductCategoryAssignment>;
}): Promise<void> {
  try {
    if (typeof fetch !== 'undefined') {
      await fetch('/__dovi_delivery_db__', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
  } catch {}
}

export async function syncCategoriesFromServer(): Promise<void> {
  try {
    if (typeof fetch === 'undefined') return;
    const res = await fetch('/__dovi_delivery_db__', { method: 'GET' });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data?.categories) && data.categories.length > 0) {
      writeLocal(STORAGE_KEYS.CATEGORIES, data.categories);
    }
    if (data?.productCategoryAssignments && typeof data.productCategoryAssignments === 'object') {
      const current = readLocal<Record<string, ProductCategoryAssignment>>(
        STORAGE_KEYS.PRODUCT_CATEGORY_ASSIGNMENTS,
        {}
      );
      writeLocal(STORAGE_KEYS.PRODUCT_CATEGORY_ASSIGNMENTS, {
        ...current,
        ...data.productCategoryAssignments,
      });
    }
  } catch {}
}

/**
 * Ensures the 12 official main categories and their subcategories are initialized in storage.
 * Preserves any admin customizations (added/edited/reordered/deactivated subcategories).
 */
export function ensureCategoriesInitialized(): Category[] {
  const existing = readLocal<Category[] | null>(STORAGE_KEYS.CATEGORIES, null);
  if (existing && Array.isArray(existing) && existing.length >= 12) {
    // Verify it contains the official 12 structure
    const hasOfficial = existing.some((c) => c.slug === 'fashion-clothing' || c.id === 'cat-fashion-clothing');
    if (hasOfficial) {
      return normalizeCategoryTree(existing);
    }
  }

  const seeded = buildSeedCategoryTree();
  writeLocal(STORAGE_KEYS.CATEGORIES, seeded);
  void pushCategoryStoreToServer({ categories: seeded });
  return seeded;
}

function normalizeCategoryTree(rawTree: Category[]): Category[] {
  const assignments = readLocal<Record<string, ProductCategoryAssignment>>(
    STORAGE_KEYS.PRODUCT_CATEGORY_ASSIGNMENTS,
    {}
  );
  const assignmentList = Object.values(assignments);

  const sortedMains = [...rawTree]
    .filter((c) => !c.parent)
    .sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99));

  return sortedMains.map((main, idx) => {
    const rawSubs: any[] = Array.isArray(main.children) && main.children.length > 0
      ? main.children
      : Array.isArray(main.subcategories)
      ? main.subcategories
      : [];

    const sortedSubs = [...rawSubs].sort(
      (a, b) => (a.display_order ?? 99) - (b.display_order ?? 99)
    );

    const children: Category[] = sortedSubs.map((sub, sIdx) => {
      const subCount = assignmentList.filter(
        (a) => a.subcategory_id === sub.id || a.subcategory_slug === sub.slug
      ).length;
      return {
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        description: sub.description ?? null,
        icon: sub.icon ?? null,
        icon_url: sub.icon_url ?? null,
        parent: main.id,
        display_order: sub.display_order ?? sIdx + 1,
        is_active: sub.is_active !== false,
        children: [],
        product_count: Math.max(Number(sub.product_count || 0), subCount),
        updated_at: sub.updated_at || main.updated_at,
      };
    });

    const subcategories: Subcategory[] = children.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parent_id: main.id,
      parent_name: main.name,
      parent_slug: main.slug,
      description: c.description ?? null,
      display_order: c.display_order ?? 1,
      is_active: c.is_active !== false,
      product_count: c.product_count,
      updated_at: c.updated_at,
    }));

    const directMainCount = assignmentList.filter(
      (a) => a.category_id === main.id || a.category_slug === main.slug
    ).length;
    const sumSubCounts = children.reduce((sum, c) => sum + (c.product_count || 0), 0);

    return {
      ...main,
      parent: null,
      display_order: main.display_order ?? idx + 1,
      is_active: main.is_active !== false,
      children,
      subcategories,
      subcategory_count: children.length,
      product_count: Math.max(Number(main.product_count || 0), directMainCount, sumSubCounts),
    };
  });
}

// ============================================================================
// QUERYING CATEGORIES & SUBCATEGORIES
// ============================================================================

export function listMainCategories(options?: {
  includeInactive?: boolean;
  products?: Array<Partial<Product & ProductSummary>>;
}): Category[] {
  const includeInactive = options?.includeInactive ?? false;
  const tree = ensureCategoriesInitialized();

  // If a live products list is supplied, compute exact real-time product counts per category & subcategory
  let productCountsByCat = new Map<string, number>();
  let productCountsBySub = new Map<string, number>();

  if (Array.isArray(options?.products) && options!.products.length > 0) {
    for (const rawProd of options!.products) {
      const resolved = resolveProductCategoryAndSubcategory(rawProd);
      if (resolved.category_id) {
        productCountsByCat.set(
          resolved.category_id,
          (productCountsByCat.get(resolved.category_id) || 0) + 1
        );
      }
      if (resolved.subcategory_id) {
        productCountsBySub.set(
          resolved.subcategory_id,
          (productCountsBySub.get(resolved.subcategory_id) || 0) + 1
        );
      }
    }
  }

  return tree
    .filter((cat) => includeInactive || cat.is_active !== false)
    .map((cat) => {
      const filteredChildren = (cat.children || [])
        .filter((sub) => includeInactive || sub.is_active !== false)
        .map((sub) => ({
          ...sub,
          product_count: productCountsBySub.has(sub.id)
            ? productCountsBySub.get(sub.id)!
            : sub.product_count,
        }));

      const filteredSubcategories: Subcategory[] = filteredChildren.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        parent_id: cat.id,
        parent_name: cat.name,
        parent_slug: cat.slug,
        description: c.description ?? null,
        display_order: c.display_order ?? 1,
        is_active: c.is_active !== false,
        product_count: c.product_count,
        updated_at: c.updated_at,
      }));

      const totalCatProducts = productCountsByCat.has(cat.id)
        ? productCountsByCat.get(cat.id)!
        : cat.product_count;

      return {
        ...cat,
        children: filteredChildren,
        subcategories: filteredSubcategories,
        subcategory_count: filteredChildren.length,
        product_count: totalCatProducts,
      };
    });
}

export function findMainCategory(idOrSlugOrName?: string | null): Category | null {
  if (!idOrSlugOrName) return null;
  const key = String(idOrSlugOrName).trim().toLowerCase();
  if (!key) return null;

  const tree = ensureCategoriesInitialized();

  // 1. Direct match by id, slug, or exact name
  const direct = tree.find(
    (c) =>
      c.id.toLowerCase() === key ||
      c.slug.toLowerCase() === key ||
      c.name.trim().toLowerCase() === key
  );
  if (direct) return direct;

  // 2. Match via legacy category alias map
  const legacy = LEGACY_CATEGORY_MAP[key];
  if (legacy) {
    return tree.find((c) => c.id === legacy.categoryId || c.slug === legacy.categorySlug) || null;
  }

  return null;
}

export function findSubcategory(
  idOrSlugOrName?: string | null,
  parentCategoryIdOrSlug?: string | null
): { subcategory: Subcategory; parentCategory: Category } | null {
  if (!idOrSlugOrName) return null;
  const key = String(idOrSlugOrName).trim().toLowerCase();
  if (!key) return null;

  const tree = ensureCategoriesInitialized();
  const scopedCategories = parentCategoryIdOrSlug
    ? tree.filter((c) => {
        const pKey = parentCategoryIdOrSlug.trim().toLowerCase();
        return c.id.toLowerCase() === pKey || c.slug.toLowerCase() === pKey || c.name.toLowerCase() === pKey;
      })
    : tree;

  for (const cat of scopedCategories) {
    const subs = cat.subcategories || [];
    const match = subs.find(
      (s) =>
        s.id.toLowerCase() === key ||
        s.slug.toLowerCase() === key ||
        s.name.trim().toLowerCase() === key
    );
    if (match) {
      return { subcategory: match, parentCategory: cat };
    }
  }
  return null;
}

/**
 * Returns only the subcategories belonging to the specified main category (Section 6).
 */
export function getSubcategoriesForCategory(
  categoryIdOrSlug: string | null | undefined,
  options?: { includeInactive?: boolean }
): Subcategory[] {
  const main = findMainCategory(categoryIdOrSlug);
  if (!main) return [];
  const includeInactive = options?.includeInactive ?? false;
  return (main.subcategories || [])
    .filter((sub) => includeInactive || sub.is_active !== false)
    .sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99));
}

// ============================================================================
// PRODUCT CATEGORY & SUBCATEGORY MAPPING, MIGRATION & VALIDATION (SECTIONS 3, 6, 10)
// ============================================================================

const CATEGORY_META_REGEX = /<!--\s*DOVI_CATEGORY:\s*([\s\S]*?)\s*-->/g;

export function serializeProductDescriptionWithCategory(
  cleanDescription: string,
  meta: {
    category_id: string;
    category_name: string;
    category_slug: string;
    subcategory_id?: string | null;
    subcategory_name?: string | null;
    subcategory_slug?: string | null;
  }
): string {
  const stripped = stripCategoryMetadataFromDescription(cleanDescription);
  const payload = {
    category_id: meta.category_id,
    category_name: meta.category_name,
    category_slug: meta.category_slug,
    subcategory_id: meta.subcategory_id || null,
    subcategory_name: meta.subcategory_name || null,
    subcategory_slug: meta.subcategory_slug || null,
  };
  return `${stripped}\n\n<!-- DOVI_CATEGORY: ${JSON.stringify(payload)} -->`.trim();
}

export function stripCategoryMetadataFromDescription(description?: string | null): string {
  if (!description) return '';
  return description.replace(CATEGORY_META_REGEX, '').trim();
}

export function parseCategoryMetadataFromDescription(
  description?: string | null
): Partial<ProductCategoryAssignment> | null {
  if (!description) return null;
  const match = /<!--\s*DOVI_CATEGORY:\s*([\s\S]*?)\s*-->/.exec(description);
  if (!match || !match[1]) return null;
  try {
    const parsed = JSON.parse(match[1]);
    if (parsed && typeof parsed === 'object' && parsed.category_id) {
      return parsed;
    }
  } catch {}
  return null;
}

/**
 * Infers a confident mapping to one of the 12 main categories + subcategory from product name/description
 * when migrating legacy products. Returns null if no confident match exists so the product can be
 * preserved and flagged for admin review (`needs_category_review: true`).
 */
function inferCategoryFromKeywords(
  name?: string | null,
  description?: string | null
): { categoryId: string; subcategoryId: string | null } | null {
  const text = `${name || ''} ${stripCategoryMetadataFromDescription(description)}`.toLowerCase();
  if (!text.trim()) return null;

  if (/\b(sneaker|sandal|slipper|heels|boots|loafer|footwear|shoe)\b/.test(text)) {
    const sub = /\bsneaker\b/.test(text)
      ? 'sub-sneakers'
      : /\bsandal\b/.test(text)
      ? 'sub-sandals'
      : /\bslipper\b/.test(text)
      ? 'sub-slippers'
      : /\bheel\b/.test(text)
      ? 'sub-heels'
      : /\bboot\b/.test(text)
      ? 'sub-boots'
      : 'sub-formal-shoes';
    return { categoryId: 'cat-shoes-footwear', subcategoryId: sub };
  }

  if (/\b(wristwatch|rolex|casio|chronograph|necklace|jewelry|sunglass|wallet|belt)\b/.test(text)) {
    const sub = /\b(watch|wristwatch|chronograph|rolex|casio)\b/.test(text)
      ? 'sub-wristwatches'
      : /\b(jewelry|necklace|ring|bracelet)\b/.test(text)
      ? 'sub-jewelry'
      : /\bsunglass\b/.test(text)
      ? 'sub-sunglasses'
      : /\bbelt\b/.test(text)
      ? 'sub-belts'
      : /\bwallet\b/.test(text)
      ? 'sub-wallets'
      : 'sub-fashion-accessories';
    return { categoryId: 'cat-watches-accessories', subcategoryId: sub };
  }

  if (/\b(shirt|trouser|jeans|dress|skirt|agbada|kaftan|ankara|underwear|sleepwear|blouse|hoodie|jacket|suit)\b/.test(text)) {
    const sub = /\b(shirt|top|blouse|polo|t-shirt)\b/.test(text)
      ? 'sub-shirts-tops'
      : /\b(trouser|jean|chino|pant)\b/.test(text)
      ? 'sub-trousers-jeans'
      : /\bdress\b/.test(text)
      ? 'sub-dresses'
      : /\bskirt\b/.test(text)
      ? 'sub-skirts'
      : /\b(agbada|kaftan|ankara|traditional|senator)\b/.test(text)
      ? 'sub-traditional-wear'
      : 'sub-mens-clothing';
    return { categoryId: 'cat-fashion-clothing', subcategoryId: sub };
  }

  if (/\b(iphone|samsung|smartphone|laptop|macbook|tablet|ipad|headphone|earbud|airpod|charger|powerbank|television|tv|speaker)\b/.test(text)) {
    const sub = /\b(iphone|samsung|smartphone|galaxy|redmi|infinix|tecno)\b/.test(text)
      ? 'sub-smartphones'
      : /\b(laptop|macbook|notebook pc|thinkpad|hp|dell)\b/.test(text)
      ? 'sub-laptops'
      : /\b(tablet|ipad)\b/.test(text)
      ? 'sub-tablets'
      : /\b(headphone|earbud|airpod|speaker|audio|soundbar)\b/.test(text)
      ? 'sub-headphones-audio'
      : /\b(charger|cable|adapter)\b/.test(text)
      ? 'sub-chargers-cables'
      : 'sub-electronics-accessories';
    return { categoryId: 'cat-phones-electronics', subcategoryId: sub };
  }

  if (/\b(chair|sofa|couch|mattress|bed|wardrobe|bookshelf|chandelier|dining table|office desk)\b/.test(text)) {
    const sub = /\bchair\b/.test(text)
      ? 'sub-chairs'
      : /\b(table|desk)\b/.test(text)
      ? 'sub-tables'
      : /\b(bed|mattress)\b/.test(text)
      ? 'sub-beds'
      : /\b(sofa|couch)\b/.test(text)
      ? 'sub-sofas'
      : /\b(lamp|chandelier|lighting)\b/.test(text)
      ? 'sub-lighting'
      : 'sub-home-decorations';
    return { categoryId: 'cat-furniture-home-decor', subcategoryId: sub };
  }

  if (/\b(blender|microwave|air fryer|fridge|refrigerator|fan|standing fan|pot|pan|cookware|utensil|kettle)\b/.test(text)) {
    const sub = /\b(pot|pan|cookware|frying)\b/.test(text)
      ? 'sub-cookware'
      : /\b(utensil|cutlery|knife|spoon)\b/.test(text)
      ? 'sub-kitchen-utensils'
      : 'sub-home-appliances';
    return { categoryId: 'cat-home-kitchen', subcategoryId: sub };
  }

  if (/\b(perfume|fragrance|skincare|lotion|serum|makeup|lipstick|shampoo|wig|haircare)\b/.test(text)) {
    const sub = /\b(perfume|fragrance|cologne)\b/.test(text)
      ? 'sub-perfumes-fragrances'
      : /\b(makeup|lipstick|foundation)\b/.test(text)
      ? 'sub-makeup'
      : /\b(hair|wig|shampoo)\b/.test(text)
      ? 'sub-haircare'
      : 'sub-skincare';
    return { categoryId: 'cat-beauty-personal-care', subcategoryId: sub };
  }

  if (/\b(dumbbell|treadmill|yoga|gym|fitness|jersey|football)\b/.test(text)) {
    return { categoryId: 'cat-sports-fitness', subcategoryId: 'sub-gym-equipment' };
  }

  if (/\b(helmet|car battery|tyre|tire|motor oil|dashcam|wiper|motorcycle)\b/.test(text)) {
    return { categoryId: 'cat-automotive-motor', subcategoryId: 'sub-car-accessories' };
  }

  if (/\b(novel|textbook|stationery|notebook|ballpoint|pen)\b/.test(text)) {
    return { categoryId: 'cat-books-stationery', subcategoryId: 'sub-books' };
  }

  if (/\b(diaper|stroller|baby|toddler|toy|lego)\b/.test(text)) {
    return { categoryId: 'cat-baby-kids', subcategoryId: 'sub-toys' };
  }

  if (/\b(backpack|suitcase|luggage|handbag|duffel|school bag)\b/.test(text)) {
    const sub = /\bbackpack\b/.test(text)
      ? 'sub-backpacks'
      : /\bhandbag\b/.test(text)
      ? 'sub-handbags'
      : /\b(luggage|suitcase)\b/.test(text)
      ? 'sub-luggage'
      : 'sub-travel-bags';
    return { categoryId: 'cat-travel-bags', subcategoryId: sub };
  }

  return null;
}

/**
 * Resolves a product's Main Category and Subcategory using:
 * 1. Explicit stored ProductCategoryAssignment
 * 2. Embedded `<!-- DOVI_CATEGORY: ... -->` metadata in product description
 * 3. Direct or legacy category mapping (Section 3)
 * 4. Keyword inference on product name/description
 * If a legacy product cannot be confidently mapped, preserves the product record and flags
 * `needs_category_review: true` for the administrator.
 */
export function resolveProductCategoryAndSubcategory(
  product: Partial<Product & ProductSummary> | Record<string, any> | null | undefined
): ProductCategoryAssignment {
  const now = new Date().toISOString();
  if (!product) {
    const fallbackMain = ensureCategoriesInitialized()[0];
    return {
      product_id: 'unknown',
      category_id: fallbackMain.id,
      category_name: fallbackMain.name,
      category_slug: fallbackMain.slug,
      subcategory_id: null,
      subcategory_name: null,
      subcategory_slug: null,
      needs_category_review: true,
      updated_at: now,
    };
  }

  const productId = String(product.id || 'unknown');

  // 1. Check explicit assignment in store
  const storedMap = readLocal<Record<string, ProductCategoryAssignment>>(
    STORAGE_KEYS.PRODUCT_CATEGORY_ASSIGNMENTS,
    {}
  );
  if (productId !== 'unknown' && storedMap[productId]) {
    const stored = storedMap[productId];
    const mainCat = findMainCategory(stored.category_id || stored.category_slug);
    const subMatch = stored.subcategory_id
      ? findSubcategory(stored.subcategory_id, mainCat?.id)
      : null;
    if (mainCat) {
      return {
        ...stored,
        category_id: mainCat.id,
        category_name: mainCat.name,
        category_slug: mainCat.slug,
        subcategory_id: subMatch ? subMatch.subcategory.id : null,
        subcategory_name: subMatch ? subMatch.subcategory.name : null,
        subcategory_slug: subMatch ? subMatch.subcategory.slug : null,
        needs_category_review: Boolean(stored.needs_category_review),
      };
    }
  }

  // 2. Check embedded description metadata
  const fromDesc = parseCategoryMetadataFromDescription(product.description);
  if (fromDesc && fromDesc.category_id) {
    const mainCat = findMainCategory(fromDesc.category_id || fromDesc.category_slug);
    if (mainCat) {
      const subMatch = fromDesc.subcategory_id
        ? findSubcategory(fromDesc.subcategory_id, mainCat.id)
        : null;
      return {
        product_id: productId,
        category_id: mainCat.id,
        category_name: mainCat.name,
        category_slug: mainCat.slug,
        subcategory_id: subMatch ? subMatch.subcategory.id : null,
        subcategory_name: subMatch ? subMatch.subcategory.name : null,
        subcategory_slug: subMatch ? subMatch.subcategory.slug : null,
        needs_category_review: false,
        updated_at: now,
      };
    }
  }

  // 3. Check product's direct properties (subcategory_id / category_id / category object / category_name)
  const rawCategoryObj = typeof product.category === 'object' && product.category ? product.category : null;
  const rawCategoryKey =
    product.category_id ||
    rawCategoryObj?.slug ||
    rawCategoryObj?.id ||
    rawCategoryObj?.name ||
    (product as any).category_name ||
    (typeof product.category === 'string' ? product.category : '');

  const rawSubKey =
    product.subcategory_id ||
    product.subcategory_slug ||
    product.subcategory_name ||
    (typeof product.subcategory === 'object' && product.subcategory
      ? product.subcategory.id || product.subcategory.slug || product.subcategory.name
      : typeof product.subcategory === 'string'
      ? product.subcategory
      : '');

  // Check if rawCategoryKey is actually a subcategory (in case backend stored subcategory in product.category)
  if (rawCategoryKey) {
    const asSub = findSubcategory(rawCategoryKey);
    if (asSub) {
      return {
        product_id: productId,
        category_id: asSub.parentCategory.id,
        category_name: asSub.parentCategory.name,
        category_slug: asSub.parentCategory.slug,
        subcategory_id: asSub.subcategory.id,
        subcategory_name: asSub.subcategory.name,
        subcategory_slug: asSub.subcategory.slug,
        needs_category_review: false,
        updated_at: now,
      };
    }
  }

  const matchedMain = findMainCategory(rawCategoryKey);
  const inferred = inferCategoryFromKeywords(product.name, product.description);

  if (matchedMain) {
    let resolvedSub: Subcategory | null = null;
    if (rawSubKey) {
      const subHit = findSubcategory(rawSubKey, matchedMain.id);
      if (subHit) resolvedSub = subHit.subcategory;
    }
    if (!resolvedSub) {
      const legacyEntry = LEGACY_CATEGORY_MAP[String(rawCategoryKey).trim().toLowerCase()];
      if (legacyEntry?.subcategoryId) {
        const subHit = findSubcategory(legacyEntry.subcategoryId, matchedMain.id);
        if (subHit) resolvedSub = subHit.subcategory;
      }
    }
    if (!resolvedSub && inferred && inferred.categoryId === matchedMain.id && inferred.subcategoryId) {
      const subHit = findSubcategory(inferred.subcategoryId, matchedMain.id);
      if (subHit) resolvedSub = subHit.subcategory;
    }

    return {
      product_id: productId,
      category_id: matchedMain.id,
      category_name: matchedMain.name,
      category_slug: matchedMain.slug,
      subcategory_id: resolvedSub?.id || null,
      subcategory_name: resolvedSub?.name || null,
      subcategory_slug: resolvedSub?.slug || null,
      needs_category_review: false,
      legacy_category_name:
        rawCategoryObj?.name && rawCategoryObj.name !== matchedMain.name ? rawCategoryObj.name : null,
      updated_at: now,
    };
  }

  // 4. Try keyword inference when rawCategoryKey is 'General', 'cat-real', 'groceries', or unrecognized
  if (inferred) {
    const inferredMain = findMainCategory(inferred.categoryId)!;
    const inferredSub = inferred.subcategoryId
      ? findSubcategory(inferred.subcategoryId, inferredMain.id)?.subcategory || null
      : null;
    return {
      product_id: productId,
      category_id: inferredMain.id,
      category_name: inferredMain.name,
      category_slug: inferredMain.slug,
      subcategory_id: inferredSub?.id || null,
      subcategory_name: inferredSub?.name || null,
      subcategory_slug: inferredSub?.slug || null,
      needs_category_review: false,
      legacy_category_name: String(rawCategoryKey || 'Unclassified'),
      updated_at: now,
    };
  }

  // 5. Unmappable legacy product -> Preserve record intact and flag `needs_category_review: true` (Section 3 & 10)
  const fallbackMain = findMainCategory('cat-phones-electronics') || ensureCategoriesInitialized()[0];
  return {
    product_id: productId,
    category_id: fallbackMain.id,
    category_name: fallbackMain.name,
    category_slug: fallbackMain.slug,
    subcategory_id: null,
    subcategory_name: null,
    subcategory_slug: null,
    needs_category_review: true,
    legacy_category_name: String(rawCategoryKey || 'Unmapped Legacy Category'),
    updated_at: now,
  };
}

export function enrichProductWithCategory<T extends Record<string, any>>(product: T): T {
  if (!product) return product;
  const resolved = resolveProductCategoryAndSubcategory(product);
  return {
    ...product,
    category: {
      id: resolved.category_id,
      name: resolved.category_name,
      slug: resolved.category_slug,
      icon_url: null,
    },
    category_id: resolved.category_id,
    category_name: resolved.category_name,
    category_slug: resolved.category_slug,
    subcategory: resolved.subcategory_id
      ? {
          id: resolved.subcategory_id,
          name: resolved.subcategory_name || '',
          slug: resolved.subcategory_slug || '',
          icon_url: null,
          parent_id: resolved.category_id,
        }
      : null,
    subcategory_id: resolved.subcategory_id,
    subcategory_name: resolved.subcategory_name,
    subcategory_slug: resolved.subcategory_slug,
    needs_category_review: resolved.needs_category_review,
    legacy_category_name: resolved.legacy_category_name || null,
  };
}

/**
 * Validates and saves a product's main category and subcategory assignment (Sections 6 & 10).
 * Enforces:
 * - Main category is required and exists.
 * - Subcategory (when provided) belongs to the selected main category.
 * - Inactive categories or inactive subcategories cannot be newly assigned to products.
 */
export function validateProductCategorySelection(params: {
  categoryIdOrSlug: string;
  subcategoryIdOrSlug?: string | null;
  isNewProduct?: boolean;
  previousCategoryId?: string | null;
  previousSubcategoryId?: string | null;
}): { mainCategory: Category; subcategory: Subcategory | null } {
  if (!params.categoryIdOrSlug || !String(params.categoryIdOrSlug).trim()) {
    throw new Error('Please select one of the 12 main product categories.');
  }

  const mainCategory = findMainCategory(params.categoryIdOrSlug);
  if (!mainCategory) {
    throw new Error(`Invalid main category "${params.categoryIdOrSlug}". Please select a valid DOVI category.`);
  }

  // Prevent selecting an inactive main category for new products or when changing category
  const isKeepingExistingInactiveCat =
    !params.isNewProduct &&
    params.previousCategoryId &&
    (params.previousCategoryId === mainCategory.id || params.previousCategoryId === mainCategory.slug);

  if (mainCategory.is_active === false && !isKeepingExistingInactiveCat) {
    throw new Error(
      `Category "${mainCategory.name}" is currently deactivated and cannot be selected for new product listings.`
    );
  }

  let subcategory: Subcategory | null = null;
  if (params.subcategoryIdOrSlug && String(params.subcategoryIdOrSlug).trim()) {
    // Look up subcategory globally first to give a specific error if it belongs to a different parent
    const anySubMatch = findSubcategory(params.subcategoryIdOrSlug);
    if (!anySubMatch) {
      throw new Error(`Selected subcategory "${params.subcategoryIdOrSlug}" does not exist.`);
    }

    if (anySubMatch.parentCategory.id !== mainCategory.id) {
      throw new Error(
        `Invalid category-subcategory relationship: Subcategory "${anySubMatch.subcategory.name}" belongs to "${anySubMatch.parentCategory.name}", not "${mainCategory.name}".`
      );
    }

    subcategory = anySubMatch.subcategory;

    const isKeepingExistingInactiveSub =
      !params.isNewProduct &&
      params.previousSubcategoryId &&
      (params.previousSubcategoryId === subcategory.id || params.previousSubcategoryId === subcategory.slug);

    if (subcategory.is_active === false && !isKeepingExistingInactiveSub) {
      throw new Error(
        `Subcategory "${subcategory.name}" is currently deactivated and cannot be selected for new product listings.`
      );
    }
  }

  return { mainCategory, subcategory };
}

export function saveProductCategoryAssignment(
  productId: string,
  params: {
    categoryIdOrSlug: string;
    subcategoryIdOrSlug?: string | null;
    isNewProduct?: boolean;
    previousCategoryId?: string | null;
    previousSubcategoryId?: string | null;
  },
  actor?: CategoryAdminActor
): ProductCategoryAssignment {
  if (actor) {
    assertAuthorizedCategoryAdmin(actor);
  }

  const { mainCategory, subcategory } = validateProductCategorySelection(params);
  const map = readLocal<Record<string, ProductCategoryAssignment>>(
    STORAGE_KEYS.PRODUCT_CATEGORY_ASSIGNMENTS,
    {}
  );

  const record: ProductCategoryAssignment = {
    product_id: String(productId),
    category_id: mainCategory.id,
    category_name: mainCategory.name,
    category_slug: mainCategory.slug,
    subcategory_id: subcategory?.id || null,
    subcategory_name: subcategory?.name || null,
    subcategory_slug: subcategory?.slug || null,
    needs_category_review: false,
    legacy_category_name: null,
    updated_at: new Date().toISOString(),
  };

  map[String(productId)] = record;
  writeLocal(STORAGE_KEYS.PRODUCT_CATEGORY_ASSIGNMENTS, map);
  void pushCategoryStoreToServer({ productCategoryAssignments: map });
  return record;
}

/**
 * Checks whether a product matches a storefront category and/or subcategory filter.
 * Supports both new category/subcategory slugs and legacy category URL aliases.
 */
export function doesProductMatchCategoryFilter(
  product: Partial<Product & ProductSummary> | Record<string, any>,
  categoryFilter?: string | null,
  subcategoryFilter?: string | null
): boolean {
  const resolved = resolveProductCategoryAndSubcategory(product);

  if (subcategoryFilter && subcategoryFilter.trim()) {
    const subTarget = findSubcategory(subcategoryFilter.trim());
    if (subTarget) {
      const matchesSub =
        resolved.subcategory_id === subTarget.subcategory.id ||
        resolved.subcategory_slug === subTarget.subcategory.slug;
      if (!matchesSub) return false;
    } else {
      const normSub = subcategoryFilter.trim().toLowerCase();
      if (
        (resolved.subcategory_slug || '').toLowerCase() !== normSub &&
        (resolved.subcategory_id || '').toLowerCase() !== normSub &&
        (resolved.subcategory_name || '').toLowerCase() !== normSub
      ) {
        return false;
      }
    }
  }

  if (categoryFilter && categoryFilter.trim()) {
    // Also check if the category filter param is actually a subcategory slug
    const asSub = findSubcategory(categoryFilter.trim());
    if (asSub && !subcategoryFilter) {
      return (
        resolved.subcategory_id === asSub.subcategory.id ||
        resolved.subcategory_slug === asSub.subcategory.slug
      );
    }

    const mainTarget = findMainCategory(categoryFilter.trim());
    if (mainTarget) {
      return (
        resolved.category_id === mainTarget.id ||
        resolved.category_slug === mainTarget.slug
      );
    }

    const normCat = categoryFilter.trim().toLowerCase();
    return (
      resolved.category_slug.toLowerCase() === normCat ||
      resolved.category_id.toLowerCase() === normCat ||
      resolved.category_name.toLowerCase() === normCat
    );
  }

  return true;
}

// ============================================================================
// ADMIN CATEGORY & SUBCATEGORY MANAGEMENT OPERATIONS (SECTIONS 4, 9, 10)
// ============================================================================

export function updateMainCategory(
  categoryId: string,
  updates: {
    name?: string;
    slug?: string;
    description?: string | null;
    icon?: string | null;
    icon_url?: string | null;
    display_order?: number;
    is_active?: boolean;
  },
  actor: CategoryAdminActor = { email: 'admin@dovi.com', role: 'ADMIN' }
): Category {
  assertAuthorizedCategoryAdmin(actor);

  const tree = ensureCategoriesInitialized();
  const idx = tree.findIndex((c) => c.id === categoryId || c.slug === categoryId);
  if (idx === -1) {
    throw new Error(`Main category "${categoryId}" not found.`);
  }

  const current = tree[idx];
  const nextName = updates.name !== undefined ? updates.name.trim() : current.name;
  if (!nextName) {
    throw new Error('Category name cannot be empty.');
  }

  // Prevent duplicate main category names (case-insensitive)
  const duplicateName = tree.find(
    (c, i) => i !== idx && c.name.trim().toLowerCase() === nextName.toLowerCase()
  );
  if (duplicateName) {
    throw new Error(`A main category named "${nextName}" already exists.`);
  }

  const nextSlug = updates.slug !== undefined ? slugifyCategoryName(updates.slug) : current.slug;
  if (!nextSlug) {
    throw new Error('Category slug cannot be empty.');
  }

  const updated: Category = {
    ...current,
    name: nextName,
    slug: nextSlug,
    description: updates.description !== undefined ? updates.description : current.description,
    icon: updates.icon !== undefined ? updates.icon : current.icon,
    icon_url: updates.icon_url !== undefined ? updates.icon_url : current.icon_url,
    display_order:
      updates.display_order !== undefined ? Number(updates.display_order) : current.display_order,
    is_active: updates.is_active !== undefined ? Boolean(updates.is_active) : current.is_active,
    updated_at: new Date().toISOString(),
  };

  tree[idx] = updated;
  const normalized = normalizeCategoryTree(tree);
  writeLocal(STORAGE_KEYS.CATEGORIES, normalized);
  void pushCategoryStoreToServer({ categories: normalized });
  return normalized.find((c) => c.id === current.id)!;
}

export function moveMainCategoryOrder(
  categoryId: string,
  direction: 'UP' | 'DOWN',
  actor: CategoryAdminActor = { email: 'admin@dovi.com', role: 'ADMIN' }
): Category[] {
  assertAuthorizedCategoryAdmin(actor);
  const tree = ensureCategoriesInitialized();
  const idx = tree.findIndex((c) => c.id === categoryId);
  if (idx === -1) return tree;

  const swapIdx = direction === 'UP' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= tree.length) return tree;

  const reordered = [...tree];
  const temp = reordered[idx];
  reordered[idx] = reordered[swapIdx];
  reordered[swapIdx] = temp;

  const withUpdatedOrders = reordered.map((c, i) => ({
    ...c,
    display_order: i + 1,
    updated_at: new Date().toISOString(),
  }));

  const normalized = normalizeCategoryTree(withUpdatedOrders);
  writeLocal(STORAGE_KEYS.CATEGORIES, normalized);
  void pushCategoryStoreToServer({ categories: normalized });
  return normalized;
}

export function createSubcategory(
  input: {
    parent_id?: string;
    parent_category_id?: string;
    name: string;
    slug?: string;
    description?: string | null;
    is_active?: boolean;
    display_order?: number;
  },
  actor: CategoryAdminActor = { email: 'admin@dovi.com', role: 'ADMIN' }
): Subcategory {
  assertAuthorizedCategoryAdmin(actor);

  const parentIdKey = (input.parent_id || input.parent_category_id || '').trim();
  if (!parentIdKey) {
    throw new Error('Parent main category is required when creating a subcategory.');
  }

  const tree = ensureCategoriesInitialized();
  const parentIdx = tree.findIndex(
    (c) => c.id === parentIdKey || c.slug === parentIdKey
  );
  if (parentIdx === -1) {
    throw new Error(
      `Invalid parent category "${parentIdKey}". A subcategory must belong to one of the 12 main categories.`
    );
  }

  const parentCat = tree[parentIdx];
  const trimmedName = (input.name || '').trim();
  if (!trimmedName) {
    throw new Error('Subcategory name is required.');
  }

  // Prevent duplicate subcategory names under the same main category (Section 10)
  const existingChildren = parentCat.children || [];
  const duplicateUnderSameParent = existingChildren.find(
    (sub) => sub.name.trim().toLowerCase() === trimmedName.toLowerCase()
  );
  if (duplicateUnderSameParent) {
    throw new Error(
      `Subcategory "${trimmedName}" already exists under "${parentCat.name}". Duplicate subcategory names under the same category are not allowed.`
    );
  }

  let baseSlug = input.slug ? slugifyCategoryName(input.slug) : slugifyCategoryName(trimmedName);
  if (!baseSlug) baseSlug = `sub-${Date.now()}`;

  // Ensure slug is globally unique across categories & subcategories
  const allSlugs = new Set<string>();
  tree.forEach((c) => {
    allSlugs.add(c.slug.toLowerCase());
    (c.children || []).forEach((s) => allSlugs.add(s.slug.toLowerCase()));
  });
  let uniqueSlug = baseSlug;
  if (allSlugs.has(uniqueSlug.toLowerCase())) {
    uniqueSlug = `${slugifyCategoryName(parentCat.slug)}-${baseSlug}`;
  }

  const nextOrder =
    input.display_order !== undefined
      ? Number(input.display_order)
      : existingChildren.length + 1;

  const now = new Date().toISOString();
  const newSubNode: Category = {
    id: `sub-${uniqueSlug}-${Date.now().toString(36).slice(-4)}`,
    name: trimmedName,
    slug: uniqueSlug,
    description: input.description ?? null,
    icon: null,
    icon_url: null,
    parent: parentCat.id,
    display_order: nextOrder,
    is_active: input.is_active !== false,
    children: [],
    product_count: 0,
    updated_at: now,
  };

  tree[parentIdx] = {
    ...parentCat,
    children: [...existingChildren, newSubNode],
    updated_at: now,
  };

  const normalized = normalizeCategoryTree(tree);
  writeLocal(STORAGE_KEYS.CATEGORIES, normalized);
  void pushCategoryStoreToServer({ categories: normalized });

  const created = findSubcategory(newSubNode.id, parentCat.id);
  return created!.subcategory;
}

export function updateSubcategory(
  subcategoryId: string,
  updates: {
    name?: string;
    slug?: string;
    parent_id?: string;
    parent_category_id?: string;
    description?: string | null;
    is_active?: boolean;
    display_order?: number;
  },
  actor: CategoryAdminActor = { email: 'admin@dovi.com', role: 'ADMIN' }
): Subcategory {
  assertAuthorizedCategoryAdmin(actor);

  const tree = ensureCategoriesInitialized();
  let sourceParentIdx = -1;
  let sourceSubIdx = -1;

  for (let i = 0; i < tree.length; i++) {
    const children = tree[i].children || [];
    const sIdx = children.findIndex((s) => s.id === subcategoryId || s.slug === subcategoryId);
    if (sIdx !== -1) {
      sourceParentIdx = i;
      sourceSubIdx = sIdx;
      break;
    }
  }

  if (sourceParentIdx === -1 || sourceSubIdx === -1) {
    throw new Error(`Subcategory "${subcategoryId}" not found.`);
  }

  const currentSub = tree[sourceParentIdx].children[sourceSubIdx];
  const targetParentKey = updates.parent_id || updates.parent_category_id;
  const targetParentId = targetParentKey ? targetParentKey.trim() : tree[sourceParentIdx].id;
  const targetParentIdx = tree.findIndex(
    (c) => c.id === targetParentId || c.slug === targetParentId
  );

  if (targetParentIdx === -1) {
    throw new Error(
      `Invalid parent category "${targetParentId}". A subcategory must belong to one of the 12 main categories.`
    );
  }

  const targetParent = tree[targetParentIdx];
  const nextName = updates.name !== undefined ? updates.name.trim() : currentSub.name;
  if (!nextName) {
    throw new Error('Subcategory name cannot be empty.');
  }

  // Check duplicate subcategory name in target parent category
  const targetChildren = targetParent.children || [];
  const duplicate = targetChildren.find(
    (s) => s.id !== currentSub.id && s.name.trim().toLowerCase() === nextName.toLowerCase()
  );
  if (duplicate) {
    throw new Error(
      `Subcategory "${nextName}" already exists under "${targetParent.name}".`
    );
  }

  const nextSlug = updates.slug !== undefined ? slugifyCategoryName(updates.slug) : currentSub.slug;
  const now = new Date().toISOString();

  const updatedNode: Category = {
    ...currentSub,
    name: nextName,
    slug: nextSlug || currentSub.slug,
    description: updates.description !== undefined ? updates.description : currentSub.description,
    parent: targetParent.id,
    is_active: updates.is_active !== undefined ? Boolean(updates.is_active) : currentSub.is_active,
    display_order:
      updates.display_order !== undefined
        ? Number(updates.display_order)
        : targetParentIdx !== sourceParentIdx
        ? targetChildren.length + 1
        : currentSub.display_order,
    updated_at: now,
  };

  if (targetParentIdx === sourceParentIdx) {
    const nextChildren = [...tree[sourceParentIdx].children];
    nextChildren[sourceSubIdx] = updatedNode;
    tree[sourceParentIdx] = {
      ...tree[sourceParentIdx],
      children: nextChildren,
      updated_at: now,
    };
  } else {
    // Reparenting subcategory to a different main category
    const remainingSource = tree[sourceParentIdx].children
      .filter((s) => s.id !== currentSub.id)
      .map((s, idx) => ({ ...s, display_order: idx + 1 }));

    tree[sourceParentIdx] = {
      ...tree[sourceParentIdx],
      children: remainingSource,
      updated_at: now,
    };

    tree[targetParentIdx] = {
      ...targetParent,
      children: [...targetChildren, updatedNode],
      updated_at: now,
    };

    // Update any product assignments linked to this subcategory so their parent category stays in sync
    const assignments = readLocal<Record<string, ProductCategoryAssignment>>(
      STORAGE_KEYS.PRODUCT_CATEGORY_ASSIGNMENTS,
      {}
    );
    let assignmentsChanged = false;
    for (const [prodId, assign] of Object.entries(assignments)) {
      if (assign.subcategory_id === currentSub.id) {
        assignments[prodId] = {
          ...assign,
          category_id: targetParent.id,
          category_name: targetParent.name,
          category_slug: targetParent.slug,
          subcategory_name: updatedNode.name,
          subcategory_slug: updatedNode.slug,
          updated_at: now,
        };
        assignmentsChanged = true;
      }
    }
    if (assignmentsChanged) {
      writeLocal(STORAGE_KEYS.PRODUCT_CATEGORY_ASSIGNMENTS, assignments);
      void pushCategoryStoreToServer({ productCategoryAssignments: assignments });
    }
  }

  const normalized = normalizeCategoryTree(tree);
  writeLocal(STORAGE_KEYS.CATEGORIES, normalized);
  void pushCategoryStoreToServer({ categories: normalized });

  const updatedMatch = findSubcategory(currentSub.id, targetParent.id);
  return updatedMatch!.subcategory;
}

export function moveSubcategoryOrder(
  subcategoryId: string,
  direction: 'UP' | 'DOWN',
  actor: CategoryAdminActor = { email: 'admin@dovi.com', role: 'ADMIN' }
): Category[] {
  assertAuthorizedCategoryAdmin(actor);

  const tree = ensureCategoriesInitialized();
  for (let i = 0; i < tree.length; i++) {
    const children = [...(tree[i].children || [])].sort(
      (a, b) => (a.display_order ?? 99) - (b.display_order ?? 99)
    );
    const sIdx = children.findIndex((s) => s.id === subcategoryId);
    if (sIdx !== -1) {
      const swapIdx = direction === 'UP' ? sIdx - 1 : sIdx + 1;
      if (swapIdx < 0 || swapIdx >= children.length) return tree;

      const temp = children[sIdx];
      children[sIdx] = children[swapIdx];
      children[swapIdx] = temp;

      const renumbered = children.map((c, idx) => ({
        ...c,
        display_order: idx + 1,
        updated_at: new Date().toISOString(),
      }));

      tree[i] = {
        ...tree[i],
        children: renumbered,
        updated_at: new Date().toISOString(),
      };

      const normalized = normalizeCategoryTree(tree);
      writeLocal(STORAGE_KEYS.CATEGORIES, normalized);
      void pushCategoryStoreToServer({ categories: normalized });
      return normalized;
    }
  }
  return tree;
}

export function reorderSubcategories(
  parentCategoryId: string,
  orderedSubcategoryIds: string[],
  actor: CategoryAdminActor = { email: 'admin@dovi.com', role: 'ADMIN' }
): Category[] {
  assertAuthorizedCategoryAdmin(actor);

  const tree = ensureCategoriesInitialized();
  const pIdx = tree.findIndex((c) => c.id === parentCategoryId || c.slug === parentCategoryId);
  if (pIdx === -1) {
    throw new Error(`Parent category "${parentCategoryId}" not found.`);
  }

  const childrenMap = new Map((tree[pIdx].children || []).map((c) => [c.id, c]));
  const reordered: Category[] = [];

  orderedSubcategoryIds.forEach((id) => {
    const item = childrenMap.get(id);
    if (item) {
      reordered.push(item);
      childrenMap.delete(id);
    }
  });
  childrenMap.forEach((item) => reordered.push(item));

  tree[pIdx] = {
    ...tree[pIdx],
    children: reordered.map((c, idx) => ({
      ...c,
      display_order: idx + 1,
      updated_at: new Date().toISOString(),
    })),
    updated_at: new Date().toISOString(),
  };

  const normalized = normalizeCategoryTree(tree);
  writeLocal(STORAGE_KEYS.CATEGORIES, normalized);
  void pushCategoryStoreToServer({ categories: normalized });
  return normalized;
}

export function deleteSubcategory(
  subcategoryId: string,
  optionsOrActor?: {
    associatedProductCount?: number;
    reassignToSubcategoryId?: string | null;
    confirmed?: boolean;
    allProducts?: any[];
  } | CategoryAdminActor,
  actorArg?: CategoryAdminActor
): Category[] {
  let actor: CategoryAdminActor = { email: 'admin@dovi.com', role: 'ADMIN' };
  let options: {
    associatedProductCount?: number;
    reassignToSubcategoryId?: string | null;
    confirmed?: boolean;
    allProducts?: any[];
  } | undefined;

  if (optionsOrActor && 'email' in optionsOrActor) {
    actor = optionsOrActor;
  } else if (optionsOrActor) {
    options = optionsOrActor;
    if (actorArg) actor = actorArg;
  } else if (actorArg) {
    actor = actorArg;
  }

  assertAuthorizedCategoryAdmin(actor);

  const tree = ensureCategoriesInitialized();
  const found = findSubcategory(subcategoryId);
  if (!found) {
    throw new Error(`Subcategory "${subcategoryId}" not found.`);
  }

  const assignments = readLocal<Record<string, ProductCategoryAssignment>>(
    STORAGE_KEYS.PRODUCT_CATEGORY_ASSIGNMENTS,
    {}
  );
  const assignedProductIds = Object.keys(assignments).filter(
    (pid) =>
      assignments[pid].subcategory_id === found.subcategory.id ||
      assignments[pid].subcategory_slug === found.subcategory.slug
  );

  const totalAssociated = Math.max(
    found.subcategory.product_count || 0,
    assignedProductIds.length,
    options?.associatedProductCount || 0
  );

  if (totalAssociated > 0 && !options?.reassignToSubcategoryId) {
    throw new Error(
      `Cannot delete subcategory "${found.subcategory.name}" because ${totalAssociated} product(s) are associated with it. Please reassign those products to another subcategory first or deactivate this subcategory instead.`
    );
  }

  if (options?.reassignToSubcategoryId) {
    const targetSub = findSubcategory(options.reassignToSubcategoryId);
    if (!targetSub) {
      throw new Error('Target reassignment subcategory does not exist.');
    }
    const now = new Date().toISOString();
    for (const pid of assignedProductIds) {
      assignments[pid] = {
        ...assignments[pid],
        category_id: targetSub.parentCategory.id,
        category_name: targetSub.parentCategory.name,
        category_slug: targetSub.parentCategory.slug,
        subcategory_id: targetSub.subcategory.id,
        subcategory_name: targetSub.subcategory.name,
        subcategory_slug: targetSub.subcategory.slug,
        updated_at: now,
      };
    }
    writeLocal(STORAGE_KEYS.PRODUCT_CATEGORY_ASSIGNMENTS, assignments);
    void pushCategoryStoreToServer({ productCategoryAssignments: assignments });
  }

  const nextTree = tree.map((cat) => {
    if (cat.id !== found.parentCategory.id) return cat;
    const nextChildren = (cat.children || [])
      .filter((s) => s.id !== found.subcategory.id)
      .map((s, idx) => ({ ...s, display_order: idx + 1 }));
    return {
      ...cat,
      children: nextChildren,
      updated_at: new Date().toISOString(),
    };
  });

  const normalized = normalizeCategoryTree(nextTree);
  writeLocal(STORAGE_KEYS.CATEGORIES, normalized);
  void pushCategoryStoreToServer({ categories: normalized });
  return normalized;
}

export const syncCategoriesFromSharedDb = syncCategoriesFromServer;

export function toggleMainCategoryStatus(
  categoryId: string,
  isActive: boolean,
  actor: CategoryAdminActor = { email: 'admin@dovi.com', role: 'ADMIN' }
): Category {
  return updateMainCategory(categoryId, { is_active: isActive }, actor);
}

export function toggleSubcategoryStatus(
  subcategoryId: string,
  isActive: boolean,
  actor: CategoryAdminActor = { email: 'admin@dovi.com', role: 'ADMIN' }
): Subcategory {
  return updateSubcategory(subcategoryId, { is_active: isActive }, actor);
}

export function reorderMainCategories(
  orderedCategoryIds: string[],
  actor: CategoryAdminActor = { email: 'admin@dovi.com', role: 'ADMIN' }
): Category[] {
  assertAuthorizedCategoryAdmin(actor);
  const tree = ensureCategoriesInitialized();
  const catMap = new Map(tree.map((c) => [c.id, c]));
  const reordered: Category[] = [];

  orderedCategoryIds.forEach((id) => {
    const item = catMap.get(id);
    if (item) {
      reordered.push(item);
      catMap.delete(id);
    }
  });
  catMap.forEach((item) => reordered.push(item));

  const normalized = normalizeCategoryTree(
    reordered.map((c, idx) => ({ ...c, display_order: idx + 1, updated_at: new Date().toISOString() }))
  );
  writeLocal(STORAGE_KEYS.CATEGORIES, normalized);
  void pushCategoryStoreToServer({ categories: normalized });
  return normalized;
}

export function deleteMainCategory(
  categoryId: string,
  options?: {
    reassignToCategoryId?: string | null;
    confirmed?: boolean;
    allProducts?: any[];
  },
  actor: CategoryAdminActor = { email: 'admin@dovi.com', role: 'ADMIN' }
): Category[] {
  assertAuthorizedCategoryAdmin(actor);
  const tree = ensureCategoriesInitialized();
  const cat = findMainCategory(categoryId);
  if (!cat) throw new Error(`Category "${categoryId}" not found.`);

  const assignments = readLocal<Record<string, ProductCategoryAssignment>>(
    STORAGE_KEYS.PRODUCT_CATEGORY_ASSIGNMENTS,
    {}
  );
  const assignedPids = Object.keys(assignments).filter(
    (pid) => assignments[pid].category_id === cat.id || assignments[pid].category_slug === cat.slug
  );
  const totalProds = Math.max(cat.product_count || 0, assignedPids.length);

  if (totalProds > 0 && !options?.reassignToCategoryId && !options?.confirmed) {
    throw new Error(
      `Cannot delete category "${cat.name}" because it has ${totalProds} associated product(s). Please reassign products first or deactivate the category.`
    );
  }

  if (options?.reassignToCategoryId) {
    const targetCat = findMainCategory(options.reassignToCategoryId);
    if (!targetCat) throw new Error('Target reassignment category does not exist.');
    const now = new Date().toISOString();
    for (const pid of assignedPids) {
      assignments[pid] = {
        ...assignments[pid],
        category_id: targetCat.id,
        category_name: targetCat.name,
        category_slug: targetCat.slug,
        subcategory_id: null,
        subcategory_name: null,
        subcategory_slug: null,
        updated_at: now,
      };
    }
    writeLocal(STORAGE_KEYS.PRODUCT_CATEGORY_ASSIGNMENTS, assignments);
    void pushCategoryStoreToServer({ productCategoryAssignments: assignments });
  }

  const nextTree = tree.filter((c) => c.id !== cat.id);
  const normalized = normalizeCategoryTree(nextTree);
  writeLocal(STORAGE_KEYS.CATEGORIES, normalized);
  void pushCategoryStoreToServer({ categories: normalized });
  return normalized;
}

export function resetCategoriesToDefault12(
  actor: CategoryAdminActor = { email: 'admin@dovi.com', role: 'ADMIN' }
): Category[] {
  assertAuthorizedCategoryAdmin(actor);
  const existing = ensureCategoriesInitialized();
  const existingCatMap = new Map(existing.map((c) => [c.id, c]));

  const seeded = buildSeedCategoryTree();
  const merged: Category[] = seeded.map((seedMain) => {
    const cur = existingCatMap.get(seedMain.id);
    if (!cur) return seedMain;
    const existingSubs = cur.children || [];
    const existingSubMap = new Map(existingSubs.map((s) => [s.slug, s]));

    const mergedSubs = [...existingSubs];
    seedMain.children.forEach((seedSub) => {
      if (!existingSubMap.has(seedSub.slug)) {
        mergedSubs.push(seedSub);
      }
    });

    return {
      ...cur,
      display_order: cur.display_order ?? seedMain.display_order,
      icon: cur.icon || seedMain.icon,
      description: cur.description || seedMain.description,
      children: mergedSubs,
    };
  });

  const normalized = normalizeCategoryTree(merged);
  writeLocal(STORAGE_KEYS.CATEGORIES, normalized);
  void pushCategoryStoreToServer({ categories: normalized });
  return normalized;
}

