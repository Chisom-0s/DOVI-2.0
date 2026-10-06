import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

interface StaticSlide {
  id: string;
  image_url: string;
  title: string;
  cta_url: string;
}

const STATIC_SLIDES: StaticSlide[] = [
  {
    id: 'slide-kitchen-furniture',
    image_url: '/images/hero/hero_kitchen_furniture.jpg',
    title: 'Dovi Kitchen & Furniture',
    cta_url: '/categories/home-kitchen',
  },
  {
    id: 'slide-electronics',
    image_url: '/images/categories/electronics.jpg',
    title: 'Dovi Electronics',
    cta_url: '/categories/electronics',
  },
  {
    id: 'slide-gadgets',
    image_url: '/images/categories/gadgets.jpg',
    title: 'Dovi Gadgets',
    cta_url: '/categories/gadgets',
  },
  {
    id: 'slide-fashion-accessories',
    image_url: '/images/hero/hero_fashion_accessories.jpg',
    title: 'Dovi Fashion Accessories',
    cta_url: '/categories/fashion',
  },
  {
    id: 'slide-clothes',
    image_url: '/images/hero/hero_clothes.jpg',
    title: 'Dovi Clothes',
    cta_url: '/categories/fashion',
  },
  {
    id: 'slide-auto',
    image_url: '/images/hero/hero_auto.jpg',
    title: 'Dovi Auto',
    cta_url: '/auto',
  },
  {
    id: 'slide-kiddies',
    image_url: '/images/hero/hero_kiddies.jpg',
    title: 'Dovi Kiddies & Toys',
    cta_url: '/categories/toys-games',
  },
];

export default function HeroBannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Auto-slide logic (4 seconds per slide)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    if (isPaused) {
      const resumeTimer = setTimeout(() => {
        setIsPaused(false);
      }, 7000);
      return () => clearTimeout(resumeTimer);
    }

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === STATIC_SLIDES.length - 1 ? 0 : prev + 1));
    }, 4500);

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
      border-radius: var(--radius-lg, 12px);
      background-color: var(--color-bg-subtle, #f3f4f6);
      outline: none;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
      /* Balanced aspect ratio for desktop & tablet */
      aspect-ratio: 2.8 / 1;
      max-height: 380px;
    }
    
    @media (max-width: 767px) {
      .hero-carousel-container {
        aspect-ratio: 2.5 / 1;
        border-radius: var(--radius-md, 8px);
      }
      .hero-nav-btn {
        display: none !important;
      }
      .hero-dots {
        bottom: 6px !important;
      }
    }

    .hero-slide-link {
      display: block;
      width: 100%;
      height: 100%;
      position: relative;
      text-decoration: none;
    }

    .hero-slide-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
      transition: transform 300ms ease;
    }

    .hero-carousel-container:hover .hero-slide-image {
      transform: scale(1.01);
    }

    .hero-nav-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background-color: rgba(0, 0, 0, 0.4);
      color: #ffffff;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255, 255, 255, 0.3);
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 10;
      opacity: 0;
      backdrop-filter: blur(4px);
    }
    
    .hero-carousel-container:hover .hero-nav-btn,
    .hero-carousel-container:focus-within .hero-nav-btn {
      opacity: 1;
    }

    .hero-nav-btn:hover {
      background-color: var(--color-primary, #ff7a00);
      border-color: var(--color-primary, #ff7a00);
      transform: translateY(-50%) scale(1.08);
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
      aria-label="Featured Categories"
    >
      <style dangerouslySetInnerHTML={{ __html: inlineStyles }} />

      <Link
        to={activeSlide.cta_url}
        className="hero-slide-link"
        title={activeSlide.title}
        aria-label={activeSlide.title}
      >
        <img
          key={activeSlide.id}
          src={activeSlide.image_url}
          alt={activeSlide.title}
          className="hero-slide-image"
          loading="eager"
        />
      </Link>

      {/* Manual Control Buttons */}
      <button
        type="button"
        className="hero-nav-btn"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePrev(); }}
        style={{ left: '12px' }}
        aria-label="Previous slide"
      >
        &#10094;
      </button>
      <button
        type="button"
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
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '6px',
          zIndex: 10,
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
          padding: '4px 8px',
          borderRadius: '9999px',
          backdropFilter: 'blur(4px)',
        }}
      >
        {STATIC_SLIDES.map((_, index) => (
          <button
            type="button"
            key={index}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentIndex(index);
              setIsPaused(true);
            }}
            style={{
              width: index === currentIndex ? '22px' : '7px',
              height: '7px',
              borderRadius: '9999px',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              backgroundColor: index === currentIndex ? 'var(--color-primary, #ff7a00)' : 'rgba(255, 255, 255, 0.65)',
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
