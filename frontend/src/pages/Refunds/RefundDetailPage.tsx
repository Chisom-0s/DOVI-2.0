import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { refundsApi } from '@/api/refunds';
import type { Refund } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';

// ----------------------------------------------------------
// RefundDetailPage — /dashboard/refunds/:id
// Fetches refund by ID from API.
// ----------------------------------------------------------
export default function RefundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [refund, setRefund] = useState<Refund | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRefund = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await refundsApi.getById(id);
        setRefund(data);
      } catch {
        setError('Refund not found.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRefund();
  }, [id]);

  const formatCurrency = (val: string) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(parseFloat(val));

  if (isLoading) {
    return (
      <div className="container" style={pageStyles}>
        <Skeleton width="200px" height="28px" borderRadius="var(--radius-md)" />
        <Skeleton width="100%" height="300px" borderRadius="var(--radius-lg)" />
      </div>
    );
  }

  if (error || !refund) {
    return (
      <div className="container" style={pageStyles}>
        <div style={centerStyles}>
          <h2 style={headingStyles}>Refund Not Found</h2>
          <p style={subTextStyles}>{error}</p>
          <Link to="/dashboard/orders" style={primaryBtnStyles}>View Orders</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={pageStyles}>
      <Link to="/dashboard/orders" style={backLinkStyles}>← My Orders</Link>

      <h1 style={titleStyles}>Refund Request</h1>

      {/* Status Header */}
      <div style={statusHeaderStyles}>
        <div style={statusIconStyles(refund.status)}>
          {statusIcon(refund.status)}
        </div>
        <div>
          <span
            className="status-badge"
            style={{
              backgroundColor: statusColor(refund.status).bg,
              color: statusColor(refund.status).text,
              fontSize: '12px',
              padding: '4px 14px',
            }}
          >
            {refund.status.replace(/_/g, ' ')}
          </span>
          <p style={statusDescStyles}>
            {statusDescription(refund.status)}
          </p>
        </div>
      </div>

      {/* Details Card */}
      <div style={cardStyles}>
        <div style={rowStyles}>
          <span style={labelStyles}>Order Reference</span>
          <Link to={`/dashboard/orders/${refund.order_reference}`} style={linkValueStyles}>
            #{refund.order_reference}
          </Link>
        </div>
        <div style={rowStyles}>
          <span style={labelStyles}>Reason</span>
          <span style={valueStyles}>{refund.reason}</span>
        </div>
        <div style={rowStyles}>
          <span style={labelStyles}>Amount</span>
          <span style={valueStyles}>{formatCurrency(refund.amount)}</span>
        </div>
        <div style={rowStyles}>
          <span style={labelStyles}>Submitted</span>
          <span style={valueStyles}>
            {new Date(refund.created_at).toLocaleDateString('en-NG', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </span>
        </div>
        {refund.resolved_at && (
          <div style={rowStyles}>
            <span style={labelStyles}>Resolved</span>
            <span style={valueStyles}>
              {new Date(refund.resolved_at).toLocaleDateString('en-NG', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          </div>
        )}
      </div>

      {/* Description */}
      <div style={sectionStyles}>
        <h3 style={sectionTitleStyles}>Description</h3>
        <p style={descTextStyles}>{refund.description}</p>
      </div>

      {/* Admin Note */}
      {refund.admin_note && (
        <div style={noteStyles}>
          <h3 style={sectionTitleStyles}>Admin Response</h3>
          <p style={descTextStyles}>{refund.admin_note}</p>
        </div>
      )}

      {/* Evidence */}
      {refund.evidence && refund.evidence.length > 0 && (
        <div style={sectionStyles}>
          <h3 style={sectionTitleStyles}>Evidence ({refund.evidence.length} file{refund.evidence.length !== 1 ? 's' : ''})</h3>
          <div style={evidenceGridStyles}>
            {refund.evidence.map((ev) => (
              <a key={ev.id} href={ev.file_url} target="_blank" rel="noopener noreferrer">
                <img
                  src={ev.file_url}
                  alt="Evidence"
                  style={evidenceImgStyles}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helpers
function statusIcon(status: string) {
  switch (status) {
    case 'APPROVED':
    case 'PROCESSED':
      return '✓';
    case 'REJECTED':
      return '✕';
    case 'UNDER_REVIEW':
      return '🔍';
    default:
      return '⏳';
  }
}

function statusDescription(status: string) {
  switch (status) {
    case 'PENDING':
      return 'Your refund request has been submitted and is awaiting review.';
    case 'UNDER_REVIEW':
      return 'Our team is currently reviewing your refund request.';
    case 'APPROVED':
      return 'Your refund has been approved and will be processed shortly.';
    case 'REJECTED':
      return 'Unfortunately, your refund request has been declined.';
    case 'PROCESSED':
      return 'Your refund has been processed and the amount has been returned.';
    default:
      return '';
  }
}

function statusColor(status: string) {
  switch (status) {
    case 'APPROVED':
    case 'PROCESSED':
      return { bg: 'rgba(46, 213, 115, 0.12)', text: 'var(--color-success)' };
    case 'REJECTED':
      return { bg: 'rgba(231, 76, 60, 0.12)', text: 'var(--color-danger)' };
    case 'UNDER_REVIEW':
      return { bg: 'rgba(103, 58, 183, 0.08)', text: 'var(--color-primary)' };
    default:
      return { bg: 'rgba(255, 165, 2, 0.12)', text: 'var(--color-warning)' };
  }
}

// Styling
const pageStyles: React.CSSProperties = {
  paddingTop: 'var(--space-6)',
  paddingBottom: 'var(--space-12)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  maxWidth: '640px',
  margin: '0 auto',
};

const backLinkStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  textDecoration: 'none',
  fontWeight: 'var(--font-medium)',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
};

const centerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--space-3)',
  padding: 'var(--space-12)',
  textAlign: 'center',
};

const headingStyles: React.CSSProperties = {
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-bold)',
  margin: 0,
};

const subTextStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
  margin: 0,
};

const statusHeaderStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-4)',
  padding: 'var(--space-5)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: '#ffffff',
};

const statusIconStyles = (status: string): React.CSSProperties => ({
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  backgroundColor: statusColor(status).bg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.5rem',
  flexShrink: 0,
});

const statusDescStyles: React.CSSProperties = {
  margin: '4px 0 0',
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
};

const cardStyles: React.CSSProperties = {
  padding: 'var(--space-4)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--color-bg-subtle)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const rowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 'var(--text-xs)',
};

const labelStyles: React.CSSProperties = {
  color: 'var(--color-text-muted)',
};

const valueStyles: React.CSSProperties = {
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text)',
};

const linkValueStyles: React.CSSProperties = {
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-primary)',
  textDecoration: 'none',
};

const sectionStyles: React.CSSProperties = {
  padding: 'var(--space-5)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const sectionTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  margin: 0,
};

const descTextStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text)',
  lineHeight: 1.6,
};

const noteStyles: React.CSSProperties = {
  ...sectionStyles,
  borderColor: 'var(--color-primary)',
  backgroundColor: 'rgba(103, 58, 183, 0.03)',
};

const evidenceGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
  gap: 'var(--space-3)',
};

const evidenceImgStyles: React.CSSProperties = {
  width: '100%',
  height: '100px',
  objectFit: 'cover',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
};

const primaryBtnStyles: React.CSSProperties = {
  padding: '10px 24px',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  borderRadius: 'var(--radius-md)',
  textDecoration: 'none',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-sm)',
};
