import React from 'react';
import { Link } from 'react-router-dom';
import type { ProductSummary } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import { isDiscountActiveNow } from '@/services/homepagePlacementService';

interface DealsAndDiscountsSectionProps {
  products: ProductSummary[];
  title?: string;
  subtitle?: string;
  viewAllUrl?: string;
}

export default function DealsAndDiscountsSection({
  products,
  title = 'Deals & Discounts',
  subtitle = 'Exclusive markdowns and limited-time discounts',
  viewAllUrl = '/products?section=deals-and-discounts',
}: DealsAndDiscountsSectionProps) {
  const now = new Date();

  // Filter for valid active discounts
  const activeDealProducts = (products || []).filter((p) => {
    const discountConfig = (p as any).discount_config;
    if (discountConfig) {
      return isDiscountActiveNow(discountConfig, now);
    }
    return Boolean((p as any).is_discount) || ((p as any).discount_percentage && (p as any).discount_percentage > 0);
  });

  if (!activeDealProducts || activeDealProducts.length === 0) {
    return null; // Gracefully omit section if no products are on active promotion
  }

  return (
    <div className="deals-and-discounts-section" style={{ width: '100%' }}>
      {/* Clean standard section header matching other homepage collections */}
      <div style={sectionHeaderStyles}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h2 style={sectionTitleStyles}>
            <span style={{ marginRight: '6px' }}>🏷️</span>
            {title}
          </h2>
          {subtitle && <p style={sectionSubtitleStyles}>{subtitle}</p>}
        </div>
        <Link to={viewAllUrl} style={seeAllStyles}>
          View All &gt;
        </Link>
      </div>

      {/* Horizontal Carousel of standard compact Product Cards */}
      <div
        className="homepage-carousel-container"
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '12px',
          paddingTop: '2px',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
        }}
      >
        {activeDealProducts.map((p) => (
          <div
            key={p.id}
            style={{
              flex: '0 0 170px',
              minWidth: '160px',
              maxWidth: '200px',
              scrollSnapAlign: 'start',
            }}
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}

const sectionHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px',
  gap: '12px',
  flexWrap: 'wrap',
};

const sectionTitleStyles: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#0f172a',
  margin: 0,
  lineHeight: 1.25,
};

const sectionSubtitleStyles: React.CSSProperties = {
  fontSize: '12px',
  color: '#64748b',
  margin: 0,
};

const seeAllStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#ff7a00',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
};
