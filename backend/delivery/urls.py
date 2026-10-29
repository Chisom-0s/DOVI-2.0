from django.urls import path
from .views import DeliveryCalculationAPIView, AdminDeliveryRouteListCreateAPIView

urlpatterns = [
    path('api/v1/delivery/calculate/', DeliveryCalculationAPIView.as_view(), name='delivery-calculate'),
    path('api/v1/delivery/routes/', AdminDeliveryRouteListCreateAPIView.as_view(), name='delivery-routes'),
]
