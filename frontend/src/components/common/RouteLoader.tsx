import React from 'react';

/**
 * RouteLoader — Lightweight, zero-dependency, branded loading fallback for lazy-loaded routes.
 * Displays a subtle top progress bar and clean content skeleton to eliminate blank screen flashes.
 */
export default function RouteLoader() {
  return (
    <div style={containerStyles} role="status" aria-label="Loading page...">
      {/* Top progress bar */}
      <div style={progressBarWrapperStyles}>
        <div style={progressBarFillStyles} />
      </div>

      {/* Main page skeleton */}
      <div style={skeletonWrapperStyles}>
        <div style={heroSkeletonStyles} />
        <div style={gridSkeletonStyles}>
          <div style={cardSkeletonStyles} />
          <div style={cardSkeletonStyles} />
          <div style={cardSkeletonStyles} />
          <div style={cardSkeletonStyles} />
        </div>
      </div>
    </div>
  );
}

const containerStyles: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  minHeight: '60vh',
  boxSizing: 'border-box',
};

const progressBarWrapperStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: '3px',
  backgroundColor: 'rgba(255, 122, 0, 0.12)',
  zIndex: 99999,
  overflow: 'hidden',
};

const progressBarFillStyles: React.CSSProperties = {
  height: '100%',
  width: '45%',
  backgroundColor: 'var(--color-primary, #ff7a00)',
  borderRadius: '2px',
  animation: 'doviRouteProgress 1.1s infinite cubic-bezier(0.4, 0, 0.2, 1)',
};

const skeletonWrapperStyles: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '24px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const heroSkeletonStyles: React.CSSProperties = {
  width: '100%',
  height: '160px',
  backgroundColor: '#f3f4f6',
  borderRadius: '16px',
  animation: 'pulse 1.8s ease-in-out infinite',
};

const gridSkeletonStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  gap: '16px',
};

const cardSkeletonStyles: React.CSSProperties = {
  height: '280px',
  backgroundColor: '#f9fafb',
  border: '1px solid #f3f4f6',
  borderRadius: '12px',
  animation: 'pulse 1.8s ease-in-out infinite',
};
