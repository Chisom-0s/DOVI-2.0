import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { homepageApi } from '@/api/homepage';
import type { HomepageBanner } from '@/types';

export interface HeroSlide {
  id: string;
  campaign_key?: string;
  image_url: string;
  title: string;
  subtitle?: string | null;
  cta_text?: string | null;
  cta_url: string;
  display_order?: number;
}

export const PROMOTIONAL_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'ban-hero-launch',
    campaign_key: 'launch',
    image_url: '/images/hero/hero_launch_campaign.jpg',
    title: 'DOVI Launch Campaign',
    subtitle: 'Discover More, Shop Smart',
    cta_text: 'Shop Now',
    cta_url: '/promotions/launch',
    display_order: 1,
  },
  {
    id: 'ban-hero-black-friday',
    campaign_key: 'black-friday',
    image_url: '/images/hero/hero_black_friday.jpg',
    title: 'Black Friday Mega Deals',
    subtitle: 'Up to 70% OFF on Selected Products',
    cta_text: 'Shop the Deals',
    cta_url: '/promotions/black-friday',
    display_order: 2,
  },
  {
    id: 'ban-hero-price-drops',
    campaign_key: 'price-drops',
    image_url: '/images/hero/hero_price_drops.jpg',
    title: 'Price Drops',
    subtitle: 'More Value, Less Spending on Selected Products',
    cta_text: 'Shop Price Drops',
    cta_url: '/promotions/price-drops',
    display_order: 3,
  },
  {
    id: 'ban-hero-free-gifts',
    campaign_key: 'rewards',
    image_url: '/images/hero/hero_free_gifts.jpg',
    title: 'Free Gifts & Shopping Rewards',
    subtitle: 'Shop qualifying products and unlock exciting rewards!',
    cta_text: 'Claim Your Free Gift',
    cta_url: '/promotions/giveaway',
    display_order: 4,
  },
  {
    id: 'ban-hero-limited-deals',
    campaign_key: 'limited-deals',
    image_url: '/images/hero/hero_limited_deals.jpg',
    title: 'Limited-Time Deals',
    subtitle: "Don't Miss Out on Special Offers - Up to 50% OFF",
    cta_text: 'Shop Limited Deals',
    cta_url: '/promotions/limited-deals',
    display_order: 5,
  },
  {
    id: 'ban-hero-christmas-deals',
    campaign_key: 'christmas',
    image_url: '/images/hero/hero_christmas_deals.jpg',
    title: 'Christmas Deals',
    subtitle: 'Up to 60% OFF - Festive Gifts & Luxury Items',
    cta_text: 'Shop Now',
    cta_url: '/promotions/christmas',
    display_order: 6,
  },
];

// Backward compatibility export
export const STATIC_SLIDES = PROMOTIONAL_HERO_SLIDES;

