// ============================================================
// DOVI 2.0 — Authoritative Delivery Pricing, Consolidation &
// Onitsha Hub Fulfillment Service
// ============================================================

import type {
  ParcelClassification,
  ProductDeliveryAttributes,
  DeliveryRoute,
  DeliveryRateChangeRecord,
  ShipmentFulfillmentStatus,
  DeliveryConfirmationStatus,
  ShipmentItem,
  OrderShipment,
  DeliveryCalculationShipmentGroup,
  DeliveryCalculationResult,
  Product,
  ProductSummary,
} from '../types';

export const PRIMARY_DISPATCH_ORIGIN = 'Onitsha';

export const PARCEL_CLASSIFICATION_LABELS: Record<ParcelClassification, string> = {
  SMALL_PARCEL: 'Small Parcel',
  HEAVY_PARCEL: 'Heavy Parcel',
  FURNITURE_BULKY: 'Furniture / Bulky Item',
  SPECIAL_MANUAL_QUOTE: 'Special Delivery / Manual Quote',
};

export const PARCEL_CLASSIFICATION_DESCRIPTIONS: Record<ParcelClassification, string> = {
  SMALL_PARCEL: 'Clothes, shoes, beauty products, small accessories, smartphones & small gadgets',
  HEAVY_PARCEL: 'Large electronics, standing fans, heavy appliances & larger household products',
  FURNITURE_BULKY: 'Chairs, tables, beds, large furniture & bulky items requiring specialized cargo',
  SPECIAL_MANUAL_QUOTE: 'Fragile, oversized, or custom-crated items requiring manual transport quotation',
};

export const SHIPMENT_STATUS_LABELS: Record<ShipmentFulfillmentStatus, string> = {
  ORDER_PLACED: 'Order Placed',
  AWAITING_DELIVERY_CONFIRMATION: 'Awaiting Delivery Confirmation',
  DELIVERY_FEE_CONFIRMED: 'Delivery Fee Confirmed',
  SOURCING_PRODUCTS: 'Sourcing Products',
  AWAITING_PRODUCTS_AT_HUB: 'Awaiting Products at Hub',
  PRODUCTS_RECEIVED: 'Products Received at Onitsha Hub',
  QUALITY_CHECK: 'Quality Check & Inspection',
  READY_FOR_PACKAGING: 'Ready for Packaging',
  PACKAGED: 'Packaged & Consolidated',
  READY_FOR_DISPATCH: 'Ready for Dispatch',
  DISPATCHED: 'Dispatched from Onitsha Hub',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
};

export const SHIPMENT_STATUS_ORDER: ShipmentFulfillmentStatus[] = [
  'ORDER_PLACED',
  'SOURCING_PRODUCTS',
  'AWAITING_PRODUCTS_AT_HUB',
  'PRODUCTS_RECEIVED',
  'QUALITY_CHECK',
  'READY_FOR_PACKAGING',
  'PACKAGED',
  'READY_FOR_DISPATCH',
  'DISPATCHED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

export const NIGERIAN_STATES: string[] = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara',
];

// LocalStorage Keys (Synchronized with /__dovi_delivery_db__ shared file store)
const STORAGE_KEYS = {
  ROUTES: 'dovi_delivery_routes_v1',
  RATE_HISTORY: 'dovi_delivery_rate_history_v1',
  PRODUCT_ATTRS: 'dovi_product_delivery_attrs_v1',
  ORDER_SHIPMENTS: 'dovi_order_shipments_v1',
};

export interface DeliveryStoreState {
  routes: DeliveryRoute[];
  rate_history: DeliveryRateChangeRecord[];
  product_delivery_attributes: Record<string, ProductDeliveryAttributes>;
  order_shipments: Record<string, OrderShipment[]>;
}

export interface AdminActor {
  id?: string;
  email: string;
  name?: string;
  role: string;
}

export interface EvaluableOrderItem {
  id?: string;
  product_id: string;
  product_name: string;
  variant_id?: string | null;
  variant_name?: string | null;
  quantity: number;
  unit_price: number;
  delivery_classification?: ParcelClassification | null;
  weight_kg?: number | null;
  dimensions_cm?: string | null;
  requires_special_handling?: boolean;
  can_consolidate_with_furniture?: boolean;
  max_items_per_shipment?: number | null;
  delivery_notes?: string | null;
  image_url?: string | null;
  category_name?: string | null;
  description?: string | null;
}

// In-memory store for environments without localStorage (e.g., Node test runner)
const memoryStore: DeliveryStoreState = {
  routes: [],
  rate_history: [],
  product_delivery_attributes: {},
  order_shipments: {},
};

function hasLocalStorage(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function readLocal<T>(key: string, fallback: T): T {
  if (!hasLocalStorage()) {
    if (key === STORAGE_KEYS.ROUTES) return memoryStore.routes as unknown as T;
    if (key === STORAGE_KEYS.RATE_HISTORY) return memoryStore.rate_history as unknown as T;
    if (key === STORAGE_KEYS.PRODUCT_ATTRS) return memoryStore.product_delivery_attributes as unknown as T;
    if (key === STORAGE_KEYS.ORDER_SHIPMENTS) return memoryStore.order_shipments as unknown as T;
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T): void {
  if (key === STORAGE_KEYS.ROUTES) memoryStore.routes = value as unknown as DeliveryRoute[];
  if (key === STORAGE_KEYS.RATE_HISTORY) memoryStore.rate_history = value as unknown as DeliveryRateChangeRecord[];
  if (key === STORAGE_KEYS.PRODUCT_ATTRS) memoryStore.product_delivery_attributes = value as unknown as Record<string, ProductDeliveryAttributes>;
  if (key === STORAGE_KEYS.ORDER_SHIPMENTS) memoryStore.order_shipments = value as unknown as Record<string, OrderShipment[]>;

  if (hasLocalStorage()) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore quota errors
    }
  }
}

/**
 * Synchronize state with the shared Vite middleware endpoint `/__dovi_delivery_db__`
 * so changes in Admin Portal (port 5174) are immediately visible in Buyer Frontend (port 5173)
 * and vice versa.
 */
export async function syncDeliveryStoreFromServer(): Promise<DeliveryStoreState> {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') {
    return getLocalDeliveryStore();
  }
  try {
    const res = await fetch('/__dovi_delivery_db__', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const serverData = (await res.json()) as Partial<DeliveryStoreState>;
      const local = getLocalDeliveryStore();

      // Merge routes by ID (taking newest updated_at)
      const routeMap = new Map<string, DeliveryRoute>();
      for (const r of local.routes) routeMap.set(r.id, r);
      for (const r of serverData.routes || []) {
        const existing = routeMap.get(r.id);
        if (!existing || new Date(r.updated_at).getTime() >= new Date(existing.updated_at).getTime()) {
          routeMap.set(r.id, r);
        }
      }
      const mergedRoutes = Array.from(routeMap.values());

      // Merge rate history by ID
      const historyMap = new Map<string, DeliveryRateChangeRecord>();
      for (const h of local.rate_history) historyMap.set(h.id, h);
      for (const h of serverData.rate_history || []) historyMap.set(h.id, h);
      const mergedHistory = Array.from(historyMap.values()).sort(
        (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
      );

      // Merge product delivery attributes
      const mergedProductAttrs: Record<string, ProductDeliveryAttributes> = {
        ...local.product_delivery_attributes,
        ...(serverData.product_delivery_attributes || {}),
      };

      // Merge order shipments
      const mergedShipments: Record<string, OrderShipment[]> = {
        ...local.order_shipments,
        ...(serverData.order_shipments || {}),
      };

      writeLocal(STORAGE_KEYS.ROUTES, mergedRoutes);
      writeLocal(STORAGE_KEYS.RATE_HISTORY, mergedHistory);
      writeLocal(STORAGE_KEYS.PRODUCT_ATTRS, mergedProductAttrs);
      writeLocal(STORAGE_KEYS.ORDER_SHIPMENTS, mergedShipments);

      return {
        routes: mergedRoutes,
        rate_history: mergedHistory,
        product_delivery_attributes: mergedProductAttrs,
        order_shipments: mergedShipments,
      };
    }
  } catch {
    // Offline or non-Vite environment
  }
  return getLocalDeliveryStore();
}

export async function pushDeliveryStoreToServer(partial?: Partial<DeliveryStoreState>): Promise<void> {
  const current = getLocalDeliveryStore();
  const payload: DeliveryStoreState = {
    routes: partial?.routes ?? current.routes,
    rate_history: partial?.rate_history ?? current.rate_history,
    product_delivery_attributes: partial?.product_delivery_attributes ?? current.product_delivery_attributes,
    order_shipments: partial?.order_shipments ?? current.order_shipments,
  };
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      await fetch('/__dovi_delivery_db__', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // Ignore network error if dev server endpoint is not active
    }
  }
}

export function getLocalDeliveryStore(): DeliveryStoreState {
  return {
    routes: readLocal<DeliveryRoute[]>(STORAGE_KEYS.ROUTES, []),
    rate_history: readLocal<DeliveryRateChangeRecord[]>(STORAGE_KEYS.RATE_HISTORY, []),
    product_delivery_attributes: readLocal<Record<string, ProductDeliveryAttributes>>(STORAGE_KEYS.PRODUCT_ATTRS, {}),
    order_shipments: readLocal<Record<string, OrderShipment[]>>(STORAGE_KEYS.ORDER_SHIPMENTS, {}),
  };
}

