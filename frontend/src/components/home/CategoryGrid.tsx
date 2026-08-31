import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '@/api/client';
import type { Category } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';

// Resolve slugs to high-quality realistic icons in the public folder, supporting API-returned icon_url
const getCategoryIconUrl = (slug: string, iconUrl?: string | null): string => {
  if (iconUrl) return iconUrl;
  
  const s = slug.toLowerCase();
  if (s.includes('electronics')) return '/images/categories/electronics.jpg';
  if (s.includes('gadget')) return '/images/categories/gadgets.jpg';
  if (s.includes('phone') || s.includes('mobile')) return '/images/categories/phones.jpg';
  if (s.includes('book') || s.includes('study')) return '/images/categories/books.jpg';
  if (s.includes('fashion') || s.includes('cloth')) return '/images/categories/fashion.jpg';
  if (s.includes('home') || s.includes('kitchen')) return '/images/categories/kitchen.jpg';
  if (s.includes('auto') || s.includes('car')) return '/images/categories/auto.jpg';
  return '/images/categories/default.jpg';
};

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await apiClient.get('/api/v1/categories/');
        setCategories(Array.isArray(data) ? data.slice(0, 8) : (data?.results ? data.results.slice(0, 8) : []));
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (isLoading) {
    return (
      <div style={skeletonContainerStyles}>
        {Array.from({ length: 4 }).map((_, idx) => (
          <Skeleton key={idx} width="120px" height="38px" borderRadius="var(--radius-full)" />
        ))}
      </div>
    );
  }

  return (
    <div className="category-grid-section" style={sectionStyles}>
      <div style={headerStyles}>
        <h2 style={titleStyles}>Popular Categories</h2>
        <Link to="/products" style={seeAllStyles}>See all &gt;</Link>
      </div>

      <div style={scrollWrapperStyles} className="hide-scrollbar">
        <div style={gridStyles}>
          {/* "All" active pill button */}
          <Link to="/products" style={activePillStyles}>
            <div style={iconContainerStyles}>
              <img
                src="/images/categories/all.jpg"
                alt="All"
                style={iconImageStyles}
              />
            </div>
            <span>All</span>
          </Link>

          {categories.map(category => (
            <Link
              key={category.id}
              to={`/categories/${category.slug}`}
              style={pillStyles}
            >
              <div style={iconContainerStyles}>
                <img
                  src={getCategoryIconUrl(category.slug, category.icon_url)}
                  alt={category.name}
                  style={iconImageStyles}
                />
              </div>
              <span>{category.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const sectionStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  paddingTop: 'var(--space-4)',
  paddingBottom: 'var(--space-4)',
  width: '100%',
};

const headerStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
};

const seeAllStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-semibold)',
  color: '#ff7a00',
  textDecoration: 'none',
};

const scrollWrapperStyles: React.CSSProperties = {
  overflowX: 'auto',
  width: '100%',
};

const gridStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-3)',
  paddingBottom: 'var(--space-2)',
  minWidth: 'max-content',
};

const pillStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  padding: '8px 16px',
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--color-border)',
  backgroundColor: '#ffffff',
  color: 'var(--color-text)',
  textDecoration: 'none',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-medium)',
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  transition: 'border-color var(--transition-fast), transform var(--transition-fast)',
};

const activePillStyles: React.CSSProperties = {
  ...pillStyles,
  backgroundColor: '#ff7a00',
  borderColor: '#ff7a00',
  color: '#ffffff',
  boxShadow: '0 4px 8px rgba(255, 122, 0, 0.25)',
};

const iconContainerStyles: React.CSSProperties = {
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#ffffff',
  border: '1px solid var(--color-border)',
  flexShrink: 0,
};

const iconImageStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const skeletonContainerStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-3)',
  paddingTop: 'var(--space-4)',
  paddingBottom: 'var(--space-4)',
  overflow: 'hidden',
};
