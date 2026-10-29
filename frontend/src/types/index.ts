// ============================================================
// DOVI 2.0 — Shared TypeScript Interfaces
// All API response shapes. No `any` allowed.
// ============================================================

// ----------------------------------------------------------
// PAGINATION
// ----------------------------------------------------------
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ----------------------------------------------------------
// API ERROR
// ----------------------------------------------------------
export interface APIError {
  error: true;
  message: string;
  code: string;
  details?: Record<string, string[]>;
}

// ----------------------------------------------------------
// USER & AUTH
// ----------------------------------------------------------
// ----------------------------------------------------------
// USER & AUTH
// ----------------------------------------------------------
export type UserRole = 'BUYER' | 'ADMIN' | 'CUSTOMER' | 'VENDOR';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export interface UserProfile {
  phone_number?: string | null;
  avatar_url?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  vendor_status?: 'N/A' | 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: UserRole;
  status: AccountStatus;
  avatar_url: string | null;
  is_email_verified: boolean;
  date_joined: string;
  last_login: string | null;
  profile?: UserProfile;
  vendor_store?: { id?: string; store_name?: string; [key: string]: any };
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role?: UserRole;
}

export interface Address {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  country: string;
  postal_code: string | null;
  is_default: boolean;
}

// ----------------------------------------------------------
// VENDORS (LEGACY COMPATIBILITY STUBS)
// ----------------------------------------------------------
export type VendorStatus = 'APPROVED';

export interface VendorSummary {
  id: string;
  name: string;
  logo_url: string | null;
  rating: number;
  review_count: number;
  location: string | null;
  slug?: string;
}

export interface VendorPayoutAccount {
  id?: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  bank_code: string;
  is_primary: boolean;
  updated_at?: string;
  created_at?: string;
}

export interface Vendor extends VendorSummary {
  description: string | null;
  status: VendorStatus;
  product_count: number;
  joined_date: string;
  response_rate: number | null;
}

// ----------------------------------------------------------
// CATEGORIES
// ----------------------------------------------------------
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon_url: string | null;
  parent: string | null;
  children: Category[];
  product_count: number;
}

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  icon_url: string | null;
}

// ----------------------------------------------------------
// PRODUCTS
// ----------------------------------------------------------
export type ProductStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'DELETED';

export interface ProductImage {
  id: string;
  url?: string;
  image_url?: string;
  thumbnail_url?: string;
  storage_key?: string;
  alt_text?: string | null;
  is_primary?: boolean;
  display_order?: number;
  created_at?: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  price?: string;
  price_override?: string | null;
  stock?: number;
  reserved?: number;
  stock_quantity?: number;
  attributes?: Record<string, string>;
  image_url?: string | null;
  color_code?: string;
}

export interface ProductSpecificationItem {
  key: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  description: string;
  price?: string;
  base_price?: string;
  compare_at_price?: string;
  reference_code?: string;
  sku?: string;
  stock_quantity?: number;
  status: ProductStatus | string;
  category: CategorySummary | string;
  category_name?: string;
  brand?: string;
  condition?: string;
  images?: ProductImage[];
  primary_image_url?: string | null;
  image_url?: string | null;
  variants?: ProductVariant[];
  average_rating?: number;
  review_count?: number;
  related_products?: ProductSummary[];
  created_at?: string;
  updated_at?: string;
  specifications?: Record<string, string> | ProductSpecificationItem[];
  vendor?: VendorSummary | string;
  vendor_name?: string;
}

export interface ProductSummary {
  id: string;
  name: string;
  slug?: string;
  price?: string;
  base_price?: string;
  compare_at_price?: string;
  variants?: ProductVariant[];
  primary_image_url?: string | null;
  average_rating: number;
  review_count: number;
  stock_quantity: number;
  status: ProductStatus;

  // Optional extension properties for dynamic homepage section filtration
  original_price?: string | null;
  discount_percentage?: number;
  category?: CategorySummary;
  category_name?: string;
  brand?: string;
  condition?: string;
  is_flash_deal?: boolean;
  is_trending?: boolean;
  is_best_seller?: boolean;
  is_hot_sale?: boolean;
  is_new_arrival?: boolean;
  created_at?: string;
  image_url?: string;
  images?: ProductImage[];
  in_stock?: boolean;
  vendor?: VendorSummary;
  vendor_name?: string;
}

