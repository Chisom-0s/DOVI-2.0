import os
from django.test import TestCase, override_settings
from emails.models import EmailLog, EmailStatus, EmailType, EmailCategory, EmailPriority
from emails.templates import EmailTemplateEngine, format_currency
from emails.services import EmailService, EmailConfig, AdminEmailConfig, AdminEmailService


class AdminEmailTemplateTests(TestCase):
    """
    Tests that all 27 admin notification templates render correctly with proper
    branding, priority indicators, information hierarchy, and plain-text fallback.
    """

    def test_admin_new_order_template(self):
        ctx = {
            "order_reference": "DOV-ORD-7788",
            "customer_name": "Chisom Okonkwo",
            "customer_email": "chisom@example.com",
            "customer_phone": "+2348012345678",
            "total_amount": 75000,
            "subtotal": 72500,
            "delivery_fee": 2500,
            "delivery_address": "Block B, Room 104, Campus Hostel",
            "delivery_method": "Campus Express Hub",
            "payment_status": "PAID / ESCROW SECURED",
            "items": [
                {"name": "Oraimo FreePods 4", "quantity": 1, "price": 25000},
                {"name": "HP EliteBook Laptop Charger", "quantity": 1, "price": 47500},
            ],
            "app_url": "https://dovishop.com",
        }
        subject, html, text = EmailTemplateEngine.render(EmailType.ADMIN_NEW_ORDER, ctx)
        self.assertIn("New Order Received — Dovi #DOV-ORD-7788", subject)
        self.assertIn("Chisom Okonkwo", html)
        self.assertIn("₦75,000.00", html)
        self.assertIn("Oraimo FreePods 4", html)
        self.assertIn("HIGH PRIORITY", html)
        self.assertIn("Confidential", html)
        self.assertIn("https://dovishop.com/admin/orders/DOV-ORD-7788", html)

        # Plain text assertions
        self.assertIn("DOV-ORD-7788", text)
        self.assertIn("₦75,000.00", text)
        self.assertIn("chisom@example.com", text)

    def test_admin_refund_approval_required_template(self):
        ctx = {
            "order_reference": "DOV-ORD-9021",
            "refund_amount": 35000,
            "inspection_notes": "Defective screen verified at Onitsha Hub",
            "app_url": "https://dovishop.com",
        }
        subject, html, text = EmailTemplateEngine.render(EmailType.ADMIN_REFUND_APPROVAL_REQUIRED, ctx)
        self.assertIn("Action Required: Refund Approval — Dovi #DOV-ORD-9021", subject)
        self.assertIn("₦35,000.00", html)
        self.assertIn("Action Required from Administrator", html)
        self.assertIn("Defective screen verified", html)
        self.assertIn("HIGH PRIORITY", html)

    def test_all_27_admin_email_types_render_without_exceptions(self):
        admin_types = [
            choice for choice, _ in EmailType.choices if choice.startswith("ADMIN_")
        ]
        self.assertEqual(len(admin_types), 27)

        sample_context = {
            "order_reference": "DOV-ORD-TEST",
            "transaction_reference": "TX-TEST-123",
            "dispute_reference": "DSP-TEST-456",
            "ticket_id": "TKT-TEST-789",
            "customer_name": "Test Customer",
            "customer_email": "test@example.com",
            "total_amount": 50000,
            "amount": 50000,
            "refund_amount": 50000,
            "product_name": "Test Smartphone",
            "ip_address": "192.168.1.1",
            "service_name": "Paystack Webhook",
            "error_title": "Database Connection Timeout",
            "app_url": "https://dovishop.com",
        }

        for email_type in admin_types:
            subject, html, text = EmailTemplateEngine.render(email_type, sample_context)
            self.assertTrue(len(subject) > 0, f"Subject empty for {email_type}")
            self.assertTrue(len(html) > 200, f"HTML too short for {email_type}")
            self.assertTrue(len(text) > 30, f"Text too short for {email_type}")
            self.assertIn("DOVI", html)
            self.assertIn("Confidential", html)


