import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HeroBannerCarousel from '@/components/home/HeroBannerCarousel';
import GiveawayBanner from '@/components/home/GiveawayBanner';
import ProductCard from '@/components/product/ProductCard';
import DealsAndDiscountsSection from '@/components/home/DealsAndDiscountsSection';
import TrendingNowCarousel from '@/components/home/TrendingNowCarousel';
import { homepageApi, getCachedHomepageSections } from '@/api/homepage';
import type { HomepageSection, ProductSummary } from '@/types';
import {
  ProductCardSkeleton,
  SectionSkeleton,
} from '@/components/common/Skeleton';

// Mandatory Homepage Section Ordering Specification:
// 1. Hero Banner
// 2. Best Sellers
// 3. Deals & Discounts
// 4. Trending Now
// 5. Save2Own
// 6. New Arrivals
// 7. Hot Sales
// 8. Featured Products

interface SectionSlotConfig {
  key: string;
  alternateKeys?: string[];
  defaultTitle: string;
  defaultSubtitle: string;
  defaultLayout: 'PRODUCT_GRID' | 'HORIZONTAL_CAROUSEL' | 'BANNER';
  ctaUrl: string;
  ctaText: string;
}

const ORDERED_SECTION_SLOTS: SectionSlotConfig[] = [
  {
    key: 'BEST_SELLERS',
    alternateKeys: ['sec-best-sellers'],
    defaultTitle: 'Best Sellers',
    defaultSubtitle: 'Top performing products in the catalog',
    defaultLayout: 'PRODUCT_GRID',
    ctaUrl: '/products?section=best-sellers',
    ctaText: 'View All',
  },
  {
    key: 'DISCOUNTS',
    alternateKeys: ['DEALS_AND_DISCOUNTS', 'sec-discounts'],
    defaultTitle: 'Deals & Discounts',
    defaultSubtitle: 'Exclusive markdowns and limited-time discounts',
    defaultLayout: 'HORIZONTAL_CAROUSEL',
    ctaUrl: '/products?section=deals-and-discounts',
    ctaText: 'View All',
  },
  {
    key: 'TRENDING_NOW',
    alternateKeys: ['TRENDING', 'sec-trending'],
    defaultTitle: 'Trending Now',
    defaultSubtitle: 'High demand products right now',
    defaultLayout: 'HORIZONTAL_CAROUSEL',
    ctaUrl: '/products?section=trending',
    ctaText: 'View All',
  },
  {
    key: 'SPECIAL_PROMO',
    alternateKeys: ['SAVE2OWN', 'sec-special-promo'],
    defaultTitle: 'Unlock Save2Own Benefits',
    defaultSubtitle: 'Contribute in bits towards purchasing high-value items without any interest.',
    defaultLayout: 'BANNER',
    ctaUrl: '/save2own',
    ctaText: 'Start Saving',
  },
  {
    key: 'NEW_ARRIVALS',
    alternateKeys: ['sec-new-arrivals'],
    defaultTitle: 'New Arrivals',
    defaultSubtitle: 'Freshly added to the catalog',
    defaultLayout: 'PRODUCT_GRID',
    ctaUrl: '/products?section=new-arrivals',
    ctaText: 'View All',
  },
  {
    key: 'HOT_SALES',
    alternateKeys: ['sec-hot-sales'],
    defaultTitle: 'Hot Sales',
    defaultSubtitle: 'Most popular purchases this week',
    defaultLayout: 'HORIZONTAL_CAROUSEL',
    ctaUrl: '/products?section=hot-sales',
    ctaText: 'View All',
  },
  {
    key: 'FEATURED_PRODUCTS',
    alternateKeys: ['FEATURED', 'sec-featured'],
    defaultTitle: 'Featured Products',
    defaultSubtitle: 'Hand-picked essentials curated for you',
    defaultLayout: 'PRODUCT_GRID',
    ctaUrl: '/products?section=featured',
    ctaText: 'View All',
  },
];

