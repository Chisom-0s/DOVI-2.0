import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Category } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Fetch categories
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/categories/`);
        if (response.ok) {
          const data = await response.json();
          // Assume returns Category[] tree or flat.
          // Filter to root categories if it's a list.
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
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} style={skeletonItemStyles}>
            <Skeleton width="60px" height="60px" borderRadius="50%" />
            <Skeleton width="80px" height="12px" />
          </div>
        ))}
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <div className="category-grid-section" style={sectionStyles}>
      <h2 style={titleStyles}>Popular Categories</h2>
      <div style={scrollWrapperStyles} className="hide-scrollbar">
        <div style={gridStyles}>
          {categories.map(category => (
            <Link
              key={category.id}
              to={`/categories/${category.slug}`}
              style={itemStyles}
              className="category-item"
            >
              <div style={iconWrapperStyles}>
                {category.icon_url ? (
                  <img src={category.icon_url} alt="" style={iconStyles} />
                ) : (
                  <div style={iconPlaceholderStyles}>
                    {category.name[0].toUpperCase()}
                  </div>
                )}
              </div>
              <span style={nameStyles}>{category.name}</span>
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
  paddingTop: 'var(--space-6)',
  paddingBottom: 'var(--space-6)',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
};

const scrollWrapperStyles: React.CSSProperties = {
  overflowX: 'auto',
  width: '100%',
};

const gridStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-6)',
  paddingBottom: 'var(--space-2)',
  minWidth: 'max-content',
};

const itemStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--space-2)',
  textDecoration: 'none',
  width: '80px',
  textAlign: 'center',
};

const iconWrapperStyles: React.CSSProperties = {
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  overflow: 'hidden',
  backgroundColor: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform var(--transition-fast), border-color var(--transition-fast)',
};

const iconStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const iconPlaceholderStyles: React.CSSProperties = {
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-primary)',
};

const nameStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-medium)',
  color: 'var(--color-text)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  width: '100%',
};

const skeletonContainerStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-6)',
  paddingTop: 'var(--space-6)',
  paddingBottom: 'var(--space-6)',
  overflow: 'hidden',
};

const skeletonItemStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--space-2)',
  width: '80px',
};
