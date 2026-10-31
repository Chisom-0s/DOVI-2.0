-- ============================================================================
-- DOVI E-COMMERCE PLATFORM
-- Migration 0002: 12 Main Categories, Subcategory Hierarchy, Product Mapping,
--                 Validation Triggers, and Row-Level Security (RLS)
-- ============================================================================

BEGIN;

-- 1. Extend existing categories table non-destructively (supports both main categories & subcategories)
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(140) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(32),
    icon_url TEXT,
    parent_id VARCHAR(64) REFERENCES categories(id) ON DELETE RESTRICT,
    display_order INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255)
);

ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon VARCHAR(32);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon_url TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id VARCHAR(64) REFERENCES categories(id) ON DELETE RESTRICT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 1;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

-- Prevent duplicate main category names and duplicate subcategory names under the same parent category
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_unique_main_name
    ON categories (LOWER(TRIM(name)))
    WHERE parent_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_unique_sub_name_per_parent
    ON categories (parent_id, LOWER(TRIM(name)))
    WHERE parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_categories_parent_order
    ON categories (parent_id, display_order, is_active);

-- 2. Extend products table non-destructively to reference main category and subcategory
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id VARCHAR(64) REFERENCES categories(id) ON DELETE RESTRICT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory_id VARCHAR(64) REFERENCES categories(id) ON DELETE RESTRICT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS needs_category_review BOOLEAN NOT NULL DEFAULT FALSE;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS legacy_category_name VARCHAR(140);
    END IF;
END $$;

-- 3. Server-side validation trigger:
--    a) A subcategory's parent must be a top-level main category (parent_id IS NULL).
--    b) A product's subcategory_id must belong to the product's main category_id.
CREATE OR REPLACE FUNCTION validate_category_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
    parent_parent_id VARCHAR(64);
BEGIN
    IF NEW.parent_id IS NOT NULL THEN
        IF NEW.parent_id = NEW.id THEN
            RAISE EXCEPTION 'A category cannot be its own parent.';
        END IF;
        SELECT parent_id INTO parent_parent_id FROM categories WHERE id = NEW.parent_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Parent category % does not exist.', NEW.parent_id;
        END IF;
        IF parent_parent_id IS NOT NULL THEN
            RAISE EXCEPTION 'Subcategories can only belong to one of the main top-level categories.';
        END IF;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_category_hierarchy ON categories;
CREATE TRIGGER trg_validate_category_hierarchy
    BEFORE INSERT OR UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION validate_category_hierarchy();

CREATE OR REPLACE FUNCTION validate_product_category_subcategory()
RETURNS TRIGGER AS $$
DECLARE
    sub_parent_id VARCHAR(64);
BEGIN
    IF NEW.subcategory_id IS NOT NULL THEN
        SELECT parent_id INTO sub_parent_id FROM categories WHERE id = NEW.subcategory_id;
        IF NOT FOUND OR sub_parent_id IS NULL THEN
            RAISE EXCEPTION 'Selected subcategory % is not a valid subcategory.', NEW.subcategory_id;
        END IF;
        IF NEW.category_id IS NOT NULL AND sub_parent_id <> NEW.category_id THEN
            RAISE EXCEPTION 'Subcategory % does not belong to main category %.', NEW.subcategory_id, NEW.category_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        DROP TRIGGER IF EXISTS trg_validate_product_category_subcategory ON products;
        CREATE TRIGGER trg_validate_product_category_subcategory
            BEFORE INSERT OR UPDATE ON products
            FOR EACH ROW
            EXECUTE FUNCTION validate_product_category_subcategory();
    END IF;
END $$;

