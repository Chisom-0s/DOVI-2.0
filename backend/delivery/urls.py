from django.urls import path
from .views import DeliveryCalculationAPIView, AdminDeliveryRouteListCreateAPIView, AdminDeliveryRouteDetailAPIView
from .payment_views import (
    PublicPromotionalCampaignsAPIView,
    AdminPromotionalCampaignsListCreateAPIView,
    AdminPromotionalCampaignDetailAPIView,
    AdminPromotionalCampaignPauseAPIView,
    AdminPromotionalCampaignResumeAPIView,
    AdminPromotionalCampaignDuplicateAPIView,
    ReceiptUploadAPIView,
    SubmitPaymentEvidenceAPIView,
    PaymentEvidenceDetailAPIView,
    AdminPaymentsListAPIView,
    AdminPaymentVerifyAPIView,
    AdminPaymentRejectAPIView,
    OrderTransitionAPIView,
    OrderListCreateAPIView,
    OrderDetailAPIView,
    MinimumOrderSettingsAPIView,
    PaymentSessionListCreateAPIView,
    PaymentSessionDetailAPIView,
    PaymentSessionRenewAPIView,
    AdminPaymentSessionsListAPIView,
)

urlpatterns = [
    # Delivery
    path('calculate/', DeliveryCalculationAPIView.as_view(), name='delivery-calculate'),
    path('routes/', AdminDeliveryRouteListCreateAPIView.as_view(), name='delivery-routes'),
    path('routes/<uuid:route_id>/', AdminDeliveryRouteDetailAPIView.as_view(), name='delivery-route-detail'),
    path('delivery/calculate/', DeliveryCalculationAPIView.as_view(), name='nested-delivery-calculate'),
    path('delivery/routes/', AdminDeliveryRouteListCreateAPIView.as_view(), name='nested-delivery-routes'),
    path('delivery/routes/<uuid:route_id>/', AdminDeliveryRouteDetailAPIView.as_view(), name='nested-delivery-route-detail'),

    # Minimum Order Value Settings (Admin Controlled)
    path('settings/minimum-order/', MinimumOrderSettingsAPIView.as_view(), name='settings-minimum-order'),
    path('admin/settings/minimum-order/', MinimumOrderSettingsAPIView.as_view(), name='admin-settings-minimum-order'),

    # Strict 60-Minute Payment Sessions
    path('payments/sessions/', PaymentSessionListCreateAPIView.as_view(), name='payment-sessions'),
    path('payments/sessions/<str:session_id>/', PaymentSessionDetailAPIView.as_view(), name='payment-session-detail'),
    path('payments/sessions/<str:session_id>/renew/', PaymentSessionRenewAPIView.as_view(), name='payment-session-renew'),
    path('admin/payment-sessions/', AdminPaymentSessionsListAPIView.as_view(), name='admin-payment-sessions-list'),

    # Manual Bank Transfer Payments & Verification
    path('payments/upload-receipt/', ReceiptUploadAPIView.as_view(), name='payment-upload-receipt'),
    path('payments/submit-evidence/', SubmitPaymentEvidenceAPIView.as_view(), name='payment-submit-evidence'),
    path('payments/evidence/', PaymentEvidenceDetailAPIView.as_view(), name='payment-evidence-detail'),
    path('admin/payments/', AdminPaymentsListAPIView.as_view(), name='admin-payments-list'),
    path('admin/payments/<str:payment_id>/verify/', AdminPaymentVerifyAPIView.as_view(), name='admin-payment-verify'),
    path('admin/payments/<str:payment_id>/reject/', AdminPaymentRejectAPIView.as_view(), name='admin-payment-reject'),

    # Reusable Promotional Campaigns & Banners
    path('promotions/campaigns/', PublicPromotionalCampaignsAPIView.as_view(), name='public-promotions-campaigns'),
    path('admin/promotions/campaigns/', AdminPromotionalCampaignsListCreateAPIView.as_view(), name='admin-promotions-campaigns'),
    path('admin/promotions/campaigns/<str:campaign_id>/', AdminPromotionalCampaignDetailAPIView.as_view(), name='admin-promotions-campaign-detail'),
    path('admin/promotions/campaigns/<str:campaign_id>/pause/', AdminPromotionalCampaignPauseAPIView.as_view(), name='admin-promotions-campaign-pause'),
    path('admin/promotions/campaigns/<str:campaign_id>/resume/', AdminPromotionalCampaignResumeAPIView.as_view(), name='admin-promotions-campaign-resume'),
    path('admin/promotions/campaigns/<str:campaign_id>/duplicate/', AdminPromotionalCampaignDuplicateAPIView.as_view(), name='admin-promotions-campaign-duplicate'),

    # Orders & Lifecycle Transitions
    path('orders/', OrderListCreateAPIView.as_view(), name='orders-list-create'),
    path('orders/<str:order_id>/', OrderDetailAPIView.as_view(), name='order-detail'),
    path('orders/<str:order_id>/transition/', OrderTransitionAPIView.as_view(), name='order-transition'),
]
