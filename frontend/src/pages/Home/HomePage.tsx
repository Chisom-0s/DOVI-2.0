import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HeroBannerCarousel from '@/components/home/HeroBannerCarousel';
import ProductCard from '@/components/product/ProductCard';
import { homepageApi, getCachedHomepageSections } from '@/api/homepage';
import { formatPrice } from '@/utils/currency';
import { getProductImageUrl, getProductFallbackImage } from '@/utils/image';
import type { HomepageSection, ProductSummary } from '@/types';
import {
  ProductCardSkeleton,
  SectionSkeleton,
} from '@/components/common/Skeleton';

const DEFAULT_CATEGORIES = [
  { id: 'cat-phones', name: 'Phones & Tablets', slug: 'phones-tablets', icon: '📱' },
  { id: 'cat-computers', name: 'Computers', slug: 'computers', icon: '💻' },
  { id: 'cat-electronics', name: 'Electronics', slug: 'electronics', icon: '🔌' },
  { id: 'cat-gaming', name: 'Gaming', slug: 'gaming', icon: '🎮' },
  { id: 'cat-auto-parts', name: 'Auto Parts', slug: 'auto-parts', icon: '⚙️' },
  { id: 'cat-auto-acc', name: 'Auto Accessories', slug: 'auto-accessories', icon: '🚗' },
];

