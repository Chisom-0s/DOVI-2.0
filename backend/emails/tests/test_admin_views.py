import json
from django.test import TestCase
from rest_framework.test import APIClient
from emails.models import EmailLog, EmailStatus, EmailType, EmailCategory, EmailPriority
from emails.services import AdminEmailService


class AdminEmailAPIEndpointsTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Seed 1 customer email and 2 admin notifications
        self.user_log = EmailLog.objects.create(
            recipient="buyer@campus.edu",
            recipient_name="Student Buyer",
            email_type=EmailType.WELCOME,
            category=EmailCategory.ACCOUNT,
            priority=EmailPriority.INFORMATIONAL,
            is_admin=False,
            subject="Welcome to Dovi",
            sender="Dovi <hello@dovishop.com>",
            status=EmailStatus.DELIVERED,
        )

        self.admin_order_log = EmailLog.objects.create(
            recipient="admin@dovishop.com",
            recipient_name="Dovi Administrator",
            email_type=EmailType.ADMIN_NEW_ORDER,
            category=EmailCategory.ADMIN_ORDERS,
            priority=EmailPriority.HIGH,
            is_admin=True,
            subject="New Order Received — Dovi #DOV-999",
            sender="Dovi Operations <notifications@dovishop.com>",
            status=EmailStatus.ACCEPTED,
        )

        self.admin_sec_log = EmailLog.objects.create(
            recipient="security@dovishop.com",
            recipient_name="Dovi Security",
            email_type=EmailType.ADMIN_SECURITY_LOGIN_FAILED_REPEATED,
            category=EmailCategory.ADMIN_SECURITY,
            priority=EmailPriority.URGENT,
            is_admin=True,
            subject="SECURITY ALERT: Repeated Failed Admin Logins",
            sender="Dovi Security <security@dovishop.com>",
            status=EmailStatus.FAILED,
            last_error="Network timeout connecting to SMTP gateway",
        )

    def test_list_all_emails(self):
        res = self.client.get('/api/v1/admin/emails/')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['count'], 3)

    def test_filter_by_is_admin(self):
        res = self.client.get('/api/v1/admin/emails/?is_admin=true')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['count'], 2)
        for item in data['results']:
            self.assertTrue(item['is_admin'])

    def test_filter_by_priority(self):
        res = self.client.get('/api/v1/admin/emails/?priority=URGENT')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['count'], 1)
        self.assertEqual(data['results'][0]['priority'], 'URGENT')

    def test_dedicated_admin_notifications_endpoint(self):
        res = self.client.get('/api/v1/admin/emails/admin_notifications/')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['count'], 2)

    def test_metrics_endpoint_includes_admin_counts(self):
        res = self.client.get('/api/v1/admin/emails/metrics/')
        self.assertEqual(res.status_code, 200)
        metrics = res.json()
        self.assertEqual(metrics['total_emails'], 3)
        self.assertEqual(metrics['admin_emails_count'], 2)
        self.assertEqual(metrics['customer_emails_count'], 1)

    def test_config_endpoint_returns_admin_routing(self):
        res = self.client.get('/api/v1/admin/emails/config/')
        self.assertEqual(res.status_code, 200)
        cfg = res.json()
        self.assertIn('admin_emails', cfg)
        self.assertIn('admin_categories_routing', cfg)
        self.assertIn('orders', cfg['admin_categories_routing'])
        self.assertIn('payments', cfg['admin_categories_routing'])

    def test_retry_failed_email_endpoint(self):
        res = self.client.post(f'/api/v1/admin/emails/{self.admin_sec_log.id}/retry/')
        self.assertEqual(res.status_code, 200)
        self.admin_sec_log.refresh_from_db()
        self.assertIn(self.admin_sec_log.status, [EmailStatus.QUEUED, EmailStatus.ACCEPTED, EmailStatus.FAILED])
