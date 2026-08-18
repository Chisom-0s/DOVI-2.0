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

  return (
    <section style={sectionStyles} className="product-row-section">
      <div style={headerStyles}>
        <h2 style={titleStyles}>{title}</h2>
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

const headerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
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

const listStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-4)',
  paddingBottom: 'var(--space-2)',
  minWidth: 'max-content',
};

const cardWrapperStyles: React.CSSProperties = {
  width: '180px',
};
