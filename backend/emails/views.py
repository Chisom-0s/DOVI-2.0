import json
import logging
from django.db.models import Q, Count
from django.http import HttpResponse
from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .models import EmailLog, EmailStatus, EmailType, EmailCategory, EmailPriority
from .serializers import (
    EmailLogSerializer,
    SendTestEmailSerializer,
    PlatformAnnouncementSerializer,
    EmailConfigResponseSerializer,
)
from .services import EmailService, EmailConfig, AdminEmailConfig

logger = logging.getLogger(__name__)

# Try importing svix for webhook verification
try:
    from svix.webhooks import Webhook
    HAS_SVIX = True
except ImportError:
    HAS_SVIX = False


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class AdminEmailLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin endpoints for inspecting email delivery logs and retrying failures.
    """
    queryset = EmailLog.objects.all().prefetch_related('delivery_attempts')
    serializer_class = EmailLogSerializer
    pagination_class = StandardPagination
    # In production, guarded by IsAdminUser or RoleGuard
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        # Filter by status
        status_filter = params.get('status')
        if status_filter and status_filter != 'ALL':
            qs = qs.filter(status=status_filter)

        # Filter by category
        category = params.get('category')
        if category and category != 'ALL':
            qs = qs.filter(category=category)

        # Filter by email_type
        email_type = params.get('email_type')
        if email_type and email_type != 'ALL':
            qs = qs.filter(email_type=email_type)

        # Filter by priority
        priority = params.get('priority')
        if priority and priority != 'ALL':
            qs = qs.filter(priority=priority)

        # Filter by audience (ADMIN vs CUSTOMER)
        audience = params.get('audience')
        if audience:
            if audience.upper() == 'ADMIN':
                qs = qs.filter(is_admin=True)
            elif audience.upper() in ['CUSTOMER', 'BUYER', 'USER']:
                qs = qs.filter(is_admin=False)

        # Explicit boolean is_admin parameter
        is_admin_param = params.get('is_admin')
        if is_admin_param is not None:
            if is_admin_param.lower() in ('true', '1', 't'):
                qs = qs.filter(is_admin=True)
            elif is_admin_param.lower() in ('false', '0', 'f'):
                qs = qs.filter(is_admin=False)

        # Search by recipient, subject, or resend_message_id
        q = params.get('q')
        if q:
            q = q.strip()
            qs = qs.filter(
                Q(recipient__icontains=q) |
                Q(recipient_name__icontains=q) |
                Q(subject__icontains=q) |
                Q(resend_message_id__icontains=q)
            )

        return qs

    @action(detail=True, methods=['post'])
    def retry(self, request, pk=None):
        """Retries sending an eligible failed or bounced email."""
        try:
            email_log = EmailService.retry_email(str(pk))
            serializer = self.get_serializer(email_log)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except EmailLog.DoesNotExist:
            return Response({'error': 'Email log not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"[AdminEmailLogViewSet] Retry error for {pk}: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def admin_notifications(self, request):
        """Dedicated viewset endpoint returning only administrative operational notifications."""
        admin_qs = self.get_queryset().filter(is_admin=True)
        page = self.paginate_queryset(admin_qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(admin_qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def metrics(self, request):
        """Calculates dashboard metrics across email logs."""
        total_count = EmailLog.objects.count()
        delivered_count = EmailLog.objects.filter(status=EmailStatus.DELIVERED).count()
        accepted_count = EmailLog.objects.filter(status=EmailStatus.ACCEPTED).count()
        failed_count = EmailLog.objects.filter(status=EmailStatus.FAILED).count()
        bounced_count = EmailLog.objects.filter(status=EmailStatus.BOUNCED).count()
        queued_count = EmailLog.objects.filter(status=EmailStatus.QUEUED).count()
        admin_count = EmailLog.objects.filter(is_admin=True).count()
        customer_count = EmailLog.objects.filter(is_admin=False).count()

        delivered_or_accepted = delivered_count + accepted_count
        rate = (delivered_or_accepted / total_count * 100) if total_count > 0 else 100.0

        return Response({
            'total_emails': total_count,
            'delivered': delivered_count,
            'accepted': accepted_count,
            'failed': failed_count,
            'bounced': bounced_count,
            'queued': queued_count,
            'admin_emails_count': admin_count,
            'customer_emails_count': customer_count,
            'delivery_rate_pct': round(rate, 1),
        })


class AdminEmailConfigView(APIView):
    """
    Returns non-secret email configuration for the admin dashboard.
    Never exposes raw API keys.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        api_key = EmailConfig.get_api_key()
        webhook_secret = EmailConfig.get_webhook_secret()

        data = {
            'is_configured': bool(api_key),
            'masked_api_key': EmailConfig.get_masked_api_key(),
            'from_address': EmailConfig.get_from_address(),
            'from_name': EmailConfig.get_from_name(),
            'reply_to': EmailConfig.get_reply_to(),
            'app_url': EmailConfig.get_app_url(),
            'webhook_endpoint': f"{EmailConfig.get_app_url()}/api/v1/webhooks/resend/",
            'webhook_configured': bool(webhook_secret),
            'admin_emails': AdminEmailConfig.get_all_configured_admin_emails(),
            'admin_categories_routing': {
                'orders': AdminEmailConfig.get_admin_recipients(EmailCategory.ADMIN_ORDERS),
                'payments': AdminEmailConfig.get_admin_recipients(EmailCategory.ADMIN_PAYMENTS),
                'approvals': AdminEmailConfig.get_admin_recipients(EmailCategory.ADMIN_APPROVALS),
                'support': AdminEmailConfig.get_admin_recipients(EmailCategory.ADMIN_SUPPORT),
                'inventory': AdminEmailConfig.get_admin_recipients(EmailCategory.ADMIN_INVENTORY),
                'security': AdminEmailConfig.get_admin_recipients(EmailCategory.ADMIN_SECURITY),
            },
        }
        serializer = EmailConfigResponseSerializer(data)
        return Response(serializer.data)


