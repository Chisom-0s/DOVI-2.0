import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { homepageApi } from '@/api/homepage';
import { productsApi } from '@/api/products';
import ProductCard from '@/components/product/ProductCard';
import { SkeletonCard } from '@/components/common/Skeleton';
import type { ProductSummary, HomepageBanner } from '@/types';

interface CampaignMeta {
  key: string;
  title: string;
  subtitle: string;
  bannerImage: string;
  badgeText: string;
  discountBadge?: string;
  themeColor: string;
  accentBg: string;
  rules?: string[];
  showCountdown?: boolean;
}

const CAMPAIGN_REGISTRY: Record<string, CampaignMeta> = {
  launch: {
    key: 'launch',
    title: 'DOVI Launch Campaign',
    subtitle: 'Discover More, Shop Smart. Official launch pricing, certified sellers, fast nationwide shipping, and secure payments.',
    bannerImage: '/images/hero/hero_launch_campaign.jpg',
    badgeText: '🚀 Official Launch Offer',
    discountBadge: 'Exclusive Launch Deals',
    themeColor: '#ff7a00',
    accentBg: 'linear-gradient(135deg, rgba(255, 122, 0, 0.08) 0%, rgba(255, 122, 0, 0.02) 100%)',
  },
  'black-friday': {
    key: 'black-friday',
    title: 'Black Friday Mega Deals',
    subtitle: 'Massive doorbuster savings on premium electronics, smartphones, audio gear, and lifestyle fashion. Up to 70% OFF while supplies last!',
    bannerImage: '/images/hero/hero_black_friday.jpg',
    badgeText: '🔥 Mega Flash Discounts',
    discountBadge: 'Up to 70% OFF',
    themeColor: '#dc2626',
    accentBg: 'linear-gradient(135deg, rgba(220, 38, 38, 0.08) 0%, rgba(220, 38, 38, 0.02) 100%)',
    showCountdown: true,
  },
  'price-drops': {
    key: 'price-drops',
    title: 'Price Drops — More Value, Less Spending',
    subtitle: 'Real, verified markdowns across high-demand inventory. Every product in this collection features active discounted rates.',
    bannerImage: '/images/hero/hero_price_drops.jpg',
    badgeText: '📉 Verified Price Drops',
    discountBadge: 'Huge Markdowns',
    themeColor: '#8b5cf6',
    accentBg: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.02) 100%)',
  },
  giveaway: {
    key: 'giveaway',
    title: 'Free Gifts & Shopping Rewards',
    subtitle: 'Shop qualifying products to unlock free shopping gifts including DOVI 3D Audio Wireless EarPods and exclusive gift packages!',
    bannerImage: '/images/hero/hero_free_gifts.jpg',
    badgeText: '🎁 Free Gift Promotion',
    discountBadge: 'Cart ₦30,000+ Qualifies',
    themeColor: '#7c3aed',
    accentBg: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(124, 58, 237, 0.02) 100%)',
    rules: [
      'Orders with subtotal of ₦30,000 or above qualify for a free premium gift package.',
      'Includes high-fidelity Wireless EarPods with ergonomic charging case.',
      'One gift reward per eligible customer order while promotional stock lasts.',
      'Gifts are automatically secured and reserved during the checkout flow.',
    ],
  },
  rewards: {
    key: 'rewards',
    title: 'Free Gifts & Shopping Rewards',
    subtitle: 'Shop qualifying products to unlock free shopping gifts including DOVI 3D Audio Wireless EarPods and exclusive gift packages!',
    bannerImage: '/images/hero/hero_free_gifts.jpg',
    badgeText: '🎁 Free Gift Promotion',
    discountBadge: 'Cart ₦30,000+ Qualifies',
    themeColor: '#7c3aed',
    accentBg: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(124, 58, 237, 0.02) 100%)',
    rules: [
      'Orders with subtotal of ₦30,000 or above qualify for a free premium gift package.',
      'Includes high-fidelity Wireless EarPods with ergonomic charging case.',
      'One gift reward per eligible customer order while promotional stock lasts.',
      'Gifts are automatically secured and reserved during the checkout flow.',
    ],
  },
  'limited-deals': {
    key: 'limited-deals',
    title: 'Limited-Time Deals',
    subtitle: "Don't miss out on special offers! Limited quantities with discounts up to 50% OFF. Shop fast before time expires.",
    bannerImage: '/images/hero/hero_limited_deals.jpg',
    badgeText: '⚡ Limited Time Deals',
    discountBadge: 'Up to 50% OFF',
    themeColor: '#f59e0b',
    accentBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.02) 100%)',
    showCountdown: true,
  },
  christmas: {
    key: 'christmas',
    title: 'Christmas Deals — Holiday Gifting & Luxury Items',
    subtitle: 'Celebrate the festive season with up to 60% OFF curated holiday essentials, designer fragrances, fashion handbags, sneakers, and beauty sets.',
    bannerImage: '/images/hero/hero_christmas_deals.jpg',
    badgeText: '🎄 Christmas Holiday Sale',
    discountBadge: 'Up to 60% OFF',
    themeColor: '#059669',
    accentBg: 'linear-gradient(135deg, rgba(5, 150, 105, 0.08) 0%, rgba(5, 150, 105, 0.02) 100%)',
  },
};