export default function HomePage() {
  // Mount with cached sections for immediate render
  const [sectionsMap, setSectionsMap] = useState<Record<string, HomepageSection>>(() => {
    const cached = getCachedHomepageSections();
    const map: Record<string, HomepageSection> = {};
    for (const s of cached) {
      map[s.key] = s;
      if (s.id) map[s.id] = s;
    }
    return map;
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => Object.keys(sectionsMap).length === 0);

  useEffect(() => {
    let isMounted = true;

    const loadHomeData = async () => {
      try {
        const data = await homepageApi.getData();
        if (isMounted && data && Array.isArray(data.sections)) {
          const map: Record<string, HomepageSection> = {};
          for (const s of data.sections) {
            map[s.key] = s;
            if (s.id) map[s.id] = s;
          }
          setSectionsMap(map);
        }
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadHomeData();

    window.addEventListener('dovi-merchandising-updated', loadHomeData);
    window.addEventListener('dovi-homepage-placements-updated', loadHomeData);

    return () => {
      isMounted = false;
      window.removeEventListener('dovi-merchandising-updated', loadHomeData);
      window.removeEventListener('dovi-homepage-placements-updated', loadHomeData);
    };
  }, []);

  const findSection = (slot: SectionSlotConfig): HomepageSection | null => {
    if (sectionsMap[slot.key]) return sectionsMap[slot.key];
    if (slot.alternateKeys) {
      for (const k of slot.alternateKeys) {
        if (sectionsMap[k]) return sectionsMap[k];
      }
    }
    return null;
  };

  const renderSectionContent = (slot: SectionSlotConfig, section: HomepageSection | null) => {
    const products: ProductSummary[] = section?.products || [];
    const layout = section?.configuration?.layout || slot.defaultLayout;

    // Loading State
    if (isLoading && products.length === 0 && layout !== 'BANNER') {
      return (
        <div style={{ marginTop: '12px' }}>
          {layout === 'HORIZONTAL_CAROUSEL' ? (
            <SectionSkeleton layout="HORIZONTAL_CAROUSEL" count={4} />
          ) : (
            <div className="marketplace-product-grid">
              {Array.from({ length: 4 }).map((_, idx) => (
                <ProductCardSkeleton key={idx} />
              ))}
            </div>
          )}
        </div>
      );
    }

    // Save2Own / Special Promo Banner
    if (layout === 'BANNER' || slot.key === 'SPECIAL_PROMO') {
      return (
        <div
          style={{
            ...bannerStyles,
            backgroundColor: section?.configuration?.background_color || 'rgba(255, 122, 0, 0.05)',
          }}
        >
          <div style={bannerContentStyles}>
            <h3 style={bannerTitleStyles}>{section?.title || slot.defaultTitle}</h3>
            <p style={bannerSubtitleStyles}>{section?.subtitle || slot.defaultSubtitle}</p>
            <Link to={section?.configuration?.cta_url || slot.ctaUrl} style={bannerCtaStyles}>
              {section?.configuration?.cta_text || slot.ctaText} →
            </Link>
          </div>
        </div>
      );
    }

    // Deals & Discounts Dedicated Component
    if (slot.key === 'DISCOUNTS' || slot.key === 'DEALS_AND_DISCOUNTS') {
      return (
        <DealsAndDiscountsSection
          products={products}
          title={section?.title || slot.defaultTitle}
          subtitle={section?.subtitle || slot.defaultSubtitle}
          viewAllUrl={section?.configuration?.cta_url || slot.ctaUrl}
        />
      );
    }

    // Trending Now Dedicated Carousel
    if (slot.key === 'TRENDING_NOW') {
      return <TrendingNowCarousel products={products} />;
    }

    // Horizontal Carousel Layout
    if (layout === 'HORIZONTAL_CAROUSEL') {
      if (products.length === 0) {
        return (
          <div style={emptySectionStyles}>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              No items currently listed in this collection. Check back soon!
            </p>
          </div>
        );
      }
      return (
        <div
          className="homepage-carousel-container"
          style={{
            display: 'flex',
            gap: '16px',
            overflowX: 'auto',
            paddingBottom: '16px',
            paddingTop: '4px',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
          }}
        >
          {products.map((p) => (
            <div key={p.id} style={{ flex: '0 0 230px', minWidth: '220px', scrollSnapAlign: 'start' }}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      );
    }

    // Product Grid Layout (Default)
    if (products.length === 0) {
      return (
        <div style={emptySectionStyles}>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            No items currently listed in this collection. Check back soon!
          </p>
        </div>
      );
    }

    return (
      <div className="marketplace-product-grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    );
  };

  return (
    <div style={pageStyles}>
      {/* SECTION 1: Hero Banner */}
      <div className="container" style={topBannerWrapperStyles}>
        <HeroBannerCarousel />
      </div>

      {/* Promotional Launch Giveaway Banner (Clearly visible promotional placement without disrupting 8 section order) */}
      <div className="container" style={{ width: '100%' }}>
        <GiveawayBanner />
      </div>

      {/* STRICT HOMEPAGE SECTION SLOTS (Sections 2 through 8 in immutable order) */}
      <div className="container" style={sectionsListStyles}>
        {ORDERED_SECTION_SLOTS.map((slot, index) => {
          const section = findSection(slot);
          const isBanner = slot.defaultLayout === 'BANNER';
          const isCustomSpecial = slot.key === 'DISCOUNTS' || slot.key === 'DEALS_AND_DISCOUNTS' || slot.key === 'TRENDING_NOW';
          const title = section?.title || slot.defaultTitle;
          const subtitle = section?.subtitle || slot.defaultSubtitle;
          const ctaUrl = section?.configuration?.cta_url || slot.ctaUrl;
          const ctaText = section?.configuration?.cta_text || slot.ctaText;

          return (
            <section
              key={slot.key}
              data-section-order={index + 2}
              data-section-key={slot.key}
              style={sectionWrapperStyles}
            >
              {/* Section Header (rendered for standard product grid / carousel sections) */}
              {!isBanner && !isCustomSpecial && (
                <div style={sectionHeaderStyles}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <h2 style={sectionTitleStyles}>{title}</h2>
                    {subtitle && <p style={sectionSubtitleStyles}>{subtitle}</p>}
                  </div>
                  <Link to={ctaUrl} style={seeAllStyles}>
                    {ctaText} &gt;
                  </Link>
                </div>
              )}

              {/* Section Content */}
              {renderSectionContent(slot, section)}
            </section>
          );
        })}
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const pageStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-bg)',
  paddingTop: 'var(--space-4)',
  paddingBottom: 'var(--space-12)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const topBannerWrapperStyles: React.CSSProperties = {
  width: '100%',
};

const sectionsListStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-8)',
  width: '100%',
};

const sectionWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  width: '100%',
};

const sectionHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '4px',
};

const sectionTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  margin: 0,
  lineHeight: 'var(--leading-tight)',
};

const sectionSubtitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
  margin: '4px 0 0 0',
  lineHeight: 'var(--leading-normal)',
};

const seeAllStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-primary)',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

const bannerStyles: React.CSSProperties = {
  display: 'flex',
  borderRadius: '12px',
  padding: '24px',
  border: '1px solid var(--color-border)',
  position: 'relative',
  overflow: 'hidden',
};

const bannerContentStyles: React.CSSProperties = {
  flex: 1,
  zIndex: 2,
};

const bannerTitleStyles: React.CSSProperties = {
  fontSize: 'clamp(1.1rem, 2.5vw, 1.375rem)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  margin: 0,
  lineHeight: 'var(--leading-tight)',
};

const bannerSubtitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
  marginTop: '8px',
  lineHeight: 'var(--leading-normal)',
};

const bannerCtaStyles: React.CSSProperties = {
  display: 'inline-block',
  marginTop: '16px',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  padding: '8px 18px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-xs)',
};

const emptySectionStyles: React.CSSProperties = {
  padding: '24px',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  border: '1px dashed #cbd5e1',
  textAlign: 'center',
};
