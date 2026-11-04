from django.test import TestCase
from emails.models import EmailLog, EmailStatus, EmailType, EmailCategory
from emails.templates import EmailTemplateEngine, format_currency
from emails.services import EmailService, EmailConfig


class EmailTemplateEngineTests(TestCase):
    def test_currency_formatter(self):
        self.assertEqual(format_currency(1500), "₦1,500.00")
        self.assertEqual(format_currency(250000.5), "₦250,000.50")
        self.assertEqual(format_currency(0), "₦0.00")
        self.assertEqual(format_currency("4200"), "₦4,200.00")

    def test_welcome_template_renders_html_and_text(self):
        ctx = {
            "customer_name": "Chisom",
            "app_url": "https://dovishop.com",
            "action_url": "https://dovishop.com/products",
        }
        subject, html, text = EmailTemplateEngine.render(EmailType.WELCOME, ctx)
        self.assertIn("Welcome to Dovi", subject)
        self.assertIn("Chisom", html)
        self.assertIn("Shop Smart. Feel Good.", html)
        self.assertIn("https://dovishop.com", text)
        self.assertTrue(len(text) > 50)

    def test_order_confirmation_template(self):
        ctx = {
            "customer_name": "Victor",
            "order_reference": "DOV-ORD-9912",
            "total_amount": 35000,
            "subtotal": 33500,
            "delivery_fee": 1500,
            "delivery_method": "Dovi Campus Express",
            "items": [
                {"name": "Dovi Noise-Cancelling Headphones", "quantity": 1, "price": 33500}
            ],
        }
        subject, html, text = EmailTemplateEngine.render(EmailType.ORDER_CONFIRMATION, ctx)
        self.assertIn("DOV-ORD-9912", subject)
        self.assertIn("₦35,000.00", html)
        self.assertIn("Dovi Noise-Cancelling Headphones", html)
        self.assertIn("₦35,000.00", text)

    def test_all_email_types_render_without_exceptions(self):
        for choice_val, _ in EmailType.choices:
            ctx = {
                "customer_name": "Test User",
                "order_reference": "DOV-ORD-TEST",
                "total_amount": 10000,
                "ticket_id": "TKT-TEST",
                "dispute_reference": "DSP-TEST",
                "payout_reference": "PO-TEST",
            }
            subject, html, text = EmailTemplateEngine.render(choice_val, ctx)
            self.assertTrue(len(subject) > 0, f"Subject empty for {choice_val}")
            self.assertTrue(len(html) > 100, f"HTML too short for {choice_val}")
            self.assertTrue(len(text) > 20, f"Plain text too short for {choice_val}")


class EmailServiceLogicTests(TestCase):
    def test_idempotency_prevents_duplicate_logs(self):
        key = "idemp-test-order-999"
        ctx = {"customer_name": "Ada", "order_reference": "DOV-999"}

        # First send (intercept network by testing creation)
        log1 = EmailService.send_transactional_email(
            email_type=EmailType.ORDER_CONFIRMATION,
            recipient="ada@example.com",
            context=ctx,
            recipient_name="Ada",
            idempotency_key=key,
            force_sync=False,
        )
        log1.mark_accepted("re_mock_12345")

        # Second send with same idempotency key
        log2 = EmailService.send_transactional_email(
            email_type=EmailType.ORDER_CONFIRMATION,
            recipient="ada@example.com",
            context=ctx,
            recipient_name="Ada",
            idempotency_key=key,
            force_sync=False,
        )

        self.assertEqual(log1.id, log2.id)
        self.assertEqual(EmailLog.objects.filter(idempotency_key=key).count(), 1)

    def test_webhook_handles_delivery_event(self):
        log = EmailLog.objects.create(
            recipient="student@campus.edu",
            email_type=EmailType.WELCOME,
            category=EmailCategory.ACCOUNT,
            subject="Welcome",
            sender="Dovi <hello@dovishop.com>",
            status=EmailStatus.ACCEPTED,
            resend_message_id="re_live_webhook_msg_88",
        )

        success = EmailService.handle_resend_webhook(
            event_type="email.delivered",
            data={"email_id": "re_live_webhook_msg_88"}
        )
        self.assertTrue(success)

        log.refresh_from_db()
        self.assertEqual(log.status, EmailStatus.DELIVERED)
        self.assertIsNotNone(log.delivered_at)

    def test_webhook_handles_bounce_event(self):
        log = EmailLog.objects.create(
            recipient="invalid-mailbox@campus.edu",
            email_type=EmailType.ORDER_CONFIRMATION,
            category=EmailCategory.BUYER,
            subject="Order",
            sender="Dovi <hello@dovishop.com>",
            status=EmailStatus.ACCEPTED,
            resend_message_id="re_live_bounce_msg_77",
        )

        success = EmailService.handle_resend_webhook(
            event_type="email.bounced",
            data={
                "email_id": "re_live_bounce_msg_77",
                "bounce": {"message": "550 5.1.1 User unknown"}
            }
        )
        self.assertTrue(success)

        log.refresh_from_db()
        self.assertEqual(log.status, EmailStatus.BOUNCED)
        self.assertIn("550 5.1.1", log.last_error)

    def test_semantic_event_triggers(self):
        # 1. Welcome trigger
        welcome_log = EmailService.trigger_welcome("newbuyer@example.com", "Chisom", "https://dovishop.com/login")
        self.assertEqual(welcome_log.recipient, "newbuyer@example.com")
        self.assertEqual(welcome_log.email_type, EmailType.WELCOME)
        self.assertIn("welcome-newbuyer@example.com", welcome_log.idempotency_key)

        # 2. Order confirmation trigger
        items = [{"name": "Calculus Textbook", "quantity": 1, "price": 12000}]
        order_log = EmailService.trigger_order_confirmation(
            buyer_email="newbuyer@example.com",
            buyer_name="Chisom",
            order_reference="DOV-ORD-7711",
            order_items=items,
            total_amount="12000",
        )
        self.assertEqual(order_log.email_type, EmailType.ORDER_CONFIRMATION)
        self.assertEqual(order_log.idempotency_key, "buyer-order-confirm-DOV-ORD-7711")

        # 3. Payment success trigger
        pay_log = EmailService.trigger_payment_successful(
            buyer_email="newbuyer@example.com",
            buyer_name="Chisom",
            order_reference="DOV-ORD-7711",
            transaction_reference="FLW-TX-9901",
            total_amount="12000",
        )
        self.assertEqual(pay_log.email_type, EmailType.PAYMENT_SUCCESSFUL)
        self.assertEqual(pay_log.idempotency_key, "payment-success-FLW-TX-9901")

        # 4. Status update trigger
        status_log = EmailService.trigger_order_status_update(
            buyer_email="newbuyer@example.com",
            buyer_name="Chisom",
            order_reference="DOV-ORD-7711",
            new_status="SHIPPED",
            tracking_info="TRACK-8899",
            courier_name="GIG Logistics",
        )
        self.assertIsNotNone(status_log)
        self.assertEqual(status_log.email_type, EmailType.ORDER_DISPATCHED)