export default function CampaignCollectionPage() {
  const { slug } = useParams<{ slug: string }>();
  const normalizedSlug = (slug || 'launch').toLowerCase().trim();
  const campaignMeta = CAMPAIGN_REGISTRY[normalizedSlug] || {
    key: normalizedSlug,
    title: `${normalizedSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} Collection`,
    subtitle: 'Explore exclusive promotional items, seasonal deals, and verified quality products on DOVI.',
    bannerImage: '/images/hero/hero_launch_campaign.jpg',
    badgeText: '⭐ Special Promotion',
    themeColor: '#ff7a00',
    accentBg: 'linear-gradient(135deg, rgba(255, 122, 0, 0.08) 0%, rgba(255, 122, 0, 0.02) 100%)',
  };

  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [activeBanner, setActiveBanner] = useState<HomepageBanner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'discount'>('featured');

  // Countdown timer simulation for flash/limited deals
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 14,
    minutes: 36,
    seconds: 48,
  });

  useEffect(() => {
    if (!campaignMeta.showCountdown) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [campaignMeta.showCountdown]);

  // Fetch campaign products
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadData = async () => {
      try {
        // First try the specialized campaign products API
        const res = await homepageApi.getCampaignProducts(normalizedSlug);
        if (!isMounted) return;

        if (res.banner) {
          setActiveBanner(res.banner);
        }

        if (Array.isArray(res.products) && res.products.length > 0) {
          setProducts(res.products);
          setIsLoading(false);
          return;
        }

        // Fallback: fetch products from standard products API
        const allProductsRes = await productsApi.list({ page: 1, page_size: 40 });
        if (!isMounted) return;

        let filtered = allProductsRes.results || [];
        const num = (v: any) => Number(v) || 0;

        // Apply campaign specific curation
        if (normalizedSlug === 'price-drops') {
          filtered = filtered.filter((p) => (p as any).is_discount || (p as any).discount_percentage || (num(p.compare_at_price) > num(p.base_price)));
        } else if (normalizedSlug === 'limited-deals' || normalizedSlug === 'black-friday') {
          filtered = filtered.filter((p) => (p as any).is_flash_deal || (p as any).is_discount || (num(p.compare_at_price) > num(p.base_price)));
        } else if (normalizedSlug === 'giveaway' || normalizedSlug === 'rewards') {
          filtered = filtered.filter((p) => num(p.base_price) >= 30000 || (p as any).category_name?.toLowerCase().includes('electronic'));
        } else if (normalizedSlug === 'christmas') {
          // Holiday gifts: fragrance, beauty, shoes, accessories
          const holidayTerms = ['perfume', 'fragrance', 'sneaker', 'shoe', 'bag', 'watch', 'beauty', 'gift'];
          const christmasMatches = filtered.filter((p) =>
            holidayTerms.some((t) => (p.name || (p as any).title || '').toLowerCase().includes(t) || (p as any).category_name?.toLowerCase().includes(t))
          );
          if (christmasMatches.length > 0) {
            filtered = christmasMatches;
          }
        }

        setProducts(filtered.length > 0 ? filtered : allProductsRes.results || []);
      } catch {
        if (!isMounted) return;
        setProducts([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [normalizedSlug]);

  // Client-side sorting
  const sortedProducts = useMemo(() => {
    const list = [...products];
    const num = (v: any) => Number(v) || 0;
    if (sortBy === 'price_asc') {
      return list.sort((a, b) => num(a.base_price) - num(b.base_price));
    }
    if (sortBy === 'price_desc') {
      return list.sort((a, b) => num(b.base_price) - num(a.base_price));
    }
    if (sortBy === 'discount') {
      return list.sort((a, b) => {
        const discA = num(a.compare_at_price) > num(a.base_price) && num(a.compare_at_price) > 0
          ? (num(a.compare_at_price) - num(a.base_price)) / num(a.compare_at_price)
          : 0;
        const discB = num(b.compare_at_price) > num(b.base_price) && num(b.compare_at_price) > 0
          ? (num(b.compare_at_price) - num(b.base_price)) / num(b.compare_at_price)
          : 0;
        return discB - discA;
      });
    }
    return list;
  }, [products, sortBy]);

  const displayImage = activeBanner?.desktop_image_url || activeBanner?.image_url || campaignMeta.bannerImage;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px', minHeight: '80vh' }}>
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
        <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Home</Link>
        <span>&rsaquo;</span>
        <Link to="/products" style={{ color: '#64748b', textDecoration: 'none' }}>Marketplace</Link>
        <span>&rsaquo;</span>
        <span style={{ color: '#ff7a00', fontWeight: 600 }}>{campaignMeta.title}</span>
      </nav>

      {/* Hero Campaign Banner */}
      <div
        style={{
          width: '100%',
          aspectRatio: '2 / 1',
          maxHeight: '380px',
          minHeight: '160px',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
          backgroundColor: '#0f172a',
          marginBottom: '24px',
          border: '1px solid rgba(0, 0, 0, 0.05)',
        }}
      >
        <img
          src={displayImage}
          alt={campaignMeta.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
        />
      </div>

      {/* Campaign Details Header & Badges */}
      <div
        style={{
          background: campaignMeta.accentBg,
          borderRadius: '14px',
          padding: '20px 24px',
          marginBottom: '28px',
          border: `1px solid ${campaignMeta.themeColor}33`,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '9999px', backgroundColor: `${campaignMeta.themeColor}15`, border: `1px solid ${campaignMeta.themeColor}44`, color: campaignMeta.themeColor, fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
              <span>{campaignMeta.badgeText}</span>
              {campaignMeta.discountBadge && (
                <span style={{ backgroundColor: campaignMeta.themeColor, color: '#ffffff', padding: '1px 8px', borderRadius: '9999px', fontSize: '11px' }}>
                  {campaignMeta.discountBadge}
                </span>
              )}
            </div>
            <h1 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              {campaignMeta.title}
            </h1>
            <p style={{ fontSize: '14px', color: '#475569', margin: 0, maxWidth: '780px', lineHeight: 1.5 }}>
              {campaignMeta.subtitle}
            </p>
          </div>

          {/* Flash Deal Countdown Timer */}
          {campaignMeta.showCountdown && (
            <div style={{ background: '#0f172a', color: '#ffffff', padding: '10px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Ends in:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace', fontSize: '15px', fontWeight: 800, color: '#ff7a00' }}>
                <span>{String(timeLeft.hours).padStart(2, '0')}</span>h :
                <span>{String(timeLeft.minutes).padStart(2, '0')}</span>m :
                <span>{String(timeLeft.seconds).padStart(2, '0')}</span>s
              </div>
            </div>
          )}
        </div>

        {/* Free Gifts & Shopping Rewards Rules Callout */}
        {campaignMeta.rules && (
          <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px dashed rgba(0, 0, 0, 0.1)' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
              How to Claim Your Free Gift Package:
            </span>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
              {campaignMeta.rules.map((rule, idx) => (
                <li key={idx}>{rule}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Sorting & Filter Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>
          Showing <span style={{ color: '#0f172a', fontWeight: 700 }}>{sortedProducts.length}</span> campaign items
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label htmlFor="campaign-sort" style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>Sort by:</label>
          <select
            id="campaign-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '13px',
              fontWeight: 500,
              color: '#0f172a',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="featured">Featured Campaign Items</option>
            <option value="discount">Highest Discount</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '16px',
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : sortedProducts.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 16px',
            backgroundColor: '#f8fafc',
            borderRadius: '16px',
            border: '1px dashed #cbd5e1',
            margin: '20px 0',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🛍️</div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
            No products found for this campaign right now
          </h3>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '420px', margin: '0 auto 18px auto' }}>
            New promotional inventory is being added continuously. Check back shortly or browse all items in the marketplace.
          </p>
          <Link
            to="/products"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ff7a00',
              color: '#ffffff',
              padding: '8px 20px',
              borderRadius: '9999px',
              fontWeight: 700,
              fontSize: '14px',
              textDecoration: 'none',
            }}
          >
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '16px',
          }}
        >
          {sortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