const DEFAULT_VENDORS = [
  { id: 'vend-slot', name: 'SLOT Nigeria', rating: '4.8', location: 'Ikeja, Lagos' },
  { id: 'vend-apple', name: 'iConnect Store', rating: '4.9', location: 'Lekki, Lagos' },
  { id: 'vend-lubes', name: 'Dovi Auto Hub', rating: '4.7', location: 'Enugu, Nigeria' },
];

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
    const categories = section.categories || DEFAULT_CATEGORIES;
    const vendors = section.vendors || DEFAULT_VENDORS;

    // If section products are still loading, show individual skeletons matching layout
    if (products.length === 0 && layout !== 'BANNER' && layout !== 'CATEGORY_PILLS' && layout !== 'CATEGORY_GRID' && layout !== 'CATEGORY_CIRCLES' && layout !== 'VENDOR_GRID' && layout !== 'BRAND_GRID') {
      if (layout === 'HORIZONTAL_CAROUSEL') {
        return (
          <div style={carouselScrollStyles} className="hide-scrollbar">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} style={{ minWidth: '150px', flexShrink: 0 }}>
                <ProductCardSkeleton />
              </div>
            ))}
          </div>
        );
      }
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
        return (
          <div className="marketplace-product-grid">
            {products.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        );

      case 'HORIZONTAL_CAROUSEL':
        return (
          <div style={carouselScrollStyles} className="hide-scrollbar">
            {products.map(p => (
              <div key={p.id} style={{ minWidth: '150px', flexShrink: 0 }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        );

      case 'COMPACT_LIST':
        return (
          <div style={listStyles}>
            {products.map(p => (
              <Link to={`/products/${p.id}`} key={p.id} style={listItemStyles}>
                <img
                  src={getProductImageUrl(p)}
                  alt={p.name}
                  style={listThumbStyles}
                  onError={e => {
                    (e.target as HTMLImageElement).src = getProductFallbackImage(p);
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={listItemNameStyles}>{p.name}</div>
                  <div style={listItemPriceStyles}>
                    {formatPrice(p)}
                    {p.original_price && (
                      <span style={listOriginalPriceStyles}>
                        {formatPrice(p.original_price)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        );

      case 'LARGE_PRODUCT_CARDS':
        return (
          <div style={largeGridStyles}>
            {products.map(p => (
              <Link to={`/products/${p.id}`} key={p.id} style={largeCardStyles}>
                <div style={largeCardImageWrapperStyles}>
                  <img
                    src={getProductImageUrl(p)}
                    alt={p.name}
                    style={largeCardImageStyles}
                    onError={e => {
                      (e.target as HTMLImageElement).src = getProductFallbackImage(p);
                    }}
                  />
                </div>
                <div style={largeCardBodyStyles}>
                  <div style={largeCardTitleStyles}>{p.name}</div>
                  <div style={largeCardFooterStyles}>
                    <span style={largeCardPriceStyles}>{formatPrice(p)}</span>
                    {p.discount_percentage !== undefined && p.discount_percentage > 0 && (
                      <span style={largeCardDiscountStyles}>-{p.discount_percentage}% OFF</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        );

      case 'CATEGORY_GRID':
      case 'CATEGORY_CIRCLES':
        return (
          <div style={categoriesGridStyles}>
            {categories.map(c => (
              <Link to={`/categories/${c.slug}`} key={c.id} style={categoryCircleStyles}>
                <div style={categoryIconCircleStyles}>
                  {c.icon || '📦'}
                </div>
                <span style={categoryNameStyles}>{c.name}</span>
              </Link>
            ))}
          </div>
        );

      case 'CATEGORY_PILLS':
        return (
          <div style={carouselScrollStyles} className="hide-scrollbar">
            {categories.map(c => (
              <Link to={`/categories/${c.slug}`} key={c.id} style={pillStyles}>
                <span>{c.icon || '📦'}</span>
                <span>{c.name}</span>
              </Link>
            ))}
          </div>
        );

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

      case 'VENDOR_GRID':
      case 'BRAND_GRID':
        return (
          <div style={vendorsGridStyles}>
            {vendors.map(v => (
              <Link to={`/vendors/${v.id}`} key={v.id} style={vendorCardStyles}>
                <div style={vendorAvatarStyles}>
                  {v.name.charAt(0).toUpperCase()}
                </div>
                <div style={vendorNameStyles}>{v.name}</div>
                <div style={vendorRatingStyles}>⭐ {v.rating} · {v.location}</div>
              </Link>
            ))}
          </div>
        );

      case 'AUTO_LISTING_GRID':
        return (
          <div className="marketplace-product-grid">
            {products.map(p => (
              <Link to={`/products/${p.id}`} key={p.id} style={autoTeaserCardStyles}>
                <div style={autoTeaserImgWrapperStyles}>
                  <img
                    src={getProductImageUrl(p)}
                    alt={p.name}
                    style={autoTeaserImgStyles}
                    onError={e => {
                      (e.target as HTMLImageElement).src = getProductFallbackImage(p);
                    }}
                  />
                  <span style={autoTeaserBadgeStyles}>
                    {formatPrice(p)}
                  </span>
                </div>
                <div style={autoTeaserBodyStyles}>
                  <div style={autoTeaserTitleStyles}>{p.name}</div>
                  <div style={autoTeaserCategoryStyles}>{p.category?.name || 'Auto'}</div>
                </div>
              </Link>
            ))}
          </div>
        );

      default:
        return null;
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
          sections.map(section => (
            <section key={section.id} style={sectionWrapperStyles}>
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


const carouselScrollStyles: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  overflowX: 'auto',
  paddingBottom: '8px',
  width: '100%',
};

const listStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const listItemStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  textDecoration: 'none',
  color: 'inherit',
  padding: '12px',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  backgroundColor: '#ffffff',
  transition: 'border-color 150ms ease',
};

const listThumbStyles: React.CSSProperties = {
  width: '48px',
  height: '48px',
  objectFit: 'contain',
  borderRadius: '4px',
  backgroundColor: '#f9fafb',
};

const listItemNameStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
};

const listItemPriceStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-primary)',
  marginTop: '4px',
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
};

const listOriginalPriceStyles: React.CSSProperties = {
  textDecoration: 'line-through',
  color: 'var(--color-text-muted)',
  fontWeight: 'var(--font-normal)',
};

const largeGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
};

const largeCardStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  textDecoration: 'none',
  color: 'inherit',
  border: '1px solid var(--color-border)',
  borderRadius: '12px',
  overflow: 'hidden',
  backgroundColor: '#ffffff',
};

const largeCardImageWrapperStyles: React.CSSProperties = {
  height: '180px',
  backgroundColor: '#f9fafb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
};

const largeCardImageStyles: React.CSSProperties = {
  maxHeight: '100%',
  maxWidth: '100%',
  objectFit: 'contain',
};

const largeCardBodyStyles: React.CSSProperties = {
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const largeCardTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  height: '40px',
  overflow: 'hidden',
  lineHeight: '1.4',
};

const largeCardFooterStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '4px',
};

const largeCardPriceStyles: React.CSSProperties = {
  color: 'var(--color-primary)',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-sm)',
};

const largeCardDiscountStyles: React.CSSProperties = {
  fontSize: '9px',
  color: '#ffffff',
  backgroundColor: 'var(--color-primary)',
  padding: '2px 6px',
  borderRadius: '4px',
  fontWeight: 'var(--font-bold)',
};

const categoriesGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '16px',
};

const categoryCircleStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
  textDecoration: 'none',
  color: 'inherit',
};

const categoryIconCircleStyles: React.CSSProperties = {
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 122, 0, 0.06)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '24px',
  transition: 'transform 150ms ease',
};

const categoryNameStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
  textAlign: 'center',
};

const pillStyles: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '99px',
  border: '1px solid var(--color-border)',
  backgroundColor: '#ffffff',
  textDecoration: 'none',
  color: 'inherit',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
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
  fontSize: '20px',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  margin: 0,
};

const bannerSubtitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
  marginTop: '8px',
  marginRepeat: 0,
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

const vendorsGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
};

const vendorCardStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
  padding: '16px',
  border: '1px solid var(--color-border)',
  borderRadius: '12px',
  textDecoration: 'none',
  color: 'inherit',
  backgroundColor: '#f9fafb',
};

const vendorAvatarStyles: React.CSSProperties = {
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '20px',
  fontWeight: 'var(--font-bold)',
};

const vendorNameStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  textAlign: 'center',
};

const vendorRatingStyles: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--color-text-muted)',
};


const autoTeaserCardStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  textDecoration: 'none',
  color: 'inherit',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: '#ffffff',
};

const autoTeaserImgWrapperStyles: React.CSSProperties = {
  height: '110px',
  backgroundColor: '#f3f4f6',
  position: 'relative',
};

const autoTeaserImgStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const autoTeaserBadgeStyles: React.CSSProperties = {
  position: 'absolute',
  bottom: '6px',
  left: '6px',
  backgroundColor: 'rgba(0,0,0,0.65)',
  color: '#ffffff',
  fontSize: '10px',
  padding: '2px 6px',
  borderRadius: '4px',
  fontWeight: 'var(--font-bold)',
};

const autoTeaserBodyStyles: React.CSSProperties = {
  padding: '8px',
};

const autoTeaserTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-bold)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const autoTeaserCategoryStyles: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--color-text-muted)',
  marginTop: '4px',
};

const emptyStyles: React.CSSProperties = {
  textAlign: 'center',
  padding: 'var(--space-16) 0',
  border: '1px dashed var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-muted)',
};
