import { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { homepageApi, DEFAULT_HERO_BANNERS } from '@/api/homepage';
import type { HomepageBanner } from '@/types';

export default function HeroBannerCarousel() {
  const [allBanners, setAllBanners] = useState<HomepageBanner[]>(() => {
    try {
      const stored = localStorage.getItem('dovi_homepage_banners_db');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.some((b: any) => b.id && (b.id.includes('campaign') || b.id.includes('christmas')))) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_HERO_BANNERS;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Sync banners from API & localStorage
  const loadBanners = async () => {
    try {
      const banners = await homepageApi.getBanners();
      if (Array.isArray(banners) && banners.length > 0) {
        setAllBanners(banners);
      }
    } catch (err) {
      console.warn('Failed to load dynamic banners, using local defaults', err);
    }
  };

  useEffect(() => {
    loadBanners();

    // Listen for changes from admin dashboard tab or window events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dovi_homepage_banners_db' && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (Array.isArray(updated) && updated.length > 0) {
            setAllBanners(updated);
          }
        } catch {}
      }
    };

    const handleCustomUpdate = () => {
      loadBanners();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('dovi:banners_updated', handleCustomUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dovi:banners_updated', handleCustomUpdate);
    };
  }, []);

  // Filter for active, scheduled, and unexpired banners
  const visibleBanners = useMemo(() => {
    const now = new Date();
    const filtered = allBanners
      .filter((banner) => {
        if (!banner.is_active) return false;
        // Schedule: Not yet started
        if (banner.start_date && new Date(banner.start_date) > now) return false;
        // Schedule: Expired
        if (banner.end_date && new Date(banner.end_date) < now) return false;
        return true;
      })
      .sort((a, b) => a.display_order - b.display_order);

    return filtered.length > 0 ? filtered : DEFAULT_HERO_BANNERS;
  }, [allBanners]);

  // Adjust current index if it exceeds active banners count
  useEffect(() => {
    if (currentIndex >= visibleBanners.length) {
      setCurrentIndex(0);
    }
  }, [visibleBanners.length, currentIndex]);

  // Auto-slide rotation with custom slide duration
  const currentBanner = visibleBanners[currentIndex] || visibleBanners[0];
  const slideDuration = currentBanner?.slide_interval_ms || 5000;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;
    if (visibleBanners.length <= 1) return;

    if (isPaused) {
      const resumeTimer = setTimeout(() => {
        setIsPaused(false);
      }, 7000);
      return () => clearTimeout(resumeTimer);
    }

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === visibleBanners.length - 1 ? 0 : prev + 1));
    }, slideDuration);

    return () => clearInterval(timer);
  }, [isPaused, currentIndex, visibleBanners.length, slideDuration]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === visibleBanners.length - 1 ? 0 : prev + 1));
    setIsPaused(true);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? visibleBanners.length - 1 : prev - 1));
    setIsPaused(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrev();
    else if (e.key === 'ArrowRight') handleNext();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 45) handleNext();
    if (distance < -45) handlePrev();
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const inlineStyles = `
    .hero-carousel-container {
      position: relative;
      width: 100%;
      overflow: hidden;
      border-radius: var(--radius-xl, 16px);
      background-color: #0f172a;
      outline: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(0, 0, 0, 0.05);
      aspect-ratio: 2.15 / 1;
      max-height: 440px;
      min-height: 180px;
      transition: box-shadow 0.3s ease;
    }

    @media (max-width: 1024px) {
      .hero-carousel-container {
        aspect-ratio: 2.1 / 1;
        max-height: 380px;
      }
    }

    @media (max-width: 767px) {
      .hero-carousel-container {
        aspect-ratio: 2 / 1;
        border-radius: var(--radius-lg, 12px);
        max-height: 250px;
        min-height: 160px;
      }
      .hero-nav-btn {
        display: none !important;
      }
      .hero-dots {
        bottom: 8px !important;
        right: 12px !important;
      }
    }

    .hero-slide-wrapper {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      pointer-events: none;
      transition: opacity 500ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .hero-slide-wrapper.active {
      opacity: 1;
      pointer-events: auto;
      z-index: 2;
    }

    .hero-slide-link {
      display: block;
      width: 100%;
      height: 100%;
      position: relative;
      text-decoration: none;
      color: inherit;
      cursor: pointer;
    }

    .hero-slide-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
      transition: transform 600ms ease;
    }

    .hero-carousel-container:hover .hero-slide-wrapper.active .hero-slide-image {
      transform: scale(1.015);
    }

    /* Navigation Arrows */
    .hero-nav-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: rgba(15, 23, 42, 0.55);
      color: #ffffff;
      font-size: 1.15rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255, 255, 255, 0.25);
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 10;
      opacity: 0;
      backdrop-filter: blur(6px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    
    .hero-carousel-container:hover .hero-nav-btn,
    .hero-carousel-container:focus-within .hero-nav-btn {
      opacity: 1;
    }

    .hero-nav-btn:hover {
      background-color: var(--color-primary, #ff7a00);
      border-color: var(--color-primary, #ff7a00);
      transform: translateY(-50%) scale(1.08);
      box-shadow: 0 4px 14px rgba(255, 122, 0, 0.45);
    }

    /* Dot Indicators */
    .hero-dots {
      position: absolute;
      bottom: 14px;
      right: 24px;
      display: flex;
      gap: 6px;
      z-index: 10;
      background-color: rgba(15, 23, 42, 0.45);
      padding: 5px 10px;
      border-radius: 9999px;
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.15);
    }

    @media (max-width: 767px) {
      .hero-dots {
        padding: 4px 8px;
        gap: 4px;
      }
    }
  `;

  return (
    <div
      className="hero-carousel-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="DOVI Promotional Campaigns"
    >
      <style dangerouslySetInnerHTML={{ __html: inlineStyles }} />

      {/* Render all campaign slides with smooth cross-fade */}
      {visibleBanners.map((slide, index) => {
        const isActive = index === currentIndex;
        const targetUrl = slide.cta_url || '/products';
        const isExternal = targetUrl.startsWith('http');

        return (
          <div
            key={slide.id}
            className={`hero-slide-wrapper ${isActive ? 'active' : ''}`}
            aria-hidden={!isActive}
          >
            {isExternal ? (
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-slide-link"
                title={`${slide.title}${slide.subtitle ? ` — ${slide.subtitle}` : ''}`}
                aria-label={`${slide.title}: ${slide.cta_text || 'View Campaign'}`}
                tabIndex={isActive ? 0 : -1}
              >
                <img
                  src={slide.desktop_image_url}
                  alt={slide.title}
                  className="hero-slide-image"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              </a>
            ) : (
              <Link
                to={targetUrl}
                className="hero-slide-link"
                title={`${slide.title}${slide.subtitle ? ` — ${slide.subtitle}` : ''}`}
                aria-label={`${slide.title}: ${slide.cta_text || 'View Campaign'}`}
                tabIndex={isActive ? 0 : -1}
              >
                <img
                  src={slide.desktop_image_url}
                  alt={slide.title}
                  className="hero-slide-image"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              </Link>
            )}
          </div>
        );
      })}

      {/* Manual Left/Right Controls (Desktop) */}
      {visibleBanners.length > 1 && (
        <>
          <button
            type="button"
            className="hero-nav-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handlePrev();
            }}
            style={{ left: '16px' }}
            aria-label="Previous campaign slide"
          >
            &#10094;
          </button>
          <button
            type="button"
            className="hero-nav-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleNext();
            }}
            style={{ right: '16px' }}
            aria-label="Next campaign slide"
          >
            &#10095;
          </button>

          {/* Dot Indicators */}
          <div className="hero-dots" role="tablist" aria-label="Campaign navigation">
            {visibleBanners.map((slide, index) => {
              const isActive = index === currentIndex;
              return (
                <button
                  type="button"
                  role="tab"
                  key={slide.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentIndex(index);
                    setIsPaused(true);
                  }}
                  style={{
                    width: isActive ? '22px' : '7px',
                    height: '7px',
                    borderRadius: '9999px',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    backgroundColor: isActive ? 'var(--color-primary, #ff7a00)' : 'rgba(255, 255, 255, 0.65)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  aria-label={`Go to slide ${index + 1}: ${slide.title}`}
                  aria-selected={isActive}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
