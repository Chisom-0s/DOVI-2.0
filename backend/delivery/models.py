import uuid
from django.db import models


class ParcelClassification(models.TextChoices):
    SMALL_PARCEL = 'SMALL_PARCEL', 'Small Parcel'
    HEAVY_PARCEL = 'HEAVY_PARCEL', 'Heavy Parcel'
    FURNITURE_BULKY = 'FURNITURE_BULKY', 'Furniture / Bulky Item'
    SPECIAL_MANUAL_QUOTE = 'SPECIAL_MANUAL_QUOTE', 'Special Delivery / Manual Quote'


class ShipmentFulfillmentStatus(models.TextChoices):
    AWAITING_DELIVERY_CONFIRMATION = 'AWAITING_DELIVERY_CONFIRMATION', 'Delivery Confirmation Required'
    DELIVERY_FEE_CONFIRMED = 'DELIVERY_FEE_CONFIRMED', 'Delivery Fee Confirmed'
    ORDER_PLACED = 'ORDER_PLACED', 'Order Placed'
    SOURCING_PRODUCTS = 'SOURCING_PRODUCTS', 'Sourcing Products'
    AWAITING_PRODUCTS_AT_HUB = 'AWAITING_PRODUCTS_AT_HUB', 'Awaiting Products at Hub'
    PRODUCTS_RECEIVED = 'PRODUCTS_RECEIVED', 'Products Received'
    QUALITY_CHECK = 'QUALITY_CHECK', 'Quality Check'
    READY_FOR_PACKAGING = 'READY_FOR_PACKAGING', 'Ready for Packaging'
    PACKAGED = 'PACKAGED', 'Packaged'
    READY_FOR_DISPATCH = 'READY_FOR_DISPATCH', 'Ready for Dispatch'
    DISPATCHED = 'DISPATCHED', 'Dispatched'
    OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY', 'Out for Delivery'
    DELIVERED = 'DELIVERED', 'Delivered'
    CANCELLED = 'CANCELLED', 'Cancelled'


class DeliveryRoute(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    origin = models.CharField(max_length=100, default='Onitsha')
    destination_state = models.CharField(max_length=100, db_index=True)
    destination_city = models.CharField(max_length=100, blank=True, default='', db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)

    # Configured rates per parcel classification (null = unconfigured / requires manual quote)
    small_parcel_rate = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    heavy_parcel_rate = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    furniture_bulky_rate = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    # Consolidation & combined transport settings
    combined_small_heavy_rate = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    combined_furniture_rate = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    allow_small_with_furniture = models.BooleanField(default=False)
    max_small_parcel_weight_kg = models.DecimalField(max_digits=10, decimal_places=2, default=25.00)
    max_heavy_parcel_weight_kg = models.DecimalField(max_digits=10, decimal_places=2, default=100.00)
    max_furniture_items_consolidated = models.PositiveIntegerField(default=3)
    multi_furniture_requires_manual_quote = models.BooleanField(default=False)

    # Special handling
    special_handling_surcharge = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    requires_manual_quote_for_special_handling = models.BooleanField(default=True)
    require_weight_dimensions_for_bulky = models.BooleanField(default=False)
    special_delivery_requirements = models.TextField(blank=True, default='')
    estimated_delivery_info = models.CharField(max_length=255, blank=True, default='')

    updated_by_id = models.UUIDField(null=True, blank=True)
    updated_by_email = models.EmailField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'delivery_routes'
        unique_together = [('origin', 'destination_state', 'destination_city')]
        ordering = ['destination_state', 'destination_city']


class DeliveryRateChangeHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    route = models.ForeignKey(DeliveryRoute, on_delete=models.CASCADE, related_name='rate_changes')
    origin = models.CharField(max_length=100)
    destination = models.CharField(max_length=200)
    delivery_classification = models.CharField(max_length=80)
    previous_rate = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    new_rate = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    changed_by_id = models.UUIDField(null=True, blank=True)
    changed_by_email = models.EmailField()
    reason = models.TextField(blank=True, default='')
    changed_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'delivery_rate_change_history'
        ordering = ['-changed_at']


class OrderShipment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shipment_number = models.PositiveIntegerField(default=1)
    shipment_reference = models.CharField(max_length=64, unique=True, db_index=True)
    order_id = models.UUIDField(db_index=True)
    order_reference = models.CharField(max_length=64, db_index=True)
    buyer_id = models.UUIDField(null=True, blank=True, db_index=True)

    origin = models.CharField(max_length=100, default='Onitsha')
    destination_state = models.CharField(max_length=100)
    destination_city = models.CharField(max_length=100)
    destination_address = models.TextField()
    recipient_name = models.CharField(max_length=200, blank=True, default='')
    recipient_phone = models.CharField(max_length=60, blank=True, default='')

    shipment_classification = models.CharField(
        max_length=40,
        choices=ParcelClassification.choices,
        default=ParcelClassification.SMALL_PARCEL,
    )
    classification_label = models.CharField(max_length=120)
    is_consolidated = models.BooleanField(default=True)
    consolidation_summary = models.TextField(blank=True, default='')
    separation_reason = models.TextField(blank=True, default='')

    total_quantity = models.PositiveIntegerField(default=1)
    combined_weight_kg = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    combined_dimensions_cm = models.CharField(max_length=160, blank=True, default='')

    delivery_fee = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    special_handling_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    requires_manual_quote = models.BooleanField(default=False)
    manual_quote_reason = models.TextField(blank=True, default='')

    status = models.CharField(
        max_length=40,
        choices=ShipmentFulfillmentStatus.choices,
        default=ShipmentFulfillmentStatus.ORDER_PLACED,
    )
    transport_arrangement = models.CharField(max_length=255, blank=True, default='')
    delivery_notes = models.TextField(blank=True, default='')
    estimated_delivery_info = models.CharField(max_length=255, blank=True, default='')

    received_at_hub_confirmed = models.BooleanField(default=False)
    inspection_confirmed = models.BooleanField(default=False)
    packaging_confirmed = models.BooleanField(default=False)
    customer_approved_split = models.BooleanField(default=False)

    received_at_hub_at = models.DateTimeField(null=True, blank=True)
    inspected_at = models.DateTimeField(null=True, blank=True)
    packaged_at = models.DateTimeField(null=True, blank=True)
    dispatched_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    timeline_json = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'order_shipments'
        ordering = ['shipment_number']


class OrderShipmentItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shipment = models.ForeignKey(OrderShipment, on_delete=models.CASCADE, related_name='items')
    product_id = models.CharField(max_length=120)
    product_name = models.CharField(max_length=255)
    product_image_url = models.TextField(blank=True, default='')
    variant_id = models.CharField(max_length=120, blank=True, default='')
    variant_name = models.CharField(max_length=255, blank=True, default='')
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    line_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    delivery_classification = models.CharField(max_length=40, null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    dimensions_cm = models.CharField(max_length=120, blank=True, default='')
    requires_special_handling = models.BooleanField(default=False)
    delivery_notes = models.TextField(blank=True, default='')

    supplier_status = models.CharField(max_length=40, default='PENDING')
    received_at_hub = models.BooleanField(default=False)
    inspected = models.BooleanField(default=False)
    packaged = models.BooleanField(default=False)

    class Meta:
        db_table = 'order_shipment_items'