-- 4. Upsert the 12 Official DOVI Main Categories
INSERT INTO categories (id, name, slug, icon, description, parent_id, display_order, is_active)
VALUES
    ('cat-fashion-clothing', 'Fashion & Clothing', 'fashion-clothing', '👗', 'Men''s, women''s, and traditional apparel, shirts, trousers, dresses, and everyday fashion.', NULL, 1, TRUE),
    ('cat-shoes-footwear', 'Shoes & Footwear', 'shoes-footwear', '👟', 'Sneakers, sandals, slippers, formal shoes, heels, and boots for every occasion.', NULL, 2, TRUE),
    ('cat-beauty-personal-care', 'Beauty & Personal Care', 'beauty-personal-care', '💄', 'Skincare, makeup, haircare, perfumes, body care, and personal hygiene essentials.', NULL, 3, TRUE),
    ('cat-phones-electronics', 'Phones & Electronics', 'phones-electronics', '📱', 'Smartphones, laptops, tablets, headphones, chargers, and electronic accessories.', NULL, 4, TRUE),
    ('cat-home-kitchen', 'Home & Kitchen', 'home-kitchen', '🍳', 'Kitchen utensils, cookware, home appliances, cleaning supplies, and storage.', NULL, 5, TRUE),
    ('cat-furniture-home-decor', 'Furniture & Home Decor', 'furniture-home-decor', '🛋️', 'Chairs, tables, beds, sofas, shelves, lighting, and interior home decorations.', NULL, 6, TRUE),
    ('cat-watches-accessories', 'Watches & Accessories', 'watches-accessories', '⌚', 'Wristwatches, jewelry, sunglasses, belts, wallets, and fashion accessories.', NULL, 7, TRUE),
    ('cat-sports-fitness', 'Sports & Fitness', 'sports-fitness', '🏋️', 'Sportswear, gym equipment, fitness accessories, sports shoes, and outdoor gear.', NULL, 8, TRUE),
    ('cat-automotive-motor', 'Automotive & Motor Accessories', 'automotive-motor-accessories', '🛞', 'Car accessories, motorcycle accessories, spare parts, maintenance gear, and helmets.', NULL, 9, TRUE),
    ('cat-books-stationery', 'Books & Stationery', 'books-stationery', '📚', 'Books, notebooks, pens, writing materials, school supplies, and office stationery.', NULL, 10, TRUE),
    ('cat-baby-kids', 'Baby & Kids', 'baby-kids', '🧸', 'Baby clothing, kids clothing, toys, baby care, feeding accessories, and essentials.', NULL, 11, TRUE),
    ('cat-travel-bags', 'Travel & Bags', 'travel-bags', '🧳', 'Backpacks, travel bags, luggage, handbags, school bags, and travel accessories.', NULL, 12, TRUE)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    description = COALESCE(categories.description, EXCLUDED.description),
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

