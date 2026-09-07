import React, { useState } from 'react';

interface ItemImageLoaderProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  imageStyle?: React.CSSProperties;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  loading?: 'lazy' | 'eager';
}

export function ItemImageLoader({
  src,
  alt,
  className = '',
  style,
  imageStyle,
  aspectRatio = '1/1',
  objectFit = 'cover',
  loading = 'lazy',
}: ItemImageLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const containerStyles: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    aspectRatio: aspectRatio,
    backgroundColor: '#f1f5f9',
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
    transition: 'opacity 300ms ease',
    opacity: isLoading || hasError ? 1 : 0,
    pointerEvents: isLoading || hasError ? 'auto' : 'none',
  };

  return (
    <div className={`item-image-loader-container ${className}`} style={containerStyles}>
      {/* Neutral Skeleton Shimmer Placeholder (No logo) */}
      <div style={placeholderStyles}>
        {hasError ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94a3b8', gap: '4px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span style={{ fontSize: '10px', fontWeight: '500' }}>Image unavailable</span>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <div className="dovi-neutral-pulse" style={{ animationDelay: '0s' }} />
            <div className="dovi-neutral-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="dovi-neutral-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        )}

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
      {src && !hasError && (
        <img
          src={src}
          alt={alt}
          loading={loading}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: objectFit,
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 300ms ease-in-out',
            ...imageStyle,
          }}
        />
      )}
    </div>
  );
}

export default ItemImageLoader;
