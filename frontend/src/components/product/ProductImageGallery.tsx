import { useState, useEffect, useRef } from 'react';
import type { ProductImage } from '@/types';
import { normalizeUrl, getProductFallbackImage } from '@/utils/image';

interface ProductImageGalleryProps {
  images: ProductImage[];
  product?: any;
}

export default function ProductImageGallery({ images, product }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({ transform: 'scale(1)', transformOrigin: 'center' });
  const imgRef = useRef<HTMLImageElement>(null);

  // Use contextual product fallback image
  const fallbackImage = getProductFallbackImage(product);

  // Compute the active image source
  const hasImages = images && images.length > 0;
  const activeImage = hasImages ? images[activeIndex] : null;
  const activeSrc = hasImages
    ? (normalizeUrl(activeImage?.url || activeImage?.image_url) || fallbackImage)
    : fallbackImage;

  // Reset loading state whenever the image source changes
  useEffect(() => {
    setImageLoaded(false);
    // Check if the image is already cached (complete)
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setImageLoaded(true);
    }
  }, [activeSrc]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).src = fallbackImage;
    setImageLoaded(true); // show fallback without skeleton
  };

  // Mouse move handler for premium zoom on hover (desktop)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageLoaded) return; // no zoom while loading
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transform: 'scale(1.8)',
      transformOrigin: `${x}% ${y}%`,
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transform: 'scale(1)',
      transformOrigin: 'center',
    });
  };

  return (
    <div style={galleryWrapperStyles}>
      {/* Main Image Container */}
      <div
        style={mainImageContainerStyles}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Shimmer skeleton shown while image is loading */}
        {!imageLoaded && (
          <div style={imageSkeletonStyles}>
            <div style={shimmerOverlayStyles} />
          </div>
        )}

        <img
          ref={imgRef}
          src={activeSrc}
          alt={activeImage?.alt_text || product?.name || 'Product Image'}
          style={{
            ...mainImageStyles,
            ...zoomStyle,
            opacity: imageLoaded ? 1 : 0,
            transition: imageLoaded
              ? 'opacity 0.3s ease-in, transform 0.15s ease-out'
              : 'none',
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />

        {/* Mobile Swipe Indicators overlay */}
        {hasImages && (
          <div className="hide-desktop" style={mobileSwipeIndicatorStyles}>
            <span>{activeIndex + 1} / {images.length}</span>
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {hasImages && images.length > 1 && (
        <div style={thumbnailStripStyles} className="hide-scrollbar">
          {images.map((img, idx) => {
            const thumbSrc = normalizeUrl(img.thumbnail_url || img.url || img.image_url) || fallbackImage;
            return (
              <button
                key={img.id || idx}
                onClick={() => setActiveIndex(idx)}
                style={{
                  ...thumbnailBtnStyles,
                  borderColor: activeIndex === idx ? 'var(--color-primary)' : 'var(--color-border)',
                  boxShadow: activeIndex === idx ? '0 0 0 2px rgba(255, 122, 0, 0.15)' : 'none',
                }}
                aria-label={`View product image ${idx + 1}`}
              >
                <img
                  src={thumbSrc}
                  alt=""
                  style={thumbnailImgStyles}
                  onError={e => {
                    (e.target as HTMLImageElement).src = fallbackImage;
                  }}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Injected keyframes for the shimmer animation */}
      <style>{`
        @keyframes pdp-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const galleryWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  width: '100%',
};

const mainImageContainerStyles: React.CSSProperties = {
  position: 'relative',
  aspectRatio: '1',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  overflow: 'hidden',
  backgroundColor: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'zoom-in',
};

const mainImageStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
};

const imageSkeletonStyles: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundColor: 'var(--color-bg-subtle, #f0f0f0)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  zIndex: 1,
};

const shimmerOverlayStyles: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
  animation: 'pdp-shimmer 1.5s ease-in-out infinite',
};

const mobileSwipeIndicatorStyles: React.CSSProperties = {
  position: 'absolute',
  bottom: '12px',
  right: '12px',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  color: 'white',
  padding: '4px 10px',
  borderRadius: 'var(--radius-full)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-medium)',
  pointerEvents: 'none',
};

const thumbnailStripStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-2)',
  overflowX: 'auto',
  paddingBottom: 'var(--space-2)',
  width: '100%',
};

const thumbnailBtnStyles: React.CSSProperties = {
  flex: '0 0 68px',
  width: '68px',
  height: '68px',
  borderRadius: 'var(--radius-md)',
  border: '2px solid var(--color-border)',
  padding: '2px',
  overflow: 'hidden',
  backgroundColor: '#ffffff',
  cursor: 'pointer',
  transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
};

const thumbnailImgStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  borderRadius: 'calc(var(--radius-md) - 2px)',
};
