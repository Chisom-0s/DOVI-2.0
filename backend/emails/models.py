import uuid
from django.db import models
from django.utils import timezone


class EmailStatus(models.TextChoices):
    QUEUED = 'QUEUED', 'Queued'
    ACCEPTED = 'ACCEPTED', 'Accepted by Provider'
    DELIVERED = 'DELIVERED', 'Delivered'
    BOUNCED = 'BOUNCED', 'Bounced'
    COMPLAINED = 'COMPLAINED', 'Complained / Spam'
    FAILED = 'FAILED', 'Failed'
    CANCELLED = 'CANCELLED', 'Cancelled'


class EmailPriority(models.TextChoices):
    INFORMATIONAL = 'INFORMATIONAL', 'Informational'
    ATTENTION_REQUIRED = 'ATTENTION_REQUIRED', 'Attention Required'
    HIGH = 'HIGH', 'High Priority'
    URGENT = 'URGENT', 'Urgent'
    CRITICAL = 'CRITICAL', 'Critical'


class EmailCategory(models.TextChoices):
    ACCOUNT = 'ACCOUNT', 'Account & Security'
    BUYER = 'BUYER', 'Buyer & Orders'
    SELLER = 'SELLER', 'Seller & Payouts'
    ESCROW = 'ESCROW', 'Escrow & Disputes'
    SUPPORT = 'SUPPORT', 'Platform & Support'
    # Centralized Administrative Categories
    ADMIN_ORDERS = 'ADMIN_ORDERS', 'Admin: Orders & Fulfillment'
    ADMIN_PAYMENTS = 'ADMIN_PAYMENTS', 'Admin: Payments & Refunds'
    ADMIN_APPROVALS = 'ADMIN_APPROVALS', 'Admin: Approvals & Reviews'
    ADMIN_SUPPORT = 'ADMIN_SUPPORT', 'Admin: Support & Disputes'
    ADMIN_INVENTORY = 'ADMIN_INVENTORY', 'Admin: Inventory & Products'
    ADMIN_SECURITY = 'ADMIN_SECURITY', 'Admin: Security & Platform'


