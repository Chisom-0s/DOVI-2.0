import { useState, useRef } from 'react';
import type { ProductSummary } from '@/types';
import ProductCard from '@/components/product/ProductCard';

interface FlashSalesMarqueeProps {
  products: ProductSummary[];
}

export default function FlashSalesMarquee({ products }: FlashSalesMarqueeProps) {
  const [isPaused, setIsPaused] = useState(false);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  if (!products || products.length === 0) return null;

  // Duplicate items to ensure a continuous, seamless loop
  const displayProducts = products.length < 4 ? [...products, ...products, ...products, ...products] : [...products, ...products];

  // Pause on touch interaction, resume gently after user finishes touching
  const handleTouchStart = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    setIsPaused(true);
  };

  const handleTouchEnd = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 2500);
  };

  return (
    <div
      className="flash-sales-marquee-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
        padding: '8px 0 16px 0',
      }}
    >
      <div
        className={`flash-sales-track ${isPaused ? 'paused' : ''}`}
        style={{
          display: 'flex',
          gap: '16px',
          width: 'max-content',
        }}
      >
        {displayProducts.map((p, idx) => (
          <div
            key={`${p.id}-${idx}`}
            style={{
              flex: '0 0 230px',
              width: '230px',
            }}
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>

      <style>{`
        .flash-sales-track {
          animation: doviFlashMarquee 42s linear infinite;
          will-change: transform;
        }

        .flash-sales-track.paused,
        .flash-sales-marquee-container:hover .flash-sales-track,
        .flash-sales-marquee-container:focus-within .flash-sales-track {
          animation-play-state: paused !important;
        }

        @keyframes doviFlashMarquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .flash-sales-track {
            animation: none !important;
            transform: none !important;
          }
          .flash-sales-marquee-container {
            overflow-x: auto !important;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>
    </div>
  );
}
