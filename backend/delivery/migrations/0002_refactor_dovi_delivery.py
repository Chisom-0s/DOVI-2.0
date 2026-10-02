from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('delivery', '0001_initial'),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name='deliverygroup',
            name='delivery_dg_order_v_idx',
        ),
        migrations.AlterField(
            model_name='deliverygroup',
            name='vendor',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='delivery_groups',
                to='vendors.vendor',
                help_text="Merchant responsible for fulfilling this group (deprecated)."
            ),
        ),
        migrations.AlterField(
            model_name='deliverygroup',
            name='method',
            field=models.CharField(
                choices=[
                    ('PICKUP', 'Store Pickup'),
                    ('DOVI_ARRANGED', 'Dovi Delivery'),
                    ('VENDOR_ARRANGED', 'Dovi Delivery (Legacy)'),
                ],
                db_index=True,
                default='DOVI_ARRANGED',
                max_length=50
            ),
        ),
        migrations.AddIndex(
            model_name='deliverygroup',
            index=models.Index(fields=['order'], name='delivery_dg_order_idx'),
        ),
    ]