export default function HeroBannerCarousel() {
  const [slides, setSlides] = useState<HeroSlide[]>(PROMOTIONAL_HERO_SLIDES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Sync with homepage banners API (admin CMS driven with fallback)
  useEffect(() => {
    let isMounted = true;
    homepageApi.getBanners().then((banners: HomepageBanner[]) => {
      if (!isMounted) return;
      if (Array.isArray(banners) && banners.length > 0) {
        const active = banners
          .filter((b) => b.is_active)
          .sort((a, b) => a.display_order - b.display_order)
          .map((b) => ({
            id: b.id,
            campaign_key: (b as any).campaign_key,
            image_url: b.desktop_image_url || (b as any).image_url || '/images/hero/hero_launch_campaign.jpg',
            title: b.title,
            subtitle: b.subtitle,
            cta_text: b.cta_text,
            cta_url: b.cta_url || '/',
            display_order: b.display_order,
          }));
        if (active.length > 0) {
          setSlides(active);
        }
      }
    }).catch(() => {
      // Fallback remains PROMOTIONAL_HERO_SLIDES
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-slide logic (5 seconds per slide)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches || slides.length <= 1) return;

    if (isPaused) {
      const resumeTimer = setTimeout(() => {
        setIsPaused(false);
      }, 7000);
      return () => clearTimeout(resumeTimer);
    }

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev >= slides.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, currentIndex, slides.length]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= slides.length - 1 ? 0 : prev + 1));
    setIsPaused(true);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? slides.length - 1 : prev - 1));
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
      aspect-ratio: 2 / 1;
      max-height: 440px;
      min-height: 175px;
      overflow: hidden;
      border-radius: var(--radius-xl, 16px);
      background-color: #0f172a;
      outline: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
      border: 1px solid rgba(0, 0, 0, 0.06);
    }

    @media (max-width: 1024px) {
      .hero-carousel-container {
        border-radius: var(--radius-lg, 14px);
        max-height: 380px;
      }
    }

    @media (max-width: 767px) {
      .hero-carousel-container {
        border-radius: var(--radius-md, 10px);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        max-height: 260px;
      }
      .hero-nav-btn {
        display: none !important;
      }
      .hero-dots {
        bottom: 8px !important;
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
      cursor: pointer;
    }

    .hero-slide-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
      transition: transform 450ms ease;
      user-select: none;
      -webkit-user-drag: none;
    }

    .hero-carousel-container:hover .hero-slide-wrapper.active .hero-slide-image {
      transform: scale(1.015);
    }

    /* Navigation Arrows */
    .hero-nav-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background-color: rgba(15, 23, 42, 0.65);
      color: #ffffff;
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid rgba(255, 255, 255, 0.35);
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 10;
      opacity: 0;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    }
    
    .hero-carousel-container:hover .hero-nav-btn,
    .hero-carousel-container:focus-within .hero-nav-btn {
      opacity: 1;
    }

    .hero-nav-btn:hover {
      background-color: var(--color-primary, #ff7a00);
      border-color: var(--color-primary, #ff7a00);
      transform: translateY(-50%) scale(1.08);
      box-shadow: 0 4px 16px rgba(255, 122, 0, 0.5);
    }

    /* Dot Indicators */
    .hero-dots {
      position: absolute;
      bottom: 12px;
      right: 20px;
      display: flex;
      gap: 6px;
      z-index: 10;
      background-color: rgba(15, 23, 42, 0.6);
      padding: 5px 10px;
      border-radius: 9999px;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    @media (max-width: 767px) {
      .hero-dots {
        right: 50%;
        transform: translateX(50%);
        bottom: 8px !important;
        padding: 3px 8px;
        gap: 4px;
      }
    }
  `;

  if (slides.length === 0) return null;

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
      aria-label="Promotional Campaigns Carousel"
    >
      <style dangerouslySetInnerHTML={{ __html: inlineStyles }} />

      {/* Render promotional campaign slides directly with high-fidelity graphics */}
      {slides.map((slide, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={slide.id}
            className={`hero-slide-wrapper ${isActive ? 'active' : ''}`}
            aria-hidden={!isActive}
          >
            <Link
              to={slide.cta_url}
              className="hero-slide-link"
              title={`${slide.title}${slide.cta_text ? ` — ${slide.cta_text}` : ''}`}
              aria-label={`${slide.title}${slide.cta_text ? `: ${slide.cta_text}` : ''}`}
              tabIndex={isActive ? 0 : -1}
            >
              <img
                src={slide.image_url}
                alt={slide.title}
                className="hero-slide-image"
                loading={index === 0 ? 'eager' : 'lazy'}
                draggable={false}
              />
            </Link>
          </div>
        );
      })}

      {/* Manual Left/Right Navigation Buttons */}
      {slides.length > 1 && (
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
            aria-label="Previous promotional slide"
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
            aria-label="Next promotional slide"
          >
            &#10095;
          </button>
        </>
      )}

      {/* Slide Dot Indicators */}
      {slides.length > 1 && (
        <div className="hero-dots" role="tablist" aria-label="Slide indicators">
          {slides.map((slide, index) => {
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
                  width: isActive ? '24px' : '7px',
                  height: '7px',
                  borderRadius: '9999px',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  backgroundColor: isActive ? 'var(--color-primary, #ff7a00)' : 'rgba(255, 255, 255, 0.6)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                aria-label={`Go to ${slide.title}`}
                aria-selected={isActive}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
