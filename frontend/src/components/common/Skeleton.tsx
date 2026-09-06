// ============================================================
// Skeleton — configurable loading placeholder
// ============================================================
interface SkeletonProps {
  key?: any;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

export function Skeleton({ width = '100%', height = '1rem', borderRadius = '4px', className }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className ?? ''}`}
      style={{
        width,
        height,
        borderRadius,
      }}
      aria-hidden="true"
    />
  );
}

// ============================================================
// SkeletonText — paragraph of skeleton lines
// ============================================================
interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={`skeleton-text ${className ?? ''}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height="0.875rem"
          className="skeleton-text__line"
        />
      ))}
    </div>
  );
}

// ============================================================
// SkeletonCard — generic card skeleton
// ============================================================
export function SkeletonCard() {
  return (
    <div className="skeleton-card" style={cardStyles}>
      <Skeleton height="180px" borderRadius="0" />
      <div className="skeleton-card__body" style={cardBodyStyles}>
        <Skeleton height="1rem" width="85%" />
        <Skeleton height="0.875rem" width="60%" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
          <Skeleton height="1.25rem" width="45%" />
          <Skeleton height="1.75rem" width="30px" borderRadius="50%" />
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return <SkeletonCard />;
}

export function CategoryPillSkeleton() {
  return (
    <div style={pillSkeletonStyles}>
      <Skeleton width="28px" height="28px" borderRadius="50%" />
      <Skeleton width="70px" height="14px" borderRadius="4px" />
    </div>
  );
}

export function SectionSkeleton({
  layout = 'PRODUCT_GRID',
  title: _title = 'Loading section...',
  count = 4,
}: {
  layout?: string;
  title?: string;
  count?: number;
}) {
  return (
    <div style={sectionWrapperStyles}>
      <div style={sectionHeaderStyles}>
        <div>
          <Skeleton height="1.4rem" width="180px" borderRadius="4px" />
          <div style={{ marginTop: '6px' }}>
            <Skeleton height="0.9rem" width="260px" borderRadius="4px" />
          </div>
        </div>
      </div>

      {layout === 'HORIZONTAL_CAROUSEL' ? (
        <div style={carouselScrollStyles} className="hide-scrollbar">
          {Array.from({ length: count }).map((_, idx) => (
            <div key={idx} style={{ minWidth: '190px', flexShrink: 0 }}>
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      ) : layout === 'CATEGORY_PILLS' ? (
        <div style={carouselScrollStyles} className="hide-scrollbar">
          {Array.from({ length: 6 }).map((_, idx) => (
            <CategoryPillSkeleton key={idx} />
          ))}
        </div>
      ) : (
        <div style={gridStyles}>
          {Array.from({ length: count }).map((_, idx) => (
            <ProductCardSkeleton key={idx} />
          ))}
        </div>
      )}
    </div>
  );
}

const cardStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-surface, #ffffff)',
  borderRadius: 'var(--radius-md, 8px)',
  overflow: 'hidden',
  border: '1px solid var(--color-border, #e2e8f0)',
};

const cardBodyStyles: React.CSSProperties = {
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const pillSkeletonStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 16px',
  borderRadius: '999px',
  backgroundColor: 'var(--color-surface, #ffffff)',
  border: '1px solid var(--color-border, #e2e8f0)',
  flexShrink: 0,
};

const sectionWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  marginBottom: '32px',
};

const sectionHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
};

const gridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: '16px',
};

const carouselScrollStyles: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  overflowX: 'auto',
  paddingBottom: '8px',
};

