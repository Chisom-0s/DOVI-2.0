import uuid
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError


class DeliveryMethod(models.TextChoices):
    PICKUP = 'PICKUP', 'Store Pickup'
    DOVI_ARRANGED = 'DOVI_ARRANGED', 'Dovi Delivery'
    VENDOR_ARRANGED = 'VENDOR_ARRANGED', 'Dovi Delivery (Legacy)'


class DeliveryStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    READY_FOR_PICKUP = 'READY_FOR_PICKUP', 'Ready for Pickup'
    READY_FOR_DELIVERY = 'READY_FOR_DELIVERY', 'Ready for Delivery'
    IN_TRANSIT = 'IN_TRANSIT', 'In Transit'
    PICKED_UP = 'PICKED_UP', 'Picked Up'
    DELIVERED = 'DELIVERED', 'Delivered'
    COMPLETED = 'COMPLETED', 'Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'
    FAILED = 'FAILED', 'Failed'


class DeliveryGroup(models.Model):
    """
    Dovi direct fulfillment group for customer orders.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.CASCADE,
        related_name='delivery_groups',
        help_text="The parent order this fulfillment group belongs to."
    )
    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='delivery_groups',
        help_text="Merchant responsible for fulfilling this group (deprecated)."
    )
    method = models.CharField(
        max_length=50,
        choices=DeliveryMethod.choices,
        default=DeliveryMethod.DOVI_ARRANGED,
        db_index=True
    )
    status = models.CharField(
        max_length=50,
        choices=DeliveryStatus.choices,
        default=DeliveryStatus.PENDING,
        db_index=True
    )

    # Buyer delivery address (Used for DOVI_ARRANGED / VENDOR_ARRANGED)
    recipient_name = models.CharField(max_length=255, null=True, blank=True)
    recipient_phone = models.CharField(max_length=50, null=True, blank=True)
    delivery_address = models.TextField(null=True, blank=True)
    delivery_city = models.CharField(max_length=100, null=True, blank=True)
    delivery_state = models.CharField(max_length=100, null=True, blank=True)

    # Pickup location snapshot (Captured at checkout for PICKUP orders)
    pickup_address = models.TextField(null=True, blank=True)
    pickup_city = models.CharField(max_length=100, null=True, blank=True)
    pickup_state = models.CharField(max_length=100, null=True, blank=True)

    delivery_fee = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        help_text="Fulfillment fee calculated authoritatively by backend."
    )
    vendor_notes = models.TextField(blank=True, default="")
    tracking_reference = models.CharField(max_length=150, blank=True, default="")

    # Lifecycle Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    picked_up_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Delivery Group'
        verbose_name_plural = 'Delivery Groups'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order']),
            models.Index(fields=['status']),
            models.Index(fields=['method']),
        ]

    def __str__(self):
        return f"DeliveryGroup {self.id} | Order {self.order_id} [{self.method} - {self.status}]"

    def clean(self):
        super().clean()
        if self.method == DeliveryMethod.PICKUP and not (self.pickup_address or self.pickup_city):
            # In strict validation, pickup location should be snapshotted
            pass

    def transition_to(self, new_status: str, save: bool = True):
        """
        Enforces state machine rules and updates corresponding timestamps.
        """
        valid_transitions = {
            DeliveryStatus.PENDING: [DeliveryStatus.READY_FOR_PICKUP, DeliveryStatus.READY_FOR_DELIVERY, DeliveryStatus.IN_TRANSIT, DeliveryStatus.CANCELLED, DeliveryStatus.FAILED],
            DeliveryStatus.READY_FOR_PICKUP: [DeliveryStatus.PICKED_UP, DeliveryStatus.CANCELLED, DeliveryStatus.FAILED],
            DeliveryStatus.READY_FOR_DELIVERY: [DeliveryStatus.IN_TRANSIT, DeliveryStatus.CANCELLED, DeliveryStatus.FAILED],
            DeliveryStatus.IN_TRANSIT: [DeliveryStatus.DELIVERED, DeliveryStatus.CANCELLED, DeliveryStatus.FAILED],
            DeliveryStatus.PICKED_UP: [DeliveryStatus.COMPLETED, DeliveryStatus.CANCELLED],
            DeliveryStatus.DELIVERED: [DeliveryStatus.COMPLETED, DeliveryStatus.CANCELLED],
            DeliveryStatus.COMPLETED: [],
            DeliveryStatus.CANCELLED: [],
            DeliveryStatus.FAILED: [],
        }

        if new_status not in valid_transitions.get(self.status, []):
            raise ValidationError(f"Illegal delivery state transition from '{self.status}' to '{new_status}'.")

        now = timezone.now()
        self.status = new_status
        if new_status == DeliveryStatus.PICKED_UP and not self.picked_up_at:
            self.picked_up_at = now
        elif new_status == DeliveryStatus.IN_TRANSIT and not self.shipped_at:
            self.shipped_at = now
        elif new_status == DeliveryStatus.DELIVERED and not self.delivered_at:
            self.delivered_at = now
        elif new_status == DeliveryStatus.COMPLETED and not self.completed_at:
            self.completed_at = now
        elif new_status == DeliveryStatus.CANCELLED and not self.cancelled_at:
            self.cancelled_at = now

        if save:
            self.save()