class AdminEmailRoutingAndConfigTests(TestCase):
    """
    Tests administrative recipient configuration, category routing, and environment overrides.
    """

    def test_default_admin_recipient_fallback(self):
        with override_settings(DOVI_ADMIN_EMAILS=""):
            if "DOVI_ADMIN_EMAILS" in os.environ:
                del os.environ["DOVI_ADMIN_EMAILS"]
            emails = AdminEmailConfig.get_admin_recipients()
            self.assertTrue(len(emails) >= 1)
            self.assertIn("@", emails[0])

    def test_multiple_comma_separated_admin_emails(self):
        test_val = "admin1@dovishop.com, admin2@dovishop.com, support-lead@dovishop.com"
        with override_settings(DOVI_ADMIN_EMAILS=test_val):
            os.environ["DOVI_ADMIN_EMAILS"] = test_val
            recipients = AdminEmailConfig.get_admin_recipients()
            self.assertEqual(recipients, ["admin1@dovishop.com", "admin2@dovishop.com", "support-lead@dovishop.com"])

    def test_category_specific_routing_overrides(self):
        os.environ["DOVI_ADMIN_EMAILS"] = "general-admin@dovishop.com"
        os.environ["DOVI_ADMIN_ORDER_EMAILS"] = "orders-team@dovishop.com, logistics@dovishop.com"
        os.environ["DOVI_ADMIN_PAYMENT_EMAILS"] = "finance@dovishop.com"

        order_recipients = AdminEmailConfig.get_admin_recipients(EmailCategory.ADMIN_ORDERS)
        payment_recipients = AdminEmailConfig.get_admin_recipients(EmailCategory.ADMIN_PAYMENTS)
        general_recipients = AdminEmailConfig.get_admin_recipients(EmailCategory.ADMIN_APPROVALS)

        self.assertEqual(order_recipients, ["orders-team@dovishop.com", "logistics@dovishop.com"])
        self.assertEqual(payment_recipients, ["finance@dovishop.com"])
        self.assertEqual(general_recipients, ["general-admin@dovishop.com"])


