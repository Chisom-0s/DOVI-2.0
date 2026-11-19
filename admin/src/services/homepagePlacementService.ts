// ============================================================
// DOVI 2.0 — Authoritative Homepage Promotional Placement Service
// Admin-controlled placement for Best Sellers, Trending Now,
// New Arrivals, Hot Sales, Flash Sales, and Custom Sections.
// ============================================================

export interface FlashSaleConfig {
  flash_price: number | null;
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
  custom_section_ids?: string[];
  section_orders?: Record<string, number>; // sectionIdOrKey -> 0-based display index
  flash_sale?: FlashSaleConfig | null;
  updated_at: string;
}

export interface MerchandisingSection {
  id: string;
  key: string; // 'BEST_SELLERS' | 'TRENDING_NOW' | 'SPECIAL_PROMO' | 'NEW_ARRIVALS' | 'HOT_SALES' | 'FLASH_DEALS' | string
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
  PLACEMENTS: 'dovi_homepage_placements_v1',
  SECTIONS: 'dovi_merchandising_sections_v1',
};

const memoryStore: Record<string, any> = {};

export const DEFAULT_CORE_SECTIONS: MerchandisingSection[] = [
  {
    id: 'sec-best-sellers',
    key: 'BEST_SELLERS',
    name: 'Best Sellers',
    title: 'Best Sellers',
    subtitle: 'Top performing products curated by DOVI',
    is_active: true,
    sort_order: 1,
    display_limit: 4,
    product_ids: [],
    is_custom: false,
  },
  {
    id: 'sec-trending',
    key: 'TRENDING_NOW',
    name: 'Trending Now',
    title: 'Trending Now',
    subtitle: 'High demand picks selected for today',
    is_active: true,
    sort_order: 2,
    display_limit: 6,
    product_ids: [],
    is_custom: false,
  },
  {
    id: 'sec-special-promo',
    key: 'SPECIAL_PROMO',
    name: 'Special Promo',
    title: 'Unlock Save2Own Benefits',
    subtitle: 'Contribute in bits towards purchasing high-value items without any interest.',
    is_active: true,
    sort_order: 3,
    display_limit: 1,
    product_ids: [],
    is_custom: false,
  },
  {
    id: 'sec-new-arrivals',
    key: 'NEW_ARRIVALS',
    name: 'New Arrivals',
    title: 'New Arrivals',
    subtitle: 'Fresh additions to the DOVI marketplace',
    is_active: true,
    sort_order: 4,
    display_limit: 4,
    product_ids: [],
    is_custom: false,
  },
  {
    id: 'sec-hot-sales',
    key: 'HOT_SALES',
    name: 'Hot Sales',
    title: 'Hot Sales',
    subtitle: 'Great deals on popular products',
    is_active: true,
    sort_order: 5,
    display_limit: 6,
    product_ids: [],
    is_custom: false,
  },
  {
    id: 'sec-flash-deals',
    key: 'FLASH_DEALS',
    name: 'Flash Sales',
    title: 'Flash Sales',
    subtitle: 'Limited-time special prices — ending soon!',
    is_active: true,
    sort_order: 6,
    display_limit: 6,
    product_ids: [],
    is_custom: false,
  },
];

function readLocal<T>(key: string, fallback: T): T {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const item = window.localStorage.getItem(key);
      if (item) return JSON.parse(item);
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
  if (flashSale.flash_price === null || flashSale.flash_price === undefined || flashSale.flash_price <= 0) {
    return false;
  }
  const nowMs = asOfDate.getTime();
  if (flashSale.start_time) {
    const startMs = new Date(flashSale.start_time).getTime();
    if (!isNaN(startMs) && nowMs < startMs) {
      return false; // Not yet started
    }
  }
  if (flashSale.end_time) {
    const endMs = new Date(flashSale.end_time).getTime();
    if (!isNaN(endMs) && nowMs > endMs) {
      return false; // Expired
    }
  }
  return true;
}

/**
 * Parses embedded homepage metadata from a product's description.
 * Format: <!-- DOVI_HOMEPAGE: {...} -->
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
 * Embeds or updates homepage promotional placement metadata in product description HTML comment.
 */
