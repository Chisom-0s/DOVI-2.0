import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import type { Review, APIError } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);
  const [ratingFilter, setRatingFilter] = useState('');

  // Delete Confirm Modal / State
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReviews = async (showSkeleton = true) => {
    if (showSkeleton) setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.listReviews({
        page,
        rating: ratingFilter ? parseInt(ratingFilter) : undefined,
      });
      setReviews(res.results || []);
      setTotalPages(Math.ceil(res.count / 20) || 1);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load reviews.');
    } finally {
      if (showSkeleton) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page, ratingFilter]);

  const handleDeleteConfirm = async () => {
    if (!reviewToDelete) return;
    setIsActionPending(true);
    try {
      await adminApi.removeReview(reviewToDelete.id);
      toast.success('Review has been deleted and moderated successfully.');
      setReviews(prev => prev.filter(r => r.id !== reviewToDelete.id));
      setReviewToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to moderate review.');
    } finally {
      setIsActionPending(false);
    }
  };

  if (isLoading) {
    return (
      <div style={containerStyles}>
        <h2 style={titleStyles}>Review Moderation Queue</h2>
        <Skeleton width="100%" height="300px" borderRadius="12px" />
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <h2 style={titleStyles}>Review Moderation Queue</h2>

      <ApiErrorMessage error={error} />

      {/* Filter / Search Bar */}
      <div style={filterBarStyles}>
        <div style={filterWrapperStyles}>
          <label style={filterLabelStyles}>Rating Score:</label>
          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setPage(1);
            }}
            style={selectStyles}
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      {reviews.length === 0 ? (
        <EmptyState
          icon="⭐"
          title="No Reviews Found"
          subtitle="Try adjusting your rating filters."
        />
      ) : (
        <div style={tableCardStyles}>
          <div style={tableWrapperStyles}>
            <table style={tableStyles}>
              <thead>
                <tr style={tableHeaderRowStyles}>
                  <th style={tableHeaderCellStyles}>Target Product</th>
                  <th style={tableHeaderCellStyles}>Rating Scores</th>
                  <th style={tableHeaderCellStyles}>Written Content</th>
                  <th style={tableHeaderCellStyles}>Verified Purchase</th>
                  <th style={tableHeaderCellStyles}>Submitted Date</th>
                  <th style={{ ...tableHeaderCellStyles, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r: any) => (
                  <tr key={r.id} style={tableRowStyles}>
                    <td style={{ ...tableCellStyles, fontWeight: 700 }}>
                      <span style={{ color: 'var(--color-primary)' }}>
                        {r.product_name || r.product_id || r.product || 'Product'}
                      </span>
                      {r.buyer_email && (
                        <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 400, marginTop: '2px' }}>
                          By: {r.buyer_email}
                        </div>
                      )}
                    </td>
                    <td style={tableCellStyles}>
                      <div style={scoresListStyles}>
                        <span style={scoreBadgeStyles}>Rating: ★{r.rating ?? r.product_rating ?? '5'}</span>
                      </div>
                    </td>
                    <td style={{ ...tableCellStyles, maxWidth: '300px', fontSize: '13px' }}>
                      {r.title && <strong style={{ display: 'block', marginBottom: '2px' }}>{r.title}</strong>}
                      <p style={{ margin: 0, color: '#4b5563', lineHeight: 1.4 }}>{r.comment || r.body || 'No comment provided.'}</p>
                    </td>
                    <td style={tableCellStyles}>
                      <span style={verifiedBadgeStyles(r.is_verified_purchase)}>
                        {r.is_verified_purchase ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td style={tableCellStyles}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A'}</td>
                    <td style={{ ...tableCellStyles, textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setReviewToDelete(r)}
                        style={deleteBtnStyles}
                      >
                        Delete Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={paginationStyles}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                style={pageBtnStyles}
              >
                Previous
              </button>
              <span style={pageLabelStyles}>Page {page} of {totalPages}</span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                style={pageBtnStyles}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {reviewToDelete && (
        <div style={modalBackdropStyles}>
          <div style={modalContentStyles}>
            <h3 style={modalTitleStyles}>Moderate / Delete Review</h3>
            <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              Are you sure you want to delete this review from product {reviewToDelete.product_id}? This operation will remove the review permanently.
            </p>
            <div style={modalActionsStyles}>
              <button type="button" onClick={() => setReviewToDelete(null)} style={modalCancelBtnStyles}>
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionPending}
                onClick={handleDeleteConfirm}
                style={modalDangerSubmitBtnStyles}
              >
                {isActionPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Badge status helper
const verifiedBadgeStyles = (verified: boolean): React.CSSProperties => {
  return {
    backgroundColor: verified ? '#d1fae5' : '#f3f4f6',
    color: verified ? '#065f46' : '#4b5563',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
  };
};

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const titleStyles: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 800,
  color: '#1f2937',
  margin: 0,
};

const filterBarStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '16px',
};

const filterWrapperStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const filterLabelStyles: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#4b5563',
};

const selectStyles: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  outline: 'none',
  backgroundColor: '#ffffff',
};

const tableCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
};

const tableWrapperStyles: React.CSSProperties = {
  overflowX: 'auto',
};

const tableStyles: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
};

const tableHeaderRowStyles: React.CSSProperties = {
  borderBottom: '2px solid #f3f4f6',
  backgroundColor: '#fafafa',
};

const tableHeaderCellStyles: React.CSSProperties = {
  padding: '12px var(--space-4)',
  fontSize: '11px',
  fontWeight: 700,
  color: '#6b7280',
  textTransform: 'uppercase',
};

const tableRowStyles: React.CSSProperties = {
  borderBottom: '1px solid #f3f4f6',
  fontSize: '13px',
};

const tableCellStyles: React.CSSProperties = {
  padding: '16px var(--space-4)',
  color: '#374151',
};

const scoresListStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const scoreBadgeStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  color: '#4b5563',
};

const deleteBtnStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#ef4444',
  border: '1px solid rgba(239,68,68,0.2)',
  padding: '4px 10px',
  borderRadius: '9999px',
  backgroundColor: 'transparent',
  cursor: 'pointer',
};

const paginationStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '16px',
  gap: '16px',
  borderTop: '1px solid #f3f4f6',
};

const pageBtnStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  padding: '6px 12px',
  borderRadius: '6px',
  cursor: 'pointer',
};

const pageLabelStyles: React.CSSProperties = {
  fontSize: '12px',
  color: '#4b5563',
};

const modalBackdropStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 999,
  padding: '16px',
};

const modalContentStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '24px',
  maxWidth: '440px',
  width: '100%',
  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
};

const modalTitleStyles: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#1f2937',
  margin: '0 0 12px 0',
  borderBottom: '1px solid #e5e7eb',
  paddingBottom: '8px',
};

const modalActionsStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '24px',
};

const modalCancelBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '9999px',
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  fontSize: '12px',
  fontWeight: 700,
  color: '#4b5563',
  cursor: 'pointer',
};

const modalDangerSubmitBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '9999px',
  backgroundColor: '#ef4444',
  fontSize: '12px',
  fontWeight: 700,
  color: '#ffffff',
  cursor: 'pointer',
  border: 'none',
};
