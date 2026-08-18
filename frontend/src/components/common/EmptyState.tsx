// ============================================================
// EmptyState — shown when an API returns no results
// ============================================================
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, subtitle, action, className }: EmptyStateProps) {
  return (
    <div className={`empty-state ${className ?? ''}`} role="status">
      {icon && <div className="empty-state__icon">{icon}</div>}
      <h3 className="empty-state__title">{title}</h3>
      {subtitle && <p className="empty-state__subtitle">{subtitle}</p>}
      {action && (
        <button className="empty-state__btn" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
