from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DeliveryGroupViewSet, OrderDeliveryGroupsView

router = DefaultRouter()
router.register(r'delivery', DeliveryGroupViewSet, basename='delivery')
router.register(r'delivery-groups', DeliveryGroupViewSet, basename='delivery-groups')

urlpatterns = [
    path('', include(router.urls)),
    path('orders/<uuid:order_pk>/delivery-groups/', OrderDeliveryGroupsView.as_view({'get': 'list'}), name='order-delivery-groups'),
]
