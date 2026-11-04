from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AdminEmailLogViewSet,
    AdminEmailConfigView,
    AdminSendTestEmailView,
    AdminPlatformAnnouncementView,
    ResendWebhookView,
)

router = DefaultRouter()
router.register(r'admin/emails', AdminEmailLogViewSet, basename='admin-emails')

urlpatterns = [
    path('admin/emails/config/', AdminEmailConfigView.as_view(), name='admin-email-config'),
    path('admin/emails/test/', AdminSendTestEmailView.as_view(), name='admin-email-test'),
    path('admin/emails/announcements/', AdminPlatformAnnouncementView.as_view(), name='admin-email-announcements'),
    path('webhooks/resend/', ResendWebhookView.as_view(), name='resend-webhook'),
    path('', include(router.urls)),
]
