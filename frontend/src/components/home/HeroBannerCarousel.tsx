import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export interface HeroSlide {
  id: string;
  image_url: string;
  tag: string;
  title: string;
  description: string;
  cta_text: string;
  cta_url: string;
}

export const STATIC_SLIDES: HeroSlide[] = [
  {
    id: 'slide-gadgets',
    image_url: '/images/hero/hero_gadgets.jpg',
    tag: 'GADGETS & TECH',
    title: 'Next-Gen Laptops, Audio & Mobile',
    description: 'Power your workflow and play with premium electronics, drones, and smart gear.',
    cta_text: 'Shop Gadgets',
    cta_url: '/categories/gadgets',
  },
  {
    id: 'slide-mens-fashion',
    image_url: '/images/hero/hero_mens_fashion.jpg',
    tag: "MEN'S COLLECTION",
    title: 'Urban Tailoring & Modern Streetwear',
    description: 'Statement coats, chunky knitwear, tailored trousers, and everyday staples.',
    cta_text: 'Explore Fashion',
    cta_url: '/categories/fashion',
  },
  {
    id: 'slide-appliances',
    image_url: '/images/hero/hero_appliances.jpg',
    tag: 'HOME & APPLIANCES',
    title: 'Smart Living & Kitchen Essentials',
    description: 'High-performance refrigerators, smart TVs, microwave ovens, cooling & kitchen tech.',
    cta_text: 'Shop Appliances',
    cta_url: '/categories/electronics',
  },
  {
    id: 'slide-kiddies',
    image_url: '/images/hero/hero_kiddies.jpg',
    tag: 'BABY & KIDS',
    title: 'Joyful Play & Nursery Essentials',
    description: 'Charming outfits, lightweight strollers, comfortable cribs, and educational toys.',
    cta_text: 'Shop Kiddies & Toys',
    cta_url: '/categories/toys-games',
  },
  {
    id: 'slide-furniture',
    image_url: '/images/hero/hero_furniture.jpg',
    tag: 'FURNITURE & DECOR',
    title: 'Luxury Living & Contemporary Interiors',
    description: 'Plush sectionals, marble dining suites, designer beds, and storage elegance.',
    cta_text: 'Discover Furniture',
    cta_url: '/categories/home-kitchen',
  },
  {
    id: 'slide-beauty',
    image_url: '/images/hero/hero_beauty.jpg',
    tag: 'BEAUTY & WELLNESS',
    title: 'Luxury Skincare, Fragrances & Care',
    description: 'Signature perfumes, clinical skincare formulas, salon styling tools & beauty kits.',
    cta_text: 'Shop Beauty Care',
    cta_url: '/categories/beauty',
  },
  {
    id: 'slide-auto',
    image_url: '/images/hero/hero_auto.jpg',
    tag: 'AUTO & ACCESSORIES',
    title: 'Performance Parts & Vehicle Care',
    description: 'Durable tires, custom interior seat covers, dashcams, batteries, and repair tools.',
    cta_text: 'Explore Auto Hub',
    cta_url: '/categories/auto',
  },
];

