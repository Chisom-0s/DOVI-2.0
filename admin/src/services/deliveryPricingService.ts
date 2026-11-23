// ============================================================
// DOVI 2.0 — Authoritative Delivery Pricing, Consolidation &
// Fulfillment Fulfillment Service
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
import { fetchSharedDbOnce } from './sharedDbSync';

export const PRIMARY_DISPATCH_ORIGIN = 'Onitsha';

export const DEFAULT_SEED_ROUTES: DeliveryRoute[] = [
  {
    "id": "route_f3b4eb8cde34",
    "dispatch_origin": "Onitsha",
    "destination_state": "Anambra",
    "destination_city": "Awka",
    "small_parcel_rate": 2500,
    "heavy_parcel_rate": 6000,
    "furniture_bulky_rate": 15000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 20000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "1-2 business days",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  },
  {
    "id": "route_38c2c3d4686a",
    "dispatch_origin": "Onitsha",
    "destination_state": "Anambra",
    "destination_city": "Onitsha",
    "small_parcel_rate": 1500,
    "heavy_parcel_rate": 4000,
    "furniture_bulky_rate": 12000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 17000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "Same day - 1 business day",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  },
  {
    "id": "route_6d41a0751d24",
    "dispatch_origin": "Onitsha",
    "destination_state": "Anambra",
    "destination_city": "Nnewi",
    "small_parcel_rate": 2500,
    "heavy_parcel_rate": 6000,
    "furniture_bulky_rate": 15000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 20000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "1-2 business days",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  },
  {
    "id": "route_8122825125d3",
    "dispatch_origin": "Onitsha",
    "destination_state": "Anambra",
    "destination_city": "Ekwulobia",
    "small_parcel_rate": 3000,
    "heavy_parcel_rate": 7000,
    "furniture_bulky_rate": 18000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 23000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "1-2 business days",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  },
  {
    "id": "route_e9242d7245a9",
    "dispatch_origin": "Onitsha",
    "destination_state": "Lagos",
    "destination_city": "Ikeja",
    "small_parcel_rate": 4000,
    "heavy_parcel_rate": 9000,
    "furniture_bulky_rate": 20000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 25000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "2-4 business days",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  },
  {
    "id": "route_78d07e897dd1",
    "dispatch_origin": "Onitsha",
    "destination_state": "Lagos",
    "destination_city": "Lekki",
    "small_parcel_rate": 4500,
    "heavy_parcel_rate": 10000,
    "furniture_bulky_rate": 22000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 27000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "2-4 business days",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  },
  {
    "id": "route_535857e8c217",
    "dispatch_origin": "Onitsha",
    "destination_state": "Lagos",
    "destination_city": "Victoria Island",
    "small_parcel_rate": 4500,
    "heavy_parcel_rate": 10000,
    "furniture_bulky_rate": 22000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 27000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "2-4 business days",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  },
  {
    "id": "route_84f705a3e8c5",
    "dispatch_origin": "Onitsha",
    "destination_state": "Lagos",
    "destination_city": "Surulere",
    "small_parcel_rate": 4000,
    "heavy_parcel_rate": 9000,
    "furniture_bulky_rate": 20000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 25000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "2-4 business days",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  },
  {
    "id": "route_a9089b597b37",
    "dispatch_origin": "Onitsha",
    "destination_state": "Lagos",
    "destination_city": "Yaba",
    "small_parcel_rate": 4000,
    "heavy_parcel_rate": 9000,
    "furniture_bulky_rate": 20000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 25000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "2-4 business days",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  },
  {
    "id": "route_cd1f4bb6a12a",
    "dispatch_origin": "Onitsha",
    "destination_state": "Lagos",
    "destination_city": "All Cities",
    "small_parcel_rate": 4500,
    "heavy_parcel_rate": 10000,
    "furniture_bulky_rate": 22000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 27000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "2-4 business days",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  },
  {
    "id": "route_9497935c6844",
    "dispatch_origin": "Onitsha",
    "destination_state": "FCT - Abuja",
    "destination_city": "Garki",
    "small_parcel_rate": 5000,
    "heavy_parcel_rate": 11000,
    "furniture_bulky_rate": 25000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 30000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "2-3 business days",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  },
  {
    "id": "route_b93e1332d216",
    "dispatch_origin": "Onitsha",
    "destination_state": "FCT - Abuja",
    "destination_city": "Wuse",
    "small_parcel_rate": 5000,
    "heavy_parcel_rate": 11000,
    "furniture_bulky_rate": 25000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 30000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "2-3 business days",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  },
  {
    "id": "route_3c47a115e4f1",
    "dispatch_origin": "Onitsha",
    "destination_state": "FCT - Abuja",
    "destination_city": "Maitama",
    "small_parcel_rate": 5500,
    "heavy_parcel_rate": 12000,
    "furniture_bulky_rate": 28000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 33000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "2-3 business days",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  },
  {
    "id": "route_e68180dde014",
    "dispatch_origin": "Onitsha",
    "destination_state": "FCT - Abuja",
    "destination_city": "Gwarinpa",
    "small_parcel_rate": 5000,
    "heavy_parcel_rate": 11000,
    "furniture_bulky_rate": 25000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 30000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "2-3 business days",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  },
  {
    "id": "route_775b3100f11e",
    "dispatch_origin": "Onitsha",
    "destination_state": "FCT - Abuja",
    "destination_city": "All Cities",
    "small_parcel_rate": 5000,
    "heavy_parcel_rate": 11000,
    "furniture_bulky_rate": 25000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 30000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "2-3 business days",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  },
  {
    "id": "route_7ded7f673ffc",
    "dispatch_origin": "Onitsha",
    "destination_state": "Enugu",
    "destination_city": "Enugu",
    "small_parcel_rate": 2500,
    "heavy_parcel_rate": 6000,
    "furniture_bulky_rate": 15000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 20000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "1-2 business days",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  },
  {
    "id": "route_e7736fb6ac88",
    "dispatch_origin": "Onitsha",
    "destination_state": "Enugu",
    "destination_city": "Nsukka",
    "small_parcel_rate": 3500,
    "heavy_parcel_rate": 7500,
    "furniture_bulky_rate": 18000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 23000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "1-2 business days",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  },
  {
    "id": "route_7740670fcc15",
    "dispatch_origin": "Onitsha",
    "destination_state": "Rivers",
    "destination_city": "Port Harcourt",
    "small_parcel_rate": 4000,
    "heavy_parcel_rate": 9000,
    "furniture_bulky_rate": 20000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 25000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "2-3 business days",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  },
  {
    "id": "route_e5dd3bbc64d1",
    "dispatch_origin": "Onitsha",
    "destination_state": "Rivers",
    "destination_city": "Obio-Akpor",
    "small_parcel_rate": 4000,
    "heavy_parcel_rate": 9000,
    "furniture_bulky_rate": 20000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 25000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "2-3 business days",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  },
  {
    "id": "route_d2820439f57e",
    "dispatch_origin": "Onitsha",
    "destination_state": "Delta",
    "destination_city": "Asaba",
    "small_parcel_rate": 1500,
    "heavy_parcel_rate": 4000,
    "furniture_bulky_rate": 12000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 17000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "Same day - 1 business day",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  },
  {
    "id": "route_c5c58ae45a65",
    "dispatch_origin": "Onitsha",
    "destination_state": "Delta",
    "destination_city": "Warri",
    "small_parcel_rate": 5000,
    "heavy_parcel_rate": 8500,
    "furniture_bulky_rate": 20000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 27000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "1-2 business days",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-20T18:04:01.335Z",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  },
  {
    "id": "route_eaeb30500543",
    "dispatch_origin": "Onitsha",
    "destination_state": "Imo",
    "destination_city": "Owerri",
    "small_parcel_rate": 2500,
    "heavy_parcel_rate": 6000,
    "furniture_bulky_rate": 15000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 20000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "1-2 business days",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  },
  {
    "id": "route_75926d44bac7",
    "dispatch_origin": "Onitsha",
    "destination_state": "Imo",
    "destination_city": "Orlu",
    "small_parcel_rate": 3000,
    "heavy_parcel_rate": 7000,
    "furniture_bulky_rate": 18000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 23000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "1-2 business days",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  },
  {
    "id": "route_a9a747d564e1",
    "dispatch_origin": "Onitsha",
    "destination_state": "Abia",
    "destination_city": "Aba",
    "small_parcel_rate": 2500,
    "heavy_parcel_rate": 6000,
    "furniture_bulky_rate": 15000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 20000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "1-2 business days",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  },
  {
    "id": "route_56c88181f47a",
    "dispatch_origin": "Onitsha",
    "destination_state": "Abia",
    "destination_city": "Umuahia",
    "small_parcel_rate": 2500,
    "heavy_parcel_rate": 6000,
    "furniture_bulky_rate": 15000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 20000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "1-2 business days",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  },
  {
    "id": "route_9b3216e90057",
    "dispatch_origin": "Onitsha",
    "destination_state": "Oyo",
    "destination_city": "Ibadan",
    "small_parcel_rate": 4500,
    "heavy_parcel_rate": 10000,
    "furniture_bulky_rate": 22000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 27000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "2-4 business days",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  },
  {
    "id": "route_57f8fe59ace6",
    "dispatch_origin": "Onitsha",
    "destination_state": "Edo",
    "destination_city": "Benin City",
    "small_parcel_rate": 3000,
    "heavy_parcel_rate": 7000,
    "furniture_bulky_rate": 18000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 23000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "1-2 business days",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  },
  {
    "id": "route_f1e657b7c14c",
    "dispatch_origin": "Onitsha",
    "destination_state": "Kano",
    "destination_city": "Kano",
    "small_parcel_rate": 6000,
    "heavy_parcel_rate": 14000,
    "furniture_bulky_rate": 30000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 35000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "3-5 business days",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  },
  {
    "id": "route_c0d79e5e1a99",
    "dispatch_origin": "Onitsha",
    "destination_state": "Kaduna",
    "destination_city": "Kaduna",
    "small_parcel_rate": 5500,
    "heavy_parcel_rate": 13000,
    "furniture_bulky_rate": 28000,
    "combined_small_heavy_rate": null,
    "combined_furniture_rate": 33000,
    "special_handling_surcharge": null,
    "allows_furniture_small_consolidation": true,
    "max_furniture_items_consolidated": 2,
    "max_small_parcel_weight_kg": 15,
    "max_heavy_parcel_weight_kg": 80,
    "special_delivery_requirements": null,
    "estimated_delivery_days": "3-5 business days",
    "is_active": true,
    "created_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_at": "2026-11-19T11:47:11.437760+00:00",
    "updated_by_id": "admin-system",
    "updated_by_email": "admin@dovi.com",
    "updated_by_name": "Administrator"
  }
];



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

export const ACTIVE_FULFILLMENT_STATUSES: ShipmentFulfillmentStatus[] = [
  'ORDER_PLACED',
  'PROCESSING',
  'READY_FOR_DISPATCH',
  'DISPATCHED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

export const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  ORDER_PLACED: 'Order Placed',
  PROCESSING: 'Processing',
  READY_FOR_DISPATCH: 'Ready for Dispatch',
  DISPATCHED: 'Dispatched',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  // Historical / legacy mappings
  AWAITING_DELIVERY_CONFIRMATION: 'Processing',
  DELIVERY_FEE_CONFIRMED: 'Processing',
  SOURCING_PRODUCTS: 'Processing',
  AWAITING_PRODUCTS_AT_HUB: 'Processing',
  PRODUCTS_RECEIVED: 'Processing',
  QUALITY_CHECK: 'Processing',
  READY_FOR_PACKAGING: 'Processing',
  PACKAGED: 'Ready for Dispatch',
  SHIPPED: 'Dispatched',
  IN_TRANSIT: 'Dispatched',
  RECEIVED: 'Delivered',
  COMPLETED: 'Delivered',
};

export const SHIPMENT_STATUS_ORDER: ShipmentFulfillmentStatus[] = [
  'ORDER_PLACED',
  'PROCESSING',
  'READY_FOR_DISPATCH',
  'DISPATCHED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

export function normalizeFulfillmentStatus(rawStatus?: string): ShipmentFulfillmentStatus {
  if (!rawStatus) return 'ORDER_PLACED';
  const s = rawStatus.toUpperCase().trim();
  switch (s) {
    case 'ORDER_PLACED':
    case 'PENDING_PAYMENT':
      return 'ORDER_PLACED';
    case 'PROCESSING':
    case 'SOURCING_PRODUCTS':
    case 'AWAITING_PRODUCTS_AT_HUB':
    case 'PRODUCTS_RECEIVED':
    case 'QUALITY_CHECK':
    case 'READY_FOR_PACKAGING':
    case 'DELIVERY_FEE_CONFIRMED':
    case 'AWAITING_DELIVERY_CONFIRMATION':
      return 'PROCESSING';
    case 'READY_FOR_DISPATCH':
    case 'PACKAGED':
      return 'READY_FOR_DISPATCH';
    case 'DISPATCHED':
    case 'SHIPPED':
    case 'IN_TRANSIT':
      return 'DISPATCHED';
    case 'OUT_FOR_DELIVERY':
      return 'OUT_FOR_DELIVERY';
    case 'DELIVERED':
    case 'RECEIVED':
    case 'COMPLETED':
      return 'DELIVERED';
    case 'CANCELLED':
    case 'REFUNDED':
      return 'CANCELLED';
    default:
      return 'ORDER_PLACED';
  }
}

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
  routes: [...DEFAULT_SEED_ROUTES],
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
    if (key === STORAGE_KEYS.ROUTES) return (memoryStore.routes && memoryStore.routes.length > 0 ? memoryStore.routes : fallback) as unknown as T;
    if (key === STORAGE_KEYS.RATE_HISTORY) return memoryStore.rate_history as unknown as T;
    if (key === STORAGE_KEYS.PRODUCT_ATTRS) return memoryStore.product_delivery_attributes as unknown as T;
    if (key === STORAGE_KEYS.ORDER_SHIPMENTS) return memoryStore.order_shipments as unknown as T;
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    if (key === STORAGE_KEYS.ROUTES && Array.isArray(parsed) && parsed.length === 0) {
      return fallback;
    }
    return parsed;
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
  let serverData: Partial<DeliveryStoreState> | null = await fetchSharedDbOnce();

  if (!serverData || !Array.isArray(serverData.routes) || serverData.routes.length === 0) {
    try {
      const resStatic = await fetch('/delivery_store.json', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      const cTypeStatic = resStatic.headers.get('content-type') || '';
      if (resStatic.ok && cTypeStatic.includes('application/json')) {
        serverData = (await resStatic.json()) as Partial<DeliveryStoreState>;
      }
    } catch {
      // Non-fatal
    }
  }

  const local = getLocalDeliveryStore();
  const destKey = (r: DeliveryRoute) => `${canonicalStateKey(r.destination_state)}|${canonicalCityKey(r.destination_city)}`;
  const mergedMap = new Map<string, DeliveryRoute>();

  // 1. Seed routes as baseline
  for (const r of DEFAULT_SEED_ROUTES) {
    if (r && r.destination_state) mergedMap.set(destKey(r), r);
  }
  // 2. Local routes
  for (const r of local.routes || []) {
    if (r && r.destination_state) mergedMap.set(destKey(r), r);
  }
  // 3. Server routes (override if newer or present)
  const serverRoutes = Array.isArray(serverData?.routes) ? serverData.routes : [];
  for (const r of serverRoutes) {
    if (r && r.destination_state) {
      const key = destKey(r);
      const existing = mergedMap.get(key);
      if (!existing || new Date(r.updated_at).getTime() >= new Date(existing.updated_at).getTime()) {
        mergedMap.set(key, r);
      }
    }
  }
  const mergedRoutes = Array.from(mergedMap.values());
  if (local.routes.length > serverRoutes.length) {
    void pushDeliveryStoreToServer({ routes: mergedRoutes });
  }

  // Merge rate history by ID
  const historyMap = new Map<string, DeliveryRateChangeRecord>();
  for (const h of local.rate_history || []) historyMap.set(h.id, h);
  for (const h of serverData?.rate_history || []) historyMap.set(h.id, h);
  const mergedHistory = Array.from(historyMap.values()).sort(
    (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
  );

  // Merge product delivery attributes
  const mergedProductAttrs: Record<string, ProductDeliveryAttributes> = {
    ...local.product_delivery_attributes,
    ...(serverData?.product_delivery_attributes || {}),
  };

  // Merge order shipments
  const mergedShipments: Record<string, OrderShipment[]> = {
    ...local.order_shipments,
    ...(serverData?.order_shipments || {}),
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

export async function pushDeliveryStoreToServer(partial?: Partial<DeliveryStoreState>): Promise<boolean> {
  const current = getLocalDeliveryStore();
  const payload: DeliveryStoreState = {
    routes: partial?.routes ?? current.routes,
    rate_history: partial?.rate_history ?? current.rate_history,
    product_delivery_attributes: partial?.product_delivery_attributes ?? current.product_delivery_attributes,
    order_shipments: partial?.order_shipments ?? current.order_shipments,
  };
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      const res = await fetch('/__dovi_delivery_db__', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
  return false;
}

export function getLocalDeliveryStore(): DeliveryStoreState {
  const localRoutes = readLocal<DeliveryRoute[]>(STORAGE_KEYS.ROUTES, []);
  return {
    routes: localRoutes && localRoutes.length > 0 ? localRoutes : DEFAULT_SEED_ROUTES,
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
  delivery_fee?: number | null;
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
  const localRoutes = readLocal<DeliveryRoute[]>(STORAGE_KEYS.ROUTES, DEFAULT_SEED_ROUTES);
  const baseRoutes = (localRoutes && localRoutes.length > 0) ? localRoutes : DEFAULT_SEED_ROUTES;
  const filtered = includeInactive ? baseRoutes : baseRoutes.filter((r) => r.is_active);
  return [...filtered].sort((a, b) => {
    const stateCmp = a.destination_state.localeCompare(b.destination_state);
    if (stateCmp !== 0) return stateCmp;
    return a.destination_city.localeCompare(b.destination_city);
  });
}

// ----------------------------------------------------------
// LOCATION NORMALIZATION
// A single canonical normalizer is used by the admin route editor, the
// checkout selectors and the route matcher so "Lagos", "Lagos State",
// " lagos " and "FCT - Abuja" / "Abuja (FCT)" always resolve to the same key.
// ----------------------------------------------------------
const STATE_KEY_ALIASES: Record<string, string> = {
  fct: 'fct',
  'fct abuja': 'fct',
  'abuja fct': 'fct',
  abuja: 'fct',
  'federal capital territory': 'fct',
  'cross rivers': 'cross river',
  akwaibom: 'akwa ibom',
  nassarawa: 'nasarawa',
};

export const CITY_KEY_ALIASES: Record<string, string> = {
  ph: 'port harcourt',
  phc: 'port harcourt',
  portharcourt: 'port harcourt',
  'port harcourt city': 'port harcourt',
  'port harcourt': 'port harcourt',
  benin: 'benin city',
  'benin city': 'benin city',
  enugu: 'enugu',
  'enugu urban': 'enugu',
  'enugu city': 'enugu',
  awka: 'awka',
  'awka urban': 'awka',
  'awka south': 'awka',
  'awka north': 'awka',
  onitsha: 'onitsha',
  'onitsha north': 'onitsha',
  'onitsha south': 'onitsha',
  'onitsha urban': 'onitsha',
  warri: 'warri',
  'warri south': 'warri',
  asaba: 'asaba',
  'asaba urban': 'asaba',
  aba: 'aba',
  'aba north': 'aba',
  'aba south': 'aba',
  'aba urban': 'aba',
  umuahia: 'umuahia',
  'umuahia north': 'umuahia',
  'umuahia south': 'umuahia',
  'umuahia urban': 'umuahia',
  owerri: 'owerri',
  'owerri municipal': 'owerri',
  'owerri urban': 'owerri',
  'owerri west': 'owerri',
  'owerri north': 'owerri',
  calabar: 'calabar',
  'calabar municipal': 'calabar',
  'calabar south': 'calabar',
  uyo: 'uyo',
  'uyo urban': 'uyo',
  kano: 'kano',
  'kano municipal': 'kano',
  'kano city': 'kano',
  kaduna: 'kaduna',
  'kaduna north': 'kaduna',
  'kaduna south': 'kaduna',
  'kaduna central': 'kaduna',
  ibadan: 'ibadan',
  'ibadan north': 'ibadan',
  'ibadan south': 'ibadan',
  'ibadan sw': 'ibadan',
  'ibadan central': 'ibadan',
  abeokuta: 'abeokuta',
  'abeokuta north': 'abeokuta',
  'abeokuta south': 'abeokuta',
  jos: 'jos',
  'jos north': 'jos',
  'jos south': 'jos',
  garki: 'garki',
  'garki 1': 'garki',
  'garki 2': 'garki',
  'garki ii': 'garki',
  wuse: 'wuse',
  'wuse 2': 'wuse',
  'wuse ii': 'wuse',
  'wuse zone': 'wuse',
  maitama: 'maitama',
  gwarinpa: 'gwarinpa',
  gwarimpa: 'gwarinpa',
  ikeja: 'ikeja',
  'ikeja gra': 'ikeja',
  lekki: 'lekki',
  'lekki phase 1': 'lekki',
  'lekki phase 2': 'lekki',
  'lekki peninsula': 'lekki',
  'victoria island': 'victoria island',
  vi: 'victoria island',
  surulere: 'surulere',
  yaba: 'yaba',
};

export function routeIdentity(r: Pick<DeliveryRoute, 'dispatch_origin' | 'destination_state' | 'destination_city'>): string {
  return [
    normalizeLocationName(r.dispatch_origin || PRIMARY_DISPATCH_ORIGIN),
    canonicalStateKey(r.destination_state),
    canonicalCityKey(r.destination_city),
  ].join('|');
}

const STATE_WIDE_CITY_KEYS = ['all cities', 'all city', 'all towns', 'all', 'any', 'statewide', 'state wide', '*'];

export function normalizeLocationName(value: string | null | undefined): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[().,'’`\-_/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function canonicalStateKey(value: string | null | undefined): string {
  const stripped = normalizeLocationName(value)
    .replace(/\bstate\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return STATE_KEY_ALIASES[stripped] || stripped;
}

export function canonicalCityKey(value: string | null | undefined): string {
  let norm = normalizeLocationName(value);
  if (!norm) return '';
  if (CITY_KEY_ALIASES[norm]) return CITY_KEY_ALIASES[norm];

  // Strip trailing 'state'
  norm = norm.replace(/\bstate\b/g, '').replace(/\s+/g, ' ').trim();
  if (CITY_KEY_ALIASES[norm]) return CITY_KEY_ALIASES[norm];

  // Strip state suffix if present (e.g. 'warri delta' -> 'warri', 'awka anambra' -> 'awka')
  for (const st of NIGERIAN_STATES) {
    const stNorm = normalizeLocationName(st);
    if (stNorm && norm.endsWith(stNorm)) {
      norm = norm.slice(0, -stNorm.length).trim();
      break;
    }
  }
  if (CITY_KEY_ALIASES[norm]) return CITY_KEY_ALIASES[norm];

  // Strip generic city/town qualifiers if not already an alias
  const stripped = norm.replace(/\b(city|town|lga)\b/g, '').replace(/\s+/g, ' ').trim();
  if (CITY_KEY_ALIASES[stripped]) return CITY_KEY_ALIASES[stripped];
  return stripped || norm;
}

/** Maps any user/admin supplied state string to the canonical entry in NIGERIAN_STATES (or '' if unknown). */
export function resolveCanonicalStateName(value: string | null | undefined): string {
  const key = canonicalStateKey(value);
  if (!key) return '';
  return NIGERIAN_STATES.find((s) => canonicalStateKey(s) === key) || '';
}

export function isStateWideCity(route: Pick<DeliveryRoute, 'destination_state' | 'destination_city'>): boolean {
  const cityKey = canonicalCityKey(route.destination_city);
  if (!cityKey || STATE_WIDE_CITY_KEYS.includes(cityKey)) return true;
  const stateKey = canonicalStateKey(route.destination_state);
  const citySameAsStateExceptions = ['lagos', 'enugu', 'kano', 'kaduna'];
  if (cityKey === stateKey && !citySameAsStateExceptions.includes(stateKey)) {
    return true;
  }
  return false;
}

export type RouteMatchType = 'EXACT_CITY' | 'STATE_WIDE' | 'NONE';

/**
 * Pure route matcher: given an explicit list of routes, finds the active route for
 * origin + state + city. Never falls back to a different state or a different city
 * (other than an explicitly state-wide route of the SAME state).
 */
export function findRouteInList(
  routes: DeliveryRoute[],
  destinationState: string,
  destinationCity: string,
  dispatchOrigin = PRIMARY_DISPATCH_ORIGIN
): { route: DeliveryRoute | null; match: RouteMatchType } {
  void dispatchOrigin;
  const stateKey = canonicalStateKey(destinationState);
  const cityKey = canonicalCityKey(destinationCity);

  if (!stateKey) return { route: null, match: 'NONE' };

  const candidates = routes.filter(
    (r) =>
      r.is_active !== false &&
      r.destination_state &&
      canonicalStateKey(r.destination_state) === stateKey
  );

  if (cityKey) {
    // 1. Exact normalized match
    const exact = candidates.find((r) => !isStateWideCity(r) && canonicalCityKey(r.destination_city) === cityKey);
    if (exact) return { route: exact, match: 'EXACT_CITY' };

    // 2. Substring / Prefix / Alias match:
    // e.g. customer entered "Ikeja GRA" and candidate is "Ikeja", or candidate is "Benin City" and customer entered "Benin"
    const fuzzy = candidates.find((r) => {
      if (isStateWideCity(r)) return false;
      const candKey = canonicalCityKey(r.destination_city);
      if (!candKey) return false;
      return (
        cityKey.startsWith(candKey) ||
        cityKey.includes(candKey) ||
        candKey.startsWith(cityKey) ||
        candKey.includes(cityKey)
      );
    });
    if (fuzzy) return { route: fuzzy, match: 'EXACT_CITY' };
  }

  // 3. Statewide catch-all route for this state
  const stateWide = candidates.find((r) => isStateWideCity(r));
  if (stateWide) return { route: stateWide, match: 'STATE_WIDE' };

  return { route: null, match: 'NONE' };
}

/** Lists the distinct, active, configured destination cities for a state (excluding state-wide catch-all rows). */
export function listConfiguredCitiesForState(
  routes: DeliveryRoute[],
  destinationState: string,
  dispatchOrigin = PRIMARY_DISPATCH_ORIGIN
): DeliveryRoute[] {
  void dispatchOrigin;
  const stateKey = canonicalStateKey(destinationState);
  if (!stateKey) return [];
  const seen = new Set<string>();
  const result: DeliveryRoute[] = [];
  let stateWideCatchAll: DeliveryRoute | null = null;

  for (const r of routes) {
    if (r.is_active === false) continue;
    // Destination-based delivery
    if (!r.destination_city) continue;
    if (canonicalStateKey(r.destination_state) !== stateKey) continue;
    if (isStateWideCity(r)) {
      if (!stateWideCatchAll) stateWideCatchAll = r;
      continue;
    }
    const key = canonicalCityKey(r.destination_city);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(r);
  }
  const sorted = result.sort((a, b) => a.destination_city.localeCompare(b.destination_city));
  if (stateWideCatchAll && !seen.has(canonicalCityKey(stateWideCatchAll.destination_city))) {
    sorted.push(stateWideCatchAll);
  }
  return sorted;
}

export function findActiveRoute(
  destinationState: string,
  destinationCity: string,
  dispatchOrigin = PRIMARY_DISPATCH_ORIGIN
): DeliveryRoute | null {
  return findRouteInList(listDeliveryRoutes(false), destinationState, destinationCity, dispatchOrigin).route;
}

/** Pure state-change transition: a new state ALWAYS clears the town (towns belong to exactly one state). */
export function selectDestinationState(nextState: string): { state: string; city: string } {
  return { state: nextState, city: '' };
}

/** True only if `city` is a configured town of `state` (or a custom town typed by the customer for that state). */
export function isConfiguredCityForState(
  routes: DeliveryRoute[],
  state: string,
  city: string,
  dispatchOrigin = PRIMARY_DISPATCH_ORIGIN
): boolean {
  const key = canonicalCityKey(city);
  if (!key) return false;
  return listConfiguredCitiesForState(routes, state, dispatchOrigin).some(
    (r) => canonicalCityKey(r.destination_city) === key
  );
}

export function listRateChangeHistory(routeId?: string): DeliveryRateChangeRecord[] {
  const history = readLocal<DeliveryRateChangeRecord[]>(STORAGE_KEYS.RATE_HISTORY, []);
  const filtered = routeId ? history.filter((h) => h.route_id === routeId) : history;
  return [...filtered].sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
}

export async function createDeliveryRoute(input: CreateOrUpdateRouteInput, actor: AdminActor): Promise<DeliveryRoute> {
  assertAuthorizedAdmin(actor);

  const destinationState = resolveCanonicalStateName(input.destination_state) || (input.destination_state || '').trim();
  const destinationCity = (input.destination_city || '').trim();
  const dispatchOrigin = (input.dispatch_origin || PRIMARY_DISPATCH_ORIGIN).trim();

  if (!destinationState || !destinationCity) {
    throw new Error('Destination state and city are required to create a delivery route.');
  }

  const routes = readLocal<DeliveryRoute[]>(STORAGE_KEYS.ROUTES, []);
  const duplicate = routes.find(
    (r) =>
      normalizeLocationName(r.dispatch_origin) === normalizeLocationName(dispatchOrigin) &&
      canonicalStateKey(r.destination_state) === canonicalStateKey(destinationState) &&
      canonicalCityKey(r.destination_city) === canonicalCityKey(destinationCity)
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
  await pushDeliveryStoreToServer({ routes, rate_history: history });

  return newRoute;
}

export async function updateDeliveryRoute(
  routeId: string,
  updates: Partial<CreateOrUpdateRouteInput>,
  actor: AdminActor
): Promise<DeliveryRoute> {
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
  await pushDeliveryStoreToServer({ routes, rate_history: history });

  return updated;
}

export async function deleteDeliveryRoute(routeId: string, actor: AdminActor): Promise<void> {
  assertAuthorizedAdmin(actor);
  const routes = readLocal<DeliveryRoute[]>(STORAGE_KEYS.ROUTES, []);
  const filtered = routes.filter((r) => r.id !== routeId);
  writeLocal(STORAGE_KEYS.ROUTES, filtered);
  await pushDeliveryStoreToServer({ routes: filtered });
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

    const suggested = suggestParcelClassificationForAdmin({
      name: raw.product_name,
      category_name: (raw as any)?.category_name,
      description: raw.description || undefined,
    });
    const classification: ParcelClassification =
      raw.delivery_classification ||
      storedAttrs?.delivery_classification ||
      suggested ||
      'SMALL_PARCEL';

    if (classification === 'SPECIAL_MANUAL_QUOTE') {
      manualQuoteReasons.push(
        `Product "${raw.product_name}" requires special manual delivery confirmation.`
      );
    }

    const effectiveClassification: ParcelClassification = classification;
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
      hasMissingClassification: false,
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
    } else {
      const confSmall = route?.small_parcel_rate !== null && route?.small_parcel_rate !== undefined && Number(route.small_parcel_rate) >= 0 ? Number(route.small_parcel_rate) : null;
      const confHeavy = route?.heavy_parcel_rate !== null && route?.heavy_parcel_rate !== undefined && Number(route.heavy_parcel_rate) >= 0 ? Number(route.heavy_parcel_rate) : null;
      const confBulky = route?.furniture_bulky_rate !== null && route?.furniture_bulky_rate !== undefined && Number(route.furniture_bulky_rate) >= 0 ? Number(route.furniture_bulky_rate) : null;

      const resSmall = confSmall ?? (confHeavy !== null ? Math.round(confHeavy * 0.5) : (confBulky !== null ? Math.round(confBulky * 0.25) : null));
      const resHeavy = confHeavy ?? (confSmall !== null ? Math.round(confSmall * 2.2) : (confBulky !== null ? Math.round(confBulky * 0.5) : null));

      if (effectiveClass === 'SMALL_PARCEL') {
        if (resSmall !== null) {
          baseFee = resSmall;
        } else {
          groupRequiresQuote = true;
          groupQuoteReason = `Small Parcel rate is not configured for ${route.destination_city}, ${route.destination_state}.`;
        }
      } else {
        if (resHeavy !== null) {
          baseFee = resHeavy;
        } else {
          groupRequiresQuote = true;
          groupQuoteReason = `Heavy Parcel rate is not configured for ${route.destination_city}, ${route.destination_state}.`;
        }
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
        'Small Parcel and Heavy Parcel items are consolidated into one combined Heavy Parcel shipment so you pay a single direct delivery fee.';
    } else if (weightUpgradedToHeavy) {
      consolidationExplanation = `Multiple small parcels (${combinedWeight} kg total) consolidated into a single Heavy Parcel shipment for direct delivery.`;
    } else if (totalQty > 1) {
      consolidationExplanation = `All ${totalQty} items consolidated into one ${PARCEL_CLASSIFICATION_LABELS[effectiveClass]} shipment for direct delivery with a single delivery fee.`;
    } else {
      consolidationExplanation = `Single ${PARCEL_CLASSIFICATION_LABELS[effectiveClass]} dispatch for direct delivery.`;
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
          ? 'DOVI Consolidated Heavy Van / Express Haulage for direct delivery'
          : 'DOVI Consolidated Express Parcel Courier for direct delivery',
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
      groupQuoteReason = `Bulky item "${bulkyMissingDimensions.shipmentItem.product_name}" requires special handling and dimension verification for direct delivery for manual quotation.`;
    } else {
      const confSmall = route?.small_parcel_rate !== null && route?.small_parcel_rate !== undefined && Number(route.small_parcel_rate) >= 0 ? Number(route.small_parcel_rate) : null;
      const confHeavy = route?.heavy_parcel_rate !== null && route?.heavy_parcel_rate !== undefined && Number(route.heavy_parcel_rate) >= 0 ? Number(route.heavy_parcel_rate) : null;
      const confBulky = route?.furniture_bulky_rate !== null && route?.furniture_bulky_rate !== undefined && Number(route.furniture_bulky_rate) >= 0 ? Number(route.furniture_bulky_rate) : null;
      const confComb = route?.combined_furniture_rate !== null && route?.combined_furniture_rate !== undefined && Number(route.combined_furniture_rate) >= 0 ? Number(route.combined_furniture_rate) : null;

      const resBulky = confBulky ?? (confHeavy !== null ? Math.round(confHeavy * 2.2) : (confSmall !== null ? Math.round(confSmall * 4.5) : null));
      const resComb = confComb ?? (resBulky !== null ? Math.round(resBulky * 1.35) : null);

      if (totalFurnitureUnits === 1) {
        if (resBulky !== null) {
          baseFee = resBulky;
        } else {
          groupRequiresQuote = true;
          groupQuoteReason = `Furniture / Bulky rate not configured for ${route.destination_city}, ${route.destination_state}. Manual quotation required.`;
        }
      } else {
        if (totalFurnitureUnits <= maxConsolidatedFurniture && resComb !== null) {
          baseFee = resComb;
        } else if (totalFurnitureUnits > maxConsolidatedFurniture) {
          groupRequiresQuote = true;
          groupQuoteReason = `Order includes ${totalFurnitureUnits} Furniture / Bulky items (exceeding standard ${maxConsolidatedFurniture}-item consolidated cargo limit). Manual transport quotation required.`;
        } else {
          groupRequiresQuote = true;
          groupQuoteReason = `Multiple Furniture / Bulky items (${totalFurnitureUnits} units) require a combined transport quotation for direct delivery rather than charging per item.`;
        }
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
        'Your Small Parcel items and Furniture / Bulky item are consolidated into a single dedicated transport shipment for direct delivery.';
    } else if (totalFurnitureUnits > 1) {
      consolidationExplanation = groupRequiresQuote
        ? `Multiple furniture items (${totalFurnitureUnits} units) grouped for a single combined cargo quotation (we never multiply the single-item furniture fee per item).`
        : `Multiple furniture items (${totalFurnitureUnits} units) consolidated into one combined Furniture / Bulky cargo shipment for direct delivery.`;
    } else {
      consolidationExplanation = 'Dedicated Furniture / Bulky cargo transport for direct delivery.';
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
      transport_arrangement: 'DOVI Dedicated Bulky & Furniture Cargo Transport for direct delivery',
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
      : 'Special Delivery / Manual Quote items require custom transport pricing from our logistics team.';

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
      transport_arrangement: 'Custom Arranged Specialized Transport for direct delivery',
      consolidation_explanation:
        'Items requiring custom handling or manual delivery confirmation are grouped for assessment by our logistics team.',
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
      'Delivery confirmation required: Our logistics team will confirm the exact delivery fee for your destination and items before payment.';
  } else if (shipmentGroups.length === 1) {
    overallExplanation = shipmentGroups[0].consolidation_explanation;
  } else if (shipmentGroups.length > 1) {
    overallExplanation = `Your order requires ${shipmentGroups.length} separate shipments for direct delivery because ${
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
// SHIPMENT CREATION, DIRECT DELIVERY FULFILLMENT & MANUAL QUOTES
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
      throw new Error(`Cannot mark "${item.product_name}" as quality checked before it is received prior to dispatch.`);
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
        `Cannot package "${item.product_name}" until it has been received and passed quality inspection prior to dispatch.`
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
): {
  updatedShipment: OrderShipment;
  allShipments: OrderShipment[];
  overallOrderStatus: ShipmentFulfillmentStatus;
} {
  assertAuthorizedAdmin(actor);

  const shipments = getOrderShipments(orderIdOrRef);
  const sIdx = shipments.findIndex((s) => s.id === shipmentId);
  if (sIdx === -1) {
    throw new Error(`Shipment ${shipmentId} not found for order ${orderIdOrRef}.`);
  }

  const shipment = { ...shipments[sIdx], items: shipments[sIdx].items.map((i) => ({ ...i })) };
  const now = new Date().toISOString();

  shipment.status = normalizeFulfillmentStatus(newStatus);
  if (options?.transport_arrangement !== undefined) {
    shipment.transport_arrangement = options.transport_arrangement;
  }
  if (options?.delivery_notes !== undefined) {
    shipment.delivery_notes = options.delivery_notes;
  }
  if (options?.tracking_reference !== undefined) {
    shipment.tracking_reference = options.tracking_reference;
  }
  if (shipment.status === 'DISPATCHED' && !shipment.dispatched_at) {
    shipment.dispatched_at = now;
  }
  if (shipment.status === 'DELIVERED') {
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
    separation_reason: 'Approved split dispatch for items already received for direct delivery.',
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
    separation_reason: 'Split shipment awaiting delayed supplier product arrival for direct delivery.',
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
): ShipmentFulfillmentStatus {
  if (!shipments || shipments.length === 0) return 'PROCESSING';

  const normalized = shipments.map((s) => normalizeFulfillmentStatus(s.status));

  // Single shipment orders: overall order fulfillment strictly reflects shipment status
  if (normalized.length === 1) {
    return normalized[0];
  }

  // All shipments cancelled
  if (normalized.every((s) => s === 'CANCELLED')) {
    return 'CANCELLED';
  }

  const active = normalized.filter((s) => s !== 'CANCELLED');
  if (active.length === 0) return 'CANCELLED';

  // 1. If every active shipment is DELIVERED, overall order is DELIVERED
  if (active.every((s) => s === 'DELIVERED')) {
    return 'DELIVERED';
  }

  // 2. If any active shipment is still being prepared, order CANNOT show Delivered or Out for Delivery
  const anyPreparing = active.some((s) => s === 'ORDER_PLACED' || s === 'PROCESSING');
  if (anyPreparing) {
    return 'PROCESSING';
  }

  // 3. If all active shipments are in final stage and at least one is Out for Delivery
  const allFinal = active.every((s) => s === 'OUT_FOR_DELIVERY' || s === 'DELIVERED');
  if (allFinal && active.some((s) => s === 'OUT_FOR_DELIVERY')) {
    return 'OUT_FOR_DELIVERY';
  }

  // 4. If any shipment is Dispatched
  const anyDispatched = active.some((s) => s === 'DISPATCHED' || s === 'OUT_FOR_DELIVERY' || s === 'DELIVERED');
  if (anyDispatched) {
    return 'DISPATCHED';
  }

  return 'READY_FOR_DISPATCH';
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
  destinationState = '',
  destinationCity = '',
  dispatchOrigin = PRIMARY_DISPATCH_ORIGIN,
  routeOverride?: DeliveryRoute | null
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
    ...(routeOverride !== undefined ? { routeOverride } : {}),
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

export function setLocalRoutes(routes: DeliveryRoute[]): void {
  writeLocal(STORAGE_KEYS.ROUTES, routes);
}
