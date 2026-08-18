import { useEffect, useState } from 'react';
import HeroBannerCarousel from '@/components/home/HeroBannerCarousel';
import CategoryGrid from '@/components/home/CategoryGrid';
import ProductRow from '@/components/product/ProductRow';
import { homepageApi } from '@/api/homepage';
import { productsApi } from '@/api/products';
import type { HomepageSection, ProductSummary } from '@/types';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function HomePage() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [sectionData, setSectionData] = useState<Record<string, ProductSummary[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch sections config and product data for sections
  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const sectionsConfig = await homepageApi.getSections();
        const activeSections = sectionsConfig
          .filter(s => s.visible)
          .sort((a, b) => a.display_order - b.display_order);

        setSections(activeSections);

        // Fetch product list data for all visible sections in parallel
        const dataPromises = activeSections.map(async section => {
          let products: ProductSummary[] = [];
          try {
            switch (section.key) {
              case 'flash_deals':
                products = await productsApi.flashDeals();
                break;
              case 'trending_now':
                products = await productsApi.trending();
                break;
              case 'best_sellers':
                products = await productsApi.bestSellers();
                break;
              case 'new_arrivals':
                products = await productsApi.newArrivals();
                break;
              case 'top_rated':
                products = await productsApi.topRated();
                break;
              case 'budget_deals':
                products = await productsApi.budgetDeals();
                break;
              case 'featured_products':
                products = await productsApi.featured();
                break;
              case 'marketplace_feed':
                const feed = await productsApi.list({ page_size: 10 });
                products = feed.results;
                break;
            }
          } catch (err) {
            console.warn(`Failed to load products for section: ${section.key}`, err);
          }
          return { key: section.key, products };
        });

        const results = await Promise.all(dataPromises);
        const mappedData: Record<string, ProductSummary[]> = {};
        results.forEach(res => {
          mappedData[res.key] = res.products;
        });

        setSectionData(mappedData);
      } catch (err) {
        console.error('Failed to load homepage sections:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadHomeData();
  }, []);

  // Section component mapper
  const renderSection = (section: HomepageSection) => {
    const products = sectionData[section.key] ?? [];

    switch (section.key) {
      case 'popular_categories':
        return <CategoryGrid key={section.id} />;

      case 'flash_deals':
      case 'trending_now':
      case 'best_sellers':
      case 'new_arrivals':
      case 'top_rated':
      case 'budget_deals':
      case 'featured_products':
      case 'marketplace_feed':
        return (
          <ProductRow
            key={section.id}
            title={section.title}
            products={products}
            isLoading={isLoading}
          />
        );

      case 'student_essentials':
        return (
          <section key={section.id} style={teaserCardStyles}>
            <div style={teaserContentStyles}>
              <span style={teaserBadgeStyles}>Student Hub</span>
              <h2 style={teaserTitleStyles}>{section.title}</h2>
              <p style={teaserDescStyles}>Back to school essentials at special discounted rates.</p>
              <a href="/products?category=student" style={teaserLinkStyles}>Shop Essentials &rarr;</a>
            </div>
          </section>
        );

      case 'save2own':
        return (
          <section key={section.id} style={teaserCardStyles}>
            <div style={{ ...teaserContentStyles, borderLeftColor: 'var(--color-primary)' }}>
              <span style={{ ...teaserBadgeStyles, backgroundColor: 'var(--color-primary)' }}>Save2Own</span>
              <h2 style={teaserTitleStyles}>{section.title}</h2>
              <p style={teaserDescStyles}>Contribute in bits towards purchasing high-value items without breaking the bank.</p>
              <a href="/save2own" style={teaserLinkStyles}>Start Saving &rarr;</a>
            </div>
          </section>
        );

      case 'dovi_auto':
        return (
          <section key={section.id} style={teaserCardStyles}>
            <div style={{ ...teaserContentStyles, borderLeftColor: 'var(--color-success)' }}>
              <span style={{ ...teaserBadgeStyles, backgroundColor: 'var(--color-success)' }}>Dovi Auto</span>
              <h2 style={teaserTitleStyles}>{section.title}</h2>
              <p style={teaserDescStyles}>Discover cars, compatibility parts, accessories, and bookings on auto rentals.</p>
              <a href="/auto" style={teaserLinkStyles}>Go to Dovi Auto &rarr;</a>
            </div>
          </section>
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
        {isLoading ? (
          <div style={loaderStyles}>
            <LoadingSpinner size="lg" />
            <p style={loaderTextStyles}>Loading marketplace sections...</p>
          </div>
        ) : sections.length > 0 ? (
          sections.map(section => renderSection(section))
        ) : (
          <div style={emptyStyles}>
            <h3>Welcome to Dovi</h3>
            <p>Connection with backend server is offline.</p>
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
  gap: 'var(--space-6)',
};

const loaderStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--space-16) 0',
  gap: 'var(--space-4)',
};

const loaderTextStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
};

const emptyStyles: React.CSSProperties = {
  textAlign: 'center',
  padding: 'var(--space-16) 0',
  border: '1px dashed var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-muted)',
};

const teaserCardStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
};

const teaserContentStyles: React.CSSProperties = {
  padding: 'var(--space-6)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
  borderLeft: '4px solid var(--color-primary)',
};

const teaserBadgeStyles: React.CSSProperties = {
  display: 'inline-block',
  alignSelf: 'flex-start',
  fontSize: '10px',
  fontWeight: 'var(--font-bold)',
  backgroundColor: 'var(--color-primary)',
  color: 'white',
  padding: '2px 8px',
  borderRadius: 'var(--radius-full)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const teaserTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-md)',
  fontWeight: 'var(--font-bold)',
};

const teaserDescStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
};

const teaserLinkStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-primary)',
  textDecoration: 'none',
  marginTop: 'var(--space-2)',
};
