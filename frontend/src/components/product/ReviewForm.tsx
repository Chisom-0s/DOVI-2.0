import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { productsApi } from '@/api/products';
import type { Review } from '@/types';

interface ReviewFormProps {
  productId: string;
  onReviewSubmitted: (newReview: Review) => void;
}

export default function ReviewForm({ productId, onReviewSubmitted }: ReviewFormProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [productRating, setProductRating] = useState(5);
  const [vendorRating, setVendorRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [body, setBody] = useState('');
  const [title, setTitle] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user is unauthenticated, show login prompt
  if (!isAuthenticated) {
    const loginRedirectUrl = `/login?redirect=${encodeURIComponent(location.pathname)}`;
    return (
      <div style={authPromptStyles}>
        <span style={{ fontSize: '1.5rem' }}>🔒</span>
        <h4 style={authPromptTitleStyles}>Share your feedback</h4>
        <p style={authPromptTextStyles}>You must be logged in to leave a product review.</p>
        <button
          onClick={() => navigate(loginRedirectUrl)}
          style={authPromptBtnStyles}
        >
          Sign In to Review
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (body.trim().length < 10) {
      toast.error('Review body must be at least 10 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Build FormData for multipart review submission (supports photo upload)
      const formData = new FormData();
      formData.append('product_rating', productRating.toString());
      formData.append('vendor_rating', vendorRating.toString());
      formData.append('delivery_rating', deliveryRating.toString());
      formData.append('body', body.trim());
      if (title.trim()) {
        formData.append('title', title.trim());
      }
      if (photo) {
        formData.append('photo', photo);
      }

      const newReview = await productsApi.submitReview(productId, formData);
      toast.success('Thank you! Your review has been submitted.');
      
      // Reset form
      setBody('');
      setTitle('');
      setPhoto(null);
      setProductRating(5);
      setVendorRating(5);
      setDeliveryRating(5);

      onReviewSubmitted(newReview);
    } catch (err) {
      console.error('Review submit failed:', err);
      toast.error('Could not submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={formStyles}>
      <h3 style={titleStyles}>Write a Customer Review</h3>

      {/* Product Rating Selector */}
      <div style={formGroupStyles}>
        <label style={labelStyles}>Product Rating</label>
        <div style={starRowStyles}>
          {Array.from({ length: 5 }).map((_, idx) => {
            const ratingValue = idx + 1;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setProductRating(ratingValue)}
                style={starBtnStyles}
                aria-label={`Rate ${ratingValue} Stars`}
              >
                <span style={{
                  ...starStyles,
                  color: ratingValue <= productRating ? '#f39c12' : 'var(--color-border)',
                }}>
                  ★
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={ratingsGridStyles}>
        {/* Vendor Rating */}
        <div style={formGroupStyles}>
          <label style={labelStyles}>Vendor Rating</label>
          <div style={starRowStyles}>
            {Array.from({ length: 5 }).map((_, idx) => {
              const ratingValue = idx + 1;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setVendorRating(ratingValue)}
                  style={starBtnStyles}
                  aria-label={`Rate Vendor ${ratingValue} Stars`}
                >
                  <span style={{
                    ...starStyles,
                    fontSize: '1.25rem',
                    color: ratingValue <= vendorRating ? '#f39c12' : 'var(--color-border)',
                  }}>
                    ★
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Delivery Rating */}
        <div style={formGroupStyles}>
          <label style={labelStyles}>Delivery Rating</label>
          <div style={starRowStyles}>
            {Array.from({ length: 5 }).map((_, idx) => {
              const ratingValue = idx + 1;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setDeliveryRating(ratingValue)}
                  style={starBtnStyles}
                  aria-label={`Rate Delivery ${ratingValue} Stars`}
                >
                  <span style={{
                    ...starStyles,
                    fontSize: '1.25rem',
                    color: ratingValue <= deliveryRating ? '#f39c12' : 'var(--color-border)',
                  }}>
                    ★
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Review Title */}
      <div style={formGroupStyles}>
        <label htmlFor="review-title" style={labelStyles}>Review Title (Optional)</label>
        <input
          id="review-title"
          type="text"
          placeholder="Summarize your experience..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={inputStyles}
        />
      </div>

      {/* Review Body */}
      <div style={formGroupStyles}>
        <label htmlFor="review-body" style={labelStyles}>Review Details</label>
        <textarea
          id="review-body"
          placeholder="What did you like or dislike? How was the quality?"
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={4}
          style={textareaStyles}
          required
        />
      </div>

      {/* Photo Upload */}
      <div style={formGroupStyles}>
        <label htmlFor="review-photo" style={labelStyles}>Add Photo (Optional)</label>
        <div style={fileUploadWrapperStyles}>
          <input
            id="review-photo"
            type="file"
            accept="image/*"
            onChange={e => {
              if (e.target.files && e.target.files[0]) {
                setPhoto(e.target.files[0]);
              }
            }}
            style={fileInputStyles}
          />
          <div style={fileLabelStyles}>
            {photo ? `Selected: ${photo.name}` : '📁 Choose Image File'}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        style={submitBtnStyles}
      >
        {isSubmitting ? 'Submitting Review...' : 'Submit Review'}
      </button>
    </form>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const formStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  padding: 'var(--space-6)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: '#ffffff',
  width: '100%',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  marginBottom: 'var(--space-2)',
};

const ratingsGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 'var(--space-4)',
};

const formGroupStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
};

const labelStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
};

const starRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-1)',
};

const starBtnStyles: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: '0',
  cursor: 'pointer',
};

const starStyles: React.CSSProperties = {
  fontSize: '2rem',
  lineHeight: '1',
  transition: 'color var(--transition-fast)',
};

const inputStyles: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  fontSize: 'var(--text-sm)',
  outline: 'none',
};

const textareaStyles: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  fontSize: 'var(--text-sm)',
  outline: 'none',
  resize: 'vertical',
  fontFamily: 'inherit',
};

const fileUploadWrapperStyles: React.CSSProperties = {
  position: 'relative',
  border: '1px dashed var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-3) var(--space-4)',
  textAlign: 'center',
  cursor: 'pointer',
  backgroundColor: 'var(--color-bg-subtle)',
};

const fileInputStyles: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  opacity: 0,
  cursor: 'pointer',
};

const fileLabelStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
  fontWeight: 'var(--font-medium)',
};

const submitBtnStyles: React.CSSProperties = {
  padding: '12px 24px',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-semibold)',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  cursor: 'pointer',
  transition: 'background-color var(--transition-fast)',
  marginTop: 'var(--space-2)',
};

const authPromptStyles: React.CSSProperties = {
  padding: 'var(--space-8) var(--space-6)',
  border: '1px dashed var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--color-bg-subtle)',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--space-3)',
  width: '100%',
};

const authPromptTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
};

const authPromptTextStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
  maxWidth: '30ch',
  margin: '0',
};

const authPromptBtnStyles: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-semibold)',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  cursor: 'pointer',
  boxShadow: '0 4px 10px rgba(255, 122, 0, 0.15)',
};
