import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { save2ownApi } from '@/api/save2own';
import type { Save2OwnGoalSummary } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import type { APIError } from '@/types';

export default function Save2OwnGoalsPage() {
  const [goals, setGoals] = useState<Save2OwnGoalSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  useEffect(() => {
    const fetchGoals = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await save2ownApi.listGoals();
        setGoals(response.results || []);
      } catch (err: any) {
        setError(err);
        toast.error('Failed to load Save2Own goals.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchGoals();
  }, []);

  const formatCurrency = (val: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(parseFloat(val || '0'));
  };

  const getStatusBadgeStyles = (status: string): React.CSSProperties => {
    let backgroundColor = 'rgba(107, 114, 128, 0.12)';
    let color = 'var(--color-text-muted)';

    switch (status) {
      case 'ACTIVE':
        backgroundColor = 'rgba(39, 174, 96, 0.12)';
        color = 'var(--color-success)';
        break;
      case 'PAUSED':
        backgroundColor = 'rgba(255, 159, 67, 0.12)';
        color = 'var(--color-warning)';
        break;
      case 'COMPLETED':
        backgroundColor = 'rgba(103, 58, 183, 0.12)';
        color = '#673ab7';
        break;
      case 'CANCELLED':
        backgroundColor = 'rgba(239, 68, 68, 0.12)';
        color = 'var(--color-danger)';
        break;
      case 'PRODUCT_UNAVAILABLE':
      case 'SUSPENDED':
        backgroundColor = 'rgba(239, 68, 68, 0.12)';
        color = 'var(--color-danger)';
        break;
      case 'PRICE_CHANGED':
      case 'PAYMENT_REVIEW':
      case 'REFUND_PENDING':
        backgroundColor = 'rgba(255, 159, 67, 0.12)';
        color = 'var(--color-warning)';
        break;
      case 'DRAFT':
      default:
        backgroundColor = 'rgba(107, 114, 128, 0.12)';
        color = 'var(--color-text-muted)';
        break;
    }

    return {
      backgroundColor,
      color,
      padding: '4px 8px',
      borderRadius: 'var(--radius-sm)',
      fontSize: '11px',
      fontWeight: 'var(--font-bold)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      display: 'inline-block',
      width: 'fit-content',
    };
  };

  if (isLoading) {
    return (
      <div style={containerStyles}>
        <div style={headerStyles}>
          <Skeleton width="180px" height="28px" borderRadius="var(--radius-md)" />
          <Skeleton width="120px" height="38px" borderRadius="var(--radius-full)" />
        </div>
        <div style={gridStyles}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} style={cardSkeletonStyles}>
              <Skeleton height="150px" borderRadius="var(--radius-md) var(--radius-md) 0 0" />
              <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <Skeleton width="80%" height="18px" />
                <Skeleton width="50%" height="14px" />
                <Skeleton width="100%" height="10px" borderRadius="var(--radius-full)" />
                <Skeleton width="40%" height="24px" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyles}>
        <div style={headerStyles}>
          <h2 style={titleStyles}>Save2Own Goals</h2>
        </div>
        <ApiErrorMessage error={error} />
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div style={containerStyles}>
        <div style={headerStyles}>
          <h2 style={titleStyles}>Save2Own Goals</h2>
        </div>
        <div style={emptyWrapperStyles}>
          <EmptyState
            icon="🎯"
            title="No Save2Own Goals Yet"
            subtitle="Start saving up interest-free for items you love. Find an eligible product in the marketplace and choose Start Saving."
            action={{
              label: 'Browse Products',
              onClick: () => {
                window.location.href = '/products';
              },
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <h2 style={titleStyles}>Save2Own Goals</h2>
        <Link to="/products" style={createBtnStyles}>
          Create New Goal
        </Link>
      </div>

      <div style={gridStyles}>
        {goals.map((goal) => {
          const formattedTarget = formatCurrency(goal.target_amount);
          const formattedContributed = formatCurrency(goal.total_contributed);
          const formattedRemaining = formatCurrency(goal.remaining_amount);

          return (
            <div key={goal.id} style={cardStyles} className="s2o-goal-card">
              {/* Product Info Banner */}
              <div style={productBannerStyles}>
                <img
                  src={goal.product.primary_image_url || '/logo.jpg?v=2'}
                  alt={goal.product.name}
                  style={productImgStyles}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.jpg?v=2';
                  }}
                />
                <div style={productDetailStyles}>
                  <h3 style={productNameStyles}>{goal.product.name}</h3>
                  <span style={getStatusBadgeStyles(goal.status)}>{goal.status.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Progress and Financials */}
              <div style={contentBodyStyles}>
                <div style={progressContainerStyles}>
                  <div style={progressHeaderStyles}>
                    <span style={progressLabelStyles}>Progress</span>
                    <span style={progressPercentStyles}>{goal.progress_percentage}%</span>
                  </div>
                  <div style={progressBarBgStyles}>
                    <div
                      style={{
                        ...progressBarFillStyles,
                        width: `${Math.min(goal.progress_percentage, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div style={financialsGridStyles}>
                  <div style={finItemStyles}>
                    <span style={finLabelStyles}>Saved</span>
                    <span style={finValueStyles}>{formattedContributed}</span>
                  </div>
                  <div style={finItemStyles}>
                    <span style={finLabelStyles}>Target</span>
                    <span style={finValueStyles}>{formattedTarget}</span>
                  </div>
                  <div style={finItemStyles}>
                    <span style={finLabelStyles}>Remaining</span>
                    <span style={{ ...finValueStyles, color: 'var(--color-primary)' }}>{formattedRemaining}</span>
                  </div>
                </div>

                {goal.target_date && (
                  <div style={targetDateRowStyles}>
                    <span>Target Completion:</span>
                    <strong>{new Date(goal.target_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</strong>
                  </div>
                )}

                <Link to={`/save2own/goals/${goal.id}`} style={detailsLinkStyles}>
                  View Details &amp; Manage &rarr;
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-5)',
  width: '100%',
};

const headerStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  margin: 0,
};

const createBtnStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  padding: '10px 20px',
  borderRadius: 'var(--radius-full)',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-sm)',
  transition: 'background-color var(--transition-fast)',
  textDecoration: 'none',
};

const gridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
  gap: 'var(--space-6)',
};

const cardStyles: React.CSSProperties = {
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: '#ffffff',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  transition: 'transform var(--transition-base), box-shadow var(--transition-base)',
};

const cardSkeletonStyles: React.CSSProperties = {
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: '#ffffff',
  overflow: 'hidden',
  height: '280px',
};

const productBannerStyles: React.CSSProperties = {
  display: 'flex',
  padding: 'var(--space-4)',
  gap: 'var(--space-4)',
  backgroundColor: 'var(--color-bg-subtle)',
  borderBottom: '1px solid var(--color-border)',
};

const productImgStyles: React.CSSProperties = {
  width: '64px',
  height: '64px',
  objectFit: 'cover',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  backgroundColor: '#ffffff',
  flexShrink: 0,
};

const productDetailStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-1)',
  justifyContent: 'center',
};

const productNameStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  margin: 0,
  lineHeight: 1.4,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const contentBodyStyles: React.CSSProperties = {
  padding: 'var(--space-4)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  flex: 1,
};

const progressContainerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-1)',
};

const progressHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
};

const progressLabelStyles: React.CSSProperties = {
  color: 'var(--color-text-muted)',
};

const progressPercentStyles: React.CSSProperties = {
  color: 'var(--color-primary)',
};

const progressBarBgStyles: React.CSSProperties = {
  width: '100%',
  height: '8px',
  backgroundColor: 'var(--color-border)',
  borderRadius: 'var(--radius-full)',
  overflow: 'hidden',
};

const progressBarFillStyles: React.CSSProperties = {
  height: '100%',
  background: 'linear-gradient(90deg, var(--color-primary) 0%, #ffb800 100%)',
  borderRadius: 'var(--radius-full)',
  transition: 'width var(--transition-slow) ease-out',
};

const financialsGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 'var(--space-2)',
  borderBottom: '1px solid var(--color-border)',
  paddingBottom: 'var(--space-3)',
};

const finItemStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const finLabelStyles: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  fontWeight: 'var(--font-semibold)',
};

const finValueStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
};

const targetDateRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
};

const detailsLinkStyles: React.CSSProperties = {
  textAlign: 'center',
  color: 'var(--color-primary)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  textDecoration: 'none',
  paddingTop: 'var(--space-2)',
  marginTop: 'auto',
  transition: 'color var(--transition-fast)',
};

const emptyWrapperStyles: React.CSSProperties = {
  padding: 'var(--space-10) var(--space-6)',
  border: '1px dashed var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--color-bg-subtle)',
};