export default function HeroBannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Auto-slide logic (4.8 seconds per slide)
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
    }, 4800);

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
      background-color: #f8fafc;
      outline: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(0, 0, 0, 0.05);
      /* Balanced height for hero banners */
      height: clamp(260px, 30vw, 400px);
    }

    @media (max-width: 1024px) {
      .hero-carousel-container {
        height: clamp(220px, 32vw, 310px);
      }
    }

    @media (max-width: 767px) {
      .hero-carousel-container {
        height: clamp(185px, 52vw, 240px);
        border-radius: var(--radius-lg, 12px);
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
      transition: opacity 550ms cubic-bezier(0.4, 0, 0.2, 1);
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
      transform: scale(1.02);
    }

    /* Soft ambient gradient scrim to ensure text and CTA contrast */
    .hero-slide-scrim {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        90deg,
        rgba(15, 23, 42, 0.65) 0%,
        rgba(15, 23, 42, 0.35) 45%,
        rgba(15, 23, 42, 0.05) 85%
      );
      pointer-events: none;
    }

    @media (max-width: 640px) {
      .hero-slide-scrim {
        background: linear-gradient(
          0deg,
          rgba(15, 23, 42, 0.8) 0%,
          rgba(15, 23, 42, 0.3) 65%,
          transparent 100%
        );
      }
    }

    /* Floating CTA Card */
    .hero-glass-card {
      position: absolute;
      left: 32px;
      bottom: 28px;
      max-width: 440px;
      background: rgba(15, 23, 42, 0.72);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 14px;
      padding: 16px 20px;
      box-shadow: 0 10px 25px -4px rgba(0, 0, 0, 0.3);
      color: #ffffff;
      z-index: 5;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: transform 0.25s ease, background-color 0.25s ease;
    }

    .hero-slide-link:hover .hero-glass-card {
      transform: translateY(-2px);
      background: rgba(15, 23, 42, 0.82);
    }

    .hero-tag-badge {
      display: inline-block;
      align-self: flex-start;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #ff9d42;
      background: rgba(255, 122, 0, 0.15);
      border: 1px solid rgba(255, 122, 0, 0.3);
      padding: 2px 8px;
      border-radius: 6px;
    }

    .hero-slide-title {
      font-size: 1.25rem;
      font-weight: 800;
      line-height: 1.2;
      color: #ffffff;
      margin: 0;
      letter-spacing: -0.01em;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }

    .hero-slide-desc {
      font-size: 0.82rem;
      line-height: 1.35;
      color: rgba(255, 255, 255, 0.82);
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .hero-cta-btn {
      align-self: flex-start;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
      background: linear-gradient(135deg, #ff7a00 0%, #e65c00 100%);
      color: #ffffff;
      font-size: 0.825rem;
      font-weight: 700;
      padding: 7px 16px;
      border-radius: 9999px;
      box-shadow: 0 3px 10px rgba(255, 122, 0, 0.38);
      transition: all 0.2s ease;
    }

    .hero-slide-link:hover .hero-cta-btn {
      transform: scale(1.04);
      box-shadow: 0 5px 15px rgba(255, 122, 0, 0.55);
      background: linear-gradient(135deg, #ff8c1a 0%, #ff5500 100%);
    }

    .hero-cta-arrow {
      transition: transform 0.2s ease;
    }

    .hero-slide-link:hover .hero-cta-arrow {
      transform: translateX(3px);
    }

    @media (max-width: 767px) {
      .hero-glass-card {
        left: 12px;
        right: 12px;
        bottom: 12px;
        max-width: calc(100% - 24px);
        padding: 10px 14px;
        border-radius: 12px;
        gap: 4px;
      }
      .hero-slide-title {
        font-size: clamp(0.95rem, 3.8vw, 1.15rem);
      }
      .hero-slide-desc {
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
        font-size: 0.76rem;
        line-height: 1.3;
      }
      .hero-tag-badge {
        font-size: 0.68rem;
        padding: 2px 7px;
      }
      .hero-cta-btn {
        font-size: 0.8rem;
        padding: 6px 14px;
        margin-top: 2px;
        min-height: 32px;
      }
    }

    /* Navigation Arrows */
    .hero-nav-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background-color: rgba(15, 23, 42, 0.55);
      color: #ffffff;
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255, 255, 255, 0.25);
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 10;
      opacity: 0;
      backdrop-filter: blur(6px);
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
      right: 28px;
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
        right: 12px;
        bottom: 10px !important;
        padding: 3px 6px;
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
      aria-label="Featured Categories & Promotions"
    >
      <style dangerouslySetInnerHTML={{ __html: inlineStyles }} />

      {/* Render all slides with smooth cross-fade */}
      {STATIC_SLIDES.map((slide, index) => {
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
              title={`${slide.title} — ${slide.cta_text}`}
              aria-label={`${slide.title}: ${slide.cta_text}`}
              tabIndex={isActive ? 0 : -1}
            >
              <img
                src={slide.image_url}
                alt={slide.title}
                className="hero-slide-image"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
              <div className="hero-slide-scrim" />

              {/* Floating CTA Overlay Card */}
              <div className="hero-glass-card">
                <span className="hero-tag-badge">{slide.tag}</span>
                <h2 className="hero-slide-title">{slide.title}</h2>
                <p className="hero-slide-desc">{slide.description}</p>
                <div className="hero-cta-btn">
                  <span>{slide.cta_text}</span>
                  <svg
                    className="hero-cta-arrow"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        );
      })}

      {/* Manual Control Buttons */}
      <button
        type="button"
        className="hero-nav-btn"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handlePrev();
        }}
        style={{ left: '16px' }}
        aria-label="Previous slide"
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
        aria-label="Next slide"
      >
        &#10095;
      </button>

      {/* Dot Indicators */}
      <div className="hero-dots" role="tablist" aria-label="Slide navigation">
        {STATIC_SLIDES.map((slide, index) => {
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
              aria-label={`Go to slide ${index + 1}: ${slide.title}`}
              aria-selected={isActive}
            />
          );
        })}
      </div>
    </div>
  );
}
