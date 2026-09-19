from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import DeliveryGroup, DeliveryStatus
from .serializers import DeliveryGroupSerializer, DeliveryGroupTransitionSerializer
from .selectors import get_delivery_groups_for_user, get_delivery_group_by_id
from .services import DeliveryStateService
from .permissions import IsDeliveryGroupParticipant


class DeliveryGroupViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for tracking and updating vendor fulfillment groups.
    - Buyer: views groups for their own orders, confirms receipt when delivered.
    - Vendor: views groups for their store, marks ready, dispatches, confirms pickup.
    - Admin: full monitoring and transition rights.
    """
    serializer_class = DeliveryGroupSerializer
    permission_classes = [permissions.IsAuthenticated, IsDeliveryGroupParticipant]

    def get_queryset(self):
        return get_delivery_groups_for_user(self.request.user)

    def get_object(self):
        obj = get_delivery_group_by_id(self.kwargs['pk'], self.request.user)
        if not obj:
            return get_object_or_404(DeliveryGroup, pk=self.kwargs['pk'])
        self.check_object_permissions(self.request, obj)
        return obj

    @action(detail=True, methods=['post'], url_path='mark-ready')
    def mark_ready(self, request, pk=None):
        group = self.get_object()
        serializer = DeliveryGroupTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        notes = serializer.validated_data.get('vendor_notes', '')

        target_status = DeliveryStatus.READY_FOR_PICKUP if group.method == 'PICKUP' else DeliveryStatus.READY_FOR_DELIVERY
        updated_group = DeliveryStateService.transition(group, target_status, request.user, vendor_notes=notes)
        return Response(DeliveryGroupSerializer(updated_group).data)

    @action(detail=True, methods=['post'], url_path='dispatch')
    def dispatch(self, request, pk=None):
        group = self.get_object()
        serializer = DeliveryGroupTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tracking_ref = serializer.validated_data.get('tracking_reference', '')
        notes = serializer.validated_data.get('vendor_notes', '')

        updated_group = DeliveryStateService.transition(
            group,
            DeliveryStatus.IN_TRANSIT,
            request.user,
            tracking_reference=tracking_ref,
            vendor_notes=notes
        )
        return Response(DeliveryGroupSerializer(updated_group).data)

    @action(detail=True, methods=['post'], url_path='confirm-pickup')
    def confirm_pickup(self, request, pk=None):
        group = self.get_object()
        updated_group = DeliveryStateService.transition(group, DeliveryStatus.PICKED_UP, request.user)
        # Also auto-transition to COMPLETED for pickup handover
        updated_group = DeliveryStateService.transition(updated_group, DeliveryStatus.COMPLETED, request.user)
        return Response(DeliveryGroupSerializer(updated_group).data)

    @action(detail=True, methods=['post'], url_path='confirm-delivery')
    def confirm_delivery(self, request, pk=None):
        group = self.get_object()
        if group.status == DeliveryStatus.IN_TRANSIT:
            updated_group = DeliveryStateService.transition(group, DeliveryStatus.DELIVERED, request.user)
            updated_group = DeliveryStateService.transition(updated_group, DeliveryStatus.COMPLETED, request.user)
        elif group.status == DeliveryStatus.DELIVERED:
            updated_group = DeliveryStateService.transition(group, DeliveryStatus.COMPLETED, request.user)
        else:
            updated_group = DeliveryStateService.transition(group, DeliveryStatus.COMPLETED, request.user)

        return Response(DeliveryGroupSerializer(updated_group).data)


class OrderDeliveryGroupsView(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, order_pk=None):
        groups = DeliveryGroup.objects.filter(order_id=order_pk).select_related('order', 'vendor').prefetch_related('items')
        serializer = DeliveryGroupSerializer(groups, many=True)
        return Response(serializer.data)
