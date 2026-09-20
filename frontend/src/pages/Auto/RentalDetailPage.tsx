import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AutoSubNav from '@/components/auto/AutoSubNav';
import AutoComingSoon from '@/components/auto/AutoComingSoon';
import { autoApi } from '@/api/auto';
import type { AutoRental } from '@/types';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { NoInternetBanner } from '@/components/common/NoInternetBanner';
import toast from 'react-hot-toast';

export default function RentalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [rental, setRental] = useState<AutoRental | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Booking Form State
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [provider, setProvider] = useState('flutterwave');
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    const fetchRentalDetail = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await autoApi.getRental(id);
        setRental(data);
        setError(null);
        setActiveImageIndex(0);
      } catch (err) {
        console.error('Failed to load rental details:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRentalDetail();
  }, [id]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rental || !pickupDate || !returnDate) return;

    // Calculate dates duration on client for limit validation only
    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    
    if (end <= start) {
      toast.error('Return date must be after pickup date');
      return;
    }

    const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (durationDays < rental.minimum_days) {
      toast.error(`Minimum rental duration is ${rental.minimum_days} days`);
      return;
    }

    if (rental.maximum_days && durationDays > rental.maximum_days) {
      toast.error(`Maximum rental duration is ${rental.maximum_days} days`);
      return;
    }

    try {
      setIsBooking(true);
      const confirmationRedirect = `${window.location.origin}/auto/rentals/confirmation`;
      
      const booking = await autoApi.bookRental(rental.id, {
        pickup_date: pickupDate,
        return_date: returnDate,
        provider,
        redirect_url: confirmationRedirect,
      });

      toast.success('Booking initiated!');
      // Navigate to confirmation page passing the booking ID
      navigate(`/auto/rentals/confirmation?booking_id=${booking.id}`);
    } catch (err: any) {
      console.error('Booking failed:', err);
      toast.error(err.message || 'Failed to request rental booking. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div style={containerStyles}>
        <AutoSubNav />
        <div style={loadingContainerStyles}>
          <LoadingSpinner label="Loading vehicle details..." />
        </div>
      </div>
    );
  }

  if (error || !rental) {
    if (!navigator.onLine || error?.code === 'NETWORK_ERROR' || error?.message?.toLowerCase().includes('internet signal')) {
      return (
        <div style={containerStyles}>
          <AutoSubNav />
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 16px' }}>
            <NoInternetBanner onRetry={() => window.location.reload()} />
          </div>
        </div>
      );
    }
    return (
      <AutoComingSoon sectionName="Rentals & Bookings" backPath="/auto/rentals" backLabel="Back to Rentals" />
    );
  }

  const hasImages = rental.images && rental.images.length > 0;
  const currentImage = hasImages
    ? rental.images[activeImageIndex]?.url
    : rental.primary_image_url;

  return (
    <div style={containerStyles}>
      <AutoSubNav />

      <div style={detailWrapperStyles}>
        {/* Navigation Breadcrumbs */}
        <div style={breadcrumbStyles}>
          <Link to="/auto" style={breadcrumbLinkStyles}>Auto</Link> &gt;{' '}
          <Link to="/auto/rentals" style={breadcrumbLinkStyles}>Rentals</Link> &gt;{' '}
          <span style={breadcrumbCurrentStyles}>{rental.make} {rental.model}</span>
        </div>

        {/* Main Columns Grid Layout */}
        <div style={layoutGridStyles}>
          {/* Left Column: Gallery & Specifications Table */}
          <div style={leftColStyles}>
            <div style={galleryStyles}>
              <div style={mainImgWrapperStyles}>
                {currentImage ? (
                  <img src={currentImage} alt={rental.make} style={mainImgStyles} />
                ) : (
                  <div style={placeholderImgStyles}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path>
                      <circle cx="7" cy="17" r="2"></circle>
                      <path d="M9 17h6"></path>
                      <circle cx="17" cy="17" r="2"></circle>
                    </svg>
                  </div>
                )}
              </div>

              {/* Thumbnails strip */}
              {hasImages && rental.images.length > 1 && (
                <div style={thumbnailListStyles}>
                  {rental.images.map((img, idx) => (
                    <button
                      key={img.id}
                      style={{
                        ...thumbnailBtnStyles,
                        border: activeImageIndex === idx ? '2px solid var(--color-primary, #ff7a00)' : '2px solid transparent',
                      }}
                      onClick={() => setActiveImageIndex(idx)}
                    >
                      <img src={img.url} alt="thumbnail" style={thumbnailImgStyles} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Vehicle Specifications */}
            <div style={specsBoxStyles}>
              <h2 style={sectionTitleStyles}>Specifications</h2>
              <div style={specsGridStyles}>
                <div style={specRowStyles}>
                  <span style={specLabelStyles}>Pickup Location</span>
                  <span style={specValStyles}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span style={{ verticalAlign: 'middle' }}>{rental.pickup_location}</span>
                  </span>
                </div>
                <div style={specRowStyles}>
                  <span style={specLabelStyles}>Return Location</span>
                  <span style={specValStyles}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span style={{ verticalAlign: 'middle' }}>{rental.return_location}</span>
                  </span>
                </div>
                <div style={specRowStyles}>
                  <span style={specLabelStyles}>Minimum Rent Duration</span>
                  <span style={specValStyles}>{rental.minimum_days} days</span>
                </div>
                <div style={specRowStyles}>
                  <span style={specLabelStyles}>Maximum Rent Duration</span>
                  <span style={specValStyles}>{rental.maximum_days ? `${rental.maximum_days} days` : 'Unlimited'}</span>
                </div>
                <div style={specRowStyles}>
                  <span style={specLabelStyles}>Available From</span>
                  <span style={specValStyles}>{new Date(rental.available_from).toLocaleDateString()}</span>
                </div>
                {rental.available_to && (
                  <div style={specRowStyles}>
                    <span style={specLabelStyles}>Available To</span>
                    <span style={specValStyles}>{new Date(rental.available_to).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div style={termsBoxStyles}>
              <h2 style={sectionTitleStyles}>Rental Terms & Conditions</h2>
              <ul style={termsListStyles}>
                <li>Minimum age requirement for drivers is 21 years old.</li>
                <li>Valid national driving permit or international license required at pickup.</li>
                <li>Refundable security deposit is held to cover any incidental minor damages.</li>
                <li>Vehicle must be returned with the same fuel level as recorded at pickup.</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Price details, Booking form widget, Vendor Details */}
          <div style={rightColStyles}>
            {/* Rates Card */}
            <div style={ratesCardStyles}>
              <h1 style={titleStyles}>
                {rental.make} {rental.model} <span style={yearStyles}>{rental.year}</span>
              </h1>

              <div style={priceContainerStyles}>
                <span style={priceLabelTextStyles}>Daily Rate</span>
                <span style={priceStyles}>₦{parseFloat(rental.daily_rate).toLocaleString()} <span style={{ fontSize: '14px', color: '#4b5563', fontWeight: 600 }}>/ day</span></span>
                
                {rental.weekly_rate && (
                  <div style={{ marginTop: '8px', borderTop: '1px solid #e5e7eb', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                    <span style={{ color: '#4b5563' }}>Weekly Discount Rate:</span>
                    <strong style={{ color: '#1f2937' }}>₦{parseFloat(rental.weekly_rate).toLocaleString()} / week</strong>
                  </div>
                )}
              </div>

              {/* Security Deposit warning */}
              <div style={depositAlertStyles}>
                <span>⚠️ Refundable Deposit:</span>
                <strong>₦{parseFloat(rental.security_deposit).toLocaleString()}</strong>
              </div>

              {/* Booking Request Form Widget */}
              <form onSubmit={handleBookingSubmit} style={bookingFormStyles}>
                <h3 style={bookingFormTitleStyles}>Reserve Vehicle</h3>

                <div style={formGroupStyles}>
                  <label style={formLabelStyles}>Pickup Date</label>
                  <input
                    type="date"
                    required
                    style={formInputStyles}
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                  />
                </div>

                <div style={formGroupStyles}>
                  <label style={formLabelStyles}>Return Date</label>
                  <input
                    type="date"
                    required
                    style={formInputStyles}
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                  />
                </div>

                <div style={formGroupStyles}>
                  <label style={formLabelStyles}>Payment Provider</label>
                  <select
                    style={formSelectStyles}
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                  >
                    <option value="flutterwave">Flutterwave Gateway</option>
                    <option value="opay">OPay Wallet</option>
                  </select>
                </div>

                {/* Safe Note regarding pricing calculation rule */}
                <p style={noteStyles}>
                  ℹ️ Total rentals pricing including refundable deposit is calculated by the secure database and shown at review checkout.
                </p>

                <button
                  type="submit"
                  style={{
                    ...bookBtnStyles,
                    cursor: isBooking ? 'not-allowed' : 'pointer',
                    opacity: isBooking ? 0.7 : 1,
                  }}
                  disabled={isBooking}
                >
                  {isBooking ? 'Processing reservation...' : 'Reserve & Check Out 🔑'}
                </button>
              </form>
            </div>

            {/* Vendor Information Card */}
            <div style={vendorCardStyles}>
              <h3 style={cardHeadingStyles}>Vendor Info</h3>
              <div style={vendorInfoRowStyles}>
                <div style={vendorLogoPlaceholderStyles}>
                  {rental.vendor?.name?.charAt(0) || 'V'}
                </div>
                <div>
                  <h4 style={vendorNameStyles}>{rental.vendor?.name || 'Premium Rentals'}</h4>
                  <div style={vendorRatingStyles}>
                    <span style={{ color: '#ffb600' }}>★</span>{' '}
                    <span>{rental.vendor?.rating || '4.8'}</span>
                    <span style={reviewCountStyles}>({rental.vendor?.review_count || 14} reviews)</span>
                  </div>
                  <p style={vendorLocationStyles}>📍 Lagos, Nigeria</p>
                </div>
              </div>
            </div>
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



const detailWrapperStyles: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '24px var(--space-4, 16px) 64px var(--space-4, 16px)',
  width: '100%',
};

const breadcrumbStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs, 0.75rem)',
  color: 'var(--color-text-muted, #6b7280)',
  marginBottom: '24px',
};

const breadcrumbLinkStyles: React.CSSProperties = {
  textDecoration: 'none',
  color: 'inherit',
  fontWeight: 500,
};

const breadcrumbCurrentStyles: React.CSSProperties = {
  color: 'var(--color-text, #1f2937)',
  fontWeight: 700,
};

const layoutGridStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '32px',
};

const leftColStyles: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '32px',
};

const rightColStyles: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const galleryStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: 'var(--radius-xl, 16px)',
  padding: '16px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
};

const mainImgWrapperStyles: React.CSSProperties = {
  position: 'relative',
  height: '320px',
  backgroundColor: '#e5e7eb',
  borderRadius: 'var(--radius-lg, 12px)',
  overflow: 'hidden',
};

const mainImgStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const placeholderImgStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '96px',
  color: '#9ca3af',
};

const thumbnailListStyles: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  marginTop: '16px',
  overflowX: 'auto',
  paddingBottom: '8px',
};

const thumbnailBtnStyles: React.CSSProperties = {
  width: '80px',
  height: '60px',
  borderRadius: '8px',
  overflow: 'hidden',
  cursor: 'pointer',
  padding: 0,
  backgroundColor: '#e5e7eb',
  flexShrink: 0,
};

const thumbnailImgStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const specsBoxStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: 'var(--radius-xl, 16px)',
  padding: '32px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
};

const sectionTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-lg, 1.125rem)',
  fontWeight: 800,
  color: '#1f2937',
  marginBottom: '20px',
  borderBottom: '2px solid #f3f4f6',
  paddingBottom: '12px',
};

const specsGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '16px 32px',
};

const specRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 0',
  borderBottom: '1px solid #f3f4f6',
};

const specLabelStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs, 0.75rem)',
  color: 'var(--color-text-muted, #6b7280)',
  fontWeight: 500,
};

const specValStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm, 0.875rem)',
  color: '#1f2937',
  fontWeight: 700,
};

const termsBoxStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: 'var(--radius-xl, 16px)',
  padding: '32px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
};

const termsListStyles: React.CSSProperties = {
  margin: 0,
  paddingLeft: '20px',
  fontSize: 'var(--text-sm, 0.875rem)',
  color: '#4b5563',
  lineHeight: 1.8,
};

const ratesCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: 'var(--radius-xl, 16px)',
  padding: '32px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-xl, 1.25rem)',
  fontWeight: 900,
  color: '#1f2937',
  marginBottom: '12px',
  lineHeight: 1.3,
};

const yearStyles: React.CSSProperties = {
  fontSize: '14px',
  color: '#6b7280',
  fontWeight: 500,
};

const priceContainerStyles: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  padding: '16px 20px',
  borderRadius: '12px',
  marginBottom: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const priceLabelTextStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  textTransform: 'uppercase',
  color: 'var(--color-text-muted, #6b7280)',
};

