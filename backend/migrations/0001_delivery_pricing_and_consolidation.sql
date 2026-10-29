-- ============================================================================
-- DOVI 2.0 — Delivery Pricing, Order Consolidation & Onitsha Hub Fulfillment
-- Migration: 0001_delivery_pricing_and_consolidation.sql
-- Safe, non-destructive migration preserving all existing data, tables, and records.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Extend existing products table with delivery-related attributes
--    Does NOT permanently tie delivery classification to product category.
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS products_product
  ADD COLUMN IF NOT EXISTS delivery_classification VARCHAR(40) NULL
    CHECK (delivery_classification IN ('SMALL_PARCEL', 'HEAVY_PARCEL', 'FURNITURE_BULKY', 'SPECIAL_MANUAL_QUOTE')),
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(10, 2) NULL
    CHECK (weight_kg IS NULL OR weight_kg >= 0),
  ADD COLUMN IF NOT EXISTS dimensions_length_cm NUMERIC(10, 2) NULL
    CHECK (dimensions_length_cm IS NULL OR dimensions_length_cm >= 0),
  ADD COLUMN IF NOT EXISTS dimensions_width_cm NUMERIC(10, 2) NULL
    CHECK (dimensions_width_cm IS NULL OR dimensions_width_cm >= 0),
  ADD COLUMN IF NOT EXISTS dimensions_height_cm NUMERIC(10, 2) NULL
    CHECK (dimensions_height_cm IS NULL OR dimensions_height_cm >= 0),
  ADD COLUMN IF NOT EXISTS dimensions_text VARCHAR(120) NULL,
  ADD COLUMN IF NOT EXISTS requires_special_handling BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS can_consolidate_with_furniture BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS max_items_per_shipment INTEGER NULL
    CHECK (max_items_per_shipment IS NULL OR max_items_per_shipment >= 1),
  ADD COLUMN IF NOT EXISTS delivery_notes TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_products_delivery_classification
  ON products_product (delivery_classification);

-- ----------------------------------------------------------------------------
-- 2. Delivery Routes & Rates Table (Origin -> Destination State/City)
--    Primary dispatch origin defaults to 'Onitsha'.
--    No hardcoded or sample prices are inserted.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS delivery_routes (
  id UUID PRIMARY KEY,
  origin VARCHAR(100) NOT NULL DEFAULT 'Onitsha',
  destination_state VARCHAR(100) NOT NULL,
  destination_city VARCHAR(100) NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Configured rates per parcel classification (NULL = unconfigured / requires manual quote)
  small_parcel_rate NUMERIC(12, 2) NULL CHECK (small_parcel_rate IS NULL OR small_parcel_rate >= 0),
  heavy_parcel_rate NUMERIC(12, 2) NULL CHECK (heavy_parcel_rate IS NULL OR heavy_parcel_rate >= 0),
  furniture_bulky_rate NUMERIC(12, 2) NULL CHECK (furniture_bulky_rate IS NULL OR furniture_bulky_rate >= 0),

  -- Combined shipment & consolidation configuration
  combined_small_heavy_rate NUMERIC(12, 2) NULL CHECK (combined_small_heavy_rate IS NULL OR combined_small_heavy_rate >= 0),
  combined_furniture_rate NUMERIC(12, 2) NULL CHECK (combined_furniture_rate IS NULL OR combined_furniture_rate >= 0),
  allow_small_with_furniture BOOLEAN NOT NULL DEFAULT FALSE,
  max_small_parcel_weight_kg NUMERIC(10, 2) NULL DEFAULT 25.00,
  max_heavy_parcel_weight_kg NUMERIC(10, 2) NULL DEFAULT 100.00,
  max_furniture_items_consolidated INTEGER NOT NULL DEFAULT 3 CHECK (max_furniture_items_consolidated >= 1),
  multi_furniture_requires_manual_quote BOOLEAN NOT NULL DEFAULT FALSE,

  -- Special handling configuration
  special_handling_surcharge NUMERIC(12, 2) NULL CHECK (special_handling_surcharge IS NULL OR special_handling_surcharge >= 0),
  requires_manual_quote_for_special_handling BOOLEAN NOT NULL DEFAULT TRUE,
  require_weight_dimensions_for_bulky BOOLEAN NOT NULL DEFAULT FALSE,
  special_delivery_requirements TEXT NULL,
  estimated_delivery_info VARCHAR(255) NULL,

  -- Audit tracking
  updated_by_id UUID NULL,
  updated_by_email VARCHAR(255) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_delivery_route_origin_dest UNIQUE (origin, destination_state, destination_city)
);

