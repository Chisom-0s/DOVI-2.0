import React, { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { adminApi } from '@/api/admin';
import {
  PRIMARY_DISPATCH_ORIGIN,
  PARCEL_CLASSIFICATION_LABELS,
  PARCEL_CLASSIFICATION_DESCRIPTIONS,
  NIGERIAN_STATES,
  syncDeliveryStoreFromServer,
  listDeliveryRoutes,
  listRateChangeHistory,
  createDeliveryRoute,
  updateDeliveryRoute,
  deleteDeliveryRoute,
  getProductDeliveryAttributes,
  saveProductDeliveryAttributes,
  serializeProductDescriptionWithDelivery,
  suggestParcelClassificationForAdmin,
  calculateOrderDelivery,
  type CreateOrUpdateRouteInput,
  type AdminActor,
  type EvaluableOrderItem,
} from '@/services/deliveryPricingService';
import type {
  DeliveryRoute,
  DeliveryRateChangeRecord,
  ParcelClassification,
  ProductDeliveryAttributes,
  ProductSummary,
  DeliveryCalculationResult,
} from '@/types';
import toast from 'react-hot-toast';

type ActiveTab = 'routes' | 'products' | 'history' | 'simulator';

const INITIAL_ROUTE_FORM: CreateOrUpdateRouteInput = {
  dispatch_origin: PRIMARY_DISPATCH_ORIGIN,
  destination_state: 'Lagos',
  destination_city: 'All Cities',
  small_parcel_rate: null,
  heavy_parcel_rate: null,
  furniture_bulky_rate: null,
  combined_furniture_rate: null,
  special_handling_surcharge: null,
  allows_furniture_small_consolidation: false,
  max_furniture_items_consolidated: 2,
  max_small_parcel_weight_kg: 15,
  max_heavy_parcel_weight_kg: 80,
  special_delivery_requirements: '',
  estimated_delivery_days: '2-4 business days',
  is_active: true,
  reason: '',
};

export const DeliveryManagementPage: React.FC = () => {
  const { user } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('routes');
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [rateHistory, setRateHistory] = useState<DeliveryRateChangeRecord[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('ALL');

  // Route Create/Edit Modal State
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<DeliveryRoute | null>(null);
  const [routeForm, setRouteForm] = useState<CreateOrUpdateRouteInput>(INITIAL_ROUTE_FORM);
  const [savingRoute, setSavingRoute] = useState(false);

  // Product Delivery Classification Modal State
  const [editingProduct, setEditingProduct] = useState<ProductSummary | null>(null);
  const [productAttrForm, setProductAttrForm] = useState<ProductDeliveryAttributes>({
    delivery_classification: 'SMALL_PARCEL',
    weight_kg: null,
    dimensions_cm: '',
    requires_special_handling: false,
    can_consolidate_with_furniture: false,
    max_items_per_shipment: null,
    delivery_notes: '',
  });
  const [savingProductAttr, setSavingProductAttr] = useState(false);

  // Consolidation Simulator State
  const [simState, setSimState] = useState('Lagos');
  const [simCity, setSimCity] = useState('All Cities');
  const [simItems, setSimItems] = useState<EvaluableOrderItem[]>([
    {
      id: 'sim-1',
      product_id: 'sim-shirt',
      product_name: 'Cotton Polo Shirt',
      quantity: 1,
      unit_price: 12000,
      delivery_classification: 'SMALL_PARCEL',
      weight_kg: 0.4,
    },
    {
      id: 'sim-2',
      product_id: 'sim-shoes',
      product_name: 'Leather Sneakers',
      quantity: 1,
      unit_price: 28000,
      delivery_classification: 'SMALL_PARCEL',
      weight_kg: 1.1,
    },
    {
      id: 'sim-3',
      product_id: 'sim-phone',
      product_name: 'Smartphone 5G',
      quantity: 1,
      unit_price: 185000,
      delivery_classification: 'SMALL_PARCEL',
      weight_kg: 0.5,
    },
  ]);
  const [simResult, setSimResult] = useState<DeliveryCalculationResult | null>(null);

  const adminActor: AdminActor = {
    id: user?.id || 'admin-1',
    email: user?.email || 'admin@dovi.com',
    name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Administrator',
    role: user?.role || 'ADMIN',
  };

  const loadDeliveryData = useCallback(async () => {
    await syncDeliveryStoreFromServer();
    setRoutes(listDeliveryRoutes(true));
    setRateHistory(listRateChangeHistory());
  }, []);

  const loadProductsCatalog = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await adminApi.listProducts({ page: 1 });
      setProducts(res.results || []);
    } catch {
      // Ignore error
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    void loadDeliveryData();
    void loadProductsCatalog();
  }, [loadDeliveryData, loadProductsCatalog]);

  useEffect(() => {
    if (activeTab === 'simulator') {
      const res = calculateOrderDelivery({
        items: simItems,
        destinationState: simState,
        destinationCity: simCity,
        dispatchOrigin: PRIMARY_DISPATCH_ORIGIN,
      });
      setSimResult(res);
    }
  }, [activeTab, simItems, simState, simCity, routes]);

  const openCreateRouteModal = () => {
    setEditingRoute(null);
    setRouteForm(INITIAL_ROUTE_FORM);
    setIsRouteModalOpen(true);
  };

  const openEditRouteModal = (route: DeliveryRoute) => {
    setEditingRoute(route);
    setRouteForm({
      dispatch_origin: route.dispatch_origin,
      destination_state: route.destination_state,
      destination_city: route.destination_city,
      small_parcel_rate: route.small_parcel_rate,
      heavy_parcel_rate: route.heavy_parcel_rate,
      furniture_bulky_rate: route.furniture_bulky_rate,
      combined_furniture_rate: route.combined_furniture_rate,
      special_handling_surcharge: route.special_handling_surcharge,
      allows_furniture_small_consolidation: route.allows_furniture_small_consolidation,
      max_furniture_items_consolidated: route.max_furniture_items_consolidated,
      max_small_parcel_weight_kg: route.max_small_parcel_weight_kg,
      max_heavy_parcel_weight_kg: route.max_heavy_parcel_weight_kg,
      special_delivery_requirements: route.special_delivery_requirements || '',
      estimated_delivery_days: route.estimated_delivery_days || '2-4 business days',
      is_active: route.is_active,
      reason: '',
    });
    setIsRouteModalOpen(true);
  };

  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRoute(true);
    try {
      if (editingRoute) {
        updateDeliveryRoute(editingRoute.id, routeForm, adminActor);
        toast.success(
          `Updated delivery route: ${routeForm.dispatch_origin} → ${routeForm.destination_city}, ${routeForm.destination_state}`
        );
      } else {
        createDeliveryRoute(routeForm, adminActor);
        toast.success(
          `Created delivery route: ${routeForm.dispatch_origin} → ${routeForm.destination_city}, ${routeForm.destination_state}`
        );
      }
      setIsRouteModalOpen(false);
      await loadDeliveryData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save delivery route.');
    } finally {
      setSavingRoute(false);
    }
  };

  const handleToggleRouteActive = async (route: DeliveryRoute) => {
    try {
      const updated = updateDeliveryRoute(
        route.id,
        {
          is_active: !route.is_active,
          reason: !route.is_active ? 'Route activated by administrator' : 'Route deactivated by administrator',
        },
        adminActor
      );
      toast.success(
        `Route ${updated.destination_city}, ${updated.destination_state} is now ${
          updated.is_active ? 'Active' : 'Inactive'
        }.`
      );
      await loadDeliveryData();
    } catch (err: any) {
      toast.error(err?.message || 'Could not update route status.');
    }
  };

  const handleDeleteRoute = async (route: DeliveryRoute) => {
    if (
      !window.confirm(
        `Delete delivery route from ${route.dispatch_origin} to ${route.destination_city}, ${route.destination_state}?`
      )
    ) {
      return;
    }
    try {
      deleteDeliveryRoute(route.id, adminActor);
      toast.success('Delivery route deleted.');
      await loadDeliveryData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete route.');
    }
  };

  const openProductClassificationModal = (product: ProductSummary) => {
    const existing = getProductDeliveryAttributes(product);
    const suggested = suggestParcelClassificationForAdmin({
      name: product.name,
      category_name: product.category?.name,
      description: product.description,
    });

    setEditingProduct(product);
    setProductAttrForm({
      delivery_classification: existing?.delivery_classification || suggested,
      weight_kg: existing?.weight_kg ?? null,
      dimensions_cm: existing?.dimensions_cm || '',
      requires_special_handling: existing?.requires_special_handling ?? false,
      can_consolidate_with_furniture: existing?.can_consolidate_with_furniture ?? false,
      max_items_per_shipment: existing?.max_items_per_shipment ?? null,
      delivery_notes: existing?.delivery_notes || '',
    });
  };

  const handleSaveProductClassification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSavingProductAttr(true);
    try {
      const savedAttrs = saveProductDeliveryAttributes(editingProduct.id, productAttrForm, adminActor);

      try {
        const fullProd = await adminApi.getProduct(editingProduct.id);
        const updatedDescription = serializeProductDescriptionWithDelivery(
          fullProd?.description || editingProduct.description || editingProduct.name,
          savedAttrs
        );
        await adminApi.updateProduct(editingProduct.id, {
          description: updatedDescription,
        });
      } catch {
        // Synced via shared store if remote PATCH fails
      }

      toast.success(
        `Saved parcel classification (${PARCEL_CLASSIFICATION_LABELS[savedAttrs.delivery_classification]}) for "${editingProduct.name}".`
      );
      setEditingProduct(null);
      await loadProductsCatalog();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save product delivery classification.');
    } finally {
      setSavingProductAttr(false);
    }
  };

  const formatNaira = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) {
      return 'Manual Quote Required';
    }
    return `₦${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const filteredRoutes = routes.filter((r) => {
    if (stateFilter !== 'ALL' && r.destination_state !== stateFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.destination_state.toLowerCase().includes(q) ||
      r.destination_city.toLowerCase().includes(q) ||
      r.dispatch_origin.toLowerCase().includes(q) ||
      (r.updated_by_email || '').toLowerCase().includes(q)
    );
  });

  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.category?.name || '').toLowerCase().includes(q);
  });

  const classificationBadgeStyle = (classification?: ParcelClassification | null): React.CSSProperties => {
    switch (classification) {
      case 'SMALL_PARCEL':
        return { background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' };
      case 'HEAVY_PARCEL':
        return { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' };
      case 'FURNITURE_BULKY':
        return { background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' };
      case 'SPECIAL_MANUAL_QUOTE':
        return { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' };
      default:
        return { background: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb' };
    }
  };

  return (
    <div style={{ padding: '8px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#fff7ed',
                color: '#ea580c',
                border: '1px solid #fed7aa',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              📍 Primary Dispatch Hub: {PRIMARY_DISPATCH_ORIGIN}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#f0fdf4',
                color: '#15803d',
                border: '1px solid #bbf7d0',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              ✓ Consolidated Order Pricing Engine
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', margin: 0 }}>
            DOVI Delivery Rate & Order Consolidation Management
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px', marginBottom: 0 }}>
            Configure destination delivery routes from Onitsha Hub, assign parcel classifications per product, and audit
            transport rate updates.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => {
              void loadDeliveryData();
              void loadProductsCatalog();
              toast.success('Refreshed delivery routes & rate history.');
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              background: '#fff',
              color: '#374151',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            ↻ Refresh
          </button>
          <button
            type="button"
            onClick={openCreateRouteModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              background: '#ff7a00',
              color: '#fff',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(255,122,0,0.25)',
            }}
          >
            + Add Delivery Route
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '18px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
            Active Delivery Routes
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#111827', marginTop: '6px' }}>
            {routes.filter((r) => r.is_active).length}{' '}
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>/ {routes.length} total</span>
          </div>
          <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
            Dispatched from {PRIMARY_DISPATCH_ORIGIN} Hub
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '18px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
            Parcel Classifications
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#111827', marginTop: '6px' }}>4 Tiers</div>
          <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>
            Small • Heavy • Furniture/Bulky • Manual Quote
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '18px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
            Missing Route Safety Policy
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#b45309', marginTop: '8px' }}>
            Manual Confirmation
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            Never defaults missing routes to ₦0
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '18px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
            Rate Change Audit Logs
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#111827', marginTop: '6px' }}>
            {rateHistory.length}
          </div>
          <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>
            Tracks previous & new rate + admin
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '20px',
          overflowX: 'auto',
        }}
      >
        {[
          { id: 'routes' as ActiveTab, label: 'Delivery Routes & Rates' },
          { id: 'products' as ActiveTab, label: 'Product Parcel Classifications' },
          { id: 'history' as ActiveTab, label: `Rate Change History (${rateHistory.length})` },
          { id: 'simulator' as ActiveTab, label: 'Consolidation & Pricing Simulator' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                border: 'none',
                borderBottom: isActive ? '3px solid #ff7a00' : '3px solid transparent',
                background: isActive ? '#fff7ed' : 'transparent',
                color: isActive ? '#ea580c' : '#4b5563',
                fontWeight: isActive ? 700 : 600,
                fontSize: '14px',
                cursor: 'pointer',
                borderRadius: '8px 8px 0 0',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search & Filter Bar for Routes and Products */}
      {(activeTab === 'routes' || activeTab === 'products') && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '18px',
            alignItems: 'center',
          }}
        >
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'routes'
                  ? 'Search destination state, city, or administrator...'
                  : 'Search products by name or category...'
              }
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
              }}
            />
          </div>

          {activeTab === 'routes' && (
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                background: '#fff',
              }}
            >
              <option value="ALL">All Destination States</option>
              {NIGERIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* TAB 1: DELIVERY ROUTES & RATES */}
      {activeTab === 'routes' && (
        <div
          style={{
            background: '#fff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
          }}
        >
          {filteredRoutes.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
                No Delivery Routes Configured Yet
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', maxWidth: '520px', margin: '0 auto 20px' }}>
                DOVI never invents courier rates or assigns ₦0 to unconfigured destinations. Orders to destinations
                without an active route automatically require manual delivery confirmation. Click below to configure
                your first route from {PRIMARY_DISPATCH_ORIGIN}.
              </p>
              <button
                type="button"
                onClick={openCreateRouteModal}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#ff7a00',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                + Configure First Delivery Route
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#374151' }}>Origin → Destination</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#374151' }}>Small Parcel</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#374151' }}>Heavy Parcel</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#374151' }}>Furniture / Bulky</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#374151' }}>Combined Furniture</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#374151' }}>Consolidation Rules</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#374151' }}>Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#374151' }}>Last Updated / Admin</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#374151', textAlign: 'right' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoutes.map((route) => (
                    <tr key={route.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#111827', fontSize: '14px' }}>
                          {route.dispatch_origin} → {route.destination_city}, {route.destination_state}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                          Est: {route.estimated_delivery_days || '2-4 business days'}
                          {route.special_delivery_requirements ? ` • ${route.special_delivery_requirements}` : ''}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#047857' }}>
                        {formatNaira(route.small_parcel_rate)}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1d4ed8' }}>
                        {formatNaira(route.heavy_parcel_rate)}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#c2410c' }}>
                        {formatNaira(route.furniture_bulky_rate)}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#7c2d12' }}>
                        {formatNaira(route.combined_furniture_rate)}
                        <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 400 }}>
                          Up to {route.max_furniture_items_consolidated} bulky items
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '12px', color: '#4b5563' }}>
                        <div>
                          Furniture + Small:{' '}
                          <strong>
                            {route.allows_furniture_small_consolidation ? 'Consolidated' : 'Separate Shipments'}
                          </strong>
                        </div>
                        {route.special_handling_surcharge !== null && (
                          <div style={{ color: '#b45309' }}>
                            Special Handling: +{formatNaira(route.special_handling_surcharge)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          type="button"
                          onClick={() => void handleToggleRouteActive(route)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: route.is_active ? '1px solid #86efac' : '1px solid #d1d5db',
                            background: route.is_active ? '#dcfce7' : '#f3f4f6',
                            color: route.is_active ? '#166534' : '#4b5563',
                          }}
                        >
                          {route.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '12px', color: '#4b5563' }}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>
                          {route.updated_by_name || route.updated_by_email || 'Admin'}
                        </div>
                        <div style={{ color: '#6b7280' }}>
                          {new Date(route.updated_at).toLocaleString('en-NG', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          onClick={() => openEditRouteModal(route)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #d1d5db',
                            background: '#fff',
                            color: '#374151',
                            fontWeight: 600,
                            fontSize: '12px',
                            cursor: 'pointer',
                            marginRight: '6px',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteRoute(route)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #fecaca',
                            background: '#fef2f2',
                            color: '#dc2626',
                            fontWeight: 600,
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRODUCT PARCEL CLASSIFICATIONS */}
      {activeTab === 'products' && (
        <div
          style={{
            background: '#fff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              background: '#f8fafc',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                Product-Level Parcel Classification & Handling Rules
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>
                Classifications are never permanently locked to product categories — assign Small Parcel, Heavy Parcel,
                Furniture / Bulky Item, or Special Delivery / Manual Quote per product.
              </p>
            </div>
          </div>

          {loadingProducts ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading products catalog...</div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>No matching products found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#374151' }}>Product</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#374151' }}>Category</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#374151' }}>
                      Assigned Parcel Classification
                    </th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#374151' }}>Weight & Dimensions</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#374151' }}>Special Handling / Notes</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#374151', textAlign: 'right' }}>
                      Configure
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((prod) => {
                    const attrs = getProductDeliveryAttributes(prod);
                    const classification = attrs?.delivery_classification || null;
                    return (
                      <tr key={prod.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#111827' }}>{prod.name}</td>
                        <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                          {prod.category?.name || 'General'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {classification ? (
                            <span
                              style={{
                                ...classificationBadgeStyle(classification),
                                padding: '4px 10px',
                                borderRadius: '999px',
                                fontSize: '12px',
                                fontWeight: 700,
                                display: 'inline-block',
                              }}
                            >
                              {PARCEL_CLASSIFICATION_LABELS[classification]}
                            </span>
                          ) : (
                            <span
                              style={{
                                background: '#fef3c7',
                                color: '#92400e',
                                border: '1px solid #fde68a',
                                padding: '4px 10px',
                                borderRadius: '999px',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
                              Unclassified (Requires Confirmation)
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#4b5563', fontSize: '12px' }}>
                          <div>Weight: {attrs?.weight_kg != null ? `${attrs.weight_kg} kg` : '—'}</div>
                          <div>Dimensions: {attrs?.dimensions_cm || '—'}</div>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#4b5563', fontSize: '12px' }}>
                          {attrs?.requires_special_handling && (
                            <span
                              style={{
                                display: 'inline-block',
                                background: '#fee2e2',
                                color: '#b91c1c',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontWeight: 600,
                                marginBottom: '2px',
                              }}
                            >
                              Requires Special Handling
                            </span>
                          )}
                          <div>{attrs?.delivery_notes || 'Standard hub packaging'}</div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => openProductClassificationModal(prod)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid #ff7a00',
                              background: '#fff7ed',
                              color: '#ea580c',
                              fontWeight: 600,
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            Set Classification
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RATE CHANGE AUDIT HISTORY */}
      {activeTab === 'history' && (
        <div
          style={{
            background: '#fff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#111827' }}>
              Immutable Delivery Rate Change Audit Trail
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>
              Every transport price adjustment is logged with previous rate, new rate, destination, parcel
              classification, administrator identity, and timestamp.
            </p>
          </div>

          {rateHistory.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              No delivery rate changes recorded yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#374151' }}>Timestamp</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#374151' }}>Route Destination</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#374151' }}>Classification</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#374151' }}>Previous Rate</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#374151' }}>New Rate</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#374151' }}>Changed By</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#374151' }}>Reason / Note</th>
                  </tr>
                </thead>
                <tbody>
                  {rateHistory.map((rec) => (
                    <tr key={rec.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 16px', color: '#4b5563', whiteSpace: 'nowrap' }}>
                        {new Date(rec.changed_at).toLocaleString('en-NG', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#111827' }}>
                        {rec.dispatch_origin} → {rec.destination}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                        {rec.delivery_classification}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                        {rec.previous_rate !== null ? formatNaira(rec.previous_rate) : 'Not Set'}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#047857' }}>
                        {rec.new_rate !== null ? formatNaira(rec.new_rate) : 'Manual Quote'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#111827' }}>
                        <div style={{ fontWeight: 600 }}>{rec.changed_by_name || rec.changed_by_email}</div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>{rec.changed_by_email}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#4b5563' }}>{rec.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CONSOLIDATION & PRICING SIMULATOR */}
      {activeTab === 'simulator' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              padding: '20px',
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#111827' }}>
              Test Mixed-Category Cart Consolidation
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6b7280' }}>
              Verify how DOVI consolidates items from different categories into the minimum number of shipments from{' '}
              {PRIMARY_DISPATCH_ORIGIN} Hub.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Destination State
                </label>
                <select
                  value={simState}
                  onChange={(e) => setSimState(e.target.value)}
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                >
                  {NIGERIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Destination City
                </label>
                <input
                  type="text"
                  value={simCity}
                  onChange={(e) => setSimCity(e.target.value)}
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
                Load Test Scenario:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() =>
                    setSimItems([
                      {
                        id: 's1',
                        product_id: 'p-shirt',
                        product_name: 'Shirt',
                        quantity: 1,
                        unit_price: 12000,
                        delivery_classification: 'SMALL_PARCEL',
                      },
                      {
                        id: 's2',
                        product_id: 'p-shoes',
                        product_name: 'Pair of Shoes',
                        quantity: 1,
                        unit_price: 25000,
                        delivery_classification: 'SMALL_PARCEL',
                      },
                      {
                        id: 's3',
                        product_id: 'p-phone',
                        product_name: 'Smartphone',
                        quantity: 1,
                        unit_price: 180000,
                        delivery_classification: 'SMALL_PARCEL',
                      },
                    ])
                  }
                  style={{
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    background: '#f9fafb',
                    cursor: 'pointer',
                  }}
                >
                  Shirt + Shoes + Phone (1 Small Shipment)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSimItems([
                      {
                        id: 's1',
                        product_id: 'p-shirt',
                        product_name: 'Clothes',
                        quantity: 2,
                        unit_price: 12000,
                        delivery_classification: 'SMALL_PARCEL',
                      },
                      {
                        id: 's4',
                        product_id: 'p-fan',
                        product_name: 'Standing Fan',
                        quantity: 1,
                        unit_price: 45000,
                        delivery_classification: 'HEAVY_PARCEL',
                      },
                    ])
                  }
                  style={{
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    background: '#f9fafb',
                    cursor: 'pointer',
                  }}
                >
                  Clothes + Standing Fan (1 Combined Heavy)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSimItems([
                      {
                        id: 's1',
                        product_id: 'p-shirt',
                        product_name: 'Shirt',
                        quantity: 1,
                        unit_price: 12000,
                        delivery_classification: 'SMALL_PARCEL',
                      },
                      {
                        id: 's5',
                        product_id: 'p-chair',
                        product_name: 'Executive Office Chair',
                        quantity: 1,
                        unit_price: 95000,
                        delivery_classification: 'FURNITURE_BULKY',
                      },
                    ])
                  }
                  style={{
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    background: '#f9fafb',
                    cursor: 'pointer',
                  }}
                >
                  Shirt + Chair (Consolidate or Split)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSimItems([
                      {
                        id: 's5',
                        product_id: 'p-chair',
                        product_name: 'Executive Chair',
                        quantity: 2,
                        unit_price: 95000,
                        delivery_classification: 'FURNITURE_BULKY',
                      },
                    ])
                  }
                  style={{
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    background: '#f9fafb',
                    cursor: 'pointer',
                  }}
                >
                  Multiple Furniture Items
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {simItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    background: '#f9fafb',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#111827' }}>
                      {item.product_name} (x{item.quantity})
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {item.delivery_classification
                        ? PARCEL_CLASSIFICATION_LABELS[item.delivery_classification]
                        : 'Unclassified'}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>
                    {formatNaira(item.unit_price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              padding: '20px',
            }}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 700, color: '#111827' }}>
              Consolidation & Delivery Pricing Result
            </h3>
            {simResult && (
              <div>
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: simResult.requires_manual_quote ? '#fffbeb' : '#ecfdf5',
                    border: simResult.requires_manual_quote ? '1px solid #fde68a' : '1px solid #a7f3d0',
                    color: simResult.requires_manual_quote ? '#92400e' : '#065f46',
                    fontSize: '13px',
                    marginBottom: '16px',
                  }}
                >
                  <strong>
                    {simResult.requires_manual_quote
                      ? 'Delivery Confirmation Required:'
                      : `${simResult.shipment_count} Consolidated Shipment(s):`}
                  </strong>{' '}
                  {simResult.overall_explanation}
                </div>

                {simResult.shipments.map((sh) => (
                  <div
                    key={sh.group_index}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: '#111827' }}>
                        Shipment #{sh.group_index}: {sh.classification_label}
                      </span>
                      <span style={{ fontWeight: 800, color: '#ea580c', fontSize: '14px' }}>
                        {sh.requires_manual_quote ? 'Manual Quote Required' : formatNaira(sh.delivery_fee)}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>
                      Items: {sh.items.map((i) => `${i.product_name} (x${i.quantity})`).join(', ')}
                    </div>
                    <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
                      {sh.consolidation_explanation}
                    </div>
                    {sh.separation_reason && (
                      <div style={{ fontSize: '12px', color: '#b45309', marginTop: '4px' }}>
                        Why separated: {sh.separation_reason}
                      </div>
                    )}
                  </div>
                ))}

                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                    <span>Product Subtotal:</span>
                    <strong>{formatNaira(simResult.product_subtotal)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                    <span>Consolidated Delivery Fee ({simResult.shipment_count} shipment):</span>
                    <strong>
                      {simResult.requires_manual_quote
                        ? 'Delivery Confirmation Required'
                        : formatNaira(simResult.total_delivery_fee)}
                    </strong>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '16px',
                      fontWeight: 800,
                      color: '#111827',
                      marginTop: '8px',
                    }}
                  >
                    <span>Total Payable:</span>
                    <span style={{ color: '#ff7a00' }}>
                      {simResult.requires_manual_quote
                        ? `${formatNaira(simResult.product_subtotal)} + Delivery Quote`
                        : formatNaira(simResult.total_payable)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE / EDIT DELIVERY ROUTE */}
      {isRouteModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(17, 24, 39, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '14px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#111827' }}>
                {editingRoute ? 'Edit Delivery Route & Parcel Rates' : 'Create New Delivery Route'}
              </h2>
              <button
                type="button"
                onClick={() => setIsRouteModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRoute}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                    Dispatch Origin Hub *
                  </label>
                  <input
                    type="text"
                    required
                    value={routeForm.dispatch_origin || PRIMARY_DISPATCH_ORIGIN}
                    onChange={(e) => setRouteForm({ ...routeForm, dispatch_origin: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                    Destination State *
                  </label>
                  <select
                    required
                    value={routeForm.destination_state}
                    onChange={(e) => setRouteForm({ ...routeForm, destination_state: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  >
                    {NIGERIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                    Destination City / Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. All Cities, Ikeja, Lekki, Awka"
                    value={routeForm.destination_city}
                    onChange={(e) => setRouteForm({ ...routeForm, destination_city: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  />
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>
                    Use "All Cities" to apply to the entire state
                  </span>
                </div>
              </div>

              <div
                style={{
                  marginTop: '18px',
                  padding: '16px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
                  Parcel Classification Delivery Rates (₦) — Leave blank if Manual Quote is required
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      Small Parcel Rate (₦)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Leave blank for Manual Quote"
                      value={routeForm.small_parcel_rate ?? ''}
                      onChange={(e) =>
                        setRouteForm({
                          ...routeForm,
                          small_parcel_rate: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      Heavy Parcel Rate (₦)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Leave blank for Manual Quote"
                      value={routeForm.heavy_parcel_rate ?? ''}
                      onChange={(e) =>
                        setRouteForm({
                          ...routeForm,
                          heavy_parcel_rate: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      Furniture / Bulky Item Rate (₦)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Single bulky item rate"
                      value={routeForm.furniture_bulky_rate ?? ''}
                      onChange={(e) =>
                        setRouteForm({
                          ...routeForm,
                          furniture_bulky_rate: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      Combined Multi-Furniture Rate (₦)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Consolidated rate for 2+ bulky items"
                      value={routeForm.combined_furniture_rate ?? ''}
                      onChange={(e) =>
                        setRouteForm({
                          ...routeForm,
                          combined_furniture_rate: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      Special Handling Surcharge (₦)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Optional fragile/handling fee"
                      value={routeForm.special_handling_surcharge ?? ''}
                      onChange={(e) =>
                        setRouteForm({
                          ...routeForm,
                          special_handling_surcharge: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      Estimated Delivery Window
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2-4 business days"
                      value={routeForm.estimated_delivery_days || ''}
                      onChange={(e) => setRouteForm({ ...routeForm, estimated_delivery_days: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Max Furniture Items Consolidated
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={routeForm.max_furniture_items_consolidated ?? 2}
                    onChange={(e) =>
                      setRouteForm({ ...routeForm, max_furniture_items_consolidated: Number(e.target.value) || 2 })
                    }
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Special Delivery Requirements / Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fragile crating available at Onitsha Hub"
                    value={routeForm.special_delivery_requirements || ''}
                    onChange={(e) => setRouteForm({ ...routeForm, special_delivery_requirements: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(routeForm.allows_furniture_small_consolidation)}
                    onChange={(e) =>
                      setRouteForm({ ...routeForm, allows_furniture_small_consolidation: e.target.checked })
                    }
                  />
                  <span>
                    Allow Small Parcels to consolidate into Furniture / Bulky shipment on this route (when product
                    allows)
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(routeForm.is_active)}
                    onChange={(e) => setRouteForm({ ...routeForm, is_active: e.target.checked })}
                  />
                  <span>Route is Active and available for checkout</span>
                </label>
              </div>

              <div style={{ marginTop: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Audit Reason for Rate Creation / Update
                </label>
                <input
                  type="text"
                  placeholder="e.g. Updated transport company haulage rate from Onitsha"
                  value={routeForm.reason || ''}
                  onChange={(e) => setRouteForm({ ...routeForm, reason: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div style={{ marginTop: '22px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsRouteModalOpen(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    background: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRoute}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#ff7a00',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {savingRoute ? 'Saving...' : editingRoute ? 'Save Route Changes' : 'Create Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN PRODUCT PARCEL CLASSIFICATION */}
      {editingProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(17, 24, 39, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '14px',
              maxWidth: '560px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#111827' }}>
                Configure Product Delivery Attributes
              </h2>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontWeight: 700, color: '#111827' }}>{editingProduct.name}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Category: {editingProduct.category?.name || 'General'}
              </div>
            </div>

            <form onSubmit={handleSaveProductClassification}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Parcel Classification *
                </label>
                <select
                  value={productAttrForm.delivery_classification}
                  onChange={(e) =>
                    setProductAttrForm({
                      ...productAttrForm,
                      delivery_classification: e.target.value as ParcelClassification,
                    })
                  }
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                >
                  {(Object.keys(PARCEL_CLASSIFICATION_LABELS) as ParcelClassification[]).map((cls) => (
                    <option key={cls} value={cls}>
                      {PARCEL_CLASSIFICATION_LABELS[cls]} — {PARCEL_CLASSIFICATION_DESCRIPTIONS[cls]}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 1.5"
                    value={productAttrForm.weight_kg ?? ''}
                    onChange={(e) =>
                      setProductAttrForm({
                        ...productAttrForm,
                        weight_kg: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Dimensions (L × W × H cm)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 60x55x95 cm"
                    value={productAttrForm.dimensions_cm || ''}
                    onChange={(e) => setProductAttrForm({ ...productAttrForm, dimensions_cm: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(productAttrForm.requires_special_handling)}
                    onChange={(e) =>
                      setProductAttrForm({ ...productAttrForm, requires_special_handling: e.target.checked })
                    }
                  />
                  <span>Requires Special Handling (fragile / custom crating at Onitsha Hub)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(productAttrForm.can_consolidate_with_furniture)}
                    onChange={(e) =>
                      setProductAttrForm({ ...productAttrForm, can_consolidate_with_furniture: e.target.checked })
                    }
                  />
                  <span>Can travel together with Furniture / Bulky items in one consolidated shipment</span>
                </label>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Delivery & Packaging Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional handling or consolidation instructions for Onitsha Hub..."
                  value={productAttrForm.delivery_notes || ''}
                  onChange={(e) => setProductAttrForm({ ...productAttrForm, delivery_notes: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    background: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProductAttr}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#ff7a00',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {savingProductAttr ? 'Saving...' : 'Save Delivery Attributes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryManagementPage;
