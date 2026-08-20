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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px 24px',
        gap: '12px',
      }}
      className={className}
      role="status"
    >
      {icon && <div style={{ fontSize: '40px' }}>{icon}</div>}
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', margin: 0 }}>{title}</h3>
      {subtitle && <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>{subtitle}</p>}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          style={{
            backgroundColor: '#ff7a00',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            marginTop: '8px',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
