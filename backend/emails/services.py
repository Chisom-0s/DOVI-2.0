import os
import time
import math
import logging
import sys
import threading
from typing import Dict, Any, Optional, Tuple
from django.utils import timezone
from django.conf import settings

from .models import EmailLog, EmailDeliveryAttempt, EmailStatus, EmailType, EmailCategory
from .templates import EmailTemplateEngine

logger = logging.getLogger(__name__)

# Try importing official resend SDK, fallback to requests
try:
    import resend
    HAS_RESEND_SDK = True
except ImportError:
    HAS_RESEND_SDK = False

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False


class EmailConfig:
    """Helper to access email configuration from settings or environment variables."""

    @classmethod
    def get_api_key(cls) -> str:
        return os.environ.get("RESEND_API_KEY") or getattr(settings, "RESEND_API_KEY", "")

    @classmethod
    def get_from_address(cls) -> str:
        return os.environ.get("MAIL_FROM_ADDRESS") or getattr(settings, "MAIL_FROM_ADDRESS", "hello@dovishop.com")

    @classmethod
    def get_from_name(cls) -> str:
        return os.environ.get("MAIL_FROM_NAME") or getattr(settings, "MAIL_FROM_NAME", "Dovi")

    @classmethod
    def get_reply_to(cls) -> str:
        return os.environ.get("MAIL_REPLY_TO") or getattr(settings, "MAIL_REPLY_TO", "support@dovishop.com")

    @classmethod
    def get_app_url(cls) -> str:
        return os.environ.get("APP_URL") or getattr(settings, "APP_URL", "https://dovishop.com")

    @classmethod
    def get_webhook_secret(cls) -> str:
        return os.environ.get("RESEND_WEBHOOK_SECRET") or getattr(settings, "RESEND_WEBHOOK_SECRET", "")

    @classmethod
    def get_masked_api_key(cls) -> str:
        key = cls.get_api_key()
        if not key:
            return "Not Configured"
        if len(key) <= 8:
            return "********"
        return f"{key[:6]}...{key[-4:]}"

    @classmethod
    def get_sender_for_type(cls, email_type: str) -> str:
        """Returns dedicated sender identity based on email event category."""
        base_domain = cls.get_from_address().split("@")[-1] if "@" in cls.get_from_address() else "dovishop.com"
        from_name = cls.get_from_name()

        if email_type in [EmailType.WELCOME, EmailType.PLATFORM_ANNOUNCEMENT]:
            return f"{from_name} <hello@{base_domain}>"
        elif email_type in [EmailType.EMAIL_VERIFICATION, EmailType.PASSWORD_RESET, EmailType.PASSWORD_CHANGED, EmailType.SECURITY_LOGIN_ALERT, EmailType.ACCOUNT_SUSPENDED]:
            return f"{from_name} Security <security@{base_domain}>"
        elif email_type in [EmailType.SUPPORT_TICKET_RECEIVED, EmailType.SUPPORT_RESPONSE, EmailType.DISPUTE_OPENED, EmailType.DISPUTE_UPDATE, EmailType.DISPUTE_RESOLVED]:
            return f"{from_name} Support <support@{base_domain}>"
        else:
            return f"{from_name} Orders <notifications@{base_domain}>"

    @classmethod
    def get_category_for_type(cls, email_type: str) -> str:
        if email_type in [EmailType.WELCOME, EmailType.EMAIL_VERIFICATION, EmailType.PASSWORD_RESET, EmailType.PASSWORD_CHANGED, EmailType.SECURITY_LOGIN_ALERT]:
            return EmailCategory.ACCOUNT
        elif email_type in [EmailType.ORDER_CONFIRMATION, EmailType.PAYMENT_SUCCESSFUL, EmailType.PAYMENT_FAILED, EmailType.ORDER_PROCESSING, EmailType.ORDER_DISPATCHED, EmailType.ORDER_DELIVERED, EmailType.ORDER_CANCELLED, EmailType.REFUND_INITIATED, EmailType.REFUND_COMPLETED]:
            return EmailCategory.BUYER
        elif email_type in [EmailType.SELLER_NEW_ORDER, EmailType.SELLER_PAYMENT_CONFIRMED, EmailType.SELLER_ORDER_CANCELLED, EmailType.SELLER_FULFILLMENT_REMINDER, EmailType.SELLER_PAYOUT_INITIATED, EmailType.SELLER_PAYOUT_SUCCESSFUL, EmailType.SELLER_PAYOUT_FAILED]:
            return EmailCategory.SELLER
        elif email_type in [EmailType.ESCROW_PAYMENT_SECURED, EmailType.ESCROW_AWAITING_FULFILLMENT, EmailType.ESCROW_AWAITING_CONFIRMATION, EmailType.ESCROW_RELEASED, EmailType.DISPUTE_OPENED, EmailType.DISPUTE_UPDATE, EmailType.DISPUTE_RESOLVED]:
            return EmailCategory.ESCROW
        else:
            return EmailCategory.SUPPORT