const priceStyles: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 900,
  color: '#1f2937',
};

const depositAlertStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  backgroundColor: '#fef3c7',
  border: '1px solid #fde68a',
  color: '#92400e',
  padding: '12px 16px',
  borderRadius: '8px',
  fontSize: 'var(--text-xs, 0.75rem)',
  fontWeight: 600,
  marginBottom: '28px',
};

const bookingFormStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  borderTop: '1px solid #e5e7eb',
  paddingTop: '24px',
};

const bookingFormTitleStyles: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 800,
  color: '#1f2937',
  marginBottom: '8px',
};

const formGroupStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const formLabelStyles: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  color: 'var(--color-text-muted, #6b7280)',
  letterSpacing: '0.5px',
};

const formInputStyles: React.CSSProperties = {
  padding: '10px 12px',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: '8px',
  fontSize: 'var(--text-sm, 0.875rem)',
  outline: 'none',
  backgroundColor: '#f9fafb',
};

const formSelectStyles: React.CSSProperties = {
  padding: '10px 12px',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: '8px',
  fontSize: 'var(--text-sm, 0.875rem)',
  outline: 'none',
  backgroundColor: '#f9fafb',
  cursor: 'pointer',
};

const noteStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#6b7280',
  lineHeight: 1.5,
  margin: 0,
};

const bookBtnStyles: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  backgroundColor: 'var(--color-primary, #ff7a00)',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 700,
  fontSize: '15px',
  boxShadow: '0 4px 12px rgba(255, 122, 0, 0.25)',
  marginTop: '8px',
};

const vendorCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: 'var(--radius-xl, 16px)',
  padding: '24px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
};

const cardHeadingStyles: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 800,
  color: '#1f2937',
  marginBottom: '16px',
};

const vendorInfoRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  alignItems: 'center',
};

const vendorLogoPlaceholderStyles: React.CSSProperties = {
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 122, 0, 0.1)',
  color: 'var(--color-primary, #ff7a00)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '24px',
  fontWeight: 900,
};

const vendorNameStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm, 0.875rem)',
  fontWeight: 700,
  color: '#1f2937',
  marginBottom: '2px',
};

const vendorRatingStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs, 0.75rem)',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  color: '#4b5563',
  marginBottom: '4px',
};

const reviewCountStyles: React.CSSProperties = {
  color: 'var(--color-text-muted, #6b7280)',
};

const vendorLocationStyles: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--color-text-muted, #6b7280)',
};
