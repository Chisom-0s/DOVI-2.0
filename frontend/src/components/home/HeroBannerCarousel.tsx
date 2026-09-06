import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

interface StaticSlide {
  id: string;
  image_url: string;
  title: string;
  subtitle: string;
  cta_text: string;
  cta_url: string;
}

const STATIC_SLIDES: StaticSlide[] = [
  {
    id: 'slide-1-tech',
    image_url: '/images/hero/hero_tech.jpg',
    title: 'Mega Tech Deals & Verified Sellers',
    subtitle: 'Latest phones, computers & accessories with doorstep warranty.',
    cta_text: 'Shop Tech Deals →',
    cta_url: '/products',
  },
  {
    id: 'slide-2-buy-car',
    image_url: '/images/hero/hero_buy_car.jpg',
    title: 'Dovi Auto Hub — Verified Cars',
    subtitle: 'Foreign-used & brand-new vehicles with nationwide inspection.',
    cta_text: 'Explore Cars →',
    cta_url: '/auto',
  },
  {
    id: 'slide-3-hire-car',
    image_url: '/images/hero/hero_hire_car.jpg',
    title: 'Hire a Ride. Drive Today.',
    subtitle: 'Short & long-term hire with transparent rates and insured vehicles.',
    cta_text: 'Browse Hire →',
    cta_url: '/auto/hire',
  },
  {
    id: 'slide-4-auto-parts',
    image_url: '/images/hero/hero_auto_parts.jpg',
    title: 'Genuine Auto Parts, Fast',
    subtitle: 'OEM & quality aftermarket — search by make, year or VIN.',
    cta_text: 'Shop Parts →',
    cta_url: '/auto/parts',
  },
  {
    id: 'slide-5-auto-acc',
    image_url: '/images/hero/hero_auto_accessories.jpg',
    title: 'Accessories That Finish the Car',
    subtitle: 'Wheels, lighting, audio & care kits from verified sellers.',
    cta_text: 'Shop Accessories →',
    cta_url: '/auto/accessories',
  },
  {
    id: 'slide-6-save2own',
    image_url: '/images/hero/hero_save2own.jpg',
    title: 'Save2Own — Own It With Zero Debt',
    subtitle: 'Flexible micro-payments toward phones, laptops, gadgets & vehicles.',
    cta_text: 'Start Save2Own →',
    cta_url: '/save2own',
  },
];

export default function HeroBannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Auto-slide logic
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    if (isPaused) {
      const resumeTimer = setTimeout(() => {
        setIsPaused(false);
      }, 8000);
      return () => clearTimeout(resumeTimer);
    }

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === STATIC_SLIDES.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === STATIC_SLIDES.length - 1 ? 0 : prev + 1));
    setIsPaused(true);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? STATIC_SLIDES.length - 1 : prev - 1));
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
    if (distance > 50) handleNext();
    if (distance < -50) handlePrev();
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const activeSlide = STATIC_SLIDES[currentIndex];

  const inlineStyles = `
    .hero-carousel-container {
      position: relative;
      width: 100%;
      overflow: hidden;
      border-radius: var(--radius-md, 8px);
      background-color: var(--color-bg-subtle, #f3f4f6);
      outline: none;
      /* Desktop slim height */
      height: clamp(160px, 18vw, 220px);
    }
    
    @media (max-width: 1024px) {
      .hero-carousel-container {
        height: clamp(160px, 16vw, 180px);
      }
    }
    
    @media (max-width: 767px) {
      .hero-carousel-container {
        height: clamp(140px, 20vw, 170px);
      }
      .hero-overlay-content {
        padding: 16px !important;
        gap: 6px !important;
      }
      .hero-title {
        font-size: 1.15rem !important;
        margin-bottom: 2px !important;
      }
      .hero-subtitle {
        font-size: 0.8rem !important;
        line-height: 1.3 !important;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .hero-cta {
        padding: 6px 14px !important;
        font-size: 0.75rem !important;
        margin-top: 4px !important;
      }
      .hero-dots {
        bottom: 8px !important;
      }
    }

    .hero-slide-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      /* Keep the right side visible on short wide crop */
      object-position: center right;
      display: block;
      transition: opacity 500ms ease-in-out;
    }

    .hero-nav-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: rgba(0,0,0,0.25);
      color: white;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      cursor: pointer;
      transition: background-color 0.2s;
      z-index: 10;
      opacity: 0;
    }
    
    .hero-carousel-container:hover .hero-nav-btn,
    .hero-carousel-container:focus-within .hero-nav-btn {
      opacity: 1;
    }

    .hero-nav-btn:hover {
      background-color: rgba(0,0,0,0.6);
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
      aria-label="Featured content"
    >
      <style dangerouslySetInnerHTML={{ __html: inlineStyles }} />

      <Link
        to={activeSlide.cta_url}
        style={{ display: 'block', width: '100%', height: '100%', textDecoration: 'none', position: 'relative' }}
      >
        <img
          key={activeSlide.id}
          src={activeSlide.image_url}
          alt={activeSlide.title}
          className="hero-slide-image"
        />

        {/* Content Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0) 80%)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            className="container hero-overlay-content"
            style={{
              color: 'white',
              maxWidth: '450px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '24px',
            }}
          >
            <h2
              className="hero-title"
              style={{
                fontSize: '1.75rem',
                fontWeight: '800',
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              {activeSlide.title}
            </h2>
            <p
              className="hero-subtitle"
              style={{
                fontSize: '0.9rem',
                opacity: 0.9,
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              {activeSlide.subtitle}
            </p>
            <span
              className="hero-cta"
              style={{
                display: 'inline-block',
                alignSelf: 'flex-start',
                marginTop: '6px',
                padding: '8px 20px',
                backgroundColor: 'var(--color-primary, #ff7a00)',
                color: 'white',
                borderRadius: 'var(--radius-full, 9999px)',
                fontSize: '0.85rem',
                fontWeight: '700',
                textAlign: 'center',
                boxShadow: '0 4px 10px rgba(255, 122, 0, 0.4)',
              }}
            >
              {activeSlide.cta_text}
            </span>
          </div>
        </div>
      </Link>

      {/* Manual Control Buttons */}
      <button
        className="hero-nav-btn"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePrev(); }}
        style={{ left: '12px' }}
        aria-label="Previous slide"
      >
        &#10094;
      </button>
      <button
        className="hero-nav-btn"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleNext(); }}
        style={{ right: '12px' }}
        aria-label="Next slide"
      >
        &#10095;
      </button>

      {/* Dot Indicators */}
      <div
        className="hero-dots"
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '6px',
          zIndex: 10,
        }}
      >
        {STATIC_SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentIndex(index);
              setIsPaused(true);
            }}
            style={{
              width: index === currentIndex ? '20px' : '6px',
              height: '6px',
              borderRadius: '3px',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              backgroundColor: index === currentIndex ? 'var(--color-primary, #ff7a00)' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.3s ease',
            }}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === currentIndex}
          />
        ))}
      </div>
    </div>
  );
}