export function serializeProductDescriptionWithHomepage(
  description: string,
  placement: Partial<ProductHomepagePlacement>
): string {
  const cleaned = (description || '').replace(/\s*<!--\s*DOVI_HOMEPAGE:\s*\{[\s\S]*?\}\s*-->\s*/gi, '').trim();
  const payload = JSON.stringify({
    is_best_seller: Boolean(placement.is_best_seller),
    is_trending: Boolean(placement.is_trending),
    is_new_arrival: Boolean(placement.is_new_arrival),
    is_hot_sale: Boolean(placement.is_hot_sale),
    is_flash_deal: Boolean(placement.is_flash_deal),
    custom_section_ids: placement.custom_section_ids || [],
    section_orders: placement.section_orders || {},
    flash_sale: placement.flash_sale || null,
    updated_at: placement.updated_at || new Date().toISOString(),
  });
  return `${cleaned}\n\n<!-- DOVI_HOMEPAGE: ${payload} -->`.trim();
}

/**
 * Gets the current placement configuration for a product.
 * Checks:
 * 1. Embedded description metadata (highest cross-server fidelity)
 * 2. Shared local storage placement map
 */
export function getProductHomepagePlacement(productOrId: { id?: string; description?: string } | string): ProductHomepagePlacement | null {
  const productId = typeof productOrId === 'string' ? productOrId : productOrId?.id;
  const desc = typeof productOrId === 'object' ? productOrId?.description : null;

  const fromDesc = parseHomepageMetadataFromDescription(desc);
  const storeMap = readLocal<Record<string, ProductHomepagePlacement>>(STORAGE_KEYS.PLACEMENTS, {});
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
          custom_section_ids: fromDesc.custom_section_ids || [],
          section_orders: fromDesc.section_orders || {},
          flash_sale: fromDesc.flash_sale || null,
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
      custom_section_ids: fromDesc.custom_section_ids || [],
      section_orders: fromDesc.section_orders || {},
      flash_sale: fromDesc.flash_sale || null,
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
  const map = readLocal<Record<string, ProductHomepagePlacement>>(STORAGE_KEYS.PLACEMENTS, {});
  const record: ProductHomepagePlacement = {
    product_id: idStr,
    is_best_seller: Boolean(placement.is_best_seller),
    is_trending: Boolean(placement.is_trending),
    is_new_arrival: Boolean(placement.is_new_arrival),
    is_hot_sale: Boolean(placement.is_hot_sale),
    is_flash_deal: Boolean(placement.is_flash_deal),
    custom_section_ids: placement.custom_section_ids || [],
    section_orders: placement.section_orders || {},
    flash_sale: placement.flash_sale || null,
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
 * Returns all configured merchandising sections (core 5 + Save2Own promo + custom).
 */
export function listMerchandisingSections(): MerchandisingSection[] {
  const stored = readLocal<MerchandisingSection[]>(STORAGE_KEYS.SECTIONS, []);
  if (!stored || stored.length === 0) {
    writeLocal(STORAGE_KEYS.SECTIONS, DEFAULT_CORE_SECTIONS);
    return [...DEFAULT_CORE_SECTIONS];
  }

  // Ensure all core sections exist
  const existingKeys = new Set(stored.map((s) => s.key));
  let added = false;
  for (const core of DEFAULT_CORE_SECTIONS) {
    if (!existingKeys.has(core.key)) {
      stored.push(core);
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
  const placements = readLocal<Record<string, ProductHomepagePlacement>>(STORAGE_KEYS.PLACEMENTS, {});
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
    updated_at: new Date().toISOString(),
  };

  if (s.key === 'BEST_SELLERS') placement.is_best_seller = true;
  if (s.key === 'TRENDING_NOW') placement.is_trending = true;
  if (s.key === 'NEW_ARRIVALS') placement.is_new_arrival = true;
  if (s.key === 'HOT_SALES') placement.is_hot_sale = true;
  if (s.key === 'FLASH_DEALS') placement.is_flash_deal = true;
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
    return readLocal<Record<string, ProductHomepagePlacement>>(STORAGE_KEYS.PLACEMENTS, {});
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
        const local = readLocal<Record<string, ProductHomepagePlacement>>(STORAGE_KEYS.PLACEMENTS, {});
        const merged = { ...local, ...serverPlacements };
        writeLocal(STORAGE_KEYS.PLACEMENTS, merged);
      }
      const serverSections = data?.homepageSections;
      if (Array.isArray(serverSections) && serverSections.length > 0) {
        writeLocal(STORAGE_KEYS.SECTIONS, serverSections);
      }
    }
  } catch {}
  return readLocal<Record<string, ProductHomepagePlacement>>(STORAGE_KEYS.PLACEMENTS, {});
}
