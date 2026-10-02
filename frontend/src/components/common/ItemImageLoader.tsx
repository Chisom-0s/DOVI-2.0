import React, { useState, useEffect, useRef } from 'react';

export interface ItemImageLoaderProps {
  src?: string | null;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  imageStyle?: React.CSSProperties;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  loading?: 'lazy' | 'eager';
  onError?: () => void;
  onLoad?: () => void;
}

export function ItemImageLoader({
  src,
  fallbackSrc,
  alt,
  className = '',
  style,
  imageStyle,
  aspectRatio,
  objectFit = 'cover',
  loading = 'lazy',
  onError,
  onLoad,
}: ItemImageLoaderProps) {
  const initialTarget = src || fallbackSrc || '';
  const [currentSrc, setCurrentSrc] = useState<string>(initialTarget);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Sync state when src or fallbackSrc changes
  useEffect(() => {
    const nextTarget = src || fallbackSrc || '';
    setCurrentSrc(nextTarget);
    setHasError(false);
    setIsLoading(true);
  }, [src, fallbackSrc]);

  // Synchronously verify if the image is already cached / completed
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
        setIsLoading(false);
      }
    }
  }, [currentSrc]);

  const handleImageLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleImageError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      // Gracefully switch to fallback image instead of failing
      setCurrentSrc(fallbackSrc);
      setIsLoading(true);
    } else {
      setIsLoading(false);
      setHasError(true);
      onError?.();
    }
  };

  const containerStyles: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    ...(aspectRatio ? { aspectRatio } : {}),
    backgroundColor: 'var(--color-bg-subtle, #f1f5f9)',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...style,
  };

  const placeholderStyles: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    padding: '16px',
    zIndex: 1,
    transition: 'opacity 200ms ease-out',
    opacity: isLoading && !hasError ? 1 : 0,
    pointerEvents: 'none',
  };

  return (
    <div className={`item-image-loader-container ${className}`} style={containerStyles}>
      {/* Neutral Skeleton Pulse Shimmer Placeholder (Fades out when loaded) */}
      <div style={placeholderStyles}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <div className="dovi-neutral-pulse" style={{ animationDelay: '0s' }} />
          <div className="dovi-neutral-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="dovi-neutral-pulse" style={{ animationDelay: '0.4s' }} />
        </div>

        <style
          dangerouslySetInnerHTML={{
            __html: `
            @keyframes doviNeutralShimmer {
              0%, 100% { opacity: 0.3; transform: scale(0.85); }
              50% { opacity: 0.8; transform: scale(1.1); }
            }
            .dovi-neutral-pulse {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background-color: #cbd5e1;
              animation: doviNeutralShimmer 1.2s infinite ease-in-out;
            }
          `,
          }}
        />
      </div>

      {/* Target Product / Item Image */}
      {currentSrc && !hasError ? (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          loading={loading}
          decoding="async"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: objectFit,
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 250ms ease-in-out',
            ...imageStyle,
          }}
        />
      ) : hasError ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94a3b8', gap: '4px', zIndex: 2 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span style={{ fontSize: '10px', fontWeight: '500' }}>Image unavailable</span>
        </div>
      ) : null}
    </div>
  );
}

export default ItemImageLoader;
