"""
Authoritative Server-Side Delivery Pricing & Order Consolidation Service for DOVI.
Direct-to-Destination Delivery Service for DOVI.
Never hardcodes courier prices, never charges per product or per category automatically,
and consolidates mixed-category orders into the minimum practical number of shipments.
"""
from decimal import Decimal
from typing import Any, Dict, List, Optional
from .models import DeliveryRoute, ParcelClassification


CLASSIFICATION_LABELS = {
    'SMALL_PARCEL': 'Small Parcel',
    'HEAVY_PARCEL': 'Heavy Parcel',
    'FURNITURE_BULKY': 'Furniture / Bulky Item',
    'SPECIAL_MANUAL_QUOTE': 'Special Delivery / Manual Quote',
}


def find_active_route(destination_state: str, destination_city: str = '', origin: str = 'Onitsha') -> Optional[DeliveryRoute]:
    if not destination_state or not destination_state.strip():
        return None
    norm_state = destination_state.strip().lower()
    norm_city = (destination_city or '').strip().lower()
    norm_origin = (origin or 'Onitsha').strip().lower()

    if norm_city:
        # 1. Exact match
        city_match = DeliveryRoute.objects.filter(
            origin__iexact=norm_origin,
            destination_state__iexact=norm_state,
            destination_city__iexact=norm_city,
            is_active=True,
        ).first()
        if city_match:
            return city_match

        # 2. Fuzzy / Prefix / Suffix match
        candidates = DeliveryRoute.objects.filter(
            origin__iexact=norm_origin,
            destination_state__iexact=norm_state,
            is_active=True,
        )
        for r in candidates:
            rcity = (r.destination_city or '').strip().lower()
            if rcity and rcity not in ['', 'all cities', 'statewide']:
                if norm_city.startswith(rcity) or rcity.startswith(norm_city) or rcity in norm_city or norm_city in rcity:
                    return r

    # 3. Statewide match
    return DeliveryRoute.objects.filter(
        origin__iexact=norm_origin,
        destination_state__iexact=norm_state,
        destination_city__in=['', 'All Cities', 'Statewide', destination_state.strip()],
        is_active=True,
    ).first()
        if city_match:
            return city_match

    return DeliveryRoute.objects.filter(
        origin__iexact=norm_origin,
        destination_state__iexact=norm_state,
        destination_city__in=['', 'All Cities', 'Statewide'],
        is_active=True,
    ).first()


