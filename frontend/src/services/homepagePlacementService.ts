// ============================================================
// DOVI 2.0 — Authoritative Homepage Promotional Placement Service
// Admin-controlled placement for Hot Sales, Flash Sale & New Arrivals
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
  is_hot_sale: boolean;
  is_flash_deal: boolean;
  is_new_arrival: boolean;
  flash_sale?: FlashSaleConfig | null;
  updated_at: string;
}

const STORAGE_KEYS = {
  PLACEMENTS: 'dovi_homepage_placements_v1',
};

function readLocal<T>(key: string, fallback: T): T {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const item = window.localStorage.getItem(key);
      if (item) return JSON.parse(item);
    }
  } catch {}
  return fallback;
}

function writeLocal<T>(key: string, value: T): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent('dovi-homepage-placements-updated'));
    }
  } catch {}
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
    is_hot_sale: Boolean(placement.is_hot_sale),
    is_flash_deal: Boolean(placement.is_flash_deal),
    is_new_arrival: Boolean(placement.is_new_arrival),
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
      ? { product_id: String(productId || ''), is_hot_sale: Boolean(fromDesc.is_hot_sale), is_flash_deal: Boolean(fromDesc.is_flash_deal), is_new_arrival: Boolean(fromDesc.is_new_arrival), flash_sale: fromDesc.flash_sale || null, updated_at: fromDesc.updated_at || new Date().toISOString() }
      : fromStore;
  }

  if (fromDesc) {
    return {
      product_id: String(productId || ''),
      is_hot_sale: Boolean(fromDesc.is_hot_sale),
      is_flash_deal: Boolean(fromDesc.is_flash_deal),
      is_new_arrival: Boolean(fromDesc.is_new_arrival),
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
    is_hot_sale: Boolean(placement.is_hot_sale),
    is_flash_deal: Boolean(placement.is_flash_deal),
    is_new_arrival: Boolean(placement.is_new_arrival),
    flash_sale: placement.flash_sale || null,
    updated_at: new Date().toISOString(),
  };

  map[idStr] = record;
  writeLocal(STORAGE_KEYS.PLACEMENTS, map);

  // Sync to shared Vite dev server endpoint if running
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      await fetch('/__dovi_delivery_db__', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homepagePlacements: map }),
      });
    } catch {}
  }

  return record;
}

/**
 * Synchronizes placement map with shared server store.
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
        return merged;
      }
    }
  } catch {}
  return readLocal<Record<string, ProductHomepagePlacement>>(STORAGE_KEYS.PLACEMENTS, {});
}