class AdminSendTestEmailView(APIView):
    """
    Sends a test transactional email to verify integration.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SendTestEmailSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email_type = serializer.validated_data['email_type']
        recipient = serializer.validated_data['recipient']
        recipient_name = serializer.validated_data.get('recipient_name', 'Admin Tester')
        custom_ctx = serializer.validated_data.get('custom_context', {})

        # Merge standard test context defaults
        sample_context = {
            "customer_name": recipient_name,
            "order_reference": "DOV-TEST-882",
            "transaction_reference": "TX-TEST-994",
            "total_amount": 25000,
            "subtotal": 23500,
            "delivery_fee": 1500,
            "delivery_method": "Dovi Campus Express",
            "delivery_address": "Hall 3, Room 204, Campus Hostel",
            "items": [
                {"name": "Dovi Student Hoodie", "quantity": 1, "price": 18500},
                {"name": "Scientific Calculator FX-991EX", "quantity": 1, "price": 5000},
            ],
            "action_url": f"{EmailConfig.get_app_url()}/products",
            "token": "dovi-sample-test-token-123",
            "uid": "test-uid-88",
            "expires_in": "24 hours",
            "date_time": "Today, Live Test",
        }
        sample_context.update(custom_ctx)

        try:
            email_log = EmailService.send_transactional_email(
                email_type=email_type,
                recipient=recipient,
                context=sample_context,
                recipient_name=recipient_name,
                force_sync=True,  # Wait for real Resend response for instant test feedback
            )
            return Response({
                'success': True,
                'message': f"Test email '{email_type}' sent to {recipient}.",
                'email_log': EmailLogSerializer(email_log).data,
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"[AdminSendTestEmailView] Error: {e}")
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminPlatformAnnouncementView(APIView):
    """
    Broadcasts an authorized platform announcement to users.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PlatformAnnouncementSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        title = serializer.validated_data['title']
        message = serializer.validated_data['message']
        action_text = serializer.validated_data.get('action_text', 'Visit Dovi')
        action_url = serializer.validated_data.get('action_url') or EmailConfig.get_app_url()
        targets = serializer.validated_data.get('target_recipients', [])

        if not targets:
            return Response({
                'error': 'Please provide at least one recipient email address for this announcement.'
            }, status=status.HTTP_400_BAD_REQUEST)

        sent_count = 0
        for email in targets:
            try:
                EmailService.send_transactional_email(
                    email_type=EmailType.PLATFORM_ANNOUNCEMENT,
                    recipient=email,
                    context={
                        'announcement_title': title,
                        'message_html': message.replace('\n', '<br>'),
                        'message': message,
                        'action_text': action_text,
                        'action_url': action_url,
                    },
                    force_sync=False,
                )
                sent_count += 1
            except Exception as e:
                logger.error(f"[AdminPlatformAnnouncementView] Failed sending to {email}: {e}")

        return Response({
            'success': True,
            'message': f"Announcement queued for {sent_count} recipient(s).",
            'recipients_count': sent_count,
        })


class ResendWebhookView(APIView):
    """
    Receives and processes Resend delivery webhooks.
    Verifies Svix signature headers when RESEND_WEBHOOK_SECRET is configured.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payload_bytes = request.body
        secret = EmailConfig.get_webhook_secret()

        # Signature verification if secret configured and svix installed
        if secret:
            svix_id = request.headers.get("svix-id")
            svix_timestamp = request.headers.get("svix-timestamp")
            svix_signature = request.headers.get("svix-signature")

            if not (svix_id and svix_timestamp and svix_signature):
                logger.warning("[ResendWebhook] Missing svix signature headers.")
                return Response({'error': 'Missing signature headers.'}, status=status.HTTP_400_BAD_REQUEST)

            if HAS_SVIX:
                try:
                    wh = Webhook(secret)
                    wh.verify(payload_bytes, request.headers)
                except Exception as e:
                    logger.warning(f"[ResendWebhook] Signature verification failed: {e}")
                    return Response({'error': 'Invalid signature.'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            event = json.loads(payload_bytes.decode('utf-8'))
        except Exception as e:
            return Response({'error': 'Invalid JSON.'}, status=status.HTTP_400_BAD_REQUEST)

        event_type = event.get('type', '')
        event_data = event.get('data', {})

        logger.info(f"[ResendWebhook] Received event: {event_type}")
        EmailService.handle_resend_webhook(event_type, event_data)

        return Response({'status': 'processed'}, status=status.HTTP_200_OK)
