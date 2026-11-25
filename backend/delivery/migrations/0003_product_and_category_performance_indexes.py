from django.db import migrations


def apply_performance_indexes(apps, schema_editor):
    connection = schema_editor.connection
    vendor = connection.vendor

    # Safe SQL statements supported on both PostgreSQL and SQLite
    statements = []

    if vendor == 'postgresql':
        statements = [
            # Products indexes
            """
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
                    CREATE INDEX IF NOT EXISTS idx_products_status_created ON products (status, created_at DESC);
                    CREATE INDEX IF NOT EXISTS idx_products_category_status ON products (category_id, status);
                    CREATE INDEX IF NOT EXISTS idx_products_vendor_status ON products (vendor_id, status);
                    CREATE INDEX IF NOT EXISTS idx_products_base_price ON products (base_price);
                    CREATE INDEX IF NOT EXISTS idx_products_status_price ON products (status, base_price);
                END IF;
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products_product') THEN
                    CREATE INDEX IF NOT EXISTS idx_pp_status_created ON products_product (status, created_at DESC);
                    CREATE INDEX IF NOT EXISTS idx_pp_category_status ON products_product (category_id, status);
                    CREATE INDEX IF NOT EXISTS idx_pp_vendor_status ON products_product (vendor_id, status);
                    CREATE INDEX IF NOT EXISTS idx_pp_base_price ON products_product (base_price);
                    CREATE INDEX IF NOT EXISTS idx_pp_status_price ON products_product (status, base_price);
                END IF;
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_variants') THEN
                    CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants (product_id);
                    CREATE INDEX IF NOT EXISTS idx_variants_product_stock ON product_variants (product_id, stock);
                END IF;
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products_productvariant') THEN
                    CREATE INDEX IF NOT EXISTS idx_ppv_product_id ON products_productvariant (product_id);
                    CREATE INDEX IF NOT EXISTS idx_ppv_product_stock ON products_productvariant (product_id, stock);
                END IF;
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_images') THEN
                    CREATE INDEX IF NOT EXISTS idx_images_product_primary ON product_images (product_id, is_primary);
                    CREATE INDEX IF NOT EXISTS idx_images_product_id ON product_images (product_id);
                END IF;
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products_productimage') THEN
                    CREATE INDEX IF NOT EXISTS idx_ppi_product_primary ON products_productimage (product_id, is_primary);
                    CREATE INDEX IF NOT EXISTS idx_ppi_product_id ON products_productimage (product_id);
                END IF;
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
                    CREATE INDEX IF NOT EXISTS idx_categories_active_order ON categories (is_active, display_order);
                    CREATE INDEX IF NOT EXISTS idx_categories_parent_active ON categories (parent_id, is_active, display_order);
                    CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories (slug);
                END IF;
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products_category') THEN
                    CREATE INDEX IF NOT EXISTS idx_pc_active_order ON products_category (is_active, display_order);
                    CREATE INDEX IF NOT EXISTS idx_pc_parent_active ON products_category (parent_id, is_active, display_order);
                    CREATE INDEX IF NOT EXISTS idx_pc_slug ON products_category (slug);
                END IF;
            END $$;
            """
        ]
    elif vendor == 'sqlite':
        with connection.cursor() as cursor:
            tables = [row[0] for row in cursor.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
            if 'delivery_deliveryroute' in tables:
                statements.append("CREATE INDEX IF NOT EXISTS idx_delivery_route_state ON delivery_deliveryroute (destination_state, is_active);")
            if 'delivery_deliverygroup' in tables:
                statements.append("CREATE INDEX IF NOT EXISTS idx_delivery_group_status ON delivery_deliverygroup (status);")

    with connection.cursor() as cursor:
        for stmt in statements:
            cursor.execute(stmt)


class Migration(migrations.Migration):

    dependencies = [
        ('delivery', '0002_refactor_dovi_delivery'),
    ]

    operations = [
        migrations.RunPython(apply_performance_indexes, reverse_code=migrations.RunPython.noop),
    ]