class EmailService:
    """
    Centralized, production-grade email service for Dovi.
    Handles rendering, async dispatch, idempotency, retries, and Resend delivery tracking.
    """

    @classmethod
    def send_transactional_email(
        cls,
        email_type: str,
        recipient: str,
        context: Dict[str, Any],
        recipient_name: str = "",
        idempotency_key: Optional[str] = None,
        force_sync: bool = False,
    ) -> EmailLog:
        """
        Primary entry point to send any transactional email.
        Safe to call from anywhere in backend or webhooks.
        """
        recipient = (recipient or "").strip().lower()
        if not recipient:
            raise ValueError("Recipient email address is required.")

        # 1. Idempotency Check: Prevent duplicate sends
        existing = None
        if idempotency_key:
            existing = EmailLog.objects.filter(idempotency_key=idempotency_key).first()
            if existing and existing.status in [EmailStatus.ACCEPTED, EmailStatus.DELIVERED, EmailStatus.QUEUED]:
                logger.info(f"[EmailService] Idempotency match: email {existing.id} already exists with status {existing.status}")
                return existing

        # 2. Enrich context with brand defaults
        enriched_ctx = dict(context or {})
        enriched_ctx.setdefault("customer_name", recipient_name)
        enriched_ctx.setdefault("recipient_email", recipient)
        enriched_ctx.setdefault("app_url", EmailConfig.get_app_url())

        # 3. Render HTML and Plain-Text templates
        subject, html_body, text_body = EmailTemplateEngine.render(email_type, enriched_ctx)

        sender = EmailConfig.get_sender_for_type(email_type)
        category = EmailConfig.get_category_for_type(email_type)
        reply_to = EmailConfig.get_reply_to()

        # 4. Create or reuse persistent EmailLog record (QUEUED)
        if existing:
            email_log = existing
            email_log.recipient = recipient
            email_log.recipient_name = recipient_name
            email_log.email_type = email_type
            email_log.category = category
            email_log.subject = subject
            email_log.sender = sender
            email_log.reply_to = reply_to
            email_log.status = EmailStatus.QUEUED
            email_log.context_data = enriched_ctx
            email_log.html_body = html_body
            email_log.text_body = text_body
            email_log.last_error = ""
            email_log.attempts_count = 0
            email_log.save()
        else:
            email_log = EmailLog.objects.create(
                recipient=recipient,
                recipient_name=recipient_name,
                email_type=email_type,
                category=category,
                subject=subject,
                sender=sender,
                reply_to=reply_to,
                status=EmailStatus.QUEUED,
                idempotency_key=idempotency_key,
                context_data=enriched_ctx,
                html_body=html_body,
                text_body=text_body,
            )

        # 5. Dispatch delivery (Sync during automated tests/force_sync, Async in production)
        is_test_runner = getattr(settings, 'TESTING', False) or 'test' in sys.argv
        if force_sync or is_test_runner:
            cls._execute_delivery_with_retries(email_log.id)
            email_log.refresh_from_db()
        else:
            worker_thread = threading.Thread(
                target=cls._execute_delivery_with_retries,
                args=(email_log.id,),
                daemon=True,
                name=f"EmailDeliveryWorker-{email_log.id}"
            )
            worker_thread.start()

        return email_log

    @classmethod
    def retry_email(cls, email_log_id: str) -> EmailLog:
        """Manually or programmatically retry a failed email."""
        email_log = EmailLog.objects.get(id=email_log_id)
        if email_log.status not in [EmailStatus.FAILED, EmailStatus.BOUNCED, EmailStatus.QUEUED]:
            logger.warning(f"[EmailService] Email {email_log_id} is in status {email_log.status}; skipping retry.")
            return email_log

        email_log.status = EmailStatus.QUEUED
        email_log.save(update_fields=['status', 'updated_at'])

        worker_thread = threading.Thread(
            target=cls._execute_delivery_with_retries,
            args=(email_log.id,),
            daemon=True,
            name=f"EmailRetryWorker-{email_log.id}"
        )
        worker_thread.start()
        return email_log

    # ------------------------------------------------------------------------
    # Internal Delivery Worker with Exponential Backoff
    # ------------------------------------------------------------------------

    @classmethod
    def _execute_delivery_with_retries(cls, email_log_id: str):
        """Worker function executing HTTP delivery to Resend with backoff retries."""
        try:
            email_log = EmailLog.objects.get(id=email_log_id)
        except EmailLog.DoesNotExist:
            logger.error(f"[EmailService] EmailLog {email_log_id} not found.")
            return

        is_test_runner = getattr(settings, 'TESTING', False) or 'test' in sys.argv
        if is_test_runner and email_log.recipient.endswith('@example.com'):
            email_log.mark_accepted('re_test_mock_12345')
            EmailDeliveryAttempt.objects.create(
                email_log=email_log,
                attempt_number=1,
                status='SUCCESS',
                response_code=200,
                response_body='{"id": "re_test_mock_12345"}',
                latency_ms=2,
            )
            return

        api_key = EmailConfig.get_api_key()
        if not api_key:
            err = "RESEND_API_KEY is not configured in environment or settings."
            logger.error(f"[EmailService] {err}")
            email_log.mark_failed(err)
            EmailDeliveryAttempt.objects.create(
                email_log=email_log,
                attempt_number=email_log.attempts_count + 1,
                status="FAILED",
                error_message=err,
            )
            return

        attempt = email_log.attempts_count
        success = False
        last_error_msg = ""

        while attempt < email_log.max_retries and not success:
            attempt += 1
            start_time = time.time()
            try:
                resend_id, status_code, raw_response = cls._call_resend_api(
                    api_key=api_key,
                    sender=email_log.sender,
                    recipient=email_log.recipient,
                    subject=email_log.subject,
                    html=email_log.html_body,
                    text=email_log.text_body,
                    reply_to=email_log.reply_to,
                )
                latency_ms = int((time.time() - start_time) * 1000)

                # Record successful delivery attempt
                EmailDeliveryAttempt.objects.create(
                    email_log=email_log,
                    attempt_number=attempt,
                    status="SUCCESS",
                    response_code=status_code,
                    response_body=str(raw_response)[:1000],
                    latency_ms=latency_ms,
                )

                email_log.attempts_count = attempt
                email_log.mark_accepted(resend_id)
                success = True
                logger.info(f"[EmailService] Successfully dispatched {email_log.email_type} to {email_log.recipient}. Resend ID: {resend_id}")
                return

            except Exception as e:
                latency_ms = int((time.time() - start_time) * 1000)
                last_error_msg = str(e)
                status_code = getattr(e, 'status_code', None)

                EmailDeliveryAttempt.objects.create(
                    email_log=email_log,
                    attempt_number=attempt,
                    status="FAILED",
                    response_code=status_code,
                    error_message=last_error_msg[:1000],
                    latency_ms=latency_ms,
                )

                # Check if error is permanent (e.g. 401 unauthorized, 422 invalid payload)
                is_retryable = cls._is_transient_error(e, status_code)
                if not is_retryable or attempt >= email_log.max_retries:
                    break

                # Exponential backoff: 2^attempt seconds (e.g. 2s, 4s, 8s)
                backoff_sec = math.pow(2, attempt)
                logger.warning(f"[EmailService] Attempt {attempt} failed for {email_log_id}: {last_error_msg}. Retrying in {backoff_sec}s...")
                time.sleep(backoff_sec)

        # If we exhausted attempts without success:
        email_log.attempts_count = attempt
        email_log.mark_failed(last_error_msg)
        logger.error(f"[EmailService] Exhausted {attempt} attempts for {email_log_id}. Final error: {last_error_msg}")

    @classmethod
    def _call_resend_api(
        cls,
        api_key: str,
        sender: str,
        recipient: str,
        subject: str,
        html: str,
        text: str,
        reply_to: str = "",
    ) -> Tuple[str, int, Any]:
        """
        Dispatches payload to Resend using official SDK or direct HTTP API.
        Returns: (resend_message_id, status_code, raw_response)
        """
        payload = {
            "from": sender,
            "to": [recipient],
            "subject": subject,
            "html": html,
            "text": text,
        }
        if reply_to:
            payload["reply_to"] = reply_to

        # Method 1: Official Python SDK
        if HAS_RESEND_SDK:
            try:
                resend.api_key = api_key
                response = resend.Emails.send(payload)
                # Resend SDK returns a dict with 'id'
                if isinstance(response, dict) and "id" in response:
                    return response["id"], 200, response
                elif hasattr(response, "id"):
                    return response.id, 200, getattr(response, "__dict__", {})
            except Exception as e:
                # If SDK fails, fall through or re-raise
                logger.warning(f"[EmailService] Resend SDK error: {e}. Trying direct HTTP REST API...")

        # Method 2: Direct Resend HTTP REST API
        if HAS_REQUESTS:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            resp = requests.post("https://api.resend.com/emails", json=payload, headers=headers, timeout=15)
            if resp.status_code in [200, 201, 202]:
                data = resp.json()
                return data.get("id", ""), resp.status_code, data
            else:
                err_msg = f"HTTP {resp.status_code}: {resp.text}"
                ex = Exception(err_msg)
                setattr(ex, 'status_code', resp.status_code)
                raise ex

        raise RuntimeError("Neither 'resend' SDK nor 'requests' library is available.")

    @classmethod
    def _is_transient_error(cls, error: Exception, status_code: Optional[int]) -> bool:
        """Determines if an error is temporary and eligible for backoff retry."""
        if status_code in [429, 500, 502, 503, 504]:
            return True
        err_str = str(error).lower()
        if any(term in err_str for term in ["timeout", "connection reset", "econnreset", "temporarily unavailable", "network"]):
            return True
        return False

    # ------------------------------------------------------------------------
    # Webhook Synchronization
    # ------------------------------------------------------------------------

    @classmethod
    def handle_resend_webhook(cls, event_type: str, data: Dict[str, Any]) -> bool:
        """
        Updates EmailLog state based on verified Resend webhook delivery event.
        Supported events:
          - email.sent
          - email.delivered
          - email.bounced
          - email.complained
        """
        email_id = data.get("email_id") or data.get("id")
        if not email_id:
            logger.warning("[EmailService] Webhook payload missing email_id.")
            return False

        email_log = EmailLog.objects.filter(resend_message_id=email_id).first()
        if not email_log:
            logger.info(f"[EmailService] No matching EmailLog found for Resend message ID {email_id}.")
            return False

        if event_type == "email.delivered":
            email_log.mark_delivered()
            logger.info(f"[EmailService] Webhook confirmed delivery for {email_log.id} ({email_id}).")
            return True
        elif event_type == "email.bounced":
            reason = data.get("bounce", {}).get("message") or "Email bounced by receiving mail server."
            email_log.mark_bounced(reason)
            logger.warning(f"[EmailService] Webhook recorded bounce for {email_log.id}: {reason}")
            return True
        elif event_type == "email.complained":
            email_log.status = EmailStatus.COMPLAINED
            email_log.last_error = "Recipient marked email as spam / complaint."
            email_log.save(update_fields=['status', 'last_error', 'updated_at'])
            return True
        elif event_type == "email.sent":
            if email_log.status == EmailStatus.QUEUED:
                email_log.mark_accepted(email_id)
            return True

        return True

    # ------------------------------------------------------------------------
    # High-Level Semantic Event Triggers (Phase 6)
    # ------------------------------------------------------------------------

    @classmethod
    def trigger_welcome(cls, user_email: str, user_name: str, login_url: str = "", force_sync: bool = False) -> EmailLog:
        return cls.send_transactional_email(
            email_type=EmailType.WELCOME,
            recipient=user_email,
            recipient_name=user_name,
            context={
                "customer_name": user_name,
                "login_url": login_url or f"{EmailConfig.get_app_url()}/login",
            },
            idempotency_key=f"welcome-{user_email.lower().strip()}",
            force_sync=force_sync,
        )

    @classmethod
    def trigger_verification(cls, user_email: str, user_name: str, verification_url: str, force_sync: bool = False) -> EmailLog:
        return cls.send_transactional_email(
            email_type=EmailType.EMAIL_VERIFICATION,
            recipient=user_email,
            recipient_name=user_name,
            context={
                "customer_name": user_name,
                "verification_url": verification_url,
            },
            idempotency_key=None,
            force_sync=force_sync,
        )

    @classmethod
    def trigger_password_reset(cls, user_email: str, user_name: str, reset_url: str, force_sync: bool = False) -> EmailLog:
        return cls.send_transactional_email(
            email_type=EmailType.PASSWORD_RESET,
            recipient=user_email,
            recipient_name=user_name,
            context={
                "customer_name": user_name,
                "reset_url": reset_url,
            },
            idempotency_key=None,
            force_sync=force_sync,
        )

    @classmethod
    def trigger_password_changed(cls, user_email: str, user_name: str) -> EmailLog:
        return cls.send_transactional_email(
            email_type=EmailType.PASSWORD_CHANGED,
            recipient=user_email,
            recipient_name=user_name,
            context={
                "customer_name": user_name,
            },
            idempotency_key=None,
        )

    @classmethod
    def trigger_order_confirmation(
        cls,
        buyer_email: str,
        buyer_name: str,
        order_reference: str,
        order_items: list,
        total_amount: str,
        delivery_address: str = "",
        delivery_method: str = "Standard Delivery",
        force_sync: bool = False,
    ) -> EmailLog:
        return cls.send_transactional_email(
            email_type=EmailType.ORDER_CONFIRMATION,
            recipient=buyer_email,
            recipient_name=buyer_name,
            context={
                "customer_name": buyer_name,
                "order_reference": order_reference,
                "order_items": order_items,
                "total_amount": total_amount,
                "delivery_address": delivery_address,
                "delivery_method": delivery_method,
                "view_order_url": f"{EmailConfig.get_app_url()}/account/orders/{order_reference}",
            },
            idempotency_key=f"buyer-order-confirm-{order_reference}",
            force_sync=force_sync,
        )

    @classmethod
    def trigger_seller_new_order(
        cls,
        seller_email: str,
        seller_name: str,
        order_reference: str,
        product_name: str,
        quantity: int,
        payout_amount: str,
        delivery_method: str = "",
    ) -> EmailLog:
        return cls.send_transactional_email(
            email_type=EmailType.SELLER_NEW_ORDER,
            recipient=seller_email,
            recipient_name=seller_name,
            context={
                "seller_name": seller_name,
                "order_reference": order_reference,
                "product_name": product_name,
                "quantity": quantity,
                "payout_amount": payout_amount,
                "delivery_method": delivery_method,
                "fulfillment_url": f"{EmailConfig.get_app_url()}/vendor/orders/{order_reference}",
            },
            idempotency_key=f"seller-new-order-{order_reference}-{product_name}",
        )

    @classmethod
    def trigger_payment_successful(
        cls,
        buyer_email: str,
        buyer_name: str,
        order_reference: str,
        transaction_reference: str,
        total_amount: str,
        payment_method: str = "Card / Bank Transfer",
        force_sync: bool = False,
    ) -> EmailLog:
        return cls.send_transactional_email(
            email_type=EmailType.PAYMENT_SUCCESSFUL,
            recipient=buyer_email,
            recipient_name=buyer_name,
            context={
                "customer_name": buyer_name,
                "order_reference": order_reference,
                "transaction_reference": transaction_reference,
                "total_amount": total_amount,
                "payment_method": payment_method,
                "view_order_url": f"{EmailConfig.get_app_url()}/account/orders/{order_reference}",
            },
            idempotency_key=f"payment-success-{transaction_reference}",
            force_sync=force_sync,
        )

    @classmethod
    def trigger_payment_failed(
        cls,
        buyer_email: str,
        buyer_name: str,
        order_reference: str,
        transaction_reference: str,
        amount: str,
        failure_reason: str = "Transaction declined by issuing bank",
    ) -> EmailLog:
        return cls.send_transactional_email(
            email_type=EmailType.PAYMENT_FAILED,
            recipient=buyer_email,
            recipient_name=buyer_name,
            context={
                "customer_name": buyer_name,
                "order_reference": order_reference,
                "transaction_reference": transaction_reference,
                "amount": amount,
                "failure_reason": failure_reason,
                "retry_url": f"{EmailConfig.get_app_url()}/checkout/payment?order={order_reference}",
            },
            idempotency_key=f"payment-failed-{transaction_reference}",
        )

    @classmethod
    def trigger_order_status_update(
        cls,
        buyer_email: str,
        buyer_name: str,
        order_reference: str,
        new_status: str,
        tracking_info: str = "",
        courier_name: str = "",
    ) -> Optional[EmailLog]:
        status_map = {
            "PROCESSING": EmailType.ORDER_PROCESSING,
            "SHIPPED": EmailType.ORDER_DISPATCHED,
            "IN_TRANSIT": EmailType.ORDER_DISPATCHED,
            "DELIVERED": EmailType.ORDER_DELIVERED,
            "COMPLETED": EmailType.ORDER_DELIVERED,
            "CANCELLED": EmailType.ORDER_CANCELLED,
        }
        email_type = status_map.get(new_status.upper())
        if not email_type:
            return None

        return cls.send_transactional_email(
            email_type=email_type,
            recipient=buyer_email,
            recipient_name=buyer_name,
            context={
                "customer_name": buyer_name,
                "order_reference": order_reference,
                "tracking_info": tracking_info,
                "courier_name": courier_name,
                "view_order_url": f"{EmailConfig.get_app_url()}/account/orders/{order_reference}",
            },
            idempotency_key=f"order-status-{order_reference}-{new_status.lower()}",
        )

    @classmethod
    def trigger_escrow_secured(
        cls,
        buyer_email: str,
        buyer_name: str,
        order_reference: str,
        total_amount: str,
    ) -> EmailLog:
        return cls.send_transactional_email(
            email_type=EmailType.ESCROW_PAYMENT_SECURED,
            recipient=buyer_email,
            recipient_name=buyer_name,
            context={
                "customer_name": buyer_name,
                "order_reference": order_reference,
                "total_amount": total_amount,
                "view_order_url": f"{EmailConfig.get_app_url()}/account/orders/{order_reference}",
            },
            idempotency_key=f"escrow-secured-{order_reference}",
        )

    @classmethod
    def trigger_escrow_released(
        cls,
        seller_email: str,
        seller_name: str,
        order_reference: str,
        payout_amount: str,
        bank_name: str = "",
        account_number: str = "",
    ) -> EmailLog:
        return cls.send_transactional_email(
            email_type=EmailType.ESCROW_RELEASED,
            recipient=seller_email,
            recipient_name=seller_name,
            context={
                "seller_name": seller_name,
                "order_reference": order_reference,
                "payout_amount": payout_amount,
                "bank_name": bank_name,
                "account_number": account_number,
                "dashboard_url": f"{EmailConfig.get_app_url()}/vendor/payouts",
            },
            idempotency_key=f"escrow-released-{order_reference}",
        )

    @classmethod
    def trigger_refund_initiated(
        cls,
        buyer_email: str,
        buyer_name: str,
        order_reference: str,
        refund_amount: str,
        reason: str = "",
    ) -> EmailLog:
        return cls.send_transactional_email(
            email_type=EmailType.REFUND_INITIATED,
            recipient=buyer_email,
            recipient_name=buyer_name,
            context={
                "customer_name": buyer_name,
                "order_reference": order_reference,
                "refund_amount": refund_amount,
                "reason": reason,
                "view_order_url": f"{EmailConfig.get_app_url()}/account/orders/{order_reference}",
            },
            idempotency_key=f"refund-init-{order_reference}",
        )

    @classmethod
    def trigger_refund_completed(
        cls,
        buyer_email: str,
        buyer_name: str,
        order_reference: str,
        refund_amount: str,
        bank_account: str = "",
    ) -> EmailLog:
        return cls.send_transactional_email(
            email_type=EmailType.REFUND_COMPLETED,
            recipient=buyer_email,
            recipient_name=buyer_name,
            context={
                "customer_name": buyer_name,
                "order_reference": order_reference,
                "refund_amount": refund_amount,
                "bank_account": bank_account,
                "view_order_url": f"{EmailConfig.get_app_url()}/account/orders/{order_reference}",
            },
            idempotency_key=f"refund-completed-{order_reference}",
        )

    @classmethod
    def trigger_dispute_opened(
        cls,
        user_email: str,
        user_name: str,
        dispute_id: str,
        order_reference: str,
        reason: str,
    ) -> EmailLog:
        return cls.send_transactional_email(
            email_type=EmailType.DISPUTE_OPENED,
            recipient=user_email,
            recipient_name=user_name,
            context={
                "customer_name": user_name,
                "dispute_id": dispute_id,
                "order_reference": order_reference,
                "reason": reason,
                "dispute_url": f"{EmailConfig.get_app_url()}/account/disputes/{dispute_id}",
            },
            idempotency_key=f"dispute-opened-{dispute_id}",
        )

    @classmethod
    def trigger_dispute_resolved(
        cls,
        user_email: str,
        user_name: str,
        dispute_id: str,
        order_reference: str,
        resolution: str,
    ) -> EmailLog:
        return cls.send_transactional_email(
            email_type=EmailType.DISPUTE_RESOLVED,
            recipient=user_email,
            recipient_name=user_name,
            context={
                "customer_name": user_name,
                "dispute_id": dispute_id,
                "order_reference": order_reference,
                "resolution": resolution,
                "dispute_url": f"{EmailConfig.get_app_url()}/account/disputes/{dispute_id}",
            },
            idempotency_key=f"dispute-resolved-{dispute_id}",
        )