// ----------------------------------------------------------
// CART
// ----------------------------------------------------------
export interface CartItem {
  id: string;
  product?: ProductSummary;
  product_id?: string;
  product_name?: string;
  name?: string;
  variant?: ProductVariant | string | null;
  variant_name?: string;
  variant_sku?: string;
  quantity: number;
  unit_price?: string;
  price?: string;
  line_total?: string;
  is_in_stock?: boolean;
  available_stock?: number;
  image_url?: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  item_count: number;
  subtotal: string;
  delivery_estimate: string | null;
  total: string;
  is_valid: boolean;
  validation_errors: string[];
}

// ----------------------------------------------------------
// DELIVERY & FULFILLMENT
// ----------------------------------------------------------
export type DeliveryMethodType = 'PICKUP' | 'VENDOR_ARRANGED';

export type DeliveryStatus =
  | 'PENDING'
  | 'READY_FOR_PICKUP'
  | 'READY_FOR_DELIVERY'
  | 'IN_TRANSIT'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED';

export interface VendorDeliverySelection {
  vendor_id: string;
  method: DeliveryMethodType;
  delivery_address_id?: string;
}

export interface DeliveryGroup {
  id: string;
  order: string;
  order_reference: string;
  vendor: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  method: DeliveryMethodType;
  status: DeliveryStatus;
  recipient_name?: string | null;
  recipient_phone?: string | null;
  delivery_address?: string | null;
  delivery_city?: string | null;
  delivery_state?: string | null;
  pickup_address?: string | null;
  pickup_city?: string | null;
  pickup_state?: string | null;
  delivery_fee: string;
  vendor_notes?: string;
  tracking_reference?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  picked_up_at?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
}

// ----------------------------------------------------------
// ORDERS
// ----------------------------------------------------------
export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'RECEIVED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUND_REQUESTED'
  | 'REFUND_REVIEW'
  | 'REFUNDED';

export interface OrderItem {
  id: string;
  product: ProductSummary;
  variant: ProductVariant | null;
  quantity: number;
  unit_price: string;
  line_total: string;
  delivery_group_id?: string | null;
}

export interface OrderTracking {
  status: OrderStatus | DeliveryStatus;
  location: string | null;
  description: string;
  timestamp: string;
}

