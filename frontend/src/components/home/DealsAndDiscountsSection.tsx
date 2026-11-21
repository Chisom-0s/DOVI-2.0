import { useState, useEffect, useRef } from 'react';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [now, setNow] = useState<Date>(new Date());

  // Tick every second for live countdown precision
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter for valid active discounts
  const activeDealProducts = (products || []).filter((p) => {
    const discountConfig = (p as any).discount_config;
    if (discountConfig) {
      return isDiscountActiveNow(discountConfig, now);
    }
    return Boolean((p as any).is_discount) || (p.discount_percentage && p.discount_percentage > 0);
  });

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [activeDealProducts.length]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = direction === 'left' ? -320 : 320;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(checkScroll, 350);
  };

  // Find the earliest upcoming end time among active products for section-level countdown
  const earliestEndTime = activeDealProducts.reduce<string | null>((earliest, p) => {
    const end = (p as any).discount_config?.end_time;
    if (!end) return earliest;
    const endTime = new Date(end).getTime();
    if (isNaN(endTime) || endTime <= now.getTime()) return earliest;
    if (!earliest) return end;
    return endTime < new Date(earliest).getTime() ? end : earliest;
  }, null);

  const formatCountdown = (isoString?: string | null): string | null => {
    if (!isoString) return null;
    const target = new Date(isoString).getTime();
    const current = now.getTime();
    const diff = target - current;
    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (n: number) => String(n).padStart(2, '0');

    if (days > 0) {
      return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
    }
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  if (!activeDealProducts || activeDealProducts.length === 0) {
    return null; // Gracefully omit section if no products are on active promotion
  }

  const sectionCountdown = earliestEndTime ? formatCountdown(earliestEndTime) : null;

  return (
    <section
      className="deals-and-discounts-section"
      style={{
        margin: '36px 0',
        padding: '24px 20px',
        background: 'linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)',
        borderRadius: '16px',
        border: '1px solid #e0e7ff',
        boxShadow: '0 4px 20px rgba(79, 70, 229, 0.04)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                fontSize: '16px',
              }}
            >
              🏷️
            </span>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: '#1e1b4b',
                letterSpacing: '-0.3px',
                margin: 0,
              }}
            >
              {title}
            </h2>
            {sectionCountdown && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fca5a5',
                  borderRadius: '999px',
                  color: '#991b1b',
                  fontSize: '12px',
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <span>⏱️ Deals End in:</span>
                <span style={{ fontWeight: 800, color: '#b91c1c' }}>{sectionCountdown}</span>
              </div>
            )}
          </div>
          {subtitle && (
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#4338ca' }}>
              {subtitle}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Scroll Controls */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                border: '1px solid #c7d2fe',
                backgroundColor: canScrollLeft ? '#ffffff' : '#f1f5f9',
                color: canScrollLeft ? '#1e1b4b' : '#94a3b8',
                cursor: canScrollLeft ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: canScrollLeft ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Scroll right"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                border: '1px solid #c7d2fe',
                backgroundColor: canScrollRight ? '#ffffff' : '#f1f5f9',
                color: canScrollRight ? '#1e1b4b' : '#94a3b8',
                cursor: canScrollRight ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: canScrollRight ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              ›
            </button>
          </div>

          <Link
            to={viewAllUrl}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#4f46e5',
              padding: '6px 14px',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid #c7d2fe',
              textDecoration: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease',
            }}
          >
            <span>View All</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        style={{
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          paddingBottom: '8px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {activeDealProducts.map((p) => {
          const discountConfig = (p as any).discount_config;
          const itemCountdown = discountConfig?.end_time ? formatCountdown(discountConfig.end_time) : null;
          return (
            <div
              key={p.id}
              style={{
                flex: '0 0 240px',
                width: '240px',
                scrollSnapAlign: 'start',
                position: 'relative',
              }}
            >
              <ProductCard product={p} />
              {itemCountdown && itemCountdown !== 'Ended' && (
                <div
                  style={{
                    marginTop: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#dc2626',
                    backgroundColor: '#fef2f2',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    textAlign: 'center',
                    border: '1px dashed #fecaca',
                  }}
                >
                  ⏱️ Ends: {itemCountdown}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
