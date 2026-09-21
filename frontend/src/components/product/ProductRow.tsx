import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import { SkeletonCard } from '@/components/common/Skeleton';
import type { ProductSummary } from '@/types';

interface ProductRowProps {
  key?: string;
  title: string;
  products: ProductSummary[];
  isLoading: boolean;
}

export default function ProductRow({ title, products, isLoading }: ProductRowProps) {
  if (!isLoading && products.length === 0) {
    return null;
  }

  // Choose icon and subtitle based on title
  let icon = '🛍️';
  let subtitle = '';
  if (title.toLowerCase().includes('flash')) {
    icon = '⚡';
    subtitle = 'Hurry up! Limited time offers';
  } else if (title.toLowerCase().includes('trending')) {
    icon = '🔥';
    subtitle = 'People are looking at these right now';
  } else if (title.toLowerCase().includes('recommended') || title.toLowerCase().includes('marketplace')) {
    icon = '❤️';
    subtitle = "Curated products we think you'll love";
  } else if (title.toLowerCase().includes('new')) {
    icon = '✨';
    subtitle = 'Freshly added to the catalog';
  }

  return (
    <section style={sectionStyles} className="product-row-section">
      <div className="decorated-header">
        <div style={headerTextWrapper}>
          <div className="decorated-header__title">
            <span>{icon}</span>
            <span>{title}</span>
          </div>
          {subtitle && <span className="decorated-header__subtitle">{subtitle}</span>}
        </div>
        <Link to="/products" className="decorated-header__link">
          See all &gt;
        </Link>
      </div>

      <div style={scrollWrapperStyles} className="hide-scrollbar">
        <div style={listStyles}>
          {isLoading
            ? Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} style={cardWrapperStyles}>
                  <SkeletonCard />
                </div>
              ))
            : products.map(product => (
                <div key={product.id} style={cardWrapperStyles}>
                  <ProductCard product={product} />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}

const headerTextWrapper: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const sectionStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  paddingTop: 'var(--space-6)',
  paddingBottom: 'var(--space-6)',
  width: '100%',
};

const scrollWrapperStyles: React.CSSProperties = {
  overflowX: 'auto',
  width: '100%',
};

const listStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-4)',
  paddingBottom: 'var(--space-2)',
  minWidth: 'max-content',
};

const cardWrapperStyles: React.CSSProperties = {
  width: '150px',
};