def calculate_order_delivery(
    destination_state: str,
    destination_city: str,
    items: List[Dict[str, Any]],
    origin: str = 'Onitsha',
    destination_address: str = '',
    recipient_name: str = '',
    recipient_phone: str = '',
) -> Dict[str, Any]:
    """
    Centralized server-side delivery calculation and shipment grouping engine.
    """
    subtotal = sum(
        Decimal(str(item.get('unit_price', '0'))) * int(item.get('quantity', 1))
        for item in items
    )

    route = find_active_route(destination_state, destination_city, origin)
    manual_quote_reasons: List[str] = []

    if not route:
        manual_quote_reasons.append(
            f"No configured active delivery route to {destination_city + ', ' if destination_city else ''}{destination_state}. Delivery confirmation is required."
        )
        return {
            'origin': origin,
            'destination_state': destination_state,
            'destination_city': destination_city,
            'route_id': None,
            'route_found': False,
            'is_consolidated_single_shipment': True,
            'shipment_count': 1 if items else 0,
            'subtotal': str(subtotal),
            'base_delivery_fee': None,
            'special_handling_fee': '0.00',
            'total_delivery_fee': None,
            'total_payable': None,
            'requires_manual_quote': True,
            'manual_quote_reasons': manual_quote_reasons,
            'consolidation_explanation': 'Order is pending manual delivery confirmation from DOVI Support / Admin.',
            'separation_explanation': None,
        }

    small_items = []
    heavy_items = []
    furniture_items = []
    manual_items = []

    for item in items:
        cls = item.get('delivery_classification')
        name = item.get('product_name', 'Product')
        if not cls:
            # Default unclassified standard catalog item to Small Parcel
            cls = ParcelClassification.SMALL_PARCEL
        elif cls == ParcelClassification.SPECIAL_MANUAL_QUOTE:
            manual_quote_reasons.append(
                f"Product '{name}' is classified as Special Delivery / Manual Quote."
            )
            manual_items.append(item)
        elif cls == ParcelClassification.FURNITURE_BULKY:
            furniture_items.append(item)
        elif cls == ParcelClassification.HEAVY_PARCEL:
            heavy_items.append(item)
        else:
            small_items.append(item)

    shipments = []
    parcel_items = small_items + heavy_items

    can_consolidate_all = (
        bool(furniture_items)
        and bool(parcel_items)
        and route.allow_small_with_furniture
        and all(f.get('can_consolidate_with_furniture', False) and not f.get('requires_special_handling', False) for f in furniture_items)
        and all(not p.get('requires_special_handling', False) for p in parcel_items)
    )

    if can_consolidate_all and not manual_items:
        all_items = parcel_items + furniture_items
        total_furniture_qty = sum(int(f.get('quantity', 1)) for f in furniture_items)
        rate = route.combined_furniture_rate or route.furniture_bulky_rate
        req_quote = False
        reason = ''
        if rate is None:
            req_quote = True
            reason = f"No configured Furniture / Bulky delivery rate for {destination_state}."
            manual_quote_reasons.append(reason)
        elif total_furniture_qty > route.max_furniture_items_consolidated or (total_furniture_qty > 1 and route.multi_furniture_requires_manual_quote):
            req_quote = True
            reason = f"Multiple furniture items ({total_furniture_qty} units) require transport capacity confirmation."
            manual_quote_reasons.append(reason)

        shipments.append({
            'shipment_number': 1,
            'shipment_classification': ParcelClassification.FURNITURE_BULKY,
            'classification_label': 'Combined Delivery (Bulky & Standard Parcels)',
            'is_consolidated': True,
            'items': all_items,
            'delivery_fee': None if req_quote else str(rate),
            'requires_manual_quote': req_quote,
            'manual_quote_reason': reason or None,
            'transport_arrangement': 'Consolidated Bulky & Parcel Transport for direct delivery',
        })
    else:
        if parcel_items:
            has_heavy = len(heavy_items) > 0
            eff_cls = ParcelClassification.HEAVY_PARCEL if has_heavy else ParcelClassification.SMALL_PARCEL
            conf_small = route.small_parcel_rate
            conf_heavy = route.heavy_parcel_rate
            conf_bulky = route.furniture_bulky_rate

            res_small = conf_small if conf_small is not None else (conf_heavy * Decimal('0.5') if conf_heavy is not None else (conf_bulky * Decimal('0.25') if conf_bulky is not None else None))
            res_heavy = conf_heavy if conf_heavy is not None else (conf_small * Decimal('2.2') if conf_small is not None else (conf_bulky * Decimal('0.5') if conf_bulky is not None else None))

            if has_heavy and small_items:
                rate = route.combined_small_heavy_rate if route.combined_small_heavy_rate is not None else res_heavy
                label = 'Combined Delivery (Heavy & Small Parcels)'
            elif has_heavy:
                rate = res_heavy
                label = 'Heavy Parcel'
            else:
                rate = res_small
                label = 'Small Parcel (Consolidated)' if len(small_items) > 1 else 'Small Parcel'

            req_quote = rate is None
            reason = ''
            if req_quote:
                reason = f"No configured {CLASSIFICATION_LABELS[eff_cls]} rate for {destination_state}."
                manual_quote_reasons.append(reason)

            shipments.append({
                'shipment_number': len(shipments) + 1,
                'shipment_classification': eff_cls,
                'classification_label': label,
                'is_consolidated': True,
                'items': parcel_items,
                'delivery_fee': None if req_quote else str(rate),
                'requires_manual_quote': req_quote,
                'manual_quote_reason': reason or None,
                'transport_arrangement': 'Consolidated Parcel Dispatch for direct delivery',
            })

        if furniture_items:
            total_furniture_qty = sum(int(f.get('quantity', 1)) for f in furniture_items)
            rate = (
                route.combined_furniture_rate
                if (total_furniture_qty > 1 and route.combined_furniture_rate is not None)
                else route.furniture_bulky_rate
            )
            req_quote = False
            reason = ''
            if rate is None:
                req_quote = True
                reason = f"No configured Furniture / Bulky Item rate for {destination_state}."
                manual_quote_reasons.append(reason)
            elif total_furniture_qty > route.max_furniture_items_consolidated or (total_furniture_qty > 1 and route.multi_furniture_requires_manual_quote):
                req_quote = True
                reason = f"Multiple furniture/bulky items ({total_furniture_qty} pieces) require transport confirmation."
                manual_quote_reasons.append(reason)

            shipments.append({
                'shipment_number': len(shipments) + 1,
                'shipment_classification': ParcelClassification.FURNITURE_BULKY,
                'classification_label': 'Furniture / Bulky Item (Consolidated)' if total_furniture_qty > 1 else 'Furniture / Bulky Item',
                'is_consolidated': total_furniture_qty > 1,
                'items': furniture_items,
                'delivery_fee': None if req_quote else str(rate),
                'requires_manual_quote': req_quote,
                'manual_quote_reason': reason or None,
                'transport_arrangement': 'Dedicated Bulky / Furniture Transport for direct delivery',
            })

        if manual_items:
            shipments.append({
                'shipment_number': len(shipments) + 1,
                'shipment_classification': ParcelClassification.SPECIAL_MANUAL_QUOTE,
                'classification_label': 'Special Delivery / Manual Quote',
                'is_consolidated': len(manual_items) > 1,
                'items': manual_items,
                'delivery_fee': None,
                'requires_manual_quote': True,
                'manual_quote_reason': 'Requires manual delivery confirmation by DOVI.',
                'transport_arrangement': 'Special Arrangement (Pending Delivery Confirmation)',
            })

    requires_manual_quote = len(manual_quote_reasons) > 0 or any(s['requires_manual_quote'] for s in shipments)
    total_delivery = (
        None
        if requires_manual_quote
        else sum(Decimal(s['delivery_fee']) for s in shipments if s['delivery_fee'] is not None)
    )

    return {
        'origin': route.origin,
        'destination_state': destination_state,
        'destination_city': destination_city,
        'route_id': str(route.id),
        'route_found': True,
        'is_consolidated_single_shipment': len(shipments) == 1,
        'shipment_count': len(shipments),
        'shipments': shipments,
        'subtotal': str(subtotal),
        'base_delivery_fee': None if total_delivery is None else str(total_delivery),
        'special_handling_fee': '0.00',
        'total_delivery_fee': None if total_delivery is None else str(total_delivery),
        'total_payable': None if total_delivery is None else str(subtotal + total_delivery),
        'requires_manual_quote': requires_manual_quote,
        'manual_quote_reasons': manual_quote_reasons,
        'consolidation_explanation': (
            'All items in your order will be consolidated and packaged together for direct delivery into a single shipment.'
            if len(shipments) == 1
            else 'Your order has been grouped into separate shipments based on parcel transport requirements.'
        ),
        'separation_explanation': (
            'Furniture / Bulky items require a separate transport arrangement from standard parcels to ensure safe handling for direct delivery.'
            if len(shipments) > 1
            else None
        ),
    }
