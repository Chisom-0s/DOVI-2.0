from rest_framework import serializers
from .models import DeliveryGroup, DeliveryMethod, DeliveryStatus


class DeliveryGroupItemSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_id = serializers.UUIDField(source='product.id', read_only=True)
    variant_name = serializers.SerializerMethodField()
    quantity = serializers.IntegerField(read_only=True)
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    def get_variant_name(self, obj):
        if hasattr(obj, 'variant') and obj.variant:
            return obj.variant.name
        return None


class DeliveryGroupSerializer(serializers.ModelSerializer):
    order_reference = serializers.SerializerMethodField()
    items = serializers.SerializerMethodField()

    class Meta:
        model = DeliveryGroup
        fields = [
            'id',
            'order',
            'order_reference',
            'method',
            'status',
            'recipient_name',
            'recipient_phone',
            'delivery_address',
            'delivery_city',
            'delivery_state',
            'pickup_address',
            'pickup_city',
            'pickup_state',
            'delivery_fee',
            'vendor_notes',
            'tracking_reference',
            'items',
            'created_at',
            'updated_at',
            'picked_up_at',
            'shipped_at',
            'delivered_at',
            'completed_at',
            'cancelled_at',
        ]
        read_only_fields = fields

    def get_order_reference(self, obj):
        if hasattr(obj.order, 'reference_code'):
            return obj.order.reference_code
        if hasattr(obj.order, 'reference'):
            return obj.order.reference
        return str(obj.order_id)

    def get_items(self, obj):
        items = obj.items.all() if hasattr(obj, 'items') else []
        return DeliveryGroupItemSerializer(items, many=True).data


class DeliveryGroupTransitionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=DeliveryStatus.choices, required=False)
    tracking_reference = serializers.CharField(max_length=150, required=False, allow_blank=True)
    notes = serializers.CharField(source='vendor_notes', required=False, allow_blank=True)


class DoviDeliverySelectionSerializer(serializers.Serializer):
    method = serializers.ChoiceField(choices=DeliveryMethod.choices)
    delivery_address_id = serializers.UUIDField(required=False, allow_null=True)

