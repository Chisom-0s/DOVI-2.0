import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { reviewsApi } from '@/api/reviews';
import type { Review } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';

interface UserReview extends Review {
  product?: {
    id: string;
    name: string;
    primary_image_url: string | null;
  };
}

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit modal/state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editBody, setEditBody] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await reviewsApi.list();
      setReviews(data.results);
    } catch {
      toast.error('Failed to load your reviews.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleEditClick = (rev: UserReview) => {
    setEditingId(rev.id);
    setEditRating(rev.product_rating);
    setEditBody(rev.body);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setIsUpdating(true);
    try {
      const updated = await reviewsApi.update(editingId, {
        product_rating: editRating,
        body: editBody,
      });
      setReviews(prev => prev.map(r => r.id === editingId ? { ...r, ...updated } : r));
      setEditingId(null);
      toast.success('Review updated.');
    } catch {
      toast.error('Failed to update review.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await reviewsApi.delete(id);
      setReviews(prev => prev.filter(r => r.id !== id));
      toast.success('Review deleted.');
    } catch {
      toast.error('Failed to delete review.');
    }
  };

  return (
    <div style={containerStyles}>
      <h2 style={titleStyles}>My Reviews</h2>

      {isLoading && (
        <div style={listStyles}>
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} width="100%" height="100px" borderRadius="var(--radius-lg)" />
          ))}
        </div>
      )}

      {/* Edit Review Modal/Form Overlay */}
      {editingId && (
        <form onSubmit={handleUpdate} style={editFormStyles}>
          <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)' }}>Edit Review</h3>
          <div style={ratingSelectorStyles}>
            <label style={labelStyles}>Rating</label>
            <div style={starsRowStyles}>
              {Array.from({ length: 5 }).map((_, idx) => {
                const starVal = idx + 1;
                return (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setEditRating(starVal)}
                    style={starBtnStyles(starVal <= editRating)}
                  >
                    ★
                  </button>
                );
              })}
            </div>
          </div>
          <div style={fieldStyles}>
            <label style={labelStyles}>Review Comment</label>
            <textarea
              value={editBody}
              onChange={e => setEditBody(e.target.value)}
              style={textareaStyles}
              rows={4}
              required
            />
          </div>
          <div style={actionRowStyles}>
            <button
              type="submit"
              disabled={isUpdating}
              style={{
                ...primaryBtnStyles,
                opacity: isUpdating ? 0.6 : 1,
              }}
            >
              {isUpdating ? 'Updating...' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => setEditingId(null)} style={secondaryBtnStyles}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {!isLoading && !editingId && reviews.length === 0 && (
        <div style={emptyStyles}>
          <span style={{ fontSize: '2rem' }}>⭐</span>
          <p style={emptyTextStyles}>You haven't written any reviews yet.</p>
        </div>
      )}

      {!isLoading && !editingId && reviews.length > 0 && (
        <div style={listStyles}>
          {reviews.map((rev) => (
            <div key={rev.id} style={reviewCardStyles}>
              <div style={reviewHeaderStyles}>
                <div>
                  <strong style={productNameStyles}>
                    {rev.product?.name || `Product ID: ${rev.product_id}`}
                  </strong>
                  <span style={orderRefStyles}>Order Ref: #{rev.order_reference}</span>
                </div>
                <span style={starsTextStyles}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} style={{ color: i < rev.product_rating ? 'var(--color-warning)' : 'var(--color-border)' }}>
                      ★
                    </span>
                  ))}
                </span>
              </div>
              <p style={bodyStyles}>{rev.body}</p>
              <div style={footerRowStyles}>
                <span style={dateStyles}>
                  {new Date(rev.created_at).toLocaleDateString('en-NG', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </span>
                <div style={actionBtnRowStyles}>
                  <button onClick={() => handleEditClick(rev)} style={editBtnStyles}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(rev.id)} style={deleteBtnStyles}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------
// Styling
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  margin: 0,
};

const listStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const reviewCardStyles: React.CSSProperties = {
  padding: 'var(--space-4)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
};

const reviewHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: 'var(--space-2)',
};

const productNameStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  display: 'block',
};

const orderRefStyles: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--color-text-muted)',
};

const starsTextStyles: React.CSSProperties = {
  fontSize: '14px',
};

const bodyStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  lineHeight: 1.5,
};

const footerRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 'var(--space-2)',
  borderTop: '1px solid var(--color-border)',
  paddingTop: 'var(--space-2)',
};

const dateStyles: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--color-text-muted)',
};

const actionBtnRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-3)',
};

const editBtnStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-primary)',
  fontWeight: 'var(--font-bold)',
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
};

const deleteBtnStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-danger)',
  fontWeight: 'var(--font-bold)',
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
};

const editFormStyles: React.CSSProperties = {
  padding: 'var(--space-5)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
};

const ratingSelectorStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-1)',
};

const labelStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text-muted)',
};

const starsRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: '2px',
};

const starBtnStyles = (active: boolean): React.CSSProperties => ({
  fontSize: '20px',
  color: active ? 'var(--color-warning)' : 'var(--color-border)',
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
});

const fieldStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-1)',
};

const textareaStyles: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 'var(--text-xs)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-sans)',
  resize: 'vertical',
  outline: 'none',
};

const actionRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-3)',
};

const primaryBtnStyles: React.CSSProperties = {
  padding: '10px 24px',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  cursor: 'pointer',
};

const secondaryBtnStyles: React.CSSProperties = {
  padding: '10px 24px',
  backgroundColor: 'transparent',
  color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-semibold)',
  cursor: 'pointer',
};

const emptyStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-2)',
  padding: 'var(--space-12) 0',
  border: '2px dashed var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--color-bg-subtle)',
};

const emptyTextStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
};
