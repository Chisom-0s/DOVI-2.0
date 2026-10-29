from rest_framework import permissions, status, views
from rest_framework.response import Response
from .models import DeliveryRoute, DeliveryRateChangeHistory, OrderShipment
from .services import calculate_order_delivery


class IsAdminRolePermission(permissions.BasePermission):
    """
    Strictly enforces that only authenticated Administrators (role == 'ADMIN' or is_staff)
    can create, update, activate, deactivate, or delete delivery routes and rates.
    """
    message = 'Permission denied. Only authorized administrators can modify delivery rates.'

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        return getattr(user, 'role', None) == 'ADMIN' or getattr(user, 'is_staff', False)


class DeliveryCalculationAPIView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data or {}
        result = calculate_order_delivery(
            destination_state=data.get('destination_state', ''),
            destination_city=data.get('destination_city', ''),
            items=data.get('items', []),
            origin=data.get('origin', 'Onitsha'),
            destination_address=data.get('destination_address', ''),
            recipient_name=data.get('recipient_name', ''),
            recipient_phone=data.get('recipient_phone', ''),
        )
        return Response(result, status=status.HTTP_200_OK)


class AdminDeliveryRouteListCreateAPIView(views.APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsAdminRolePermission()]

    def get(self, request):
        active_only = request.query_params.get('active_only') == 'true'
        qs = DeliveryRoute.objects.all()
        if active_only:
            qs = qs.filter(is_active=True)
        routes = [
            {
                'id': str(r.id),
                'origin': r.origin,
                'destination_state': r.destination_state,
                'destination_city': r.destination_city,
                'is_active': r.is_active,
                'small_parcel_rate': float(r.small_parcel_rate) if r.small_parcel_rate is not None else None,
                'heavy_parcel_rate': float(r.heavy_parcel_rate) if r.heavy_parcel_rate is not None else None,
                'furniture_bulky_rate': float(r.furniture_bulky_rate) if r.furniture_bulky_rate is not None else None,
                'combined_small_heavy_rate': float(r.combined_small_heavy_rate) if r.combined_small_heavy_rate is not None else None,
                'combined_furniture_rate': float(r.combined_furniture_rate) if r.combined_furniture_rate is not None else None,
                'allow_small_with_furniture': r.allow_small_with_furniture,
                'max_furniture_items_consolidated': r.max_furniture_items_consolidated,
                'multi_furniture_requires_manual_quote': r.multi_furniture_requires_manual_quote,
                'special_handling_surcharge': float(r.special_handling_surcharge) if r.special_handling_surcharge is not None else None,
                'requires_manual_quote_for_special_handling': r.requires_manual_quote_for_special_handling,
                'special_delivery_requirements': r.special_delivery_requirements,
                'estimated_delivery_info': r.estimated_delivery_info,
                'updated_by': r.updated_by_email,
                'updated_at': r.updated_at.isoformat(),
                'created_at': r.created_at.isoformat(),
            }
            for r in qs
        ]
        return Response(routes, status=status.HTTP_200_OK)

    def post(self, request):
        payload = request.data or {}
        actor_email = getattr(request.user, 'email', 'admin@dovi.com')
        route = DeliveryRoute.objects.create(
            origin=payload.get('origin', 'Onitsha') or 'Onitsha',
            destination_state=payload['destination_state'],
            destination_city=payload.get('destination_city', '') or '',
            is_active=payload.get('is_active', True),
            small_parcel_rate=payload.get('small_parcel_rate'),
            heavy_parcel_rate=payload.get('heavy_parcel_rate'),
            furniture_bulky_rate=payload.get('furniture_bulky_rate'),
            combined_small_heavy_rate=payload.get('combined_small_heavy_rate'),
            combined_furniture_rate=payload.get('combined_furniture_rate'),
            allow_small_with_furniture=payload.get('allow_small_with_furniture', False),
            max_furniture_items_consolidated=payload.get('max_furniture_items_consolidated', 3),
            multi_furniture_requires_manual_quote=payload.get('multi_furniture_requires_manual_quote', False),
            special_handling_surcharge=payload.get('special_handling_surcharge'),
            requires_manual_quote_for_special_handling=payload.get('requires_manual_quote_for_special_handling', True),
            special_delivery_requirements=payload.get('special_delivery_requirements', ''),
            estimated_delivery_info=payload.get('estimated_delivery_info', ''),
            updated_by_id=getattr(request.user, 'id', None),
            updated_by_email=actor_email,
        )
        dest_label = f"{route.destination_city}, {route.destination_state}" if route.destination_city else route.destination_state
        for cls_label, val in [
            ('Small Parcel', route.small_parcel_rate),
            ('Heavy Parcel', route.heavy_parcel_rate),
            ('Furniture / Bulky Item', route.furniture_bulky_rate),
        ]:
            if val is not None:
                DeliveryRateChangeHistory.objects.create(
                    route=route,
                    origin=route.origin,
                    destination=dest_label,
                    delivery_classification=cls_label,
                    previous_rate=None,
                    new_rate=val,
                    changed_by_id=getattr(request.user, 'id', None),
                    changed_by_email=actor_email,
                    reason=payload.get('reason', 'Initial route configuration'),
                )
        return Response({'id': str(route.id)}, status=status.HTTP_201_CREATED)
