import { useEffect, useState, useCallback } from 'react';
import { autoApi } from '@/api/auto';
import type { RentalBooking } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';
import toast from 'react-hot-toast';

export default function MyRentalsPage() {
  const [bookings, setBookings] = useState<RentalBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Cancellation confirm modal state
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await autoApi.listBookings();
      setBookings(data.results);
      setError(null);
    } catch (err) {
      console.error('Failed to load rental bookings:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancelConfirm = async () => {
    if (!cancellingId) return;

    try {
      setIsCancelling(true);
      await autoApi.cancelBooking(cancellingId);
      toast.success('Reservation booking cancelled successfully');
      setCancellingId(null);
      fetchBookings();
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      toast.error('Unable to cancel booking at this time');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div style={containerStyles}>
      <div style={headerRowStyles}>
        <div>
          <h2 style={titleStyles}>My Rental Bookings</h2>
          <p style={subtitleStyles}>Monitor your active reservations, return statuses, and deposit refunds</p>
        </div>
      </div>

      {isLoading ? (
        <div style={skeletonWrapperStyles}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height="90px" borderRadius="12px" />
          ))}
        </div>
      ) : error ? (
        <div style={errorContainerStyles}>
          <ApiErrorMessage error={error} />
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          title="No Rentals Found"
          subtitle="You haven't reserved any vehicles yet."
        />
      ) : (
        <div style={listStyles}>
          {bookings.map((booking) => (
            <div key={booking.id} style={cardStyles}>
              {/* Row Left: Vehicle Image & Info */}
              <div style={vehicleSectionStyles}>
                {booking.rental.primary_image_url ? (
                  <img
                    src={booking.rental.primary_image_url}
                    alt={booking.rental.make}
                    style={imgStyles}
                  />
                ) : (
                  <div style={placeholderImgStyles}>🚗</div>
                )}
                <div>
                  <h3 style={vehicleNameStyles}>
                    {booking.rental.make} {booking.rental.model} ({booking.rental.year})
                  </h3>
                  <div style={dateRangeStyles}>
                    📅 {new Date(booking.pickup_date).toLocaleDateString()} &rarr;{' '}
                    {new Date(booking.return_date).toLocaleDateString()} ({booking.total_days} days)
                  </div>
                  <div style={locationTextStyles}>📍 Pickup: {booking.rental.pickup_location}</div>
                </div>
              </div>

              {/* Row Center: Status badging */}
              <div style={statusSectionStyles}>
                <div>
                  <span style={labelStyles}>Booking Status</span>
                  <span
                    style={{
                      ...statusBadgeStyles,
                      backgroundColor:
                        booking.booking_status === 'CONFIRMED' || booking.booking_status === 'ACTIVE'
                          ? '#edfdf6'
                          : booking.booking_status === 'CANCELLED'
                            ? '#fdf2f2'
                            : '#f3f4f6',
                      color:
                        booking.booking_status === 'CONFIRMED' || booking.booking_status === 'ACTIVE'
                          ? 'var(--color-success, #27ae60)'
                          : booking.booking_status === 'CANCELLED'
                            ? 'var(--color-danger, #ef4444)'
                            : '#4b5563',
                    }}
                  >
                    {booking.booking_status}
                  </span>
                </div>
                <div>
                  <span style={labelStyles}>Payment</span>
                  <span style={paymentBadgeStyles}>{booking.payment_status}</span>
                </div>
              </div>

              {/* Row Right: Totals and actions */}
              <div style={totalSectionStyles}>
                <div style={priceContainerStyles}>
                  <div style={priceRowStyles}>
                    <span style={priceLabelStyles}>Security Deposit</span>
                    <strong style={priceValStyles}>₦{parseFloat(booking.security_deposit).toLocaleString()}</strong>
                  </div>
                  <div style={priceRowStyles}>
                    <span style={priceLabelStyles}>Rental Fee</span>
                    <strong style={priceValStyles}>₦{parseFloat(booking.total_amount).toLocaleString()}</strong>
                  </div>
                </div>

                {/* Cancel Booking toggle based on API status */}
                {booking.can_cancel && (
                  <button
                    style={cancelBtnStyles}
                    onClick={() => setCancellingId(booking.id)}
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {cancellingId && (
        <div style={modalOverlayStyles}>
          <div style={modalCardStyles}>
            <h3 style={modalTitleStyles}>Cancel Vehicle Booking?</h3>
            <p style={modalTextStyles}>
              Are you sure you want to cancel this reservation booking? You may be eligible for a refund according to rental terms.
            </p>
            <div style={modalActionsStyles}>
              <button
                type="button"
                style={modalCancelBtnStyles}
                onClick={() => setCancellingId(null)}
                disabled={isCancelling}
              >
                Keep Booking
              </button>
              <button
                type="button"
                style={modalSubmitBtnStyles}
                onClick={handleCancelConfirm}
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
};

const headerRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '28px',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  margin: 0,
};

const subtitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  marginTop: '4px',
  margin: 0,
};

const skeletonWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const errorContainerStyles: React.CSSProperties = {
  padding: '32px',
  textAlign: 'center',
};

const listStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const cardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-xl)',
  padding: '24px',
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '20px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
};

const vehicleSectionStyles: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  alignItems: 'center',
  flex: '2 1 300px',
};

const imgStyles: React.CSSProperties = {
  width: '90px',
  height: '68px',
  borderRadius: '8px',
  objectFit: 'cover',
  backgroundColor: '#f3f4f6',
};

const placeholderImgStyles: React.CSSProperties = {
  width: '90px',
  height: '68px',
  borderRadius: '8px',
  backgroundColor: '#f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '28px',
};

const vehicleNameStyles: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 800,
  color: 'var(--color-text)',
  margin: 0,
};

const dateRangeStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  marginTop: '6px',
};

const locationTextStyles: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--color-text-muted)',
  marginTop: '4px',
};

