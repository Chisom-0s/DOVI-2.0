import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import type { Save2OwnDashboardMetrics, APIError } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';

export default function Save2OwnDashboardPage() {
  const [metrics, setMetrics] = useState<Save2OwnDashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  const fetchMetrics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.getSave2OwnDashboardMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load Save2Own dashboard metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const formatCurrency = (val: any) => {
    const num = parseFloat(String(val || '0'));
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(isNaN(num) ? 0 : num);
  };

  if (isLoading) {
    return (
      <div style={containerStyles}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={titleStyles}>Save2Own Financial &amp; Operations Dashboard</h1>
            <p style={subtitleStyles}>Loading financial metrics and ledger overview...</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <Skeleton height="140px" borderRadius="12px" />
          <Skeleton height="140px" borderRadius="12px" />
          <Skeleton height="140px" borderRadius="12px" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <Skeleton height="100px" borderRadius="10px" />
          <Skeleton height="100px" borderRadius="10px" />
          <Skeleton height="100px" borderRadius="10px" />
          <Skeleton height="100px" borderRadius="10px" />
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      {/* Header and Subnav Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h1 style={titleStyles}>Save2Own Financial &amp; Operations Dashboard</h1>
          <p style={subtitleStyles}>
            Authoritative financial tracking, goal lifecycle stats, locked funds, and verification metrics.
          </p>
        </div>

        {/* Global CSV Download Action */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={fetchMetrics}
            style={btnSecondaryStyles}
            title="Refresh Metrics"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Subnav Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <span style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, backgroundColor: '#ff7a00', color: '#ffffff' }}>
          📊 Dashboard
        </span>
        <Link
          to="/save2own"
          style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, backgroundColor: '#f3f4f6', color: '#4b5563', textDecoration: 'none' }}
        >
          🎯 All Goals
        </Link>
        <Link
          to="/save2own/contributions"
          style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, backgroundColor: '#f3f4f6', color: '#4b5563', textDecoration: 'none' }}
        >
          🏦 Contributions Verification
        </Link>
        <Link
          to="/save2own/participants"
          style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, backgroundColor: '#f3f4f6', color: '#4b5563', textDecoration: 'none' }}
        >
          👥 Participants &amp; Identity
        </Link>
        <Link
          to="/save2own/refunds"
          style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, backgroundColor: '#f3f4f6', color: '#4b5563', textDecoration: 'none' }}
        >
          💸 Refunds
        </Link>
      </div>

      <ApiErrorMessage error={error} />

      {metrics && (
        <>
          {/* PRIMARY FINANCIAL KPI CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            {/* Confirmed Balance Card */}
            <div style={{ ...kpiCardStyles, borderLeft: '4px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={kpiLabelStyles}>Total Confirmed Capital</span>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#111827', marginTop: '6px' }}>
                    {formatCurrency(metrics.total_confirmed_funds)}
                  </div>
                </div>
                <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#059669', fontSize: '20px' }}>
                  💰
                </div>
              </div>
              <div style={{ marginTop: '12px', fontSize: '12px', color: '#6b7280' }}>
                Strict authoritative balance: Verified payments minus refunds and reversals.
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 600, color: '#059669' }}>
                ✓ {metrics.confirmed_contributions} verified contribution payments
              </div>
            </div>

            {/* Pending Payments Card */}
            <div style={{ ...kpiCardStyles, borderLeft: '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={kpiLabelStyles}>Pending Verification Volume</span>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#111827', marginTop: '6px' }}>
                    {formatCurrency(metrics.pending_verification_amount)}
                  </div>
                </div>
                <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#fffbeb', color: '#d97706', fontSize: '20px' }}>
                  ⏳
                </div>
              </div>
              <div style={{ marginTop: '12px', fontSize: '12px', color: '#6b7280' }}>
                Customer transfer claims awaiting admin review. Excluded from goal balances.
              </div>
              <div style={{ marginTop: '8px' }}>
                <Link
                  to="/save2own/contributions?status=SUBMITTED"
                  style={{ fontSize: '12px', fontWeight: 700, color: '#d97706', textDecoration: 'none' }}
                >
                  Verify {metrics.pending_contributions} pending payments &rarr;
                </Link>
              </div>
            </div>

            {/* Total Refunds Card */}
            <div style={{ ...kpiCardStyles, borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={kpiLabelStyles}>Refunded / Settled Funds</span>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#111827', marginTop: '6px' }}>
                    {formatCurrency(metrics.refund_amount)}
                  </div>
                </div>
                <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#f5f3ff', color: '#7c3aed', fontSize: '20px' }}>
                  💸
                </div>
              </div>
              <div style={{ marginTop: '12px', fontSize: '12px', color: '#6b7280' }}>
                Total payouts processed or approved for cancelled Save2Own goals.
              </div>
              <div style={{ marginTop: '8px' }}>
                <Link
                  to="/save2own/refunds"
                  style={{ fontSize: '12px', fontWeight: 700, color: '#7c3aed', textDecoration: 'none' }}
                >
                  Manage refunds ledger &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* SECONDARY OPERATIONAL METRICS */}
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '14px' }}>
            Lifecycle &amp; Participation Overview
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            <div style={statMiniBoxStyles}>
              <span style={statMiniLabelStyles}>Active Goals</span>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                {metrics.active_goals}
              </div>
              <span style={{ fontSize: '11px', color: '#6b7280' }}>Currently saving</span>
            </div>

            <div style={statMiniBoxStyles}>
              <span style={statMiniLabelStyles}>Completed Goals</span>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>
                {metrics.completed_goals}
              </div>
              <span style={{ fontSize: '11px', color: '#6b7280' }}>100% funded</span>
            </div>

            <div style={statMiniBoxStyles}>
              <span style={statMiniLabelStyles}>Cancelled Goals</span>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
                {metrics.cancelled_goals}
              </div>
              <span style={{ fontSize: '11px', color: '#6b7280' }}>Refund lifecycle</span>
            </div>

            <div style={statMiniBoxStyles}>
              <span style={statMiniLabelStyles}>Paused Goals</span>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
                {metrics.paused_goals}
              </div>
              <span style={{ fontSize: '11px', color: '#6b7280' }}>Under price/item review</span>
            </div>

            <div style={statMiniBoxStyles}>
              <span style={statMiniLabelStyles}>Registered Participants</span>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginTop: '4px' }}>
                {metrics.total_participants}
              </div>
              <span style={{ fontSize: '11px', color: '#6b7280' }}>Verified identity ledger</span>
            </div>
          </div>

          {/* FINANCIAL INTEGRITY & CSV EXPORTS PANEL */}
          <div style={exportsCardStyles}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827' }}>
                  📥 Authoritative Audit &amp; Accounting CSV Exports
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                  Generate clean spreadsheet reports directly from the database. Note: biometric selfies are excluded for security.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <a
                href={adminApi.exportSave2OwnGoalsCsvUrl()}
                target="_blank"
                rel="noreferrer"
                style={exportBtnStyles}
              >
                <span>🎯</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, color: '#111827' }}>Export All Goals CSV</div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Balances, progress &amp; products</div>
                </div>
              </a>

              <a
                href={adminApi.exportSave2OwnContributionsCsvUrl()}
                target="_blank"
                rel="noreferrer"
                style={exportBtnStyles}
              >
                <span>🏦</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, color: '#111827' }}>Export Contributions CSV</div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Transfer refs, banks &amp; snapshots</div>
                </div>
              </a>

              <a
                href={adminApi.exportSave2OwnRefundsCsvUrl()}
                target="_blank"
                rel="noreferrer"
                style={exportBtnStyles}
              >
                <span>💸</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, color: '#111827' }}>Export Refunds CSV</div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Payouts, refs &amp; accounts</div>
                </div>
              </a>

              <a
                href={adminApi.exportSave2OwnParticipantsCsvUrl()}
                target="_blank"
                rel="noreferrer"
                style={exportBtnStyles}
              >
                <span>👥</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, color: '#111827' }}>Export Participants CSV</div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Identity ledger &amp; unlock history</div>
                </div>
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ----------------------------------------------------------
// Styles
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  padding: '24px',
  maxWidth: '1280px',
  margin: '0 auto',
};

const titleStyles: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 800,
  color: '#111827',
  margin: '0 0 6px 0',
};

const subtitleStyles: React.CSSProperties = {
  fontSize: '13px',
  color: '#6b7280',
  margin: 0,
};

const kpiCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '20px',
  border: '1px solid #e5e7eb',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};

const kpiLabelStyles: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#4b5563',
  textTransform: 'uppercase',
  letterSpacing: '0.025em',
};

const statMiniBoxStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '10px',
  padding: '16px',
  border: '1px solid #e5e7eb',
  display: 'flex',
  flexDirection: 'column',
};

const statMiniLabelStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#4b5563',
};

const exportsCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '20px',
  border: '1px solid #e5e7eb',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};

const exportBtnStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  borderRadius: '8px',
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  textDecoration: 'none',
  fontSize: '13px',
  transition: 'background-color 0.15s ease',
};

const btnSecondaryStyles: React.CSSProperties = {
  padding: '8px 14px',
  fontSize: '13px',
  fontWeight: 600,
  borderRadius: '6px',
  backgroundColor: '#ffffff',
  color: '#4b5563',
  border: '1px solid #d1d5db',
  cursor: 'pointer',
};
