import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Category } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';

// Map slugs to emoji icons matching screenshot
const getCategoryIcon = (slug: string): string => {
  const s = slug.toLowerCase();
  if (s.includes('electronics')) return '🔌';
  if (s.includes('gadget')) return '⚡';
  if (s.includes('phone') || s.includes('mobile')) return '📱';
  if (s.includes('book') || s.includes('study')) return '📚';
  if (s.includes('fashion') || s.includes('cloth')) return '👕';
  if (s.includes('home') || s.includes('kitchen')) return '🍳';
  if (s.includes('auto') || s.includes('car')) return '🚗';
  return '📦'; // default
};

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/categories/`);
        if (response.ok) {
          const data = await response.json();
          setCategories(Array.isArray(data) ? data.slice(0, 8) : []);
        }
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
            <span style={iconStyles}>🏪</span>
            <span>All</span>
          </Link>

          {categories.map(category => (
            <Link
              key={category.id}
              to={`/categories/${category.slug}`}
              style={pillStyles}
            >
              <span style={iconStyles}>{getCategoryIcon(category.slug)}</span>
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

const iconStyles: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  display: 'inline-flex',
  alignItems: 'center',
};

const skeletonContainerStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-3)',
  paddingTop: 'var(--space-4)',
  paddingBottom: 'var(--space-4)',
  overflow: 'hidden',
};
