import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import AutoSubNav from '@/components/auto/AutoSubNav';
import { autoApi } from '@/api/auto';
import type { RentalBooking } from '@/types';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';

export default function RentalConfirmationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('booking_id');

  const [booking, setBooking] = useState<RentalBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        // Find booking in the user's booking history
        const data = await autoApi.listBookings();
        const match = data.results.find((b) => b.id === bookingId);
        if (match) {
          setBooking(match);
          setError(null);
        } else {
          setError(new Error('Booking details not found in history'));
        }
      } catch (err) {
        console.error('Failed to load booking details:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookingDetails();
  }, [bookingId]);

  if (isLoading) {
    return (
      <div style={containerStyles}>
        <AutoSubNav />
        <div style={loadingContainerStyles}>
          <LoadingSpinner label="Loading reservation confirmation details..." />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div style={containerStyles}>
        <AutoSubNav />
        <div style={errorWrapperStyles}>
          <ApiErrorMessage error={error || new Error('Invalid booking reference')} />
          <button style={backBtnStyles} onClick={() => navigate('/auto/rentals')}>
            &larr; Back to Rentals
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <AutoSubNav />

      <div style={wrapperStyles}>
        <div style={successCardStyles}>
          <div style={successBadgeStyles}>✓</div>
          <h1 style={titleStyles}>Booking Confirmed!</h1>
          <p style={subtitleStyles}>Your vehicle reservation request has been processed successfully.</p>

          <div style={refBoxStyles}>
            <span style={refLabelStyles}>Reservation Ref ID</span>
            <strong style={refValStyles}>{booking.id}</strong>
          </div>

          <div style={receiptStyles}>
            <h3 style={receiptHeadingStyles}>Reservation Receipt</h3>

            <div style={receiptRowStyles}>
              <span style={labelStyles}>Vehicle Reserved</span>
              <strong style={valStyles}>
                {booking.rental.make} {booking.rental.model} ({booking.rental.year})
              </strong>
            </div>

            <div style={receiptRowStyles}>
              <span style={labelStyles}>Pickup Date</span>
              <span style={valStyles}>{new Date(booking.pickup_date).toLocaleDateString()}</span>
            </div>

            <div style={receiptRowStyles}>
              <span style={labelStyles}>Return Date</span>
              <span style={valStyles}>{new Date(booking.return_date).toLocaleDateString()}</span>
            </div>

            <div style={receiptRowStyles}>
              <span style={labelStyles}>Rent Duration</span>
              <span style={valStyles}>{booking.total_days} days</span>
            </div>

            <div style={dividerStyles} />

            {/* Price values directly outputted from database fields - NO client-side calculations */}
            <div style={receiptRowStyles}>
              <span style={labelStyles}>Refundable Security Deposit</span>
              <span style={valStyles}>₦{parseFloat(booking.security_deposit).toLocaleString()}</span>
            </div>

            <div style={receiptRowStyles}>
              <span style={labelStyles}>Rental Service Fee</span>
              <span style={valStyles}>₦{parseFloat(booking.total_amount).toLocaleString()}</span>
            </div>

            <div style={dividerStyles} />

            <div style={totalRowStyles}>
              <span>Grand Total Paid</span>
              <span>₦{(parseFloat(booking.total_amount) + parseFloat(booking.security_deposit)).toLocaleString()}</span>
            </div>
          </div>

          <div style={actionsStyles}>
            <Link to="/dashboard/rentals" style={primaryBtnStyles}>
              My Dashboard Reservations 📂
            </Link>
            <Link to="/auto/rentals" style={secondaryBtnStyles}>
              Rent another vehicle &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  minHeight: '100vh',
  fontFamily: 'var(--font-sans)',
};

const loadingContainerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '120px 24px',
};

const errorWrapperStyles: React.CSSProperties = {
  maxWidth: '640px',
  margin: '80px auto',
  padding: '0 24px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '24px',
};

const backBtnStyles: React.CSSProperties = {
  padding: '10px 24px',
  backgroundColor: '#111827',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 700,
  cursor: 'pointer',
};

const wrapperStyles: React.CSSProperties = {
  maxWidth: '560px',
  margin: '40px auto 80px auto',
  padding: '0 var(--space-4, 16px)',
  width: '100%',
};

const successCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: 'var(--radius-xl, 16px)',
  border: '1px solid var(--color-border, #e5e7eb)',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
  padding: '40px 32px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const successBadgeStyles: React.CSSProperties = {
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  backgroundColor: '#edfdf6',
  color: 'var(--color-success, #27ae60)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '32px',
  fontWeight: 900,
  marginBottom: '24px',
  border: '2px solid #cbf8e3',
};

const titleStyles: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 900,
  color: '#1f2937',
  margin: 0,
};

const subtitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm, 0.875rem)',
  color: 'var(--color-text-muted, #6b7280)',
  marginTop: '8px',
  marginBottom: '32px',
  lineHeight: 1.5,
};

const refBoxStyles: React.CSSProperties = {
  backgroundColor: '#f3f4f6',
  padding: '12px 24px',
  borderRadius: '8px',
  marginBottom: '32px',
  display: 'inline-flex',
  flexDirection: 'column',
  gap: '4px',
};

const refLabelStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  textTransform: 'uppercase',
  color: 'var(--color-text-muted, #6b7280)',
};

const refValStyles: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 800,
  color: '#111827',
};

const receiptStyles: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '32px',
  textAlign: 'left',
};

const receiptHeadingStyles: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 800,
  color: '#1f2937',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  borderBottom: '1px solid #e5e7eb',
  paddingBottom: '12px',
  marginBottom: '16px',
};

const receiptRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 0',
};

const labelStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs, 0.75rem)',
  color: 'var(--color-text-muted, #6b7280)',
  fontWeight: 500,
};

const valStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm, 0.875rem)',
  color: '#1f2937',
  fontWeight: 700,
};

const dividerStyles: React.CSSProperties = {
  borderTop: '1px dashed #d1d5db',
  margin: '12px 0',
};

const totalRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 'var(--text-sm, 0.875rem)',
  fontWeight: 800,
  color: 'var(--color-primary, #ff7a00)',
  paddingTop: '4px',
};

const actionsStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  width: '100%',
};

const primaryBtnStyles: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  backgroundColor: '#111827',
  color: '#ffffff',
  textAlign: 'center',
  textDecoration: 'none',
  borderRadius: '8px',
  fontWeight: 700,
  fontSize: '14px',
};

const secondaryBtnStyles: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  backgroundColor: '#ffffff',
  color: '#4b5563',
  textAlign: 'center',
  textDecoration: 'none',
  borderRadius: '8px',
  fontWeight: 700,
  fontSize: '14px',
  border: '1px solid #d1d5db',
};