const statusSectionStyles: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  flex: '1 1 180px',
};

const labelStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '9px',
  fontWeight: 700,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  marginBottom: '4px',
};

const statusBadgeStyles: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '10px',
  fontWeight: 750,
  padding: '2px 8px',
  borderRadius: '4px',
  textTransform: 'uppercase',
};

const paymentBadgeStyles: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '10px',
  fontWeight: 750,
  padding: '2px 8px',
  borderRadius: '4px',
  backgroundColor: '#f3f4f6',
  color: '#4b5563',
  textTransform: 'uppercase',
};

const totalSectionStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '12px',
  flex: '1 1 180px',
};

const priceContainerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  width: '100%',
};

const priceRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '16px',
  width: '100%',
};

const priceLabelStyles: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--color-text-muted)',
};

const priceValStyles: React.CSSProperties = {
  fontSize: '13px',
  color: 'var(--color-text)',
  fontWeight: 700,
};

const cancelBtnStyles: React.CSSProperties = {
  padding: '6px 12px',
  backgroundColor: '#ffffff',
  border: '1px solid var(--color-danger, #ef4444)',
  color: 'var(--color-danger, #ef4444)',
  borderRadius: '6px',
  fontSize: '11px',
  fontWeight: 700,
  cursor: 'pointer',
};

// Modal configuration
const modalOverlayStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '32px',
  width: '100%',
  maxWidth: '400px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
};

const modalTitleStyles: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 800,
  color: 'var(--color-text)',
  marginBottom: '12px',
};

const modalTextStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
  lineHeight: 1.5,
  marginBottom: '24px',
};

const modalActionsStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
};

const modalCancelBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: '#4b5563',
  backgroundColor: '#ffffff',
  cursor: 'pointer',
};

const modalSubmitBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  border: 'none',
  borderRadius: '6px',
  fontSize: 'var(--text-xs)',
  fontWeight: 700,
  color: '#ffffff',
  backgroundColor: 'var(--color-danger, #ef4444)',
  cursor: 'pointer',
};
