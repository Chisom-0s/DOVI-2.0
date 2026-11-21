import React from 'react';

export default function AdminRouteLoader() {
  return (
    <div style={containerStyles}>
      {/* Top subtle progress bar */}
      <div style={progressBarWrapperStyles}>
        <div style={progressBarFillStyles} />
      </div>

      <div style={contentSkeletonWrapper}>
        <div style={titleSkeletonStyles} />
        <div style={cardGridSkeletonStyles}>
          <div style={cardSkeletonStyles} />
          <div style={cardSkeletonStyles} />
          <div style={cardSkeletonStyles} />
        </div>
        <div style={tableSkeletonStyles} />
      </div>
    </div>
  );
}

const containerStyles: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  minHeight: '400px',
  animation: 'fadeIn 150ms ease-in',
};

const progressBarWrapperStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: '3px',
  backgroundColor: 'rgba(255, 122, 0, 0.1)',
  zIndex: 9999,
  overflow: 'hidden',
};

const progressBarFillStyles: React.CSSProperties = {
  height: '100%',
  width: '40%',
  backgroundColor: '#ff7a00',
  borderRadius: '2px',
  animation: 'indeterminateProgress 1s infinite linear',
};

const contentSkeletonWrapper: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  opacity: 0.7,
};

const titleSkeletonStyles: React.CSSProperties = {
  width: '220px',
  height: '32px',
  backgroundColor: '#e5e7eb',
  borderRadius: '8px',
};

const cardGridSkeletonStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '16px',
};

const cardSkeletonStyles: React.CSSProperties = {
  height: '110px',
  backgroundColor: '#e5e7eb',
  borderRadius: '12px',
};

const tableSkeletonStyles: React.CSSProperties = {
  height: '360px',
  backgroundColor: '#e5e7eb',
  borderRadius: '12px',
};
