import {
  OFFICIAL_12_CATEGORIES_SEED,
  listMainCategories,
  getSubcategoriesForCategory,
  findMainCategory,
  findSubcategory,
} from '@/services/categoryService';
import type { Subcategory } from '@/types';

export interface CategoryItem {
  id?: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string | null;
  display_order?: number;
  is_active?: boolean;
  subcategories?: Subcategory[];
}

/**
 * The 12 Official DOVI Main Product Categories (Section 3)
 */
export const HOME_CATEGORIES: CategoryItem[] = OFFICIAL_12_CATEGORIES_SEED.map((c) => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  icon: c.icon,
  description: c.description,
  display_order: c.display_order,
  is_active: true,
  subcategories: c.subcategories.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    parent_id: c.id,
    parent_name: c.name,
    parent_slug: c.slug,
    display_order: s.display_order,
    is_active: true,
    product_count: 0,
  })),
}));

/**
 * Returns the live active main categories (and their active subcategories) sorted by display_order.
 */
export function getActiveStorefrontCategories(): CategoryItem[] {
  const active = listMainCategories({ includeInactive: false });
  if (active.length === 0) return HOME_CATEGORIES;
  return active.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon || '📦',
    description: c.description,
    display_order: c.display_order,
    is_active: c.is_active !== false,
    subcategories: c.subcategories || [],
  }));
}

export { getSubcategoriesForCategory, findMainCategory, findSubcategory };
