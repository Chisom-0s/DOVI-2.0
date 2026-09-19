from rest_framework import permissions


class IsDeliveryGroupParticipant(permissions.BasePermission):
    """
    Permission check for DeliveryGroup access:
    - Admin: Full access
    - Vendor: Access only if group.vendor == request.user.vendor
    - Buyer: Access only if group.order.buyer == request.user
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if getattr(user, 'is_staff', False) or getattr(user, 'role', '') == 'ADMIN':
            return True

        if hasattr(user, 'vendor') and user.vendor and str(user.vendor.id) == str(obj.vendor_id):
            return True

        if obj.order.buyer_id == user.id:
            return True

        return False
