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
    <div className="skeleton-card">
      <Skeleton height="200px" borderRadius="8px 8px 0 0" />
      <div className="skeleton-card__body">
        <Skeleton height="1rem" width="80%" />
        <Skeleton height="0.875rem" width="60%" />
        <Skeleton height="1.25rem" width="40%" />
      </div>
    </div>
  );
}
