// ============================================================
// LoadingSpinner
// ============================================================
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  label?: string;
}

export default function LoadingSpinner({ size = 'md', fullScreen = false, label = 'Loading...' }: LoadingSpinnerProps) {
  const spinner = (
    <div className={`spinner spinner--${size}`} role="status" aria-label={label}>
      <div className="spinner__ring" />
      <span className="sr-only">{label}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="spinner-overlay">
        {spinner}
      </div>
    );
  }

  return spinner;
}
