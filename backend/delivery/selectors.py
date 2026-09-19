from django.core.exceptions import PermissionDenied
from .models import DeliveryGroup


def get_delivery_groups_for_user(user):
    """
    Returns DeliveryGroups accessible to the user based on role:
    - Admin: all groups
    - Vendor: groups belonging to user's vendor
    - Buyer: groups belonging to user's orders
    """
    if getattr(user, 'is_staff', False) or getattr(user, 'role', '') == 'ADMIN':
        return DeliveryGroup.objects.all().select_related('order', 'vendor').prefetch_related('items')

    if hasattr(user, 'vendor') and user.vendor:
        return DeliveryGroup.objects.filter(vendor=user.vendor).select_related('order', 'vendor').prefetch_related('items')

    return DeliveryGroup.objects.filter(order__buyer=user).select_related('order', 'vendor').prefetch_related('items')


def get_delivery_group_by_id(group_id: str, user):
    """
    Retrieves a single DeliveryGroup ensuring the user has ownership or participant permission.
    """
    try:
        group = DeliveryGroup.objects.select_related('order', 'vendor').prefetch_related('items').get(id=group_id)
    except DeliveryGroup.DoesNotExist:
        return None

    is_admin = getattr(user, 'is_staff', False) or getattr(user, 'role', '') == 'ADMIN'
    is_vendor = hasattr(user, 'vendor') and user.vendor and str(user.vendor.id) == str(group.vendor_id)
    is_buyer = group.order.buyer_id == user.id

    if not (is_admin or is_vendor or is_buyer):
        raise PermissionDenied("You do not have permission to view this delivery group.")

    return group
