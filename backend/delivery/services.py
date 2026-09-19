import logging
from decimal import Decimal
from django.db import transaction
from django.core.exceptions import ValidationError, PermissionDenied
from django.utils import timezone
from .models import DeliveryGroup, DeliveryMethod, DeliveryStatus

logger = logging.getLogger(__name__)


class DeliveryCalculationService:
    """
    Authoritative server-side delivery fee calculation service.
    Frontend fee inputs are completely ignored for security.
    """
    @staticmethod
    def calculate_group_fee(vendor, method: str) -> Decimal:
        if method == DeliveryMethod.PICKUP:
            return Decimal("0.00")
        elif method == DeliveryMethod.VENDOR_ARRANGED:
            # Check if vendor has configured delivery fee
            vendor_fee = getattr(vendor, 'delivery_fee', None)
            if vendor_fee is not None:
                return Decimal(str(vendor_fee))
            return Decimal("0.00")
        return Decimal("0.00")


class DeliveryGroupCreationService:
    """
    Service to split cart items by vendor and create DeliveryGroup instances during checkout.
    Executes within the parent order placement transaction.
    """
    @classmethod
    @transaction.atomic
    def create_delivery_groups_for_order(cls, order, vendor_selections: list) -> list:
        """
        :param order: Created Order instance
        :param vendor_selections: list of dicts: [{'vendor_id': uuid, 'method': 'PICKUP'|'VENDOR_ARRANGED', 'address': {...}}]
        """
        # Group order items by vendor
        items_by_vendor = {}
        for item in order.items.all():
            v_id = str(item.product.vendor_id)
            if v_id not in items_by_vendor:
                items_by_vendor[v_id] = []
            items_by_vendor[v_id].append(item)

        selections_map = {str(s['vendor_id']): s for s in vendor_selections} if vendor_selections else {}

        groups = []
        for vendor_id, items in items_by_vendor.items():
            vendor = items[0].product.vendor

            # Verify vendor active
            if hasattr(vendor, 'is_active') and not vendor.is_active:
                raise ValidationError(f"Vendor '{vendor.name}' is currently inactive.")

            selection = selections_map.get(vendor_id, {})
            method = selection.get('method', DeliveryMethod.VENDOR_ARRANGED)

            # Validate vendor method support
            if method == DeliveryMethod.PICKUP:
                supports_pickup = getattr(vendor, 'supports_pickup', True)
                if not supports_pickup:
                    raise ValidationError(f"Vendor '{vendor.name}' does not support store pickup.")

            fee = DeliveryCalculationService.calculate_group_fee(vendor, method)

            group = DeliveryGroup(
                order=order,
                vendor=vendor,
                method=method,
                status=DeliveryStatus.PENDING,
                delivery_fee=fee,
            )

            if method == DeliveryMethod.PICKUP:
                # Capture snapshot of vendor pickup address
                group.pickup_address = getattr(vendor, 'pickup_address', getattr(vendor, 'address', 'Store Location'))
                group.pickup_city = getattr(vendor, 'pickup_city', getattr(vendor, 'city', ''))
                group.pickup_state = getattr(vendor, 'pickup_state', getattr(vendor, 'state', ''))
            else:
                # Vendor Arranged: capture buyer delivery address from order
                group.recipient_name = getattr(order.delivery_address, 'full_name', order.buyer_name) if hasattr(order, 'delivery_address') else getattr(order, 'buyer_name', '')
                group.recipient_phone = getattr(order.delivery_address, 'phone', '') if hasattr(order, 'delivery_address') else ''
                group.delivery_address = getattr(order.delivery_address, 'address_line_1', getattr(order, 'shipping_address_line_1', ''))
                group.delivery_city = getattr(order.delivery_address, 'city', getattr(order, 'shipping_city', ''))
                group.delivery_state = getattr(order.delivery_address, 'state', getattr(order, 'shipping_state', ''))

            group.save()

            # Associate order items with this group
            for item in items:
                if hasattr(item, 'delivery_group'):
                    item.delivery_group = group
                    item.save(update_fields=['delivery_group'])

            groups.append(group)

            DeliveryAuditService.log_event(group, 'DELIVERY_GROUP_CREATED', f"Created {method} delivery group for vendor {vendor.name}")

        return groups


class DeliveryStateService:
    """
    Enforces status transitions, actor permissions, notifications, and audit logging.
    """
    @classmethod
    def transition(cls, group: DeliveryGroup, new_status: str, actor, tracking_reference: str = "", vendor_notes: str = "") -> DeliveryGroup:
        # Check permissions
        is_vendor = hasattr(actor, 'vendor') and actor.vendor and str(actor.vendor.id) == str(group.vendor_id)
        is_buyer = group.order.buyer_id == actor.id
        is_admin = getattr(actor, 'is_staff', False) or getattr(actor, 'role', '') == 'ADMIN'

        if not (is_vendor or is_buyer or is_admin):
            raise PermissionDenied("You do not have permission to modify this delivery group.")

        # Role-specific transition rules
        if new_status in [DeliveryStatus.READY_FOR_PICKUP, DeliveryStatus.READY_FOR_DELIVERY, DeliveryStatus.IN_TRANSIT]:
            if not (is_vendor or is_admin):
                raise PermissionDenied("Only the vendor or admin can mark orders ready or dispatch.")

        if tracking_reference:
            group.tracking_reference = tracking_reference
        if vendor_notes:
            group.vendor_notes = vendor_notes

        group.transition_to(new_status, save=True)

        # Notify buyer & vendor
        DeliveryNotificationService.notify_status_change(group, new_status)
        DeliveryAuditService.log_event(group, f"ORDER_{new_status}", f"Status changed to {new_status} by {actor.email}")

        return group


class DeliveryNotificationService:
    @staticmethod
    def notify_status_change(group: DeliveryGroup, status: str):
        msg_map = {
            DeliveryStatus.READY_FOR_PICKUP: f"Your order #{group.order.reference_code if hasattr(group.order, 'reference_code') else group.order.id} from {group.vendor.name} is ready for pickup!",
            DeliveryStatus.READY_FOR_DELIVERY: f"{group.vendor.name} has prepared your order for delivery.",
            DeliveryStatus.IN_TRANSIT: f"Your order from {group.vendor.name} is on the way! Tracking: {group.tracking_reference or 'N/A'}",
            DeliveryStatus.PICKED_UP: f"Your order from {group.vendor.name} has been picked up.",
            DeliveryStatus.DELIVERED: f"Your order from {group.vendor.name} has been delivered!",
            DeliveryStatus.COMPLETED: f"Fulfillment completed for {group.vendor.name}.",
        }
        text = msg_map.get(status)
        if text:
            logger.info(f"[NOTIFICATION] Sent to buyer ({group.order.buyer_id}): {text}")


class DeliveryAuditService:
    @staticmethod
    def log_event(group: DeliveryGroup, action: str, details: str):
        logger.info(f"[AUDIT LOG] {action} | Group {group.id} | {details}")
