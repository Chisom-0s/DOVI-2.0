export interface CategoryItem {
  name: string;
  slug: string;
  icon?: string;
}

export const HOME_CATEGORIES: CategoryItem[] = [
  { name: 'Electronics', slug: 'electronics', icon: '💻' },
  { name: 'Gadgets', slug: 'gadgets', icon: '🔌' },
  { name: 'Phones & Tablets', slug: 'phones-tablets', icon: '📱' },
  { name: 'Computers', slug: 'computers', icon: '🖥️' },
  { name: 'Audio & Video', slug: 'audio-video', icon: '🎧' },
  { name: 'Gaming', slug: 'gaming', icon: '🎮' },
  { name: 'Smart Home', slug: 'smart-home', icon: '🏠' },
  { name: 'Fashion & Apparel', slug: 'fashion', icon: '👗' },
  { name: 'Shoes', slug: 'shoes', icon: '👟' },
  { name: 'Books & Media', slug: 'books', icon: '📚' },
  { name: 'Home & Kitchen', slug: 'home-kitchen', icon: '🍳' },
  { name: 'Beauty & Health', slug: 'beauty-health', icon: '💄' },
  { name: 'Sports & Outdoors', slug: 'sports-outdoors', icon: '⚽' },
  { name: 'Automotive', slug: 'automotive', icon: '🚗' },
  { name: 'Groceries', slug: 'groceries', icon: '🍎' },
  { name: 'Toys & Games', slug: 'toys-games', icon: '🧸' },
];