-- 5. Upsert the Initial Subcategories under each of the 12 Main Categories
INSERT INTO categories (id, name, slug, parent_id, display_order, is_active)
VALUES
    -- 1. Fashion & Clothing
    ('sub-mens-clothing', 'Men''s Clothing', 'mens-clothing', 'cat-fashion-clothing', 1, TRUE),
    ('sub-womens-clothing', 'Women''s Clothing', 'womens-clothing', 'cat-fashion-clothing', 2, TRUE),
    ('sub-shirts-tops', 'Shirts & Tops', 'shirts-tops', 'cat-fashion-clothing', 3, TRUE),
    ('sub-trousers-jeans', 'Trousers & Jeans', 'trousers-jeans', 'cat-fashion-clothing', 4, TRUE),
    ('sub-dresses', 'Dresses', 'dresses', 'cat-fashion-clothing', 5, TRUE),
    ('sub-skirts', 'Skirts', 'skirts', 'cat-fashion-clothing', 6, TRUE),
    ('sub-underwear-sleepwear', 'Underwear & Sleepwear', 'underwear-sleepwear', 'cat-fashion-clothing', 7, TRUE),
    ('sub-traditional-wear', 'Traditional Wear', 'traditional-wear', 'cat-fashion-clothing', 8, TRUE),

    -- 2. Shoes & Footwear
    ('sub-sneakers', 'Sneakers', 'sneakers', 'cat-shoes-footwear', 1, TRUE),
    ('sub-sandals', 'Sandals', 'sandals', 'cat-shoes-footwear', 2, TRUE),
    ('sub-slippers', 'Slippers', 'slippers', 'cat-shoes-footwear', 3, TRUE),
    ('sub-formal-shoes', 'Formal Shoes', 'formal-shoes', 'cat-shoes-footwear', 4, TRUE),
    ('sub-heels', 'Heels', 'heels', 'cat-shoes-footwear', 5, TRUE),
    ('sub-boots', 'Boots', 'boots', 'cat-shoes-footwear', 6, TRUE),

    -- 3. Beauty & Personal Care
    ('sub-skincare', 'Skincare', 'skincare', 'cat-beauty-personal-care', 1, TRUE),
    ('sub-makeup', 'Makeup', 'makeup', 'cat-beauty-personal-care', 2, TRUE),
    ('sub-haircare', 'Haircare', 'haircare', 'cat-beauty-personal-care', 3, TRUE),
    ('sub-perfumes-fragrances', 'Perfumes & Fragrances', 'perfumes-fragrances', 'cat-beauty-personal-care', 4, TRUE),
    ('sub-body-care', 'Body Care', 'body-care', 'cat-beauty-personal-care', 5, TRUE),
    ('sub-personal-hygiene', 'Personal Hygiene', 'personal-hygiene', 'cat-beauty-personal-care', 6, TRUE),

    -- 4. Phones & Electronics
    ('sub-smartphones', 'Smartphones', 'smartphones', 'cat-phones-electronics', 1, TRUE),
    ('sub-laptops', 'Laptops', 'laptops', 'cat-phones-electronics', 2, TRUE),
    ('sub-tablets', 'Tablets', 'tablets', 'cat-phones-electronics', 3, TRUE),
    ('sub-headphones-audio', 'Headphones & Audio', 'headphones-audio', 'cat-phones-electronics', 4, TRUE),
    ('sub-chargers-cables', 'Chargers & Cables', 'chargers-cables', 'cat-phones-electronics', 5, TRUE),
    ('sub-phone-accessories', 'Phone Accessories', 'phone-accessories', 'cat-phones-electronics', 6, TRUE),
    ('sub-electronics-accessories', 'Electronics Accessories', 'electronics-accessories', 'cat-phones-electronics', 7, TRUE),

    -- 5. Home & Kitchen
    ('sub-kitchen-utensils', 'Kitchen Utensils', 'kitchen-utensils', 'cat-home-kitchen', 1, TRUE),
    ('sub-cookware', 'Cookware', 'cookware', 'cat-home-kitchen', 2, TRUE),
    ('sub-home-appliances', 'Home Appliances', 'home-appliances', 'cat-home-kitchen', 3, TRUE),
    ('sub-cleaning-supplies', 'Cleaning Supplies', 'cleaning-supplies', 'cat-home-kitchen', 4, TRUE),
    ('sub-storage-organization', 'Storage & Organization', 'storage-organization', 'cat-home-kitchen', 5, TRUE),
    ('sub-home-essentials', 'Home Essentials', 'home-essentials', 'cat-home-kitchen', 6, TRUE),

    -- 6. Furniture & Home Decor
    ('sub-chairs', 'Chairs', 'chairs', 'cat-furniture-home-decor', 1, TRUE),
    ('sub-tables', 'Tables', 'tables', 'cat-furniture-home-decor', 2, TRUE),
    ('sub-beds', 'Beds', 'beds', 'cat-furniture-home-decor', 3, TRUE),
    ('sub-sofas', 'Sofas', 'sofas', 'cat-furniture-home-decor', 4, TRUE),
    ('sub-shelves-storage', 'Shelves & Storage', 'shelves-storage', 'cat-furniture-home-decor', 5, TRUE),
    ('sub-home-decorations', 'Home Decorations', 'home-decorations', 'cat-furniture-home-decor', 6, TRUE),
    ('sub-lighting', 'Lighting', 'lighting', 'cat-furniture-home-decor', 7, TRUE),

    -- 7. Watches & Accessories
    ('sub-wristwatches', 'Wristwatches', 'wristwatches', 'cat-watches-accessories', 1, TRUE),
    ('sub-jewelry', 'Jewelry', 'jewelry', 'cat-watches-accessories', 2, TRUE),
    ('sub-sunglasses', 'Sunglasses', 'sunglasses', 'cat-watches-accessories', 3, TRUE),
    ('sub-belts', 'Belts', 'belts', 'cat-watches-accessories', 4, TRUE),
    ('sub-wallets', 'Wallets', 'wallets', 'cat-watches-accessories', 5, TRUE),
    ('sub-fashion-accessories', 'Fashion Accessories', 'fashion-accessories', 'cat-watches-accessories', 6, TRUE),

    -- 8. Sports & Fitness
    ('sub-sportswear', 'Sportswear', 'sportswear', 'cat-sports-fitness', 1, TRUE),
    ('sub-gym-equipment', 'Gym Equipment', 'gym-equipment', 'cat-sports-fitness', 2, TRUE),
    ('sub-fitness-accessories', 'Fitness Accessories', 'fitness-accessories', 'cat-sports-fitness', 3, TRUE),
    ('sub-sports-shoes', 'Sports Shoes', 'sports-shoes', 'cat-sports-fitness', 4, TRUE),
    ('sub-outdoor-equipment', 'Outdoor Equipment', 'outdoor-equipment', 'cat-sports-fitness', 5, TRUE),

    -- 9. Automotive & Motor Accessories
    ('sub-car-accessories', 'Car Accessories', 'car-accessories', 'cat-automotive-motor', 1, TRUE),
    ('sub-motorcycle-accessories', 'Motorcycle Accessories', 'motorcycle-accessories', 'cat-automotive-motor', 2, TRUE),
    ('sub-motor-spare-parts', 'Motor Spare Parts', 'motor-spare-parts', 'cat-automotive-motor', 3, TRUE),
    ('sub-vehicle-maintenance-accessories', 'Vehicle Maintenance Accessories', 'vehicle-maintenance-accessories', 'cat-automotive-motor', 4, TRUE),
    ('sub-helmets-safety-gear', 'Helmets & Safety Gear', 'helmets-safety-gear', 'cat-automotive-motor', 5, TRUE),

    -- 10. Books & Stationery
    ('sub-books', 'Books', 'books', 'cat-books-stationery', 1, TRUE),
    ('sub-notebooks', 'Notebooks', 'notebooks', 'cat-books-stationery', 2, TRUE),
    ('sub-pens-writing-materials', 'Pens & Writing Materials', 'pens-writing-materials', 'cat-books-stationery', 3, TRUE),
    ('sub-school-supplies', 'School Supplies', 'school-supplies', 'cat-books-stationery', 4, TRUE),
    ('sub-office-supplies', 'Office Supplies', 'office-supplies', 'cat-books-stationery', 5, TRUE),

    -- 11. Baby & Kids
    ('sub-baby-clothing', 'Baby Clothing', 'baby-clothing', 'cat-baby-kids', 1, TRUE),
    ('sub-kids-clothing', 'Kids Clothing', 'kids-clothing', 'cat-baby-kids', 2, TRUE),
    ('sub-toys', 'Toys', 'toys', 'cat-baby-kids', 3, TRUE),
    ('sub-baby-care', 'Baby Care', 'baby-care', 'cat-baby-kids', 4, TRUE),
    ('sub-feeding-accessories', 'Feeding Accessories', 'feeding-accessories', 'cat-baby-kids', 5, TRUE),
    ('sub-kids-accessories', 'Kids Accessories', 'kids-accessories', 'cat-baby-kids', 6, TRUE),

    -- 12. Travel & Bags
    ('sub-backpacks', 'Backpacks', 'backpacks', 'cat-travel-bags', 1, TRUE),
    ('sub-travel-bags', 'Travel Bags', 'travel-bags', 'cat-travel-bags', 2, TRUE),
    ('sub-luggage', 'Luggage', 'luggage', 'cat-travel-bags', 3, TRUE),
    ('sub-handbags', 'Handbags', 'handbags', 'cat-travel-bags', 4, TRUE),
    ('sub-school-bags', 'School Bags', 'school-bags', 'cat-travel-bags', 5, TRUE),
    ('sub-travel-accessories', 'Travel Accessories', 'travel-accessories', 'cat-travel-bags', 6, TRUE)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    parent_id = EXCLUDED.parent_id,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

-- 6. Row-Level Security (RLS) policies for categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS categories_public_read ON categories;
CREATE POLICY categories_public_read ON categories
    FOR SELECT
    USING (TRUE);

DROP POLICY IF EXISTS categories_admin_manage ON categories;
CREATE POLICY categories_admin_manage ON categories
    FOR ALL
    USING (current_setting('request.jwt.claim.role', true) = 'ADMIN')
    WITH CHECK (current_setting('request.jwt.claim.role', true) = 'ADMIN');

COMMIT;

