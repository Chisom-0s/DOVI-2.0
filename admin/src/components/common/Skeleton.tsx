interface SkeletonProps {
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
        backgroundColor: '#e5e7eb',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
      aria-hidden="true"
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height="0.875rem"
        />
      ))}
    </div>
  );
}