class EmailType(models.TextChoices):
    # A. Account emails
    WELCOME = 'WELCOME', 'Welcome Email'
    EMAIL_VERIFICATION = 'EMAIL_VERIFICATION', 'Email Verification'
    PASSWORD_RESET = 'PASSWORD_RESET', 'Password Reset'
    PASSWORD_CHANGED = 'PASSWORD_CHANGED', 'Password Changed'
    SECURITY_LOGIN_ALERT = 'SECURITY_LOGIN_ALERT', 'Security Login Alert'

    # B. Buyer emails
    ORDER_CONFIRMATION = 'ORDER_CONFIRMATION', 'Order Confirmation'
    PAYMENT_SUCCESSFUL = 'PAYMENT_SUCCESSFUL', 'Payment Successful'
    PAYMENT_FAILED = 'PAYMENT_FAILED', 'Payment Failed'
    ORDER_PROCESSING = 'ORDER_PROCESSING', 'Order Processing'
    ORDER_DISPATCHED = 'ORDER_DISPATCHED', 'Order Dispatched'
    ORDER_DELIVERED = 'ORDER_DELIVERED', 'Order Delivered'
    ORDER_CANCELLED = 'ORDER_CANCELLED', 'Order Cancelled'
    REFUND_INITIATED = 'REFUND_INITIATED', 'Refund Initiated'
    REFUND_COMPLETED = 'REFUND_COMPLETED', 'Refund Completed'

    # C. Legacy seller types (retained for backward DB compatibility)
    SELLER_NEW_ORDER = 'SELLER_NEW_ORDER', 'Seller New Order'
    SELLER_PAYMENT_CONFIRMED = 'SELLER_PAYMENT_CONFIRMED', 'Seller Payment Confirmed'
    SELLER_ORDER_CANCELLED = 'SELLER_ORDER_CANCELLED', 'Seller Order Cancelled'
    SELLER_FULFILLMENT_REMINDER = 'SELLER_FULFILLMENT_REMINDER', 'Seller Fulfillment Reminder'
    SELLER_PAYOUT_INITIATED = 'SELLER_PAYOUT_INITIATED', 'Seller Payout Initiated'
    SELLER_PAYOUT_SUCCESSFUL = 'SELLER_PAYOUT_SUCCESSFUL', 'Seller Payout Successful'
    SELLER_PAYOUT_FAILED = 'SELLER_PAYOUT_FAILED', 'Seller Payout Failed'

    # D. Escrow and dispute emails
    ESCROW_PAYMENT_SECURED = 'ESCROW_PAYMENT_SECURED', 'Escrow Payment Secured'
    ESCROW_AWAITING_FULFILLMENT = 'ESCROW_AWAITING_FULFILLMENT', 'Escrow Awaiting Fulfillment'
    ESCROW_AWAITING_CONFIRMATION = 'ESCROW_AWAITING_CONFIRMATION', 'Escrow Awaiting Confirmation'
    ESCROW_RELEASED = 'ESCROW_RELEASED', 'Escrow Released'
    DISPUTE_OPENED = 'DISPUTE_OPENED', 'Dispute Opened'
    DISPUTE_UPDATE = 'DISPUTE_UPDATE', 'Dispute Update'
    DISPUTE_RESOLVED = 'DISPUTE_RESOLVED', 'Dispute Resolved'

    # E. Platform and customer support emails
    PLATFORM_ANNOUNCEMENT = 'PLATFORM_ANNOUNCEMENT', 'Platform Announcement'
    SUPPORT_TICKET_RECEIVED = 'SUPPORT_TICKET_RECEIVED', 'Support Ticket Received'
    SUPPORT_RESPONSE = 'SUPPORT_RESPONSE', 'Support Response'
    ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED', 'Account Suspended'
    POLICY_UPDATE = 'POLICY_UPDATE', 'Policy Update'

    # F. Centralized Admin: Order Notifications
    ADMIN_NEW_ORDER = 'ADMIN_NEW_ORDER', 'Admin: New Order Received'
    ADMIN_ORDER_CANCELLED = 'ADMIN_ORDER_CANCELLED', 'Admin: Order Cancelled'
    ADMIN_ORDER_CANCELLATION_REQUEST = 'ADMIN_ORDER_CANCELLATION_REQUEST', 'Admin: Order Cancellation Approval'
    ADMIN_ORDER_INTERVENTION = 'ADMIN_ORDER_INTERVENTION', 'Admin: Order Intervention Required'
    ADMIN_ORDER_FULFILLED = 'ADMIN_ORDER_FULFILLED', 'Admin: Order Fulfilled'
    ADMIN_DELIVERY_EXCEPTION = 'ADMIN_DELIVERY_EXCEPTION', 'Admin: Delivery Exception'

    # G. Centralized Admin: Payment & Refund Notifications
    ADMIN_PAYMENT_CONFIRMED = 'ADMIN_PAYMENT_CONFIRMED', 'Admin: Payment Confirmed'
    ADMIN_PAYMENT_FAILED = 'ADMIN_PAYMENT_FAILED', 'Admin: Payment Failed'
    ADMIN_PAYMENT_DISCREPANCY = 'ADMIN_PAYMENT_DISCREPANCY', 'Admin: Payment Discrepancy'
    ADMIN_DUPLICATE_PAYMENT = 'ADMIN_DUPLICATE_PAYMENT', 'Admin: Duplicate Payment'
    ADMIN_PAYMENT_PENDING_OVERDUE = 'ADMIN_PAYMENT_PENDING_OVERDUE', 'Admin: Payment Pending Overdue'
    ADMIN_REFUND_REQUESTED = 'ADMIN_REFUND_REQUESTED', 'Admin: Refund Request Submitted'
    ADMIN_REFUND_APPROVAL_REQUIRED = 'ADMIN_REFUND_APPROVAL_REQUIRED', 'Admin: Refund Approval Required'
    ADMIN_REFUND_PROCESSED = 'ADMIN_REFUND_PROCESSED', 'Admin: Refund Processed'

    # H. Centralized Admin: Approvals & Reviews
    ADMIN_APPROVAL_REQUIRED = 'ADMIN_APPROVAL_REQUIRED', 'Admin: Action Required / Approval'
    ADMIN_DISPUTE_ESCALATION = 'ADMIN_DISPUTE_ESCALATION', 'Admin: Dispute Resolution Required'

    # I. Centralized Admin: Customer Support & Fraud
    ADMIN_SUPPORT_TICKET_NEW = 'ADMIN_SUPPORT_TICKET_NEW', 'Admin: New Support Request'
    ADMIN_PAYMENT_ISSUE_REPORTED = 'ADMIN_PAYMENT_ISSUE_REPORTED', 'Admin: Fraud / Payment Issue Reported'
    ADMIN_SUPPORT_TICKET_ESCALATED = 'ADMIN_SUPPORT_TICKET_ESCALATED', 'Admin: Support Ticket Escalated'

    # J. Centralized Admin: Inventory & Products
    ADMIN_LOW_STOCK_ALERT = 'ADMIN_LOW_STOCK_ALERT', 'Admin: Low Stock Alert'
    ADMIN_OUT_OF_STOCK_ALERT = 'ADMIN_OUT_OF_STOCK_ALERT', 'Admin: Out of Stock Alert'
    ADMIN_PRICE_DISCREPANCY_ALERT = 'ADMIN_PRICE_DISCREPANCY_ALERT', 'Admin: Price Discrepancy Alert'

    # K. Centralized Admin: Security & Platform Reliability
    ADMIN_SECURITY_LOGIN_FAILED_REPEATED = 'ADMIN_SECURITY_LOGIN_FAILED_REPEATED', 'Admin: Repeated Failed Logins'
    ADMIN_UNAUTHORIZED_ACCESS_ATTEMPT = 'ADMIN_UNAUTHORIZED_ACCESS_ATTEMPT', 'Admin: Unauthorized Access Attempt'
    ADMIN_INTEGRATION_FAILURE = 'ADMIN_INTEGRATION_FAILURE', 'Admin: Integration Failure'
    ADMIN_RESEND_DELIVERY_FAILURE = 'ADMIN_RESEND_DELIVERY_FAILURE', 'Admin: Resend Delivery Failures'
    ADMIN_CRITICAL_APP_ERROR = 'ADMIN_CRITICAL_APP_ERROR', 'Admin: Critical Application Error'


