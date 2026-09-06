import { useState } from 'react';
import type { ProductImage } from '@/types';
import { normalizeUrl, getProductFallbackImage } from '@/utils/image';

interface ProductImageGalleryProps {
  images: ProductImage[];
  product?: any;
}

export default function ProductImageGallery({ images, product }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({ transform: 'scale(1)', transformOrigin: 'center' });

  // Use contextual product fallback image
  const fallbackImage = getProductFallbackImage(product);

  if (!images || images.length === 0) {
    return (
      <div style={galleryWrapperStyles}>
        <div style={mainImageContainerStyles}>
          <img
            src={fallbackImage}
            alt={product?.name || 'Product Image'}
            style={mainImageStyles}
          />
        </div>
      </div>
    );
  }

  const activeImage = images[activeIndex];
  const activeSrc = normalizeUrl(activeImage?.url || activeImage?.image_url) || fallbackImage;

  // Mouse move handler for premium zoom on hover (desktop)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
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
        <img
          src={activeSrc}
          alt={activeImage?.alt_text || product?.name || 'Product Image'}
          style={{ ...mainImageStyles, ...zoomStyle }}
          onError={e => {
            (e.target as HTMLImageElement).src = fallbackImage;
          }}
        />
        {/* Mobile Swipe Indicators overlay */}
        <div className="hide-desktop" style={mobileSwipeIndicatorStyles}>
          <span>{activeIndex + 1} / {images.length}</span>
        </div>
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
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
  transition: 'transform 0.15s ease-out',
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

const noImageContainerStyles: React.CSSProperties = {
  aspectRatio: '1',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-bg-subtle)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
};

const noImageTextStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--space-2)',
  color: 'var(--color-text-muted)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-medium)',
};
