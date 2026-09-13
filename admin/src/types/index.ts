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
export type UserRole = 'BUYER' | 'VENDOR' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export interface UserProfile {
  phone_number?: string;
  avatar_url?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  vendor_status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'N/A' | string;
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
  vendor_status?: string;
}

export interface AdminCreateUserPayload {
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
}

export interface AdminUpdateUserPayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  status?: AccountStatus;
  is_active?: boolean;
  is_email_verified?: boolean;
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
// VENDORS
// ----------------------------------------------------------
export type VendorStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

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
  created_at?: string;
  updated_at?: string;
}

export interface Vendor extends VendorSummary {
  description: string | null;
  status: VendorStatus;
  product_count: number;
  joined_date: string;
  response_rate: number | null;
  payout_account?: VendorPayoutAccount | null;
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
export type ProductStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED';

export interface ProductImage {
  id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  display_order: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  price: string;
  stock_quantity: number;
  attributes: Record<string, string>;
  image_url: string | null;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  sku: string;
  stock_quantity: number;
  status: ProductStatus;
  vendor: VendorSummary;
  category: CategorySummary;
  images: ProductImage[];
  variants: ProductVariant[];
  average_rating: number;
  review_count: number;
  related_products: ProductSummary[];
  created_at: string;
  updated_at: string;
}

export interface ProductSummary {
  id: string;
  name: string;
  price: string;
  primary_image_url: string | null;
  vendor: VendorSummary;
  average_rating: number;
  review_count: number;
  stock_quantity: number;
  status: ProductStatus;

  // Optional extension properties for dynamic homepage section filtration
  original_price?: string | null;
  discount_percentage?: number;
  category?: CategorySummary;
  is_flash_deal?: boolean;
  is_trending?: boolean;
  is_best_seller?: boolean;
  is_hot_sale?: boolean;
  is_new_arrival?: boolean;
  created_at?: string;
  image_url?: string;
  in_stock?: boolean;
}

// ----------------------------------------------------------
// CART
// ----------------------------------------------------------
export interface CartItem {
  id: string;
  product: ProductSummary;
  variant: ProductVariant | null;
  quantity: number;
  unit_price: string;
  line_total: string;
  is_in_stock: boolean;
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
}

export interface OrderTracking {
  status: OrderStatus;
  location: string | null;
  description: string;
  timestamp: string;
}

export interface Order {
  id: string;
  reference: string;
  status: OrderStatus;
  items: OrderItem[];
  delivery_address: Address;
  delivery_method: string;
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
  count: number;
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

export interface Save2OwnHistory {
  id: string;
  event_type: string;
  previous_value: Record<string, any> | string | null;
  new_value: Record<string, any> | string | null;
  reason: string | null;
  created_at: string;
}

export interface Save2OwnContribution {
  id: string;
  amount: string;
  payment_status?: PaymentStatus;
  status?: string;
  payment?: any;
  payment_reference: string;
  created_at: string;
}

export interface Save2OwnProductChange {
  id: string;
  old_product: ProductSummary;
  new_product: ProductSummary;
  old_target: string;
  new_target: string;
  changed_at: string;
}

export interface Save2OwnGoal {
  id: string;
  reference_code?: string;
  product: ProductSummary;
  product_name?: string;
  variant: ProductVariant | null;
  variant_name?: string;
  variant_sku?: string;
  vendor_name?: string;
  product_image?: string;
  quantity: number;
  status: Save2OwnGoalStatus;
  target_amount: string;
  saved_amount?: string;
  total_contributed: string;
  remaining_amount: string;
  progress_percentage: number;
  progress_percent?: number;
  installment_amount?: string;
  suggested_contribution?: string;
  contribution_plan?: string;
  target_date: string | null;
  contributions: Save2OwnContribution[];
  history?: Save2OwnHistory[];
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
// ADMIN AUDIT LOG
// ----------------------------------------------------------
export interface AuditLog {
  id: string;
  actor: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  action: string;
  entity_type: string;
  entity_id: string;
  ip_address: string | null;
  result: string;
  created_at: string;
}

// ----------------------------------------------------------
// ESCROW PAYOUTS & VENDOR SETTLEMENTS
// ----------------------------------------------------------
export type EscrowPayoutStatus = 'READY_FOR_PAYOUT' | 'PAYOUT_GENERATED' | 'PAID';

export interface EscrowPayoutOrder {
  id: string;
  order_reference: string;
  flw_transaction_ref: string;
  vendor_id: string;
  vendor_name: string;
  order_status: OrderStatus;
  gross_amount: string;
  commission_fee: string;
  net_payout_amount: string;
  created_at: string;
  delivered_at: string | null;
  payout_status: EscrowPayoutStatus;
  payout_batch_id?: string | null;
}

export interface VendorSettlementSummary {
  vendor_id: string;
  vendor_name: string;
  vendor_slug?: string;
  logo_url?: string | null;
  payout_account: VendorPayoutAccount | null;
  order_count: number;
  total_gross_amount: string;
  total_commission_fee: string;
  total_net_payout_amount: string;
  orders: EscrowPayoutOrder[];
  has_valid_payout_account: boolean;
}

export interface PayoutBatch {
  id: string;
  batch_reference: string;
  filename: string;
  created_at: string;
  vendor_count: number;
  order_count: number;
  total_amount: string;
  status: 'GENERATED' | 'PROCESSED' | 'PAID';
  vendor_summaries: VendorSettlementSummary[];
  order_references: string[];
}