class EmailLog(models.Model):
    """
    Authoritative record of every transactional email dispatched by Dovi.
    Tracks provider IDs, delivery status, retries, errors, priority, and audience.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.EmailField(db_index=True)
    recipient_name = models.CharField(max_length=255, blank=True, default="")
    email_type = models.CharField(max_length=64, choices=EmailType.choices, db_index=True)
    category = models.CharField(max_length=32, choices=EmailCategory.choices, db_index=True)
    priority = models.CharField(
        max_length=32,
        choices=EmailPriority.choices,
        default=EmailPriority.INFORMATIONAL,
        db_index=True,
    )
    is_admin = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Designates whether this is an internal administrative notification."
    )
    subject = models.CharField(max_length=500)
    sender = models.CharField(max_length=255, help_text="e.g. Dovi <hello@dovishop.com>")
    reply_to = models.CharField(max_length=255, blank=True, default="")

    status = models.CharField(
        max_length=32,
        choices=EmailStatus.choices,
        default=EmailStatus.QUEUED,
        db_index=True
    )
    resend_message_id = models.CharField(max_length=255, blank=True, default="", db_index=True)
    idempotency_key = models.CharField(max_length=255, blank=True, null=True, unique=True, db_index=True)

    attempts_count = models.PositiveIntegerField(default=0)
    max_retries = models.PositiveIntegerField(default=3)
    last_error = models.TextField(blank=True, default="")

    context_data = models.JSONField(default=dict, blank=True)
    html_body = models.TextField(blank=True, default="")
    text_body = models.TextField(blank=True, default="")

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Email Log'
        verbose_name_plural = 'Email Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'status']),
            models.Index(fields=['email_type', 'status']),
            models.Index(fields=['category', 'status']),
            models.Index(fields=['is_admin', 'priority']),
            models.Index(fields=['is_admin', 'status']),
            models.Index(fields=['resend_message_id']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        prefix = "[ADMIN]" if self.is_admin else "[USER]"
        return f"{prefix} [{self.status}] {self.email_type} ({self.priority}) to {self.recipient}"

    def mark_accepted(self, resend_id: str):
        self.status = EmailStatus.ACCEPTED
        self.resend_message_id = resend_id
        self.sent_at = timezone.now()
        self.save(update_fields=['status', 'resend_message_id', 'sent_at', 'updated_at'])

    def mark_delivered(self):
        self.status = EmailStatus.DELIVERED
        self.delivered_at = timezone.now()
        self.save(update_fields=['status', 'delivered_at', 'updated_at'])

    def mark_bounced(self, reason: str = ""):
        self.status = EmailStatus.BOUNCED
        if reason:
            self.last_error = reason
        self.save(update_fields=['status', 'last_error', 'updated_at'])

    def mark_failed(self, error: str):
        self.status = EmailStatus.FAILED
        self.last_error = error
        self.save(update_fields=['status', 'last_error', 'updated_at'])


class EmailDeliveryAttempt(models.Model):
    """
    Detailed audit log for every delivery attempt made to Resend.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email_log = models.ForeignKey(
        EmailLog,
        on_delete=models.CASCADE,
        related_name='delivery_attempts'
    )
    attempt_number = models.PositiveIntegerField()
    status = models.CharField(max_length=32)
    response_code = models.IntegerField(null=True, blank=True)
    response_body = models.TextField(blank=True, default="")
    error_message = models.TextField(blank=True, default="")
    latency_ms = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = 'Email Delivery Attempt'
        verbose_name_plural = 'Email Delivery Attempts'
        ordering = ['attempt_number']

    def __str__(self):
        return f"Attempt {self.attempt_number} for {self.email_log_id}: {self.status}"