export function resetDeliveryStoreForTesting(): void {
  writeLocal(STORAGE_KEYS.ROUTES, []);
  writeLocal(STORAGE_KEYS.RATE_HISTORY, []);
  writeLocal(STORAGE_KEYS.PRODUCT_ATTRS, {});
  writeLocal(STORAGE_KEYS.ORDER_SHIPMENTS, {});
}

// ----------------------------------------------------------
// ADMIN AUTHORIZATION GUARD (TEST I)
// ----------------------------------------------------------
export function assertAuthorizedAdmin(actor: AdminActor | null | undefined): void {
  if (!actor || String(actor.role).toUpperCase() !== 'ADMIN') {
    const error = new Error(
      'Forbidden: Only authorized administrators can create, edit, activate, deactivate, or manage delivery rates and fulfillment.'
    ) as Error & { status?: number; code?: string };
    error.status = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }
}

// ----------------------------------------------------------
// PRODUCT DELIVERY METADATA SERIALIZATION & PARSING
// Embeds `<!-- DOVI_DELIVERY: {...} -->` in product description
// so delivery classification & attributes persist on remote backend.
// ----------------------------------------------------------
const DOVI_DELIVERY_REGEX = /\n*<!-- DOVI_DELIVERY: (.*?) -->/s;

export function serializeProductDescriptionWithDelivery(
  cleanOrExistingDescription: string,
  deliveryAttrs: ProductDeliveryAttributes
): string {
  const stripped = (cleanOrExistingDescription || '').replace(DOVI_DELIVERY_REGEX, '').trim();
  const serialized = JSON.stringify({
    delivery_classification: deliveryAttrs.delivery_classification,
    weight_kg: deliveryAttrs.weight_kg ?? null,
    dimensions_cm: deliveryAttrs.dimensions_cm ?? null,
    requires_special_handling: Boolean(deliveryAttrs.requires_special_handling),
    can_consolidate_with_furniture: Boolean(deliveryAttrs.can_consolidate_with_furniture),
    max_items_per_shipment: deliveryAttrs.max_items_per_shipment ?? null,
    delivery_notes: deliveryAttrs.delivery_notes ?? null,
  });
  return `${stripped}\n\n<!-- DOVI_DELIVERY: ${serialized} -->`;
}

export function stripDeliveryMetadataFromDescription(rawDescription: string | null | undefined): string {
  if (!rawDescription) return '';
  return rawDescription.replace(DOVI_DELIVERY_REGEX, '').trim();
}

export function parseDeliveryMetadataFromDescription(
  rawDescription: string | null | undefined
): ProductDeliveryAttributes | null {
  if (!rawDescription) return null;
  const match = rawDescription.match(DOVI_DELIVERY_REGEX);
  if (!match || !match[1]) return null;
  try {
    const parsed = JSON.parse(match[1]);
    if (parsed && parsed.delivery_classification) {
      return {
        delivery_classification: parsed.delivery_classification as ParcelClassification,
        weight_kg: parsed.weight_kg != null ? Number(parsed.weight_kg) : null,
        dimensions_cm: parsed.dimensions_cm || null,
        requires_special_handling: Boolean(parsed.requires_special_handling),
        can_consolidate_with_furniture: Boolean(parsed.can_consolidate_with_furniture),
        max_items_per_shipment: parsed.max_items_per_shipment != null ? Number(parsed.max_items_per_shipment) : null,
        delivery_notes: parsed.delivery_notes || null,
      };
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Suggests an initial parcel classification in the Admin UI when an admin is
 * configuring a product for the first time. Never permanently locks a product
 * by category alone — admin can always override.
 */
export function suggestParcelClassificationForAdmin(product: {
  name?: string;
  category_name?: string;
  description?: string;
}): ParcelClassification {
  const text = `${product.name || ''} ${product.category_name || ''} ${product.description || ''}`.toLowerCase();
  if (
    /\b(chair|table|bed|sofa|couch|wardrobe|cabinet|mattress|desk|bookshelf|furniture|dining set)\b/.test(text)
  ) {
    return 'FURNITURE_BULKY';
  }
  if (
    /\b(standing fan|refrigerator|fridge|freezer|washing machine|generator|air conditioner|television|tv|microwave|inverter|stabilizer|speaker system|home theater|appliance)\b/.test(
      text
    )
  ) {
    return 'HEAVY_PARCEL';
  }
  return 'SMALL_PARCEL';
}

/**
 * Extracts configured delivery attributes for a product from:
 * 1. Explicit fields on the product object
 * 2. Admin Product Delivery Attributes map in shared store
 * 3. Embedded `<!-- DOVI_DELIVERY: {...} -->` metadata in `product.description`
 */
export function getProductDeliveryAttributes(
  product: Partial<Product> | Partial<ProductSummary> | Record<string, any> | null | undefined
): ProductDeliveryAttributes | null {
  if (!product) return null;

  if (product.delivery_attributes && product.delivery_attributes.delivery_classification) {
    return product.delivery_attributes;
  }

  if (product.delivery_classification) {
    return {
      delivery_classification: product.delivery_classification,
      weight_kg: product.weight_kg ?? null,
      dimensions_cm: product.dimensions_cm ?? null,
      requires_special_handling: Boolean(product.requires_special_handling),
      can_consolidate_with_furniture: Boolean(product.can_consolidate_with_furniture),
      max_items_per_shipment: product.max_items_per_shipment ?? null,
      delivery_notes: product.delivery_notes ?? null,
    };
  }

  if (product.id) {
    const storeAttrs = readLocal<Record<string, ProductDeliveryAttributes>>(STORAGE_KEYS.PRODUCT_ATTRS, {})[
      String(product.id)
    ];
    if (storeAttrs && storeAttrs.delivery_classification) {
      return storeAttrs;
    }
  }

  const fromDesc = parseDeliveryMetadataFromDescription(product.description);
  if (fromDesc) {
    return fromDesc;
  }

  return null;
}

export function saveProductDeliveryAttributes(
  productId: string,
  attrs: ProductDeliveryAttributes,
  actor?: AdminActor
): ProductDeliveryAttributes {
  if (actor) {
    assertAuthorizedAdmin(actor);
  }
  const map = readLocal<Record<string, ProductDeliveryAttributes>>(STORAGE_KEYS.PRODUCT_ATTRS, {});
  const normalized: ProductDeliveryAttributes = {
    delivery_classification: attrs.delivery_classification,
    weight_kg: attrs.weight_kg != null && !Number.isNaN(Number(attrs.weight_kg)) ? Number(attrs.weight_kg) : null,
    dimensions_cm: attrs.dimensions_cm ? String(attrs.dimensions_cm).trim() : null,
    requires_special_handling: Boolean(attrs.requires_special_handling),
    can_consolidate_with_furniture: Boolean(attrs.can_consolidate_with_furniture),
    max_items_per_shipment:
      attrs.max_items_per_shipment != null && !Number.isNaN(Number(attrs.max_items_per_shipment))
        ? Number(attrs.max_items_per_shipment)
        : null,
    delivery_notes: attrs.delivery_notes ? String(attrs.delivery_notes).trim() : null,
  };
  map[String(productId)] = normalized;
  writeLocal(STORAGE_KEYS.PRODUCT_ATTRS, map);
  void pushDeliveryStoreToServer({ product_delivery_attributes: map });
  return normalized;
}

export function enrichProductWithDelivery<T extends Record<string, any>>(product: T): T {
  const attrs = getProductDeliveryAttributes(product);
  if (!attrs) return product;
  return {
    ...product,
    delivery_classification: attrs.delivery_classification,
    weight_kg: attrs.weight_kg ?? null,
    dimensions_cm: attrs.dimensions_cm ?? null,
    requires_special_handling: Boolean(attrs.requires_special_handling),
    can_consolidate_with_furniture: Boolean(attrs.can_consolidate_with_furniture),
    max_items_per_shipment: attrs.max_items_per_shipment ?? null,
    delivery_notes: attrs.delivery_notes ?? null,
    delivery_attributes: attrs,
  };
}

// ----------------------------------------------------------
// ADMIN DELIVERY ROUTE & RATE MANAGEMENT (WITH AUDIT HISTORY)
// ----------------------------------------------------------
export interface CreateOrUpdateRouteInput {
  dispatch_origin?: string;
  destination_state: string;
  destination_city: string;
  small_parcel_rate?: number | null;
  heavy_parcel_rate?: number | null;
  furniture_bulky_rate?: number | null;
  combined_furniture_rate?: number | null;
  special_handling_surcharge?: number | null;
  allows_furniture_small_consolidation?: boolean;
  max_furniture_items_consolidated?: number;
  max_small_parcel_weight_kg?: number;
  max_heavy_parcel_weight_kg?: number;
  special_delivery_requirements?: string | null;
  estimated_delivery_days?: string | null;
  is_active?: boolean;
  reason?: string;
}

function normalizeRateValue(val: number | string | null | undefined): number | null {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  if (Number.isNaN(num) || num < 0) return null;
  return num;
}

export function listDeliveryRoutes(includeInactive = true): DeliveryRoute[] {
  const routes = readLocal<DeliveryRoute[]>(STORAGE_KEYS.ROUTES, []);
  const filtered = includeInactive ? routes : routes.filter((r) => r.is_active);
  return [...filtered].sort((a, b) => {
    const stateCmp = a.destination_state.localeCompare(b.destination_state);
    if (stateCmp !== 0) return stateCmp;
    return a.destination_city.localeCompare(b.destination_city);
  });
}

export function findActiveRoute(
  destinationState: string,
  destinationCity: string,
  dispatchOrigin = PRIMARY_DISPATCH_ORIGIN
): DeliveryRoute | null {
  const normOrigin = (dispatchOrigin || PRIMARY_DISPATCH_ORIGIN).trim().toLowerCase();
  const normState = (destinationState || '').trim().toLowerCase();
  const normCity = (destinationCity || '').trim().toLowerCase();

  if (!normState) return null;

  const activeRoutes = listDeliveryRoutes(false).filter(
    (r) => (r.dispatch_origin || PRIMARY_DISPATCH_ORIGIN).trim().toLowerCase() === normOrigin
  );

  // 1. Exact state + city match
  const exactMatch = activeRoutes.find(
    (r) =>
      r.destination_state.trim().toLowerCase() === normState &&
      r.destination_city.trim().toLowerCase() === normCity
  );
  if (exactMatch) return exactMatch;

  // 2. State-wide fallback route (where destination_city is 'All Cities', '*', or matches state name)
  const stateWideMatch = activeRoutes.find(
    (r) =>
      r.destination_state.trim().toLowerCase() === normState &&
      ['all cities', 'all', '*', normState].includes(r.destination_city.trim().toLowerCase())
  );
  return stateWideMatch || null;
}

export function listRateChangeHistory(routeId?: string): DeliveryRateChangeRecord[] {
  const history = readLocal<DeliveryRateChangeRecord[]>(STORAGE_KEYS.RATE_HISTORY, []);
  const filtered = routeId ? history.filter((h) => h.route_id === routeId) : history;
  return [...filtered].sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
}

export function createDeliveryRoute(input: CreateOrUpdateRouteInput, actor: AdminActor): DeliveryRoute {
  assertAuthorizedAdmin(actor);

  const destinationState = (input.destination_state || '').trim();
  const destinationCity = (input.destination_city || '').trim();
  const dispatchOrigin = (input.dispatch_origin || PRIMARY_DISPATCH_ORIGIN).trim();

  if (!destinationState || !destinationCity) {
    throw new Error('Destination state and city are required to create a delivery route.');
  }

  const routes = readLocal<DeliveryRoute[]>(STORAGE_KEYS.ROUTES, []);
  const duplicate = routes.find(
    (r) =>
      r.dispatch_origin.toLowerCase() === dispatchOrigin.toLowerCase() &&
      r.destination_state.toLowerCase() === destinationState.toLowerCase() &&
      r.destination_city.toLowerCase() === destinationCity.toLowerCase()
  );
  if (duplicate) {
    throw new Error(
      `A delivery route from ${dispatchOrigin} to ${destinationCity}, ${destinationState} already exists. Please edit the existing route.`
    );
  }

  const now = new Date().toISOString();
  const newRoute: DeliveryRoute = {
    id: `route_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    dispatch_origin: dispatchOrigin,
    destination_state: destinationState,
    destination_city: destinationCity,
    small_parcel_rate: normalizeRateValue(input.small_parcel_rate),
    heavy_parcel_rate: normalizeRateValue(input.heavy_parcel_rate),
    furniture_bulky_rate: normalizeRateValue(input.furniture_bulky_rate),
    combined_furniture_rate: normalizeRateValue(input.combined_furniture_rate),
    special_handling_surcharge: normalizeRateValue(input.special_handling_surcharge),
    allows_furniture_small_consolidation: Boolean(input.allows_furniture_small_consolidation),
    max_furniture_items_consolidated:
      input.max_furniture_items_consolidated != null ? Number(input.max_furniture_items_consolidated) : 2,
    max_small_parcel_weight_kg:
      input.max_small_parcel_weight_kg != null ? Number(input.max_small_parcel_weight_kg) : 15,
    max_heavy_parcel_weight_kg:
      input.max_heavy_parcel_weight_kg != null ? Number(input.max_heavy_parcel_weight_kg) : 80,
    special_delivery_requirements: input.special_delivery_requirements?.trim() || null,
    estimated_delivery_days: input.estimated_delivery_days?.trim() || '2-4 business days',
    is_active: input.is_active !== undefined ? Boolean(input.is_active) : true,
    created_at: now,
    updated_at: now,
    updated_by_id: actor.id || null,
    updated_by_email: actor.email,
    updated_by_name: actor.name || actor.email,
  };

  const history = readLocal<DeliveryRateChangeRecord[]>(STORAGE_KEYS.RATE_HISTORY, []);
  const rateFields: Array<{ key: keyof DeliveryRoute; label: string }> = [
    { key: 'small_parcel_rate', label: 'Small Parcel' },
    { key: 'heavy_parcel_rate', label: 'Heavy Parcel' },
    { key: 'furniture_bulky_rate', label: 'Furniture / Bulky Item' },
    { key: 'combined_furniture_rate', label: 'Combined Furniture' },
    { key: 'special_handling_surcharge', label: 'Special Handling Surcharge' },
  ];

  for (const field of rateFields) {
    const val = newRoute[field.key] as number | null;
    if (val !== null) {
      history.unshift({
        id: `rate_hist_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        route_id: newRoute.id,
        dispatch_origin: newRoute.dispatch_origin,
        destination: `${newRoute.destination_city}, ${newRoute.destination_state}`,
        delivery_classification: field.label,
        previous_rate: null,
        new_rate: val,
        changed_by_id: actor.id || null,
        changed_by_email: actor.email,
        changed_by_name: actor.name || actor.email,
        reason: input.reason || 'Initial route rate configuration',
        changed_at: now,
      });
    }
  }

  routes.push(newRoute);
  writeLocal(STORAGE_KEYS.ROUTES, routes);
  writeLocal(STORAGE_KEYS.RATE_HISTORY, history);
  void pushDeliveryStoreToServer({ routes, rate_history: history });

  return newRoute;
}

