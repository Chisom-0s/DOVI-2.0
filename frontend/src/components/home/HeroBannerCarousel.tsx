import { useEffect, useRef, useState } from 'react';
import { homepageApi } from '@/api/homepage';
import type { HomepageBanner } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';

export default function HeroBannerCarousel() {
  const [banners, setBanners] = useState<HomepageBanner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const slideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch banners
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await homepageApi.getBanners();
        setBanners(response);
      } catch (err) {
        console.error('Failed to load hero banners:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBanners();
  }, []);

  // Setup auto-sliding
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = banners[currentIndex]?.slide_interval_ms ?? 5000;
    slideTimerRef.current = setTimeout(() => {
      handleNext();
    }, interval);

    return () => {
      if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
    };
  }, [currentIndex, banners]);

  const handleNext = () => {
    setCurrentIndex(prev => (prev === banners.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  if (isLoading) {
    return (
      <div style={containerStyles}>
        <Skeleton height="100%" borderRadius="var(--radius-lg)" />
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const activeBanner = banners[currentIndex];

  return (
    <div style={containerStyles} className="hero-banner-carousel">
      {/* Banner Slide */}
      <a
        href={activeBanner.cta_url ?? '#'}
        style={{ ...slideStyles, backgroundImage: `url(${activeBanner.desktop_image_url})` }}
        className="carousel-slide"
      >
        {/* Mobile View Background Image (responsive layout fallback) */}
        <picture>
          <source media="(max-width: 767px)" srcSet={activeBanner.mobile_image_url || activeBanner.desktop_image_url} />
          <img src={activeBanner.desktop_image_url} alt={activeBanner.title} style={imageStyles} />
        </picture>

        {/* Content Overlay */}
        <div style={overlayStyles}>
          <div className="container" style={contentStyles}>
            <h2 style={titleStyles}>{activeBanner.title}</h2>
            {activeBanner.subtitle && <p style={subtitleStyles}>{activeBanner.subtitle}</p>}
            {activeBanner.cta_text && (
              <span style={ctaStyles}>{activeBanner.cta_text}</span>
            )}
          </div>
        </div>
      </a>

      {/* Manual Control Buttons */}
      {banners.length > 1 && (
        <>
          <button onClick={handlePrev} style={{ ...navBtnStyles, left: '16px' }} aria-label="Previous slide">
            &#10094;
          </button>
          <button onClick={handleNext} style={{ ...navBtnStyles, right: '16px' }} aria-label="Next slide">
            &#10095;
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {banners.length > 1 && (
        <div style={dotsContainerStyles}>
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              style={{
                ...dotStyles,
                backgroundColor: index === currentIndex ? 'var(--color-primary)' : 'rgba(255,255,255,0.5)',
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '320px',
  overflow: 'hidden',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--color-bg-subtle)',
};

const slideStyles: React.CSSProperties = {
  display: 'block',
  width: '100%',
  height: '100%',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  textDecoration: 'none',
  position: 'relative',
};

const imageStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
};

const overlayStyles: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(to right, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.1) 100%)',
  display: 'flex',
  alignItems: 'center',
};

const contentStyles: React.CSSProperties = {
  color: 'white',
  maxWidth: '600px',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
  padding: 'var(--space-6)',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-3xl)',
  fontWeight: 'var(--font-bold)',
  lineHeight: 1.15,
};

const subtitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  opacity: 0.9,
};

const ctaStyles: React.CSSProperties = {
  display: 'inline-block',
  alignSelf: 'flex-start',
  padding: 'var(--space-3) var(--space-6)',
  backgroundColor: 'var(--color-primary)',
  color: 'white',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-semibold)',
  textAlign: 'center',
};

const navBtnStyles: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  backgroundColor: 'rgba(0,0,0,0.4)',
  color: 'white',
  fontSize: '1.25rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  cursor: 'pointer',
  transition: 'background-color var(--transition-fast)',
  zIndex: 10,
};

const dotsContainerStyles: React.CSSProperties = {
  position: 'absolute',
  bottom: '16px',
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: 'var(--space-2)',
  zIndex: 10,
};

const dotStyles: React.CSSProperties = {
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  transition: 'background-color var(--transition-fast)',
};
