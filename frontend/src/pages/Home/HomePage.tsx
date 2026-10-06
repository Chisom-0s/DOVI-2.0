import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import HeroBannerCarousel from '@/components/home/HeroBannerCarousel';
import ProductCard from '@/components/product/ProductCard';
import { homepageApi, getCachedHomepageSections } from '@/api/homepage';
import type { HomepageSection, ProductSummary } from '@/types';
import {
  ProductCardSkeleton,
  SectionSkeleton,
} from '@/components/common/Skeleton';


// LazySection component defers below-the-fold content rendering until within 350px of viewport
function LazySection({ children, priority = false }: { children: React.ReactNode; priority?: boolean }) {
  const [isVisible, setIsVisible] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority || isVisible) return;
    const el = containerRef.current;
    if (!el) return;

    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '350px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [priority, isVisible]);

  if (!isVisible) {
    return (
      <div ref={containerRef} style={{ minHeight: '260px', margin: 'var(--space-6) 0' }}>
        <SectionSkeleton layout="HORIZONTAL_CAROUSEL" count={4} />
      </div>
    );
  }

  return <div ref={containerRef}>{children}</div>;
}

export default function HomePage() {
  // 1. Mount immediately with synchronous cached/seed sections (0ms perceived load time)
  const [sections, setSections] = useState<HomepageSection[]>(() => getCachedHomepageSections());
  const [isLoading, setIsLoading] = useState<boolean>(() => sections.length === 0);

  useEffect(() => {
    let isMounted = true;

    const loadHomeData = async () => {
      try {
        if (sections.length === 0) {
          setIsLoading(true);
        }
        const data = await homepageApi.getData();
        const now = new Date();
        const active = (data.sections || []).filter(section => {
          if (!section.is_active) return false;
          if (
            section.key === 'FEATURED_CATEGORIES' ||
            section.key === 'TOP_VENDORS' ||
            section.configuration?.layout === 'VENDOR_GRID' ||
            section.configuration?.layout === 'CATEGORY_GRID' ||
            section.configuration?.layout === 'CATEGORY_CIRCLES' ||
            section.configuration?.layout === 'CATEGORY_PILLS' ||
            section.configuration?.layout === 'BRAND_GRID'
          ) return false;
          if (section.starts_at && new Date(section.starts_at) > now) return false;
          if (section.ends_at && new Date(section.ends_at) < now) return false;
          return true;
        });

        if (isMounted) {
          setSections(active.sort((a, b) => a.sort_order - b.sort_order));
        }
      } catch (err) {
        console.error('Failed to revalidate homepage sections:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadHomeData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Registry parser mapping configuration layout rules dynamically to HTML blocks
  const renderLayout = (section: HomepageSection) => {
    const layout = section.configuration?.layout || 'PRODUCT_GRID';
    const products: ProductSummary[] = section.products || [];

    // If section products are still loading, show individual skeletons matching layout
    if (products.length === 0 && layout !== 'BANNER') {
      return (
        <div className="marketplace-product-grid">
          {Array.from({ length: 4 }).map((_, idx) => (
            <ProductCardSkeleton key={idx} />
          ))}
        </div>
      );
    }

    switch (layout) {
      case 'PRODUCT_GRID':
      case 'HORIZONTAL_CAROUSEL':
      case 'COMPACT_LIST':
      case 'LARGE_PRODUCT_CARDS':
      case 'AUTO_LISTING_GRID':
        return (
          <div className="marketplace-product-grid">
            {products.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        );

      case 'CATEGORY_GRID':
      case 'CATEGORY_CIRCLES':
      case 'CATEGORY_PILLS':
      case 'VENDOR_GRID':
      case 'BRAND_GRID':
        return null;

      case 'BANNER':
        return (
          <div
            style={{
              ...bannerStyles,
              backgroundColor: section.configuration?.background_color || 'rgba(255, 122, 0, 0.05)',
            }}
          >
            <div style={bannerContentStyles}>
              <h3 style={bannerTitleStyles}>{section.title}</h3>
              {section.subtitle && <p style={bannerSubtitleStyles}>{section.subtitle}</p>}
              {section.configuration?.cta_text && (
                <a href={section.configuration.cta_url || '#'} style={bannerCtaStyles}>
                  {section.configuration.cta_text}
                </a>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="marketplace-product-grid">
            {products.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        );
    }
  };

  return (
    <div style={pageStyles}>
      {/* Top Banner Carousel */}
      <div className="container" style={topBannerWrapperStyles}>
        <HeroBannerCarousel />
      </div>

      {/* Dynamic Sections Grid */}
      <div className="container" style={sectionsListStyles}>
        {isLoading && sections.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <SectionSkeleton layout="CATEGORY_PILLS" title="Categories" />
            <SectionSkeleton layout="HORIZONTAL_CAROUSEL" title="Flash Deals" count={5} />
            <SectionSkeleton layout="PRODUCT_GRID" title="New Arrivals" count={4} />
            <SectionSkeleton layout="HORIZONTAL_CAROUSEL" title="Trending Now" count={5} />
            <SectionSkeleton layout="PRODUCT_GRID" title="Best Sellers" count={4} />
          </div>
        ) : sections.length > 0 ? (
          sections.map((section, idx) => (
            <LazySection key={section.id} priority={idx < 2}>
              <section style={sectionWrapperStyles}>
              {/* Section Header */}
              {section.configuration?.layout !== 'BANNER' && (
                <div style={sectionHeaderStyles}>
                  <div>
                    <h2 style={sectionTitleStyles}>
                      {section.icon && <span style={{ marginRight: '8px' }}>{section.icon}</span>}
                      {section.title}
                    </h2>
                    {section.subtitle && <p style={sectionSubtitleStyles}>{section.subtitle}</p>}
                  </div>
                  {section.configuration?.cta_text && (
                    <Link to={section.configuration.cta_url || '/products'} style={seeAllStyles}>
                      {section.configuration.cta_text} &gt;
                    </Link>
                  )}
                </div>
              )}

              {/* Dynamic Layout Parser */}
              {renderLayout(section)}
            </section>
          </LazySection>
        ))
        ) : (
          <div style={emptyStyles}>
            <h3>No Sections Active</h3>
            <p>Go to Admin Dashboard homepage manager to configure section layouts.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const pageStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-bg)',
  paddingTop: 'var(--space-6)',
  paddingBottom: 'var(--space-12)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
};

const topBannerWrapperStyles: React.CSSProperties = {
  width: '100%',
};

const sectionsListStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-8)',
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
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  margin: 0,
};

const sectionSubtitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  margin: '4px 0 0 0',
};

const seeAllStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-primary)',
  textDecoration: 'none',
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
  fontSize: '20px',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  margin: 0,
};

const bannerSubtitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
  marginTop: '8px',
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

const emptyStyles: React.CSSProperties = {
  textAlign: 'center',
  padding: 'var(--space-16) 0',
  border: '1px dashed var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-muted)',
};