export function updateDeliveryRoute(
  routeId: string,
  updates: Partial<CreateOrUpdateRouteInput>,
  actor: AdminActor
): DeliveryRoute {
  assertAuthorizedAdmin(actor);

  const routes = readLocal<DeliveryRoute[]>(STORAGE_KEYS.ROUTES, []);
  const idx = routes.findIndex((r) => r.id === routeId);
  if (idx === -1) {
    throw new Error(`Delivery route ${routeId} not found.`);
  }

  const existing = routes[idx];
  const now = new Date().toISOString();

  const updated: DeliveryRoute = {
    ...existing,
    dispatch_origin:
      updates.dispatch_origin !== undefined ? updates.dispatch_origin.trim() : existing.dispatch_origin,
    destination_state:
      updates.destination_state !== undefined ? updates.destination_state.trim() : existing.destination_state,
    destination_city:
      updates.destination_city !== undefined ? updates.destination_city.trim() : existing.destination_city,
    small_parcel_rate:
      updates.small_parcel_rate !== undefined
        ? normalizeRateValue(updates.small_parcel_rate)
        : existing.small_parcel_rate,
    heavy_parcel_rate:
      updates.heavy_parcel_rate !== undefined
        ? normalizeRateValue(updates.heavy_parcel_rate)
        : existing.heavy_parcel_rate,
    furniture_bulky_rate:
      updates.furniture_bulky_rate !== undefined
        ? normalizeRateValue(updates.furniture_bulky_rate)
        : existing.furniture_bulky_rate,
    combined_furniture_rate:
      updates.combined_furniture_rate !== undefined
        ? normalizeRateValue(updates.combined_furniture_rate)
        : existing.combined_furniture_rate,
    special_handling_surcharge:
      updates.special_handling_surcharge !== undefined
        ? normalizeRateValue(updates.special_handling_surcharge)
        : existing.special_handling_surcharge,
    allows_furniture_small_consolidation:
      updates.allows_furniture_small_consolidation !== undefined
        ? Boolean(updates.allows_furniture_small_consolidation)
        : existing.allows_furniture_small_consolidation,
    max_furniture_items_consolidated:
      updates.max_furniture_items_consolidated !== undefined
        ? Number(updates.max_furniture_items_consolidated)
        : existing.max_furniture_items_consolidated,
    max_small_parcel_weight_kg:
      updates.max_small_parcel_weight_kg !== undefined
        ? Number(updates.max_small_parcel_weight_kg)
        : existing.max_small_parcel_weight_kg,
    max_heavy_parcel_weight_kg:
      updates.max_heavy_parcel_weight_kg !== undefined
        ? Number(updates.max_heavy_parcel_weight_kg)
        : existing.max_heavy_parcel_weight_kg,
    special_delivery_requirements:
      updates.special_delivery_requirements !== undefined
        ? updates.special_delivery_requirements?.trim() || null
        : existing.special_delivery_requirements,
    estimated_delivery_days:
      updates.estimated_delivery_days !== undefined
        ? updates.estimated_delivery_days?.trim() || null
        : existing.estimated_delivery_days,
    is_active: updates.is_active !== undefined ? Boolean(updates.is_active) : existing.is_active,
    updated_at: now,
    updated_by_id: actor.id || null,
    updated_by_email: actor.email,
    updated_by_name: actor.name || actor.email,
  };

  // Record audit history for any rate changes (Test H)
  const history = readLocal<DeliveryRateChangeRecord[]>(STORAGE_KEYS.RATE_HISTORY, []);
  const rateComparisons: Array<{
    prev: number | null;
    next: number | null;
    classification: string;
  }> = [
    {
      prev: existing.small_parcel_rate,
      next: updated.small_parcel_rate,
      classification: 'Small Parcel',
    },
    {
      prev: existing.heavy_parcel_rate,
      next: updated.heavy_parcel_rate,
      classification: 'Heavy Parcel',
    },
    {
      prev: existing.furniture_bulky_rate,
      next: updated.furniture_bulky_rate,
      classification: 'Furniture / Bulky Item',
    },
    {
      prev: existing.combined_furniture_rate,
      next: updated.combined_furniture_rate,
      classification: 'Combined Furniture',
    },
    {
      prev: existing.special_handling_surcharge,
      next: updated.special_handling_surcharge,
      classification: 'Special Handling Surcharge',
    },
  ];

  for (const cmp of rateComparisons) {
    if (cmp.prev !== cmp.next) {
      history.unshift({
        id: `rate_hist_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        route_id: updated.id,
        dispatch_origin: updated.dispatch_origin,
        destination: `${updated.destination_city}, ${updated.destination_state}`,
        delivery_classification: cmp.classification,
        previous_rate: cmp.prev,
        new_rate: cmp.next,
        changed_by_id: actor.id || null,
        changed_by_email: actor.email,
        changed_by_name: actor.name || actor.email,
        reason: updates.reason || 'Transport rate updated by administrator',
        changed_at: now,
      });
    }
  }

  routes[idx] = updated;
  writeLocal(STORAGE_KEYS.ROUTES, routes);
  writeLocal(STORAGE_KEYS.RATE_HISTORY, history);
  void pushDeliveryStoreToServer({ routes, rate_history: history });

  return updated;
}

export function deleteDeliveryRoute(routeId: string, actor: AdminActor): void {
  assertAuthorizedAdmin(actor);
  const routes = readLocal<DeliveryRoute[]>(STORAGE_KEYS.ROUTES, []);
  const filtered = routes.filter((r) => r.id !== routeId);
  writeLocal(STORAGE_KEYS.ROUTES, filtered);
  void pushDeliveryStoreToServer({ routes: filtered });
}

// ----------------------------------------------------------
// ORDER CONSOLIDATION & DELIVERY PRICING ENGINE
// Implements Sections 2, 3, 4, 5, 7, 8, 12 & Tests A–H, K
// ----------------------------------------------------------
export interface CalculateOrderDeliveryParams {
  items: EvaluableOrderItem[];
  destinationState: string;
  destinationCity: string;
  dispatchOrigin?: string;
  routeOverride?: DeliveryRoute | null;
}

function computeGroupWeight(items: ShipmentItem[]): number | null {
  let total = 0;
  let hasAnyWeight = false;
  for (const item of items) {
    if (item.weight_kg != null && !Number.isNaN(Number(item.weight_kg)) && Number(item.weight_kg) > 0) {
      total += Number(item.weight_kg) * item.quantity;
      hasAnyWeight = true;
    }
  }
  return hasAnyWeight ? Number(total.toFixed(2)) : null;
}

function computeGroupDimensions(items: ShipmentItem[]): string | null {
  const dims = items
    .map((i) => (i.dimensions_cm ? `${i.product_name}: ${i.dimensions_cm}${i.quantity > 1 ? ` (x${i.quantity})` : ''}` : null))
    .filter(Boolean);
  return dims.length > 0 ? dims.join(' | ') : null;
}

export function calculateOrderDelivery(params: CalculateOrderDeliveryParams): DeliveryCalculationResult {
  const dispatchOrigin = (params.dispatchOrigin || PRIMARY_DISPATCH_ORIGIN).trim();
  const destinationState = (params.destinationState || '').trim();
  const destinationCity = (params.destinationCity || '').trim();
  const now = new Date().toISOString();

  // Compute product subtotal accurately
  const productSubtotal = Number(
    params.items
      .reduce((sum, item) => sum + Number(item.unit_price || 0) * Math.max(1, Number(item.quantity || 1)), 0)
      .toFixed(2)
  );

  const route =
    params.routeOverride !== undefined
      ? params.routeOverride
      : findActiveRoute(destinationState, destinationCity, dispatchOrigin);

  const manualQuoteReasons: string[] = [];
  if (!destinationState || !destinationCity) {
    manualQuoteReasons.push('Delivery destination state and city must be selected.');
  } else if (!route) {
    manualQuoteReasons.push(
      `No configured delivery route found from ${dispatchOrigin} to ${destinationCity}, ${destinationState}. Manual delivery quotation required.`
    );
  }

  // Normalize items and resolve their configured delivery attributes
  const resolvedItems: Array<{
    shipmentItem: ShipmentItem;
    canConsolidateWithFurniture: boolean;
    maxItemsPerShipment: number | null;
    hasMissingClassification: boolean;
    deliveryNotes: string | null;
  }> = params.items.map((raw, idx) => {
    const storedAttrs = getProductDeliveryAttributes({
      id: raw.product_id,
      description: raw.description || undefined,
      delivery_classification: raw.delivery_classification || undefined,
      weight_kg: raw.weight_kg,
      dimensions_cm: raw.dimensions_cm,
      requires_special_handling: raw.requires_special_handling,
      can_consolidate_with_furniture: raw.can_consolidate_with_furniture,
      max_items_per_shipment: raw.max_items_per_shipment,
      delivery_notes: raw.delivery_notes,
    });

    const classification = raw.delivery_classification || storedAttrs?.delivery_classification || null;
    const hasMissingClassification = !classification;
    if (hasMissingClassification) {
      manualQuoteReasons.push(
        `Product "${raw.product_name}" does not have an assigned delivery classification. Administrator delivery confirmation is required.`
      );
    }

    const effectiveClassification: ParcelClassification = classification || 'SPECIAL_MANUAL_QUOTE';
    const weightKg = raw.weight_kg ?? storedAttrs?.weight_kg ?? null;
    const dimensionsCm = raw.dimensions_cm ?? storedAttrs?.dimensions_cm ?? null;
    const requiresSpecialHandling = Boolean(
      raw.requires_special_handling ?? storedAttrs?.requires_special_handling ?? false
    );
    const canConsolidateWithFurniture = Boolean(
      raw.can_consolidate_with_furniture ?? storedAttrs?.can_consolidate_with_furniture ?? false
    );
    const maxItemsPerShipment = raw.max_items_per_shipment ?? storedAttrs?.max_items_per_shipment ?? null;
    const deliveryNotes = raw.delivery_notes ?? storedAttrs?.delivery_notes ?? null;

    return {
      shipmentItem: {
        id: raw.id || `ship_item_${idx + 1}_${raw.product_id}`,
        product_id: String(raw.product_id),
        product_name: raw.product_name,
        variant_id: raw.variant_id || null,
        variant_name: raw.variant_name || null,
        quantity: Math.max(1, Number(raw.quantity || 1)),
        unit_price: Number(raw.unit_price || 0),
        delivery_classification: effectiveClassification,
        weight_kg: weightKg != null ? Number(weightKg) : null,
        dimensions_cm: dimensionsCm,
        requires_special_handling: requiresSpecialHandling,
        hub_received: false,
        hub_received_at: null,
        quality_checked: false,
        quality_checked_at: null,
        packaged: false,
        packaged_at: null,
        image_url: raw.image_url || null,
      },
      canConsolidateWithFurniture,
      maxItemsPerShipment,
      hasMissingClassification,
      deliveryNotes,
    };
  });

  // Partition items by classification
  const smallBucket = resolvedItems.filter((i) => i.shipmentItem.delivery_classification === 'SMALL_PARCEL');
  const heavyBucket = resolvedItems.filter((i) => i.shipmentItem.delivery_classification === 'HEAVY_PARCEL');
  const furnitureBucket = resolvedItems.filter((i) => i.shipmentItem.delivery_classification === 'FURNITURE_BULKY');
  const manualBucket = resolvedItems.filter(
    (i) => i.shipmentItem.delivery_classification === 'SPECIAL_MANUAL_QUOTE'
  );

  // Check if Small Parcels can consolidate directly into Furniture shipment (Test E)
  const canMergeSmallIntoFurniture =
    furnitureBucket.length > 0 &&
    smallBucket.length > 0 &&
    heavyBucket.length === 0 &&
    Boolean(route?.allows_furniture_small_consolidation) &&
    smallBucket.every((i) => i.canConsolidateWithFurniture) &&
    furnitureBucket.every((i) => i.canConsolidateWithFurniture || Boolean(route?.allows_furniture_small_consolidation));

  const shipmentGroups: DeliveryCalculationShipmentGroup[] = [];

  // 1. Handle Small + Heavy Parcel Consolidation
  const remainingSmall = canMergeSmallIntoFurniture ? [] : smallBucket;
  const parcelItems = [...remainingSmall, ...heavyBucket];

  if (parcelItems.length > 0) {
    const hasHeavy = heavyBucket.length > 0;
    const hasSmall = remainingSmall.length > 0;
    const shipmentItems = parcelItems.map((p) => p.shipmentItem);
    const combinedWeight = computeGroupWeight(shipmentItems);
    const combinedDimensions = computeGroupDimensions(shipmentItems);
    const totalQty = shipmentItems.reduce((sum, i) => sum + i.quantity, 0);

    const maxSmallWeight = route?.max_small_parcel_weight_kg ?? 15;
    const maxHeavyWeight = route?.max_heavy_parcel_weight_kg ?? 80;
    const weightUpgradedToHeavy = !hasHeavy && combinedWeight !== null && combinedWeight > maxSmallWeight;
    const exceedsHeavyLimit = combinedWeight !== null && combinedWeight > maxHeavyWeight;

    const effectiveClass: ParcelClassification =
      hasHeavy || weightUpgradedToHeavy ? 'HEAVY_PARCEL' : 'SMALL_PARCEL';

    let baseFee: number | null = null;
    let groupRequiresQuote = !route || exceedsHeavyLimit;
    let groupQuoteReason: string | null = null;

    if (!route) {
      groupQuoteReason = `Delivery rate not configured for ${destinationCity || 'destination'}, ${destinationState || 'state'}.`;
    } else if (exceedsHeavyLimit) {
      groupQuoteReason = `Combined parcel weight (${combinedWeight} kg) exceeds standard Heavy Parcel limit (${maxHeavyWeight} kg). Manual cargo quotation required.`;
    } else if (effectiveClass === 'SMALL_PARCEL') {
      if (route.small_parcel_rate !== null && route.small_parcel_rate >= 0) {
        baseFee = Number(route.small_parcel_rate);
      } else {
        groupRequiresQuote = true;
        groupQuoteReason = `Small Parcel rate is not configured for ${route.destination_city}, ${route.destination_state}.`;
      }
    } else {
      if (route.heavy_parcel_rate !== null && route.heavy_parcel_rate >= 0) {
        baseFee = Number(route.heavy_parcel_rate);
      } else {
        groupRequiresQuote = true;
        groupQuoteReason = `Heavy Parcel rate is not configured for ${route.destination_city}, ${route.destination_state}.`;
      }
    }

    const anySpecialHandling = shipmentItems.some((i) => i.requires_special_handling);
    let specialHandlingFee = 0;
    if (anySpecialHandling) {
      if (route && route.special_handling_surcharge !== null) {
        specialHandlingFee = Number(route.special_handling_surcharge);
      } else if (route) {
        groupRequiresQuote = true;
        groupQuoteReason =
          groupQuoteReason ||
          'One or more items require special handling and no surcharge is configured for this route.';
      }
    }

    if (groupRequiresQuote && groupQuoteReason && !manualQuoteReasons.includes(groupQuoteReason)) {
      manualQuoteReasons.push(groupQuoteReason);
    }

    const totalGroupFee = groupRequiresQuote || baseFee === null ? null : Number((baseFee + specialHandlingFee).toFixed(2));

    let consolidationExplanation = '';
    if (hasSmall && hasHeavy) {
      consolidationExplanation =
        'Small Parcel and Heavy Parcel items are consolidated into one combined Heavy Parcel shipment at our Onitsha hub so you pay a single delivery fee.';
    } else if (weightUpgradedToHeavy) {
      consolidationExplanation = `Multiple small parcels (${combinedWeight} kg total) consolidated into a single Heavy Parcel shipment from our Onitsha hub.`;
    } else if (totalQty > 1) {
      consolidationExplanation = `All ${totalQty} items consolidated into one ${PARCEL_CLASSIFICATION_LABELS[effectiveClass]} shipment from our Onitsha hub with a single delivery fee.`;
    } else {
      consolidationExplanation = `Single ${PARCEL_CLASSIFICATION_LABELS[effectiveClass]} dispatch from our Onitsha hub.`;
    }

    const separationReason =
      furnitureBucket.length > 0 || manualBucket.length > 0
        ? 'Standard parcels are packaged separately from Furniture / Bulky cargo to prevent transit damage and use the optimal courier arrangement.'
        : null;

    shipmentGroups.push({
      group_index: shipmentGroups.length + 1,
      shipment_classification: effectiveClass,
      classification_label: PARCEL_CLASSIFICATION_LABELS[effectiveClass],
      dispatch_origin: dispatchOrigin,
      destination_state: destinationState,
      destination_city: destinationCity,
      items: shipmentItems,
      total_item_quantity: totalQty,
      combined_weight_kg: combinedWeight,
      combined_dimensions_cm: combinedDimensions,
      base_delivery_fee: baseFee,
      special_handling_fee: specialHandlingFee,
      delivery_fee: totalGroupFee,
      requires_manual_quote: groupRequiresQuote,
      manual_quote_reason: groupQuoteReason,
      transport_arrangement:
        effectiveClass === 'HEAVY_PARCEL'
          ? 'DOVI Consolidated Heavy Van / Express Haulage from Onitsha Hub'
          : 'DOVI Consolidated Express Parcel Courier from Onitsha Hub',
      consolidation_explanation: consolidationExplanation,
      separation_reason: separationReason,
      delivery_notes: parcelItems
        .map((i) => i.deliveryNotes)
        .filter(Boolean)
        .join('; ') || null,
    });
  }

  // 2. Handle Furniture / Bulky Items (with optional consolidated Small Parcels)
  if (furnitureBucket.length > 0) {
    const mergedFurnitureList = canMergeSmallIntoFurniture
      ? [...furnitureBucket, ...smallBucket]
      : [...furnitureBucket];

    const shipmentItems = mergedFurnitureList.map((f) => f.shipmentItem);
    const totalFurnitureUnits = furnitureBucket.reduce((sum, f) => sum + f.shipmentItem.quantity, 0);
    const totalQty = shipmentItems.reduce((sum, i) => sum + i.quantity, 0);
    const combinedWeight = computeGroupWeight(shipmentItems);
    const combinedDimensions = computeGroupDimensions(shipmentItems);

    let baseFee: number | null = null;
    let groupRequiresQuote = !route;
    let groupQuoteReason: string | null = null;

    const bulkyMissingDimensions = furnitureBucket.find(
      (f) => f.shipmentItem.requires_special_handling && !f.shipmentItem.dimensions_cm
    );

    const maxConsolidatedFurniture = route?.max_furniture_items_consolidated ?? 2;

    if (!route) {
      groupQuoteReason = `Furniture / Bulky delivery rate not configured for ${destinationCity || 'destination'}, ${destinationState || 'state'}.`;
    } else if (bulkyMissingDimensions) {
      groupRequiresQuote = true;
      groupQuoteReason = `Bulky item "${bulkyMissingDimensions.shipmentItem.product_name}" requires special handling and dimension verification at Onitsha Hub for manual quotation.`;
    } else if (totalFurnitureUnits === 1) {
      if (route.furniture_bulky_rate !== null && route.furniture_bulky_rate >= 0) {
        baseFee = Number(route.furniture_bulky_rate);
      } else {
        groupRequiresQuote = true;
        groupQuoteReason = `Furniture / Bulky rate not configured for ${route.destination_city}, ${route.destination_state}. Manual quotation required.`;
      }
    } else {
      // Multiple furniture items (Test F): NEVER automatically multiply furniture rate per item!
      if (totalFurnitureUnits <= maxConsolidatedFurniture && route.combined_furniture_rate !== null && route.combined_furniture_rate >= 0) {
        baseFee = Number(route.combined_furniture_rate);
      } else if (totalFurnitureUnits > maxConsolidatedFurniture) {
        groupRequiresQuote = true;
        groupQuoteReason = `Order includes ${totalFurnitureUnits} Furniture / Bulky items (exceeding standard ${maxConsolidatedFurniture}-item consolidated cargo limit). Manual transport quotation required.`;
      } else {
        groupRequiresQuote = true;
        groupQuoteReason = `Multiple Furniture / Bulky items (${totalFurnitureUnits} units) require a combined transport quotation from Onitsha Hub rather than charging per item.`;
      }
    }

    const anySpecialHandling = shipmentItems.some((i) => i.requires_special_handling);
    let specialHandlingFee = 0;
    if (anySpecialHandling && !groupRequiresQuote) {
      if (route && route.special_handling_surcharge !== null) {
        specialHandlingFee = Number(route.special_handling_surcharge);
      }
    }

    if (groupRequiresQuote && groupQuoteReason && !manualQuoteReasons.includes(groupQuoteReason)) {
      manualQuoteReasons.push(groupQuoteReason);
    }

    const totalGroupFee = groupRequiresQuote || baseFee === null ? null : Number((baseFee + specialHandlingFee).toFixed(2));

    let consolidationExplanation = '';
    if (canMergeSmallIntoFurniture) {
      consolidationExplanation =
        'Your Small Parcel items and Furniture / Bulky item are consolidated into a single dedicated transport shipment from Onitsha Hub.';
    } else if (totalFurnitureUnits > 1) {
      consolidationExplanation = groupRequiresQuote
        ? `Multiple furniture items (${totalFurnitureUnits} units) grouped for a single combined cargo quotation (we never multiply the single-item furniture fee per item).`
        : `Multiple furniture items (${totalFurnitureUnits} units) consolidated into one combined Furniture / Bulky cargo shipment from Onitsha Hub.`;
    } else {
      consolidationExplanation = 'Dedicated Furniture / Bulky cargo transport from our Onitsha hub.';
    }

    const separationReason =
      !canMergeSmallIntoFurniture && parcelItems.length > 0
        ? 'Furniture / Bulky items require specialized cargo handling and are shipped separately from standard parcels so neither shipment is damaged.'
        : null;

    shipmentGroups.push({
      group_index: shipmentGroups.length + 1,
      shipment_classification: 'FURNITURE_BULKY',
      classification_label: PARCEL_CLASSIFICATION_LABELS.FURNITURE_BULKY,
      dispatch_origin: dispatchOrigin,
      destination_state: destinationState,
      destination_city: destinationCity,
      items: shipmentItems,
      total_item_quantity: totalQty,
      combined_weight_kg: combinedWeight,
      combined_dimensions_cm: combinedDimensions,
      base_delivery_fee: baseFee,
      special_handling_fee: specialHandlingFee,
      delivery_fee: totalGroupFee,
      requires_manual_quote: groupRequiresQuote,
      manual_quote_reason: groupQuoteReason,
      transport_arrangement: 'DOVI Dedicated Bulky & Furniture Cargo Transport from Onitsha Hub',
      consolidation_explanation: consolidationExplanation,
      separation_reason: separationReason,
      delivery_notes: mergedFurnitureList
        .map((i) => i.deliveryNotes)
        .filter(Boolean)
        .join('; ') || null,
    });
  }

  // 3. Handle Special Delivery / Manual Quote Items (or unclassified products)
  if (manualBucket.length > 0) {
    const shipmentItems = manualBucket.map((m) => m.shipmentItem);
    const totalQty = shipmentItems.reduce((sum, i) => sum + i.quantity, 0);
    const combinedWeight = computeGroupWeight(shipmentItems);
    const combinedDimensions = computeGroupDimensions(shipmentItems);

    const hasUnclassified = manualBucket.some((m) => m.hasMissingClassification);
    const groupQuoteReason = hasUnclassified
      ? 'One or more products require delivery classification confirmation by an administrator.'
      : 'Special Delivery / Manual Quote items require custom transport pricing from our Onitsha dispatch team.';

    if (!manualQuoteReasons.includes(groupQuoteReason)) {
      manualQuoteReasons.push(groupQuoteReason);
    }

    shipmentGroups.push({
      group_index: shipmentGroups.length + 1,
      shipment_classification: 'SPECIAL_MANUAL_QUOTE',
      classification_label: PARCEL_CLASSIFICATION_LABELS.SPECIAL_MANUAL_QUOTE,
      dispatch_origin: dispatchOrigin,
      destination_state: destinationState,
      destination_city: destinationCity,
      items: shipmentItems,
      total_item_quantity: totalQty,
      combined_weight_kg: combinedWeight,
      combined_dimensions_cm: combinedDimensions,
      base_delivery_fee: null,
      special_handling_fee: 0,
      delivery_fee: null,
      requires_manual_quote: true,
      manual_quote_reason: groupQuoteReason,
      transport_arrangement: 'Custom Arranged Specialized Transport from Onitsha Hub',
      consolidation_explanation:
        'Items requiring custom handling or manual delivery confirmation are grouped for assessment by our Onitsha logistics team.',
      separation_reason:
        shipmentGroups.length > 0
          ? 'Separated because these items require custom transport evaluation and manual rate confirmation.'
          : null,
      delivery_notes: manualBucket
        .map((i) => i.deliveryNotes)
        .filter(Boolean)
        .join('; ') || null,
    });
  }

  const requiresManualQuote =
    manualQuoteReasons.length > 0 || shipmentGroups.some((g) => g.requires_manual_quote || g.delivery_fee === null);

  const baseDeliveryTotal = requiresManualQuote
    ? null
    : Number(shipmentGroups.reduce((sum, g) => sum + Number(g.base_delivery_fee || 0), 0).toFixed(2));

  const specialHandlingTotal = Number(
    shipmentGroups.reduce((sum, g) => sum + Number(g.special_handling_fee || 0), 0).toFixed(2)
  );

  const totalDeliveryFee = requiresManualQuote
    ? null
    : Number(shipmentGroups.reduce((sum, g) => sum + Number(g.delivery_fee || 0), 0).toFixed(2));

  const totalPayable =
    requiresManualQuote || totalDeliveryFee === null
      ? null
      : Number((productSubtotal + totalDeliveryFee).toFixed(2));

  let overallExplanation = '';
  if (requiresManualQuote) {
    overallExplanation =
      manualQuoteReasons[0] ||
      'Delivery confirmation required: Our Onitsha logistics team will confirm the exact delivery fee for your destination and items before payment.';
  } else if (shipmentGroups.length === 1) {
    overallExplanation = shipmentGroups[0].consolidation_explanation;
  } else if (shipmentGroups.length > 1) {
    overallExplanation = `Your order requires ${shipmentGroups.length} separate shipments from our Onitsha hub because ${
      shipmentGroups[1]?.separation_reason ||
      'items require different transport arrangements to ensure safe delivery.'
    }`;
  }

  return {
    dispatch_origin: dispatchOrigin,
    destination_state: destinationState,
    destination_city: destinationCity,
    route_id: route?.id || null,
    route_found: Boolean(route),
    route_updated_at: route?.updated_at || null,
    shipment_count: shipmentGroups.length,
    is_consolidated: shipmentGroups.length === 1,
    requires_manual_quote: requiresManualQuote,
    manual_quote_reasons: manualQuoteReasons,
    manual_quote_reason: manualQuoteReasons[0] || null,
    product_subtotal: productSubtotal,
    base_delivery_total: baseDeliveryTotal,
    special_handling_total: specialHandlingTotal,
    special_handling_fee: specialHandlingTotal,
    total_delivery_fee: totalDeliveryFee,
    total_payable: totalPayable,
    overall_explanation: overallExplanation,
    consolidation_summary: overallExplanation,
    shipments: shipmentGroups,
    shipment_groups: shipmentGroups,
    calculated_at: now,
  };
}

// ----------------------------------------------------------
// SHIPMENT CREATION, ONITSHA HUB FULFILLMENT & MANUAL QUOTES
// ----------------------------------------------------------
export function buildOrderShipmentsFromCalculation(
  orderId: string,
  orderReference: string,
  calculation: DeliveryCalculationResult,
  destinationAddress?: string | null,
  recipientName?: string | null,
  recipientPhone?: string | null
): OrderShipment[] {
  const now = new Date().toISOString();
  const shipments: OrderShipment[] = calculation.shipments.map((group, idx) => {
    const initialStatus: ShipmentFulfillmentStatus = group.requires_manual_quote
      ? 'AWAITING_DELIVERY_CONFIRMATION'
      : 'ORDER_PLACED';

    return {
      id: `ship_${orderId}_${idx + 1}`,
      shipment_reference: `${orderReference}-SHP-${idx + 1}`,
      order_id: String(orderId),
      order_reference: orderReference,
      dispatch_origin: group.dispatch_origin || PRIMARY_DISPATCH_ORIGIN,
      destination_state: group.destination_state,
      destination_city: group.destination_city,
      destination_address: destinationAddress || null,
      recipient_name: recipientName || null,
      recipient_phone: recipientPhone || null,
      shipment_classification: group.shipment_classification,
      items: group.items.map((item) => ({ ...item })),
      combined_weight_kg: group.combined_weight_kg,
      combined_dimensions_cm: group.combined_dimensions_cm,
      delivery_fee: group.delivery_fee,
      special_handling_fee: group.special_handling_fee,
      requires_manual_quote: group.requires_manual_quote,
      manual_quote_status: group.requires_manual_quote ? 'PENDING_ADMIN_QUOTE' : 'NOT_REQUIRED',
      manual_quote_reason: group.manual_quote_reason || null,
      status: initialStatus,
      transport_arrangement: group.transport_arrangement,
      separation_reason: group.separation_reason || null,
      delivery_notes: group.delivery_notes || null,
      tracking_reference: `${orderReference}-TRK-${idx + 1}`,
      hub_received_confirmed: false,
      hub_inspected_confirmed: false,
      hub_packaged_confirmed: false,
      created_at: now,
      updated_at: now,
      dispatched_at: null,
      delivered_at: null,
    };
  });

  saveOrderShipments(orderId, orderReference, shipments);
  return shipments;
}

export function getOrderShipments(orderIdOrReference: string, fallbackRef?: string): OrderShipment[] {
  const map = readLocal<Record<string, OrderShipment[]>>(STORAGE_KEYS.ORDER_SHIPMENTS, {});
  const primary = map[String(orderIdOrReference)];
  if (primary && primary.length > 0) return primary;
  if (fallbackRef && map[String(fallbackRef)]) return map[String(fallbackRef)];
  return [];
}

export function getAllStoredOrderShipments(): Record<string, OrderShipment[]> {
  return readLocal<Record<string, OrderShipment[]>>(STORAGE_KEYS.ORDER_SHIPMENTS, {});
}

export function saveOrderShipments(
  orderId: string,
  orderReference: string,
  shipments: OrderShipment[]
): void {
  const map = readLocal<Record<string, OrderShipment[]>>(STORAGE_KEYS.ORDER_SHIPMENTS, {});
  map[String(orderId)] = shipments;
  if (orderReference) {
    map[String(orderReference)] = shipments;
  }
  writeLocal(STORAGE_KEYS.ORDER_SHIPMENTS, map);
  void pushDeliveryStoreToServer({ order_shipments: map });
}

export function updateShipmentItemHubStatus(
  orderIdOrRef: string,
  shipmentId: string,
  itemId: string,
  updates: {
    hub_received?: boolean;
    quality_checked?: boolean;
    packaged?: boolean;
  },
  actor: AdminActor
): OrderShipment {
  assertAuthorizedAdmin(actor);

  const shipments = getOrderShipments(orderIdOrRef);
  const sIdx = shipments.findIndex((s) => s.id === shipmentId);
  if (sIdx === -1) {
    throw new Error(`Shipment ${shipmentId} not found for order ${orderIdOrRef}.`);
  }

  const shipment = { ...shipments[sIdx], items: shipments[sIdx].items.map((i) => ({ ...i })) };
  const iIdx = shipment.items.findIndex((i) => i.id === itemId || i.product_id === itemId);
  if (iIdx === -1) {
    throw new Error(`Item ${itemId} not found in shipment ${shipmentId}.`);
  }

  const now = new Date().toISOString();
  const item = shipment.items[iIdx];

  if (updates.hub_received !== undefined) {
    item.hub_received = Boolean(updates.hub_received);
    item.hub_received_at = item.hub_received ? now : null;
    if (!item.hub_received) {
      item.quality_checked = false;
      item.quality_checked_at = null;
      item.packaged = false;
      item.packaged_at = null;
    }
  }

  if (updates.quality_checked !== undefined) {
    if (updates.quality_checked && !item.hub_received) {
      throw new Error(`Cannot mark "${item.product_name}" as quality checked before it is received at the Onitsha hub.`);
    }
    item.quality_checked = Boolean(updates.quality_checked);
    item.quality_checked_at = item.quality_checked ? now : null;
    if (!item.quality_checked) {
      item.packaged = false;
      item.packaged_at = null;
    }
  }

  if (updates.packaged !== undefined) {
    if (updates.packaged && (!item.hub_received || !item.quality_checked)) {
      throw new Error(
        `Cannot package "${item.product_name}" until it has been received and passed quality inspection at the Onitsha hub.`
      );
    }
    item.packaged = Boolean(updates.packaged);
    item.packaged_at = item.packaged ? now : null;
  }

  const allReceived = shipment.items.every((i) => i.hub_received);
  const someReceived = shipment.items.some((i) => i.hub_received);
  const allInspected = allReceived && shipment.items.every((i) => i.quality_checked);
  const allPackaged = allInspected && shipment.items.every((i) => i.packaged);

  shipment.hub_received_confirmed = allReceived;
  shipment.hub_inspected_confirmed = allInspected;
  shipment.hub_packaged_confirmed = allPackaged;
  shipment.updated_at = now;

  if (!['DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(shipment.status)) {
    if (allPackaged) {
      shipment.status = 'PACKAGED';
    } else if (allInspected) {
      shipment.status = 'READY_FOR_PACKAGING';
    } else if (allReceived) {
      shipment.status = 'PRODUCTS_RECEIVED';
    } else if (someReceived && !allReceived) {
      shipment.status = 'AWAITING_PRODUCTS_AT_HUB';
    }
  }

  shipments[sIdx] = shipment;
  saveOrderShipments(shipment.order_id, shipment.order_reference, shipments);
  return shipment;
}

export function updateShipmentStatus(
  orderIdOrRef: string,
  shipmentId: string,
  newStatus: ShipmentFulfillmentStatus,
  actor: AdminActor,
  options?: {
    transport_arrangement?: string;
    delivery_notes?: string;
    tracking_reference?: string;
  }
): { updatedShipment: OrderShipment; allShipments: OrderShipment[]; overallOrderStatus: string } {
  assertAuthorizedAdmin(actor);

  const shipments = getOrderShipments(orderIdOrRef);
  const sIdx = shipments.findIndex((s) => s.id === shipmentId);
  if (sIdx === -1) {
    throw new Error(`Shipment ${shipmentId} not found for order ${orderIdOrRef}.`);
  }

  const shipment = { ...shipments[sIdx], items: shipments[sIdx].items.map((i) => ({ ...i })) };
  const now = new Date().toISOString();

  const postHubStatuses: ShipmentFulfillmentStatus[] = [
    'READY_FOR_DISPATCH',
    'DISPATCHED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
  ];

  if (postHubStatuses.includes(newStatus)) {
    const unreceived = shipment.items.filter((i) => !i.hub_received);
    const uninspected = shipment.items.filter((i) => !i.quality_checked);
    const unpackaged = shipment.items.filter((i) => !i.packaged);

    if (unreceived.length > 0 || uninspected.length > 0 || unpackaged.length > 0) {
      const missingNames = Array.from(
        new Set([...unreceived, ...uninspected, ...unpackaged].map((i) => i.product_name))
      ).join(', ');
      throw new Error(
        `Onitsha Hub Guard: Cannot mark shipment as "${SHIPMENT_STATUS_LABELS[newStatus]}" while items (${missingNames}) have not completed hub receipt, quality inspection, and packaging. Please confirm hub steps or approve split delivery first.`
      );
    }
  }

  if (newStatus === 'PACKAGED') {
    const unready = shipment.items.filter((i) => !i.hub_received || !i.quality_checked);
    if (unready.length > 0) {
      throw new Error(
        `Cannot mark shipment as Packaged until all items (${unready.map((i) => i.product_name).join(', ')}) have arrived at the Onitsha hub and passed quality inspection.`
      );
    }
    shipment.items = shipment.items.map((i) => ({
      ...i,
      packaged: true,
      packaged_at: i.packaged_at || now,
    }));
    shipment.hub_packaged_confirmed = true;
  }

  if (newStatus === 'PRODUCTS_RECEIVED') {
    shipment.items = shipment.items.map((i) => ({
      ...i,
      hub_received: true,
      hub_received_at: i.hub_received_at || now,
    }));
    shipment.hub_received_confirmed = true;
  }

  if (newStatus === 'QUALITY_CHECK' || newStatus === 'READY_FOR_PACKAGING') {
    if (!shipment.items.every((i) => i.hub_received)) {
      throw new Error(
        'Cannot complete Quality Check until all products in this shipment have been received at the Onitsha hub.'
      );
    }
    shipment.items = shipment.items.map((i) => ({
      ...i,
      quality_checked: true,
      quality_checked_at: i.quality_checked_at || now,
    }));
    shipment.hub_inspected_confirmed = true;
  }

  shipment.status = newStatus;
  if (options?.transport_arrangement !== undefined) {
    shipment.transport_arrangement = options.transport_arrangement;
  }
  if (options?.delivery_notes !== undefined) {
    shipment.delivery_notes = options.delivery_notes;
  }
  if (options?.tracking_reference !== undefined) {
    shipment.tracking_reference = options.tracking_reference;
  }
  if (newStatus === 'DISPATCHED' && !shipment.dispatched_at) {
    shipment.dispatched_at = now;
  }
  if (newStatus === 'DELIVERED') {
    shipment.dispatched_at = shipment.dispatched_at || now;
    shipment.delivered_at = now;
  }
  shipment.updated_at = now;

  shipments[sIdx] = shipment;
  saveOrderShipments(shipment.order_id, shipment.order_reference, shipments);

  const overallOrderStatus = deriveOverallOrderStatus(shipments);
  return {
    updatedShipment: shipment,
    allShipments: shipments,
    overallOrderStatus,
  };
}

export function approvePartialSplitDelivery(
  orderIdOrRef: string,
  shipmentId: string,
  actor: AdminActor,
  additionalDeliveryFee = 0
): OrderShipment[] {
  assertAuthorizedAdmin(actor);

  const shipments = getOrderShipments(orderIdOrRef);
  const sIdx = shipments.findIndex((s) => s.id === shipmentId);
  if (sIdx === -1) {
    throw new Error(`Shipment ${shipmentId} not found.`);
  }

  const target = shipments[sIdx];
  const readyItems = target.items.filter((i) => i.hub_received);
  const delayedItems = target.items.filter((i) => !i.hub_received);

  if (readyItems.length === 0 || delayedItems.length === 0) {
    throw new Error(
      'Split delivery can only be approved when a shipment has both hub-received items and delayed items awaiting arrival.'
    );
  }

  const now = new Date().toISOString();

  const updatedReadyShipment: OrderShipment = {
    ...target,
    items: readyItems,
    combined_weight_kg: computeGroupWeight(readyItems),
    combined_dimensions_cm: computeGroupDimensions(readyItems),
    hub_received_confirmed: true,
    hub_inspected_confirmed: readyItems.every((i) => i.quality_checked),
    hub_packaged_confirmed: readyItems.every((i) => i.packaged),
    status: readyItems.every((i) => i.packaged)
      ? 'PACKAGED'
      : readyItems.every((i) => i.quality_checked)
      ? 'READY_FOR_PACKAGING'
      : 'PRODUCTS_RECEIVED',
    separation_reason: 'Approved split dispatch for items already received at Onitsha Hub.',
    updated_at: now,
  };

  const delayedShipmentIndex = shipments.length + 1;
  const delayedShipment: OrderShipment = {
    ...target,
    id: `ship_${target.order_id}_split_${Date.now()}`,
    shipment_reference: `${target.order_reference}-SHP-${delayedShipmentIndex}`,
    items: delayedItems,
    combined_weight_kg: computeGroupWeight(delayedItems),
    combined_dimensions_cm: computeGroupDimensions(delayedItems),
    delivery_fee: additionalDeliveryFee,
    special_handling_fee: 0,
    hub_received_confirmed: false,
    hub_inspected_confirmed: false,
    hub_packaged_confirmed: false,
    status: 'AWAITING_PRODUCTS_AT_HUB',
    separation_reason: 'Split shipment awaiting delayed supplier product arrival at Onitsha Hub.',
    tracking_reference: `${target.order_reference}-TRK-${delayedShipmentIndex}`,
    created_at: now,
    updated_at: now,
    dispatched_at: null,
    delivered_at: null,
  };

  shipments[sIdx] = updatedReadyShipment;
  shipments.push(delayedShipment);
  saveOrderShipments(target.order_id, target.order_reference, shipments);
  return shipments;
}

export function confirmManualDeliveryQuote(
  orderIdOrRef: string,
  shipmentQuotes: Array<{
    shipmentId: string;
    confirmedDeliveryFee: number;
    transportArrangement?: string;
    deliveryNotes?: string;
  }>,
  actor: AdminActor
): { shipments: OrderShipment[]; totalDeliveryFee: number } {
  assertAuthorizedAdmin(actor);

  const shipments = getOrderShipments(orderIdOrRef);
  if (shipments.length === 0) {
    throw new Error(`No shipments found for order ${orderIdOrRef}.`);
  }

  const now = new Date().toISOString();
  for (const quote of shipmentQuotes) {
    if (Number.isNaN(Number(quote.confirmedDeliveryFee)) || Number(quote.confirmedDeliveryFee) < 0) {
      throw new Error('Confirmed delivery fee must be a valid non-negative amount.');
    }
    const sIdx = shipments.findIndex((s) => s.id === quote.shipmentId);
    if (sIdx !== -1) {
      shipments[sIdx] = {
        ...shipments[sIdx],
        delivery_fee: Number(Number(quote.confirmedDeliveryFee).toFixed(2)),
        requires_manual_quote: false,
        manual_quote_status: 'QUOTED_AWAITING_CUSTOMER',
        status: 'DELIVERY_FEE_CONFIRMED',
        transport_arrangement: quote.transportArrangement || shipments[sIdx].transport_arrangement,
        delivery_notes: quote.deliveryNotes ?? shipments[sIdx].delivery_notes,
        updated_at: now,
      };
    }
  }

  const totalDeliveryFee = Number(
    shipments.reduce((sum, s) => sum + Number(s.delivery_fee || 0), 0).toFixed(2)
  );

  saveOrderShipments(shipments[0].order_id, shipments[0].order_reference, shipments);
  return { shipments, totalDeliveryFee };
}

export function customerRespondToManualQuote(
  orderIdOrRef: string,
  accepted: boolean
): { shipments: OrderShipment[]; status: DeliveryConfirmationStatus } {
  const shipments = getOrderShipments(orderIdOrRef);
  if (shipments.length === 0) {
    throw new Error(`No shipments found for order ${orderIdOrRef}.`);
  }

  const now = new Date().toISOString();
  const updated = shipments.map((s) => ({
    ...s,
    manual_quote_status: (accepted ? 'CUSTOMER_ACCEPTED' : 'CUSTOMER_DECLINED') as DeliveryConfirmationStatus,
    status: (accepted ? 'ORDER_PLACED' : 'AWAITING_DELIVERY_CONFIRMATION') as ShipmentFulfillmentStatus,
    updated_at: now,
  }));

  saveOrderShipments(updated[0].order_id, updated[0].order_reference, updated);
  return {
    shipments: updated,
    status: accepted ? 'CUSTOMER_ACCEPTED' : 'CUSTOMER_DECLINED',
  };
}

export function deriveOverallOrderStatus(
  shipments: OrderShipment[]
): 'PENDING_PAYMENT' | 'PROCESSING' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED' {
  if (!shipments || shipments.length === 0) return 'PROCESSING';

  const allDelivered = shipments.every((s) => s.status === 'DELIVERED');
  if (allDelivered) {
    return 'DELIVERED';
  }

  const anyOutForDeliveryOrDelivered = shipments.some(
    (s) => s.status === 'OUT_FOR_DELIVERY' || s.status === 'DELIVERED'
  );
  if (anyOutForDeliveryOrDelivered) {
    return 'IN_TRANSIT';
  }

  const anyDispatched = shipments.some((s) => s.status === 'DISPATCHED');
  if (anyDispatched) {
    return 'SHIPPED';
  }

  const anyAwaitingQuote = shipments.some((s) => s.status === 'AWAITING_DELIVERY_CONFIRMATION');
  if (anyAwaitingQuote) {
    return 'PENDING_PAYMENT';
  }

  return 'PROCESSING';
}

export function deriveOverallHubFulfillmentStatus(shipments: OrderShipment[]): ShipmentFulfillmentStatus {
  if (!shipments || shipments.length === 0) return 'ORDER_PLACED';
  if (shipments.every((s) => s.status === 'DELIVERED')) return 'DELIVERED';

  let minRank = Infinity;
  let minStatus: ShipmentFulfillmentStatus = 'ORDER_PLACED';

  for (const s of shipments) {
    if (s.status === 'AWAITING_DELIVERY_CONFIRMATION' || s.status === 'DELIVERY_FEE_CONFIRMED') {
      return s.status;
    }
    const rank = SHIPMENT_STATUS_ORDER.indexOf(s.status);
    const effectiveRank = rank === -1 ? 0 : rank;
    if (effectiveRank < minRank) {
      minRank = effectiveRank;
      minStatus = s.status;
    }
  }
  return minStatus;
}


/**
 * Resolves a product's delivery attributes with a fallback to suggested classification
 * so UI badges always have a valid `ProductDeliveryAttributes` object.
 */
export function resolveProductDeliveryAttributes(
  product: Partial<Product> | Partial<ProductSummary> | Record<string, any> | null | undefined
): ProductDeliveryAttributes {
  const configured = getProductDeliveryAttributes(product);
  if (configured) return configured;
  return {
    delivery_classification: suggestParcelClassificationForAdmin({
      name: product?.name,
      category_name: (product as any)?.category_name || (typeof product?.category === 'string' ? product.category : product?.category?.name),
      description: product?.description,
    }),
    weight_kg: product?.weight_kg ?? null,
    dimensions_cm: product?.dimensions_cm ?? null,
    requires_special_handling: Boolean(product?.requires_special_handling),
    can_consolidate_with_furniture: Boolean(product?.can_consolidate_with_furniture),
    max_items_per_shipment: product?.max_items_per_shipment ?? null,
    delivery_notes: product?.delivery_notes ?? null,
  };
}

/**
 * Convenience wrapper for calculating consolidated delivery from raw cart/order items.
 */
export function calculateConsolidatedDelivery(
  itemsOrParams: any[] | CalculateOrderDeliveryParams,
  destinationState = 'Lagos',
  destinationCity = 'Lagos',
  dispatchOrigin = PRIMARY_DISPATCH_ORIGIN
): DeliveryCalculationResult {
  if (!Array.isArray(itemsOrParams) && itemsOrParams && Array.isArray(itemsOrParams.items)) {
    return calculateOrderDelivery(itemsOrParams);
  }
  const rawList = Array.isArray(itemsOrParams) ? itemsOrParams : [];
  const evaluableItems: EvaluableOrderItem[] = rawList.map((item: any, idx: number) => {
    const prod = item.product || item;
    const resolved = resolveProductDeliveryAttributes(prod);
    const unitPrice = Number(
      item.unit_price ?? item.price ?? prod?.base_price ?? prod?.price ?? 0
    );
    return {
      id: item.id || `item_${idx + 1}`,
      product_id: String(item.product_id || prod?.id || `prod_${idx + 1}`),
      product_name: String(item.product_name || prod?.name || 'Product'),
      variant_id: item.variant_id || item.variant?.id || null,
      variant_name:
        item.variant_name ||
        (typeof item.variant === 'object' && item.variant ? item.variant.name : null),
      quantity: Math.max(1, Number(item.quantity || 1)),
      unit_price: Number.isNaN(unitPrice) ? 0 : unitPrice,
      delivery_classification:
        item.delivery_classification ||
        prod?.delivery_classification ||
        resolved.delivery_classification,
      weight_kg: item.weight_kg ?? prod?.weight_kg ?? resolved.weight_kg ?? null,
      dimensions_cm: item.dimensions_cm ?? prod?.dimensions_cm ?? resolved.dimensions_cm ?? null,
      requires_special_handling: Boolean(
        item.requires_special_handling ??
          prod?.requires_special_handling ??
          resolved.requires_special_handling
      ),
      can_consolidate_with_furniture: Boolean(
        item.can_consolidate_with_furniture ??
          prod?.can_consolidate_with_furniture ??
          resolved.can_consolidate_with_furniture
      ),
      max_items_per_shipment:
        item.max_items_per_shipment ??
        prod?.max_items_per_shipment ??
        resolved.max_items_per_shipment ??
        null,
      delivery_notes: item.delivery_notes ?? prod?.delivery_notes ?? resolved.delivery_notes ?? null,
      image_url:
        item.image_url || prod?.primary_image_url || prod?.image_url || '/logo.jpg?v=2',
      category_name: prod?.category_name || null,
      description: prod?.description || null,
    };
  });

  return calculateOrderDelivery({
    items: evaluableItems,
    destinationState,
    destinationCity,
    dispatchOrigin,
  });
}

/**
 * Re-verifies whether delivery pricing changed since the checkout calculation snapshot
 * was created (e.g., when an admin updates a route rate before customer completes payment).
 */
export function reverifySessionDeliveryPricing(params: {
  items: EvaluableOrderItem[];
  destinationState: string;
  destinationCity: string;
  dispatchOrigin?: string;
  previousDeliveryFee: number | null;
  previousRouteUpdatedAt?: string | null;
}): {
  priceChanged: boolean;
  previousDeliveryFee: number | null;
  newDeliveryFee: number | null;
  updatedCalculation: DeliveryCalculationResult;
} {
  const updatedCalculation = calculateOrderDelivery({
    items: params.items,
    destinationState: params.destinationState,
    destinationCity: params.destinationCity,
    dispatchOrigin: params.dispatchOrigin,
  });

  const previousFee = params.previousDeliveryFee;
  const newFee = updatedCalculation.total_delivery_fee;

  const feeChanged = previousFee !== newFee;
  const routeTimestampChanged = Boolean(
    params.previousRouteUpdatedAt &&
      updatedCalculation.route_updated_at &&
      params.previousRouteUpdatedAt !== updatedCalculation.route_updated_at &&
      feeChanged
  );

  return {
    priceChanged: feeChanged || routeTimestampChanged,
    previousDeliveryFee: previousFee,
    newDeliveryFee: newFee,
    updatedCalculation,
  };
}