class AdminEmailServiceWorkflowTests(TestCase):
    """
    Tests all required Phase 8 scenarios:
    1. Customer places new order -> Admin receives ADMIN_NEW_ORDER
    2. Customer payment confirmed -> Admin receives ADMIN_PAYMENT_CONFIRMED
    3. Customer payment fails -> Admin receives ADMIN_PAYMENT_FAILED
    4. Refund requires approval -> Admin receives ADMIN_REFUND_APPROVAL_REQUIRED
    5. Customer support request -> Admin receives ADMIN_SUPPORT_TICKET_NEW
    6. Order cancelled -> Admin receives ADMIN_ORDER_CANCELLED
    7. Security event -> Admin receives ADMIN_SECURITY_LOGIN_FAILED_REPEATED
    8. Inventory threshold reached -> Admin receives ADMIN_LOW_STOCK_ALERT
    9. Duplicate webhook prevention -> Idempotency stops duplicates
    10. Failure non-blocking -> App transaction never crashes when email fails
    """

    def setUp(self):
        os.environ["DOVI_ADMIN_EMAILS"] = "admin@example.com"
        if "DOVI_ADMIN_ORDER_EMAILS" in os.environ:
            del os.environ["DOVI_ADMIN_ORDER_EMAILS"]

    def test_scenario_1_customer_places_order(self):
        order_data = {
            "order_reference": "DOV-ORD-1001",
            "customer_name": "Ada Lovelace",
            "customer_email": "ada@campus.edu",
            "customer_phone": "+2348000000001",
            "total_amount": 42000,
            "payment_status": "PAID / ESCROW SECURED",
            "items": [{"name": "Scientific Calculator", "quantity": 1, "price": 42000}],
        }
        logs = AdminEmailService.notify_new_order(order_data, force_sync=True)
        self.assertEqual(len(logs), 1)
        log = logs[0]

        self.assertEqual(log.recipient, "admin@example.com")
        self.assertEqual(log.email_type, EmailType.ADMIN_NEW_ORDER)
        self.assertEqual(log.category, EmailCategory.ADMIN_ORDERS)
        self.assertEqual(log.priority, EmailPriority.HIGH)
        self.assertTrue(log.is_admin)
        self.assertIn("New Order Received — Dovi #DOV-ORD-1001", log.subject)
        self.assertEqual(log.status, EmailStatus.ACCEPTED)

    def test_scenario_2_customer_payment_confirmed(self):
        payment_data = {
            "transaction_reference": "TX-PAY-8821",
            "order_reference": "DOV-ORD-1002",
            "amount": 85000,
            "customer_name": "Emeka Nnamdi",
            "customer_email": "emeka@campus.edu",
            "payment_method": "Paystack Card",
        }
        logs = AdminEmailService.notify_payment_confirmed(payment_data, force_sync=True)
        self.assertEqual(len(logs), 1)
        log = logs[0]
        self.assertEqual(log.email_type, EmailType.ADMIN_PAYMENT_CONFIRMED)
        self.assertEqual(log.category, EmailCategory.ADMIN_PAYMENTS)
        self.assertEqual(log.priority, EmailPriority.HIGH)
        self.assertTrue(log.is_admin)
        self.assertIn("Payment Confirmed", log.subject)
        self.assertIn("85,000", log.subject)

    def test_scenario_3_customer_payment_failed(self):
        payment_data = {
            "transaction_reference": "TX-FAIL-3301",
            "order_reference": "DOV-ORD-1003",
            "amount": 25000,
            "customer_name": "Kelechi Okafor",
            "failure_reason": "Insufficient card balance",
        }
        logs = AdminEmailService.notify_payment_failed(payment_data, force_sync=True)
        self.assertEqual(len(logs), 1)
        log = logs[0]
        self.assertEqual(log.email_type, EmailType.ADMIN_PAYMENT_FAILED)
        self.assertEqual(log.priority, EmailPriority.ATTENTION_REQUIRED)
        self.assertIn("Payment Failed", log.subject)

    def test_scenario_4_refund_approval_required(self):
        refund_data = {
            "refund_reference": "RF-9912",
            "order_reference": "DOV-ORD-1004",
            "refund_amount": 30000,
            "inspection_notes": "Defect confirmed at hub",
        }
        logs = AdminEmailService.notify_refund_approval_required(refund_data, force_sync=True)
        self.assertEqual(len(logs), 1)
        log = logs[0]
        self.assertEqual(log.email_type, EmailType.ADMIN_REFUND_APPROVAL_REQUIRED)
        self.assertEqual(log.category, EmailCategory.ADMIN_PAYMENTS)
        self.assertEqual(log.priority, EmailPriority.HIGH)
        self.assertIn("Action Required: Refund Approval", log.subject)

    def test_scenario_5_customer_support_request(self):
        ticket_data = {
            "ticket_id": "TKT-441",
            "subject": "Inquiry about Onitsha pickup point",
            "customer_name": "Fatima Bello",
            "customer_email": "fatima@campus.edu",
            "category": "Delivery",
            "message_summary": "Can I pick up my laptop directly at the commercial hub?",
        }
        logs = AdminEmailService.notify_support_ticket_new(ticket_data, force_sync=True)
        self.assertEqual(len(logs), 1)
        log = logs[0]
        self.assertEqual(log.email_type, EmailType.ADMIN_SUPPORT_TICKET_NEW)
        self.assertEqual(log.category, EmailCategory.ADMIN_SUPPORT)
        self.assertEqual(log.priority, EmailPriority.HIGH)
        self.assertIn("New Support Request #TKT-441", log.subject)

    def test_scenario_6_order_cancelled(self):
        order_data = {
            "order_reference": "DOV-ORD-1006",
            "customer_name": "Tunde Bakare",
            "cancellation_reason": "Purchased wrong model",
            "total_amount": 15000,
        }
        logs = AdminEmailService.notify_order_cancelled(order_data, force_sync=True)
        self.assertEqual(len(logs), 1)
        log = logs[0]
        self.assertEqual(log.email_type, EmailType.ADMIN_ORDER_CANCELLED)
        self.assertIn("Order Cancelled by Customer — Dovi #DOV-ORD-1006", log.subject)

    def test_scenario_7_security_failed_logins(self):
        sec_data = {
            "ip_address": "197.210.88.14",
            "attempted_username": "administrator",
            "failed_attempts": 6,
        }
        logs = AdminEmailService.notify_security_login_failed_repeated(sec_data, force_sync=True)
        self.assertEqual(len(logs), 1)
        log = logs[0]
        self.assertEqual(log.email_type, EmailType.ADMIN_SECURITY_LOGIN_FAILED_REPEATED)
        self.assertEqual(log.category, EmailCategory.ADMIN_SECURITY)
        self.assertEqual(log.priority, EmailPriority.URGENT)
        self.assertIn("SECURITY ALERT: Repeated Failed Admin Logins", log.subject)

    def test_scenario_8_inventory_low_stock_alert(self):
        inv_data = {
            "product_name": "Luxury Golden Crystal LED Decorative Bulb",
            "sku": "LUX-STD-MF25",
            "current_stock": 2,
            "threshold": 5,
        }
        logs = AdminEmailService.notify_low_stock_alert(inv_data, force_sync=True)
        self.assertEqual(len(logs), 1)
        log = logs[0]
        self.assertEqual(log.email_type, EmailType.ADMIN_LOW_STOCK_ALERT)
        self.assertEqual(log.category, EmailCategory.ADMIN_INVENTORY)
        self.assertEqual(log.priority, EmailPriority.ATTENTION_REQUIRED)
        self.assertIn("Inventory Alert: Low Stock", log.subject)

    def test_scenario_9_duplicate_webhook_prevention(self):
        payment_data = {
            "transaction_reference": "TX-DUP-TEST-99",
            "order_reference": "DOV-ORD-2000",
            "amount": 50000,
        }
        # First webhook delivery
        logs_first = AdminEmailService.notify_payment_confirmed(payment_data, force_sync=True)
        self.assertEqual(len(logs_first), 1)
        first_id = logs_first[0].id

        # Repeated duplicate webhook delivery
        logs_second = AdminEmailService.notify_payment_confirmed(payment_data, force_sync=True)
        self.assertEqual(len(logs_second), 1)
        second_id = logs_second[0].id

        # Must return same log and NOT create duplicate
        self.assertEqual(first_id, second_id)
        self.assertEqual(
            EmailLog.objects.filter(idempotency_key=logs_first[0].idempotency_key).count(),
            1
        )

    def test_scenario_10_resend_failure_is_non_blocking_and_records_failure(self):
        """Verify that when Resend delivery fails, calling code never crashes and failure is recorded in EmailLog."""
        from unittest.mock import patch

        order_data = {
            "order_reference": "DOV-ORD-FAIL-SAFE",
            "customer_name": "Safe Buyer",
            "total_amount": 10000,
        }

        with patch.object(EmailService, '_execute_delivery_with_retries') as mock_deliver:
            def simulate_failure(email_log_id):
                log = EmailLog.objects.get(id=email_log_id)
                log.mark_failed("Resend API 503 Service Unavailable")

            mock_deliver.side_effect = simulate_failure

            # Calling AdminEmailService must succeed without raising exception
            logs = AdminEmailService.notify_new_order(order_data, force_sync=True)
            self.assertEqual(len(logs), 1)
            self.assertEqual(logs[0].status, EmailStatus.FAILED)
            self.assertIn("503", logs[0].last_error)
