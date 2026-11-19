from django.urls import path
from .views import DeliveryCalculationAPIView, AdminDeliveryRouteListCreateAPIView, AdminDeliveryRouteDetailAPIView

urlpatterns = [
    path('calculate/', DeliveryCalculationAPIView.as_view(), name='delivery-calculate'),
    path('routes/', AdminDeliveryRouteListCreateAPIView.as_view(), name='delivery-routes'),
    path('routes/<uuid:route_id>/', AdminDeliveryRouteDetailAPIView.as_view(), name='delivery-route-detail'),
    # Also support nested prefixes if included at root /api/v1/
    path('delivery/calculate/', DeliveryCalculationAPIView.as_view(), name='nested-delivery-calculate'),
    path('delivery/routes/', AdminDeliveryRouteListCreateAPIView.as_view(), name='nested-delivery-routes'),
    path('delivery/routes/<uuid:route_id>/', AdminDeliveryRouteDetailAPIView.as_view(), name='nested-delivery-route-detail'),
]
