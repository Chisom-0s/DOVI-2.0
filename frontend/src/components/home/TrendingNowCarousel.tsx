import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { ProductSummary } from '@/types';
import ProductCard from '@/components/product/ProductCard';

interface TrendingNowCarouselProps {
  products: ProductSummary[];
}

export default function TrendingNowCarousel({ products }: TrendingNowCarouselProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showArrows, setShowArrows] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const firstSetRef = useRef<HTMLDivElement>(null);

  // Position and timing refs for requestAnimationFrame
  const currentXRef = useRef(0);
  const singleSetWidthRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Drag interaction refs
  const isPointerDownRef = useRef(false);
  const hasMovedRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const dragStartXRef = useRef(0);
  const isHorizontalGestureRef = useRef<boolean | null>(null);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Motion preference
  const prefersReducedMotionRef = useRef(false);

  // Prepare product list: ensure at least 8 items in the base set so the track spans large screens
  const baseProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    let list = [...products];
    while (list.length < 8 && list.length > 0) {
      list = [...list, ...products];
    }
    return list;
  }, [products]);

  // Measure single set width accurately
  const measureSetWidth = useCallback(() => {
    if (firstSetRef.current) {
      const width = firstSetRef.current.getBoundingClientRect().width;
      // Account for 16px gap between sets
      if (width > 0) {
        singleSetWidthRef.current = width + 16;
      }
    }
  }, []);

  useEffect(() => {
    // Check reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotionRef.current = mediaQuery.matches;
    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotionRef.current = e.matches;
    };
    mediaQuery.addEventListener('change', handleMotionChange);

    measureSetWidth();

    // Re-measure on window resize
    window.addEventListener('resize', measureSetWidth);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && firstSetRef.current) {
      resizeObserver = new ResizeObserver(() => {
        measureSetWidth();
      });
      resizeObserver.observe(firstSetRef.current);
    }

    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
      window.removeEventListener('resize', measureSetWidth);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [measureSetWidth, baseProducts]);

  // Continuous smooth sliding animation loop
  useEffect(() => {
    if (baseProducts.length === 0) return;

    const SPEED_PIXELS_PER_SEC = 35; // Comfortable, continuous sliding speed (~35px/s)

    const step = (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      const singleSetWidth = singleSetWidthRef.current;

      if (!isPaused && !isDragging && !prefersReducedMotionRef.current && singleSetWidth > 0) {
        currentXRef.current += SPEED_PIXELS_PER_SEC * dt;

        // Seamless wrap when end of set is reached
        if (currentXRef.current >= singleSetWidth) {
          currentXRef.current -= singleSetWidth;
        }

        if (trackRef.current) {
          trackRef.current.style.transform = `translate3d(-${currentXRef.current.toFixed(2)}px, 0, 0)`;
        }
      }

      animFrameIdRef.current = requestAnimationFrame(step);
    };

    animFrameIdRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isPaused, isDragging, baseProducts]);

  // Pointer Down (Mouse & Touch unified)
  const handlePointerDown = (e: any) => {
    // Only respond to main button on mouse
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }

    isPointerDownRef.current = true;
    hasMovedRef.current = false;
    isHorizontalGestureRef.current = null;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    dragStartXRef.current = currentXRef.current;
    setIsPaused(true);
  };

  // Pointer Move
  const handlePointerMove = (e: any) => {
    if (!isPointerDownRef.current) return;

    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;

    // Determine direction on initial movement threshold
    if (isHorizontalGestureRef.current === null) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        if (Math.abs(dy) > Math.abs(dx)) {
          // Vertical page scroll detected: release pointer control so page scrolls naturally
          isHorizontalGestureRef.current = false;
          isPointerDownRef.current = false;
          setIsDragging(false);
          resumeTimeoutRef.current = setTimeout(() => {
            setIsPaused(false);
          }, 1000);
          return;
        } else {
          // Horizontal gesture confirmed
          isHorizontalGestureRef.current = true;
          setIsDragging(true);
        }
      } else {
        return;
      }
    }

    if (isHorizontalGestureRef.current === true) {
      if (Math.abs(dx) > 4) {
        hasMovedRef.current = true;
      }

      let newX = dragStartXRef.current - dx;
      const singleSetWidth = singleSetWidthRef.current;

      if (singleSetWidth > 0) {
        // Handle wrap-around seamlessly during drag in both directions
        while (newX < 0) {
          newX += singleSetWidth;
          dragStartXRef.current += singleSetWidth;
        }
        while (newX >= singleSetWidth) {
          newX -= singleSetWidth;
          dragStartXRef.current -= singleSetWidth;
        }
      }

      currentXRef.current = newX;
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(-${newX.toFixed(2)}px, 0, 0)`;
      }
    }
  };

  // Pointer Up / Cancel
  const handlePointerEnd = () => {
    if (!isPointerDownRef.current && !isDragging) return;

    isPointerDownRef.current = false;
    setIsDragging(false);

    // Schedule smooth resumption of auto-scroll
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
    resumeTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
      hasMovedRef.current = false;
    }, 2000);
  };

  // Prevent clicking card links if the user dragged
  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Nudge left / right manually (Desktop arrows)
  const handleNudge = (direction: 'left' | 'right') => {
    setIsPaused(true);
    const CARD_STEP = 246; // card width (230px) + gap (16px)
    const singleSetWidth = singleSetWidthRef.current || 1000;

    let targetX = direction === 'right'
      ? currentXRef.current + CARD_STEP
      : currentXRef.current - CARD_STEP;

    while (targetX < 0) targetX += singleSetWidth;
    while (targetX >= singleSetWidth) targetX -= singleSetWidth;

    currentXRef.current = targetX;
    if (trackRef.current) {
      trackRef.current.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
      trackRef.current.style.transform = `translate3d(-${targetX.toFixed(2)}px, 0, 0)`;
      setTimeout(() => {
        if (trackRef.current) {
          trackRef.current.style.transition = 'none';
        }
      }, 420);
    }

    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 2500);
  };

  if (baseProducts.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="trending-now-carousel-container"
      onMouseEnter={() => {
        setIsPaused(true);
        setShowArrows(true);
      }}
      onMouseLeave={() => {
        if (!isPointerDownRef.current && !isDragging) {
          setIsPaused(false);
        }
        setShowArrows(false);
      }}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onClickCapture={handleClickCapture}
      style={{
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
        padding: '8px 0 16px 0',
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'pan-y',
        userSelect: 'none',
      }}
      aria-label="Trending Now products carousel"
    >
      {/* Track containing duplicated sets for seamless continuous loop */}
      <div
        ref={trackRef}
        className="trending-now-track"
        style={{
          display: 'flex',
          gap: '16px',
          width: 'max-content',
          willChange: 'transform',
        }}
      >
        {/* Set 1: Primary set (accessible to screen readers) */}
        <div
          ref={firstSetRef}
          style={{
            display: 'flex',
            gap: '16px',
          }}
        >
          {baseProducts.map((p, idx) => (
            <div
              key={`trending-1-${p.id}-${idx}`}
              style={{
                flex: '0 0 230px',
                width: '230px',
              }}
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>

        {/* Set 2: Duplicate set for continuous seamless loop (hidden from assistive tech) */}
        <div
          aria-hidden="true"
          style={{
            display: 'flex',
            gap: '16px',
          }}
        >
          {baseProducts.map((p, idx) => (
            <div
              key={`trending-2-${p.id}-${idx}`}
              style={{
                flex: '0 0 230px',
                width: '230px',
              }}
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop subtle floating nudge arrows */}
      {showArrows && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNudge('left');
            }}
            aria-label="Previous trending products"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.94)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
              border: '1px solid rgba(0,0,0,0.08)',
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              fontSize: '20px',
              fontWeight: 800,
              transition: 'background-color 0.2s, transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.94)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            &#8249;
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNudge('right');
            }}
            aria-label="Next trending products"
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.94)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
              border: '1px solid rgba(0,0,0,0.08)',
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              fontSize: '20px',
              fontWeight: 800,
              transition: 'background-color 0.2s, transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.94)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            &#8250;
          </button>
        </>
      )}
    </div>
  );
}
