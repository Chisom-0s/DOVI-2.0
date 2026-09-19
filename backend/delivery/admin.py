from django.contrib import admin
from .models import DeliveryGroup


@admin.register(DeliveryGroup)
class DeliveryGroupAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'vendor', 'method', 'status', 'delivery_fee', 'created_at']
    list_filter = ['method', 'status', 'created_at']
    search_fields = ['id', 'order__id', 'order__reference_code', 'vendor__name', 'tracking_reference', 'recipient_name']
    readonly_fields = ['id', 'created_at', 'updated_at', 'picked_up_at', 'shipped_at', 'delivered_at', 'completed_at', 'cancelled_at']
    date_hierarchy = 'created_at'
