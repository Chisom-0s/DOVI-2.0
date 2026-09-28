import logging
from decimal import Decimal
from django.db import transaction
from django.core.exceptions import ValidationError, PermissionDenied
from django.utils import timezone
from .models import DeliveryGroup, DeliveryMethod, DeliveryStatus

logger = logging.getLogger(__name__)


import logging
from decimal import Decimal
from django.db import transaction
from django.core.exceptions import ValidationError, PermissionDenied
from django.utils import timezone
from .models import DeliveryGroup, DeliveryMethod, DeliveryStatus

logger = logging.getLogger(__name__)


class DeliveryCalculationService:
    """
    Authoritative server-side delivery fee calculation service for Dovi orders.
    Frontend fee inputs are completely ignored for security.
    """
    @staticmethod
    def calculate_group_fee(method: str) -> Decimal:
        if method == DeliveryMethod.PICKUP:
            return Decimal("0.00")
        elif method in [DeliveryMethod.DOVI_ARRANGED, DeliveryMethod.VENDOR_ARRANGED]:
            return Decimal("1500.00")  # Dovi standard delivery rate
        return Decimal("0.00")


class DeliveryGroupCreationService:
    """
    Service to create single Dovi DeliveryGroup instance during checkout.
    Executes within the parent order placement transaction.
    """
    @classmethod
    @transaction.atomic
    def create_delivery_groups_for_order(cls, order, delivery_selection: dict = None) -> list:
        """
        :param order: Created Order instance
        :param delivery_selection: dict with method and address info
        """
        selection = delivery_selection or {}
        method = selection.get('method', DeliveryMethod.DOVI_ARRANGED)

        fee = DeliveryCalculationService.calculate_group_fee(method)

        group = DeliveryGroup(
            order=order,
            vendor=None,
            method=method,
            status=DeliveryStatus.PENDING,
            delivery_fee=fee,
        )

        if method == DeliveryMethod.PICKUP:
            # Capture Dovi pickup warehouse snapshot
            group.pickup_address = selection.get('pickup_address', 'Dovi Central Warehouse, Lagos')
            group.pickup_city = selection.get('pickup_city', 'Lagos')
            group.pickup_state = selection.get('pickup_state', 'Lagos')
        else:
            # Dovi Delivery: capture buyer delivery address from order
            group.recipient_name = getattr(order.delivery_address, 'full_name', getattr(order, 'buyer_name', '')) if hasattr(order, 'delivery_address') else getattr(order, 'buyer_name', '')
            group.recipient_phone = getattr(order.delivery_address, 'phone', '') if hasattr(order, 'delivery_address') else ''
            group.delivery_address = getattr(order.delivery_address, 'address_line_1', getattr(order, 'shipping_address_line_1', ''))
            group.delivery_city = getattr(order.delivery_address, 'city', getattr(order, 'shipping_city', ''))
            group.delivery_state = getattr(order.delivery_address, 'state', getattr(order, 'shipping_state', ''))

        group.save()

        # Associate all order items with this group
        for item in order.items.all():
            if hasattr(item, 'delivery_group'):
                item.delivery_group = group
                item.save(update_fields=['delivery_group'])

        DeliveryAuditService.log_event(group, 'DELIVERY_GROUP_CREATED', f"Created {method} Dovi delivery group")

        return [group]


class DeliveryStateService:
    """
    Enforces status transitions, actor permissions, notifications, and audit logging for Dovi.
    """
    @classmethod
    def transition(cls, group: DeliveryGroup, new_status: str, actor, tracking_reference: str = "", notes: str = "") -> DeliveryGroup:
        # Check permissions
        is_buyer = group.order.buyer_id == actor.id
        is_admin = getattr(actor, 'is_staff', False) or getattr(actor, 'role', '') == 'ADMIN'

        if not (is_buyer or is_admin):
            raise PermissionDenied("You do not have permission to modify this delivery group.")

        # Role-specific transition rules
        if new_status in [DeliveryStatus.READY_FOR_PICKUP, DeliveryStatus.READY_FOR_DELIVERY, DeliveryStatus.IN_TRANSIT]:
            if not is_admin:
                raise PermissionDenied("Only Dovi administrators can mark orders ready or dispatch.")

        if tracking_reference:
            group.tracking_reference = tracking_reference
        if notes:
            group.vendor_notes = notes

        group.transition_to(new_status, save=True)

        # Notify buyer
        DeliveryNotificationService.notify_status_change(group, new_status)
        DeliveryAuditService.log_event(group, f"ORDER_{new_status}", f"Status changed to {new_status} by {actor.email}")

        return group


class DeliveryNotificationService:
    @staticmethod
    def notify_status_change(group: DeliveryGroup, status: str):
        msg_map = {
            DeliveryStatus.READY_FOR_PICKUP: f"Your Dovi order #{getattr(group.order, 'reference_code', group.order.id)} is ready for pickup!",
            DeliveryStatus.READY_FOR_DELIVERY: f"Dovi has prepared your order for delivery.",
            DeliveryStatus.IN_TRANSIT: f"Your Dovi order is on the way! Tracking: {group.tracking_reference or 'N/A'}",
            DeliveryStatus.PICKED_UP: f"Your Dovi order has been picked up.",
            DeliveryStatus.DELIVERED: f"Your Dovi order has been delivered!",
            DeliveryStatus.COMPLETED: f"Fulfillment completed for your Dovi order.",
        }
        text = msg_map.get(status)
        if text:
            logger.info(f"[NOTIFICATION] Sent to buyer ({group.order.buyer_id}): {text}")


class DeliveryAuditService:
    @staticmethod
    def log_event(group: DeliveryGroup, action: str, details: str):
        logger.info(f"[AUDIT LOG] {action} | Group {group.id} | {details}")