export interface Order {
  id: string;
  reference: string;
  status: OrderStatus;
  items: OrderItem[];
  delivery_address?: Address | null;
  delivery_method?: string | null;
  delivery_groups?: DeliveryGroup[];
  subtotal: string;
  delivery_fee: string;
  total: string;
  payment_status: string;
  payment_method: string | null;
  tracking: OrderTracking[];
  can_cancel: boolean;
  can_request_refund: boolean;
  can_confirm_receipt: boolean;
  can_review: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderSummary {
  id: string;
  reference: string;
  order_reference?: string;
  status: OrderStatus;
  item_count: number;
  total: string;
  created_at: string;
}

// ----------------------------------------------------------
// PAYMENTS
// ----------------------------------------------------------
export type PaymentStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'REFUNDED';
export type PaymentProvider = 'FLUTTERWAVE' | 'OPAY';

export interface PaymentMethod {
  id: PaymentProvider;
  name: string;
  description: string;
  logo_url: string | null;
  is_active: boolean;
}

export interface Payment {
  id: string;
  reference: string;
  order_reference: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: string;
  currency: string;
  payment_link: string | null;
  provider_reference: string | null;
  created_at: string;
  verified_at: string | null;
}

export interface PaymentInitResponse {
  payment_reference: string;
  payment_link: string;
  provider: PaymentProvider;
  amount: string;
  currency: string;
}

// ----------------------------------------------------------
// REFUNDS
// ----------------------------------------------------------
export type RefundStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PROCESSED';

export interface RefundEvidence {
  id: string;
  file_url: string;
  uploaded_at: string;
}

export interface Refund {
  id: string;
  order_reference: string;
  status: RefundStatus;
  reason: string;
  description: string;
  amount: string;
  evidence: RefundEvidence[];
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

// ----------------------------------------------------------
// REVIEWS
// ----------------------------------------------------------
export interface Review {
  id: string;
  product_id: string;
  order_reference: string;
  product_rating: number;
  vendor_rating: number;
  delivery_rating: number;
  title: string | null;
  body: string;
  is_verified_purchase: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewEligibility {
  eligible: boolean;
  reason: string | null;
  order_reference: string;
}

// ----------------------------------------------------------
// NOTIFICATIONS
// ----------------------------------------------------------
export type NotificationType =
  | 'ORDER_CREATED'
  | 'PAYMENT_SUCCESSFUL'
  | 'PAYMENT_FAILED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'REFUND_REQUESTED'
  | 'REFUND_APPROVED'
  | 'REFUND_REJECTED'
  | 'SAVE2OWN_CONTRIBUTION'
  | 'SAVE2OWN_REMINDER'
  | 'SAVE2OWN_TARGET_REACHED'
  | 'PRICE_CHANGED'
  | 'PRODUCT_UNAVAILABLE'
  | 'VENDOR_APPROVED'
  | 'VENDOR_REJECTED'
  | 'AUTO_BOOKING_CONFIRMED'
  | 'AUTO_BOOKING_CANCELLED';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationUnreadCount {
  count?: number;
  unread_count?: number;
}

// ----------------------------------------------------------
// PAYMENT ACCOUNTS (MARKETPLACE & SAVE2OWN)
// ----------------------------------------------------------
export type PaymentAccountType = 'marketplace' | 'save2own';

export interface PaymentAccount {
  id: string | null;
  account_type: PaymentAccountType;
  bank_name: string;
  account_name: string;
  account_number: string;
  currency: string;
  is_active?: boolean;
  instructions?: string;
  created_at?: string;
  updated_at?: string;
  updated_by?: string | null;
  updated_by_email?: string;
}

// ----------------------------------------------------------
// SAVE2OWN
// ----------------------------------------------------------
export type Save2OwnGoalStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PRODUCT_UNAVAILABLE'
  | 'PRICE_CHANGED'
  | 'PAYMENT_REVIEW'
  | 'REFUND_PENDING'
  | 'SUSPENDED';

export type Save2OwnContributionStatus =
  | 'pending'
  | 'submitted'
  | 'under_review'
  | 'confirmed'
  | 'rejected'
  | 'reversed'
  | 'refunded'
  | 'PENDING'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'REVERSED'
  | 'REFUNDED'
  | 'COMPLETED'
  | 'FAILED'
  | 'SUCCESSFUL';

export interface Save2OwnContribution {
  id: string;
  goal_id?: string;
  user_id?: string;
  amount: string;
  currency?: string;
  status: Save2OwnContributionStatus;
  payment_status?: PaymentStatus;
  payment_method?: 'bank_transfer' | string;
  payment_account_id?: string;
  transfer_reference?: string;
  payment_reference?: string;
  payment_proof?: string | null;
  payment_proof_path?: string | null;
  payment_proof_url?: string | null;
  submitted_at?: string | null;
  verified_at?: string | null;
  verified_by?: string | null;
  rejection_reason?: string | null;
  // Account snapshot fields
  bank_name_snapshot?: string;
  account_name_snapshot?: string;
  account_number_snapshot?: string;
  instructions_snapshot?: string;
  created_at: string;
  updated_at?: string;
}

export interface Save2OwnProductChange {
  id: string;
  old_product: ProductSummary;
  new_product: ProductSummary;
  old_target: string;
  new_target: string;
  changed_at: string;
}

export interface Save2OwnParticipant {
  id: string;
  user_id?: string;
  goal_id?: string;
  full_name: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  address: string;
  residential_address?: string;
  city: string;
  state: string;
  country: string;
  selfie_url?: string | null;
  identity_locked: boolean;
  identity_locked_at?: string | null;
  identity_unlocked_at?: string | null;
  identity_unlock_expires_at?: string | null;
  terms_acknowledged?: boolean;
  terms_acknowledged_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Save2OwnEligibilityResponse {
  eligible: boolean;
  can_create_goal: boolean;
  message: string;
  active_goal?: Save2OwnGoal | null;
}

export interface Save2OwnUnlockVerificationResponse {
  success: boolean;
  message: string;
  identity_unlock_expires_at: string;
  expires_at?: string;
  expires_in_minutes: number;
  participant: Save2OwnParticipant;
}

export interface Save2OwnGoal {
  id: string;
  reference_code?: string;
  product: ProductSummary;
  variant: ProductVariant | null;
  quantity: number;
  status: Save2OwnGoalStatus;
  target_amount: string;
  total_contributed: string;
  confirmed_balance?: string;
  saved_amount?: string;
  remaining_amount: string;
  progress_percentage: number;
  contribution_plan?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  installment_amount?: string;
  target_date: string | null;
  participant?: Save2OwnParticipant | null;
  contributions: Save2OwnContribution[];
  product_changes: Save2OwnProductChange[];
  created_at: string;
  updated_at: string;
}

export interface Save2OwnGoalSummary {
  id: string;
  product: ProductSummary;
  status: Save2OwnGoalStatus;
  target_amount: string;
  total_contributed: string;
  remaining_amount: string;
  progress_percentage: number;
  contribution_plan?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  installment_amount?: string;
  target_date: string | null;
}

// ----------------------------------------------------------
// DOVI AUTO
// ----------------------------------------------------------
export type FuelType = 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'OTHER';
export type Transmission = 'AUTOMATIC' | 'MANUAL' | 'CVT';
export type VehicleCondition = 'NEW' | 'USED';
export type PartType = 'OEM' | 'AFTERMARKET';

export interface AutoImage {
  id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
}

export interface AutoListingSummary {
  id: string;
  make: string;
  model: string;
  year: number;
  price: string;
  mileage: number | null;
  transmission: Transmission;
  fuel_type: FuelType;
  condition: VehicleCondition;
  location: string;
  primary_image_url: string | null;
  seller: VendorSummary;
  is_favorited: boolean;
}

export interface AutoListing extends AutoListingSummary {
  description: string;
  color: string | null;
  engine_size: string | null;
  body_type: string | null;
  vin: string | null;
  images: AutoImage[];
  features: string[];
  average_rating: number;
  review_count: number;
  similar_listings: AutoListingSummary[];
  created_at: string;
}

export interface AutoPartCompatibility {
  make: string;
  model: string;
  year_from: number;
  year_to: number;
}

export interface AutoPartSummary {
  id: string;
  name: string;
  part_number: string;
  part_type: PartType;
  condition: VehicleCondition;
  price: string;
  stock_quantity: number;
  primary_image_url: string | null;
  vendor: VendorSummary;
  compatible_vehicles: AutoPartCompatibility[];
}

export interface AutoPart extends AutoPartSummary {
  description: string;
  images: AutoImage[];
  created_at: string;
}

export interface AutoAccessorySummary {
  id: string;
  name: string;
  sub_category: string;
  price: string;
  stock_quantity: number;
  primary_image_url: string | null;
  vendor: VendorSummary;
}

export interface AutoRentalSummary {
  id: string;
  make: string;
  model: string;
  year: number;
  daily_rate: string;
  weekly_rate: string | null;
  pickup_location: string;
  return_location: string;
  primary_image_url: string | null;
  vendor: VendorSummary;
}

export interface AutoRental extends AutoRentalSummary {
  description: string;
  images: AutoImage[];
  security_deposit: string;
  available_from: string;
  available_to: string | null;
  minimum_days: number;
  maximum_days: number | null;
}

export interface RentalBooking {
  id: string;
  rental: AutoRentalSummary;
  pickup_date: string;
  return_date: string;
  total_days: number;
  total_amount: string;
  security_deposit: string;
  payment_status: PaymentStatus;
  booking_status: 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  can_cancel: boolean;
  created_at: string;
}

// ----------------------------------------------------------
// HOMEPAGE
// ----------------------------------------------------------
export interface HomepageBanner {
  id: string;
  title: string;
  subtitle: string | null;
  cta_text: string | null;
  cta_url: string | null;
  desktop_image_url: string;
  mobile_image_url: string;
  slide_interval_ms: number;
  display_order: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
}

export interface HomepageSection {
  id: string;
  name: string;
  key: string; // The section type (e.g. FLASH_DEALS, HERO_BANNER, CATEGORY_GRID, etc.)
  title: string;
  subtitle?: string | null;
  icon?: string | null;
  description?: string | null;
  is_active: boolean;
  visible: boolean; // mapped from is_active for backward compatibility
  sort_order: number;
  display_order: number; // mapped from sort_order
  starts_at?: string | null;
  ends_at?: string | null;
  display_limit: number;
  configuration: {
    layout: 'PRODUCT_GRID' | 'HORIZONTAL_CAROUSEL' | 'COMPACT_LIST' | 'LARGE_PRODUCT_CARDS' | 'CATEGORY_GRID' | 'CATEGORY_CIRCLES' | 'CATEGORY_PILLS' | 'BANNER' | 'BRAND_GRID' | 'VENDOR_GRID' | 'AUTO_LISTING_GRID';
    source: 'MANUAL' | 'CATEGORY' | 'VENDOR' | 'QUERY' | 'AUTOMATIC' | 'ALGORITHM';
    source_id?: string; // e.g. category ID, vendor ID
    manual_product_ids?: string[]; // Selected product IDs
    filters?: {
      min_discount?: number;
      min_rating?: number;
      in_stock_only?: boolean;
      price_min?: number;
      price_max?: number;
    };
    sort_by?: string; // price_asc, newest, highest_discount, etc.
    cta_text?: string;
    cta_url?: string;
    background_color?: string;
  };
  config: Record<string, unknown>; // mapped from configuration
  products?: ProductSummary[]; // populated dynamically
  categories?: any[];
  vendors?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface HomepageData {
  banners: HomepageBanner[];
  sections: HomepageSection[];
}

// ----------------------------------------------------------
// WISHLIST
// ----------------------------------------------------------
export interface WishlistItem {
  id: string;
  product: ProductSummary;
  added_at: string;
}

// ----------------------------------------------------------
// CHECKOUT
// ----------------------------------------------------------
export interface DeliveryMethod {
  id: string;
  name: string;
  description: string;
  estimated_days: string;
  price: string;
}

export interface CheckoutSession {
  id: string;
  cart_snapshot: Cart;
  delivery_address: Address | null;
  delivery_method: DeliveryMethod | null;
  payment_method: PaymentProvider | null;
  subtotal: string;
  delivery_fee: string;
  total: string;
  expires_at: string;
}


// ----------------------------------------------------------
// DOVI DELIVERY PRICING, CONSOLIDATION & ONITSHA HUB FULFILLMENT
// ----------------------------------------------------------
export type ParcelClassification =
  | 'SMALL_PARCEL'
  | 'HEAVY_PARCEL'
  | 'FURNITURE_BULKY'
  | 'SPECIAL_MANUAL_QUOTE';

export interface ProductDeliveryAttributes {
  delivery_classification: ParcelClassification;
  weight_kg?: number | null;
  dimensions_cm?: string | null;
  requires_special_handling?: boolean;
  can_consolidate_with_furniture?: boolean;
  max_items_per_shipment?: number | null;
  delivery_notes?: string | null;
}

export interface DeliveryRoute {
  id: string;
  dispatch_origin: string;
  destination_state: string;
  destination_city: string;
  small_parcel_rate: number | null;
  heavy_parcel_rate: number | null;
  furniture_bulky_rate: number | null;
  combined_furniture_rate: number | null;
  special_handling_surcharge: number | null;
  allows_furniture_small_consolidation: boolean;
  max_furniture_items_consolidated: number;
  max_small_parcel_weight_kg: number;
  max_heavy_parcel_weight_kg: number;
  special_delivery_requirements?: string | null;
  estimated_delivery_days?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by_id?: string | null;
  updated_by_email?: string | null;
  updated_by_name?: string | null;
}

export interface DeliveryRateChangeRecord {
  id: string;
  route_id: string;
  dispatch_origin: string;
  destination: string;
  delivery_classification: string;
  previous_rate: number | null;
  new_rate: number | null;
  changed_by_id?: string | null;
  changed_by_email: string;
  changed_by_name?: string | null;
  reason?: string | null;
  changed_at: string;
}

export type ShipmentFulfillmentStatus =
  | 'ORDER_PLACED'
  | 'AWAITING_DELIVERY_CONFIRMATION'
  | 'DELIVERY_FEE_CONFIRMED'
  | 'SOURCING_PRODUCTS'
  | 'AWAITING_PRODUCTS_AT_HUB'
  | 'PRODUCTS_RECEIVED'
  | 'QUALITY_CHECK'
  | 'READY_FOR_PACKAGING'
  | 'PACKAGED'
  | 'READY_FOR_DISPATCH'
  | 'DISPATCHED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED';

export type DeliveryConfirmationStatus =
  | 'NOT_REQUIRED'
  | 'PENDING_ADMIN_QUOTE'
  | 'QUOTED_AWAITING_CUSTOMER'
  | 'CUSTOMER_ACCEPTED'
  | 'CUSTOMER_DECLINED';

export interface ShipmentItem {
  id: string;
  product_id: string;
  product_name: string;
  variant_id?: string | null;
  variant_name?: string | null;
  quantity: number;
  unit_price: number;
  delivery_classification: ParcelClassification;
  weight_kg?: number | null;
  dimensions_cm?: string | null;
  requires_special_handling?: boolean;
  hub_received: boolean;
  hub_received_at?: string | null;
  quality_checked: boolean;
  quality_checked_at?: string | null;
  packaged: boolean;
  packaged_at?: string | null;
  image_url?: string | null;
}

export interface OrderShipment {
  id: string;
  shipment_reference: string;
  order_id: string;
  order_reference: string;
  dispatch_origin: string;
  destination_state: string;
  destination_city: string;
  destination_address?: string | null;
  shipment_classification: ParcelClassification;
  items: ShipmentItem[];
  combined_weight_kg?: number | null;
  combined_dimensions_cm?: string | null;
  delivery_fee: number | null;
  special_handling_fee: number;
  requires_manual_quote: boolean;
  manual_quote_reason?: string | null;
  status: ShipmentFulfillmentStatus;
  transport_arrangement: string;
  separation_reason?: string | null;
  delivery_notes?: string | null;
  tracking_reference?: string | null;
  hub_received_confirmed: boolean;
  hub_inspected_confirmed: boolean;
  hub_packaged_confirmed: boolean;
  created_at: string;
  updated_at: string;
  dispatched_at?: string | null;
  delivered_at?: string | null;
}

export interface DeliveryCalculationShipmentGroup {
  group_index: number;
  shipment_classification: ParcelClassification;
  classification_label: string;
  dispatch_origin: string;
  destination_state: string;
  destination_city: string;
  items: ShipmentItem[];
  total_item_quantity: number;
  combined_weight_kg: number | null;
  combined_dimensions_cm: string | null;
  base_delivery_fee: number | null;
  special_handling_fee: number;
  delivery_fee: number | null;
  requires_manual_quote: boolean;
  manual_quote_reason?: string | null;
  transport_arrangement: string;
  consolidation_explanation: string;
  separation_reason?: string | null;
  delivery_notes?: string | null;
}

export interface DeliveryCalculationResult {
  dispatch_origin: string;
  destination_state: string;
  destination_city: string;
  route_id: string | null;
  route_found: boolean;
  route_updated_at?: string | null;
  shipment_count: number;
  is_consolidated: boolean;
  requires_manual_quote: boolean;
  manual_quote_reasons: string[];
  product_subtotal: number;
  base_delivery_total: number | null;
  special_handling_total: number;
  total_delivery_fee: number | null;
  total_payable: number | null;
  overall_explanation: string;
  shipments: DeliveryCalculationShipmentGroup[];
  calculated_at: string;
}

export interface Product {
  delivery_classification?: ParcelClassification;
  weight_kg?: number | null;
  dimensions_cm?: string | null;
  requires_special_handling?: boolean;
  can_consolidate_with_furniture?: boolean;
  max_items_per_shipment?: number | null;
  delivery_notes?: string | null;
  delivery_attributes?: ProductDeliveryAttributes;
}

export interface ProductSummary {
  description?: string;
  delivery_classification?: ParcelClassification;
  weight_kg?: number | null;
  dimensions_cm?: string | null;
  requires_special_handling?: boolean;
  can_consolidate_with_furniture?: boolean;
  max_items_per_shipment?: number | null;
  delivery_notes?: string | null;
  delivery_attributes?: ProductDeliveryAttributes;
}

export interface Order {
  shipments?: OrderShipment[];
  shipment_count?: number;
  delivery_calculation?: DeliveryCalculationResult;
  requires_delivery_confirmation?: boolean;
  delivery_confirmation_status?: DeliveryConfirmationStatus;
  confirmed_delivery_fee?: string | null;
  hub_fulfillment_status?: ShipmentFulfillmentStatus;
  allow_partial_split_delivery?: boolean;
  dispatch_origin?: string;
}

export interface CheckoutSession {
  shipments?: OrderShipment[];
  shipment_count?: number;
  delivery_calculation?: DeliveryCalculationResult;
  requires_delivery_confirmation?: boolean;
  delivery_confirmation_status?: DeliveryConfirmationStatus;
  route_updated_at_snapshot?: string | null;
}


// Additional interface extensions for Delivery Consolidation & Manual Quotes
export interface User {
  phone_number?: string | null;
}

export interface OrderShipment {
  manual_quote_status?: DeliveryConfirmationStatus;
  recipient_name?: string | null;
  recipient_phone?: string | null;
}

export interface DeliveryCalculationResult {
  consolidation_summary?: string;
  manual_quote_reason?: string | null;
  shipment_groups: DeliveryCalculationShipmentGroup[];
  special_handling_fee: number;
}

export interface Order {
  requires_manual_quote?: boolean;
}