CREATE INDEX IF NOT EXISTS idx_delivery_routes_lookup
  ON delivery_routes (origin, LOWER(destination_state), LOWER(destination_city), is_active);

-- ----------------------------------------------------------------------------
-- 3. Delivery Rate Change History Table (Immutable Audit Trail)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS delivery_rate_change_history (
  id UUID PRIMARY KEY,
  route_id UUID NOT NULL REFERENCES delivery_routes(id) ON DELETE CASCADE,
  origin VARCHAR(100) NOT NULL,
  destination VARCHAR(200) NOT NULL,
  delivery_classification VARCHAR(80) NOT NULL,
  previous_rate NUMERIC(12, 2) NULL,
  new_rate NUMERIC(12, 2) NULL,
  changed_by_id UUID NULL,
  changed_by_email VARCHAR(255) NOT NULL,
  reason TEXT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_rate_history_route
  ON delivery_rate_change_history (route_id, changed_at DESC);

-- ----------------------------------------------------------------------------
-- 4. Extend Orders Table for Consolidation & Manual Quotation Workflow
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS orders_order
  ADD COLUMN IF NOT EXISTS origin_hub VARCHAR(100) NOT NULL DEFAULT 'Onitsha',
  ADD COLUMN IF NOT EXISTS shipment_count INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_consolidated_delivery BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS special_delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS requires_manual_quote BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS manual_quote_status VARCHAR(40) NOT NULL DEFAULT 'NOT_REQUIRED'
    CHECK (manual_quote_status IN ('NOT_REQUIRED', 'PENDING_ADMIN_QUOTE', 'QUOTED_AWAITING_CUSTOMER', 'ACCEPTED_BY_CUSTOMER', 'DECLINED_BY_CUSTOMER')),
  ADD COLUMN IF NOT EXISTS manual_quote_reason TEXT NULL,
  ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(40) NOT NULL DEFAULT 'ORDER_PLACED';

-- ----------------------------------------------------------------------------
-- 5. Order Shipments Table (Consolidated or Separated Transport Groups)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_shipments (
  id UUID PRIMARY KEY,
  shipment_number INTEGER NOT NULL DEFAULT 1,
  shipment_reference VARCHAR(64) NOT NULL UNIQUE,
  order_id UUID NOT NULL,
  order_reference VARCHAR(64) NOT NULL,
  buyer_id UUID NULL,
  origin VARCHAR(100) NOT NULL DEFAULT 'Onitsha',
  destination_state VARCHAR(100) NOT NULL,
  destination_city VARCHAR(100) NOT NULL,
  destination_address TEXT NOT NULL,
  recipient_name VARCHAR(200) NULL,
  recipient_phone VARCHAR(60) NULL,

  shipment_classification VARCHAR(40) NOT NULL
    CHECK (shipment_classification IN ('SMALL_PARCEL', 'HEAVY_PARCEL', 'FURNITURE_BULKY', 'SPECIAL_MANUAL_QUOTE')),
  classification_label VARCHAR(120) NOT NULL,
  is_consolidated BOOLEAN NOT NULL DEFAULT TRUE,
  consolidation_summary TEXT NULL,
  separation_reason TEXT NULL,

  total_quantity INTEGER NOT NULL DEFAULT 1,
  combined_weight_kg NUMERIC(10, 2) NULL,
  combined_dimensions_cm VARCHAR(160) NULL,

  delivery_fee NUMERIC(12, 2) NULL CHECK (delivery_fee IS NULL OR delivery_fee >= 0),
  special_handling_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  requires_manual_quote BOOLEAN NOT NULL DEFAULT FALSE,
  manual_quote_reason TEXT NULL,

  status VARCHAR(40) NOT NULL DEFAULT 'ORDER_PLACED'
    CHECK (status IN (
      'AWAITING_DELIVERY_CONFIRMATION',
      'DELIVERY_FEE_CONFIRMED',
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
      'CANCELLED'
    )),
  transport_arrangement VARCHAR(255) NOT NULL DEFAULT '',
  delivery_notes TEXT NULL,
  estimated_delivery_info VARCHAR(255) NULL,

  -- Onitsha Hub Fulfillment Checkpoints
  received_at_hub_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  inspection_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  packaging_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  customer_approved_split BOOLEAN NOT NULL DEFAULT FALSE,

  received_at_hub_at TIMESTAMPTZ NULL,
  inspected_at TIMESTAMPTZ NULL,
  packaged_at TIMESTAMPTZ NULL,
  dispatched_at TIMESTAMPTZ NULL,
  delivered_at TIMESTAMPTZ NULL,

  timeline_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_shipments_order_id
  ON order_shipments (order_id);
CREATE INDEX IF NOT EXISTS idx_order_shipments_order_ref
  ON order_shipments (order_reference);
CREATE INDEX IF NOT EXISTS idx_order_shipments_buyer_id
  ON order_shipments (buyer_id);

-- ----------------------------------------------------------------------------
-- 6. Order Shipment Items Table (Products & Quantities in Each Shipment)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_shipment_items (
  id UUID PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES order_shipments(id) ON DELETE CASCADE,
  product_id VARCHAR(120) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_image_url TEXT NULL,
  variant_id VARCHAR(120) NULL,
  variant_name VARCHAR(255) NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  line_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  delivery_classification VARCHAR(40) NULL,
  weight_kg NUMERIC(10, 2) NULL,
  dimensions_cm VARCHAR(120) NULL,
  requires_special_handling BOOLEAN NOT NULL DEFAULT FALSE,
  delivery_notes TEXT NULL,

  -- Per-item Onitsha Hub Consolidation Tracking
  supplier_status VARCHAR(40) NOT NULL DEFAULT 'PENDING'
    CHECK (supplier_status IN ('PENDING', 'SOURCING', 'RECEIVED_AT_HUB', 'LATE_AT_HUB', 'UNAVAILABLE')),
  received_at_hub BOOLEAN NOT NULL DEFAULT FALSE,
  inspected BOOLEAN NOT NULL DEFAULT FALSE,
  packaged BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_order_shipment_items_shipment
  ON order_shipment_items (shipment_id);

-- ----------------------------------------------------------------------------
-- 7. Row-Level Security (RLS) & Access Controls
-- ----------------------------------------------------------------------------
ALTER TABLE delivery_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_rate_change_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_shipment_items ENABLE ROW LEVEL SECURITY;

-- Customers can read active delivery routes; only ADMIN role can write
DROP POLICY IF EXISTS delivery_routes_read_policy ON delivery_routes;
CREATE POLICY delivery_routes_read_policy ON delivery_routes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS delivery_routes_admin_write_policy ON delivery_routes;
CREATE POLICY delivery_routes_admin_write_policy ON delivery_routes
  FOR ALL USING (current_setting('app.current_user_role', true) = 'ADMIN')
  WITH CHECK (current_setting('app.current_user_role', true) = 'ADMIN');

-- Only ADMIN role can view or insert rate change history
DROP POLICY IF EXISTS delivery_rate_history_admin_policy ON delivery_rate_change_history;
CREATE POLICY delivery_rate_history_admin_policy ON delivery_rate_change_history
  FOR ALL USING (current_setting('app.current_user_role', true) = 'ADMIN')
  WITH CHECK (current_setting('app.current_user_role', true) = 'ADMIN');

-- Customers can only access their own shipments; ADMIN can access all
DROP POLICY IF EXISTS order_shipments_access_policy ON order_shipments;
CREATE POLICY order_shipments_access_policy ON order_shipments
  FOR SELECT USING (
    current_setting('app.current_user_role', true) = 'ADMIN'
    OR buyer_id::text = current_setting('app.current_user_id', true)
  );

DROP POLICY IF EXISTS order_shipments_admin_write_policy ON order_shipments;
CREATE POLICY order_shipments_admin_write_policy ON order_shipments
  FOR ALL USING (current_setting('app.current_user_role', true) = 'ADMIN')
  WITH CHECK (current_setting('app.current_user_role', true) = 'ADMIN');

COMMIT;

