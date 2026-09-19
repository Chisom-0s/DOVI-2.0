import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('orders', '__first__'),
        ('vendors', '__first__'),
    ]

    operations = [
        migrations.CreateModel(
            name='DeliveryGroup',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('method', models.CharField(choices=[('PICKUP', 'Store Pickup'), ('VENDOR_ARRANGED', 'Vendor-Arranged Delivery')], db_index=True, default='VENDOR_ARRANGED', max_length=50)),
                ('status', models.CharField(choices=[('PENDING', 'Pending'), ('READY_FOR_PICKUP', 'Ready for Pickup'), ('READY_FOR_DELIVERY', 'Ready for Delivery'), ('IN_TRANSIT', 'In Transit'), ('PICKED_UP', 'Picked Up'), ('DELIVERED', 'Delivered'), ('COMPLETED', 'Completed'), ('CANCELLED', 'Cancelled'), ('FAILED', 'Failed')], db_index=True, default='PENDING', max_length=50)),
                ('recipient_name', models.CharField(blank=True, max_length=255, null=True)),
                ('recipient_phone', models.CharField(blank=True, max_length=50, null=True)),
                ('delivery_address', models.TextField(blank=True, null=True)),
                ('delivery_city', models.CharField(blank=True, max_length=100, null=True)),
                ('delivery_state', models.CharField(blank=True, max_length=100, null=True)),
                ('pickup_address', models.TextField(blank=True, null=True)),
                ('pickup_city', models.CharField(blank=True, max_length=100, null=True)),
                ('pickup_state', models.CharField(blank=True, max_length=100, null=True)),
                ('delivery_fee', models.DecimalField(decimal_places=2, default=0.0, max_digits=12)),
                ('vendor_notes', models.TextField(blank=True, default='')),
                ('tracking_reference', models.CharField(blank=True, default='', max_length=150)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('picked_up_at', models.DateTimeField(blank=True, null=True)),
                ('shipped_at', models.DateTimeField(blank=True, null=True)),
                ('delivered_at', models.DateTimeField(blank=True, null=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('cancelled_at', models.DateTimeField(blank=True, null=True)),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='delivery_groups', to='orders.order')),
                ('vendor', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='delivery_groups', to='vendors.vendor')),
            ],
            options={
                'verbose_name': 'Delivery Group',
                'verbose_name_plural': 'Delivery Groups',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='deliverygroup',
            index=models.Index(fields=['order', 'vendor'], name='delivery_dg_order_v_idx'),
        ),
        migrations.AddIndex(
            model_name='deliverygroup',
            index=models.Index(fields=['status'], name='delivery_dg_status_idx'),
        ),
        migrations.AddIndex(
            model_name='deliverygroup',
            index=models.Index(fields=['method'], name='delivery_dg_method_idx'),
        ),
    ]
