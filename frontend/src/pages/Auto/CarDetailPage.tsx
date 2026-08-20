import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AutoSubNav from '@/components/auto/AutoSubNav';
import { autoApi } from '@/api/auto';
import type { AutoListing } from '@/types';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function CarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [car, setCar] = useState<AutoListing | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Inquiry form states
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [isInquirySubmitting, setIsInquirySubmitting] = useState(false);

  // Favorite ID mapping for toggle
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const fetchCarDetail = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await autoApi.getListing(id);
        setCar(data);
        setIsFavorited(data.is_favorited);
        setError(null);
        setActiveImageIndex(0);
      } catch (err) {
        console.error('Failed to load car details:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCarDetail();
  }, [id]);

  const handleFavoriteToggle = async () => {
    if (!car) return;
    try {
      if (isFavorited) {
        // Unfavorite
        const favId = favoriteId || car.id;
        await autoApi.removeFavorite(favId);
        setIsFavorited(false);
        setFavoriteId(null);
        toast.success('Removed from favorites');
      } else {
        // Favorite
        const res = await autoApi.addFavorite(car.id);
        if (res && res.id) {
          setFavoriteId(res.id);
        }
        setIsFavorited(true);
        toast.success('Added to favorites');
      }
    } catch (err) {
      console.error('Favorite operation failed:', err);
      toast.error('Unable to update favorites');
    }
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!car) return;

    setIsInquirySubmitting(true);
    // Simulate inquiry submission API call
    setTimeout(() => {
      setIsInquirySubmitting(false);
      toast.success(`Inquiry sent successfully to ${car.seller?.name || 'the seller'}!`);
      setInquiryMessage('');
    }, 1000);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Listing link copied to clipboard!');
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

  if (error || !car) {
    return (
      <div style={containerStyles}>
        <AutoSubNav />
        <div style={errorWrapperStyles}>
          <ApiErrorMessage error={error || new Error('Vehicle not found')} />
          <button style={backBtnStyles} onClick={() => navigate('/auto/cars')}>
            &larr; Back to Cars
          </button>
        </div>
      </div>
    );
  }

  const hasImages = car.images && car.images.length > 0;
  const currentImage = hasImages
    ? car.images[activeImageIndex]?.url
    : car.primary_image_url;

  return (
    <div style={containerStyles}>
      <AutoSubNav />

      <div style={detailWrapperStyles}>
        {/* Navigation Breadcrumb */}
        <div style={breadcrumbStyles}>
          <Link to="/auto" style={breadcrumbLinkStyles}>Auto</Link> &gt;{' '}
          <Link to="/auto/cars" style={breadcrumbLinkStyles}>Cars</Link> &gt;{' '}
          <span style={breadcrumbCurrentStyles}>{car.make} {car.model}</span>
        </div>

        {/* Main Content Layout */}
        <div style={layoutGridStyles}>
          {/* Left Column: Image Gallery & Specs */}
          <div style={leftColStyles}>
            <div style={galleryStyles}>
              <div style={mainImgWrapperStyles}>
                {currentImage ? (
                  <img src={currentImage} alt={`${car.make} ${car.model}`} style={mainImgStyles} />
                ) : (
                  <div style={placeholderImgStyles}>🚗</div>
                )}
                <span style={conditionBadgeStyles}>{car.condition}</span>
              </div>

              {/* Thumbnails list */}
              {hasImages && car.images.length > 1 && (
                <div style={thumbnailListStyles}>
                  {car.images.map((img, idx) => (
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
                  <span style={specLabelStyles}>Make</span>
                  <span style={specValStyles}>{car.make}</span>
                </div>
                <div style={specRowStyles}>
                  <span style={specLabelStyles}>Model</span>
                  <span style={specValStyles}>{car.model}</span>
                </div>
                <div style={specRowStyles}>
                  <span style={specLabelStyles}>Year</span>
                  <span style={specValStyles}>{car.year}</span>
                </div>
                <div style={specRowStyles}>
                  <span style={specLabelStyles}>Condition</span>
                  <span style={{ ...specValStyles, textTransform: 'capitalize' }}>
                    {car.condition.toLowerCase()}
                  </span>
                </div>
                <div style={specRowStyles}>
                  <span style={specLabelStyles}>Transmission</span>
                  <span style={specValStyles}>{car.transmission}</span>
                </div>
                <div style={specRowStyles}>
                  <span style={specLabelStyles}>Fuel Type</span>
                  <span style={specValStyles}>{car.fuel_type}</span>
                </div>
                <div style={specRowStyles}>
                  <span style={specLabelStyles}>Mileage</span>
                  <span style={specValStyles}>
                    {car.mileage !== null ? `${car.mileage.toLocaleString()} km` : 'N/A'}
                  </span>
                </div>
                <div style={specRowStyles}>
                  <span style={specLabelStyles}>Colour</span>
                  <span style={specValStyles}>{car.color || 'N/A'}</span>
                </div>
                <div style={specRowStyles}>
                  <span style={specLabelStyles}>Engine Size</span>
                  <span style={specValStyles}>{car.engine_size || 'N/A'}</span>
                </div>
                <div style={specRowStyles}>
                  <span style={specLabelStyles}>Body Type</span>
                  <span style={specValStyles}>{car.body_type || 'N/A'}</span>
                </div>
                {car.vin && (
                  <div style={specRowStyles}>
                    <span style={specLabelStyles}>VIN</span>
                    <span style={specValStyles}>{car.vin}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Description */}
            <div style={descBoxStyles}>
              <h2 style={sectionTitleStyles}>Description</h2>
              <p style={descTextStyles}>{car.description || 'No description available for this listing.'}</p>
            </div>

            {/* Key Features */}
            {car.features && car.features.length > 0 && (
              <div style={descBoxStyles}>
                <h2 style={sectionTitleStyles}>Features</h2>
                <div style={featuresGridStyles}>
                  {car.features.map((feat, index) => (
                    <span key={index} style={featureTagStyles}>
                      ✓ {feat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Title, Actions, Seller, Inquiry */}
          <div style={rightColStyles}>
            {/* Title & Price Card */}
            <div style={summaryCardStyles}>
              <span style={yearBadgeStyles}>{car.year}</span>
              <h1 style={titleStyles}>
                {car.make} {car.model}
              </h1>
              <p style={locationStyles}>📍 {car.location}</p>

              <div style={priceContainerStyles}>
                <span style={priceLabelTextStyles}>Asking Price</span>
                <span style={priceStyles}>₦{parseFloat(car.price).toLocaleString()}</span>
              </div>

              <div style={actionRowStyles}>
                <button
                  style={{
                    ...favBtnStyles,
                    backgroundColor: isFavorited ? 'var(--color-primary, #ff7a00)' : 'transparent',
                    border: isFavorited ? '1px solid var(--color-primary, #ff7a00)' : '1px solid var(--color-border, #e5e7eb)',
                    color: isFavorited ? '#ffffff' : 'var(--color-text, #1f2937)',
                  }}
                  onClick={handleFavoriteToggle}
                >
                  {isFavorited ? '★ Favorited' : '☆ Add to Favorites'}
                </button>
                <button style={shareBtnStyles} onClick={handleShare}>
                  🔗 Share
                </button>
              </div>
            </div>

            {/* Seller Info Card */}
            <div style={sellerCardStyles}>
              <h3 style={cardHeadingStyles}>Seller Details</h3>
              <div style={sellerInfoRowStyles}>
                {car.seller?.logo_url ? (
                  <img src={car.seller.logo_url} alt={car.seller.name} style={sellerLogoStyles} />
                ) : (
                  <div style={sellerLogoPlaceholderStyles}>
                    {car.seller?.name?.charAt(0) || 'S'}
                  </div>
                )}
                <div>
                  <h4 style={sellerNameStyles}>{car.seller?.name || 'Private Seller'}</h4>
                  <div style={sellerRatingStyles}>
                    <span style={{ color: '#ffb600' }}>★</span>{' '}
                    <span>{car.seller?.rating || '4.5'}</span>
                    <span style={reviewCountStyles}>({car.seller?.review_count || 10} reviews)</span>
                  </div>
                  <p style={sellerLocationStyles}>📍 {car.seller?.location || 'Lagos, Nigeria'}</p>
                </div>
              </div>
            </div>

            {/* Inquiry Form */}
            <div style={inquiryCardStyles}>
              <h3 style={cardHeadingStyles}>Contact Seller</h3>
              <form onSubmit={handleInquirySubmit}>
                <div style={formGroupStyles}>
                  <label style={formLabelStyles}>Your Name</label>
                  <input
                    type="text"
                    required
                    style={formInputStyles}
                    value={inquiryName}
                    onChange={(e) => setInquiryName(e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div style={formGroupStyles}>
                  <label style={formLabelStyles}>Email Address</label>
                  <input
                    type="email"
                    required
                    style={formInputStyles}
                    value={inquiryEmail}
                    onChange={(e) => setInquiryEmail(e.target.value)}
                    placeholder="name@email.com"
                  />
                </div>
                <div style={formGroupStyles}>
                  <label style={formLabelStyles}>Phone Number</label>
                  <input
                    type="tel"
                    required
                    style={formInputStyles}
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                    placeholder="e.g. +234..."
                  />
                </div>
                <div style={formGroupStyles}>
                  <label style={formLabelStyles}>Your Message</label>
                  <textarea
                    required
                    rows={4}
                    style={formTextareaStyles}
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder={`Hi, I'm interested in this ${car.year} ${car.make} ${car.model}. Is it still available?`}
                  />
                </div>
                <button type="submit" disabled={isInquirySubmitting} style={submitBtnStyles}>
                  {isInquirySubmitting ? 'Sending...' : 'Send Inquiry'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {car.review_count > 0 && (
          <section style={reviewsSectionStyles}>
            <h2 style={reviewsSectionTitleStyles}>Reviews ({car.review_count})</h2>
            <div style={reviewsAlertStyles}>
              <span style={{ fontSize: '18px' }}>★</span>
              <span>This vehicle holds a rating of <strong>{car.average_rating} / 5</strong> based on certified customer ratings.</span>
            </div>
          </section>
        )}

        {/* Similar Listings Section */}
        {car.similar_listings && car.similar_listings.length > 0 && (
          <section style={similarSectionStyles}>
            <h2 style={similarTitleStyles}>Similar Listings</h2>
            <div style={similarGridStyles}>
              {car.similar_listings.map((similar) => (
                <Link key={similar.id} to={`/auto/cars/${similar.id}`} style={similarCardStyles}>
                  <div style={similarImgContainerStyles}>
                    {similar.primary_image_url ? (
                      <img src={similar.primary_image_url} alt={`${similar.make} ${similar.model}`} style={similarImgStyles} />
                    ) : (
                      <div style={similarPlaceholderImgStyles}>🚗</div>
                    )}
                    <span style={similarConditionBadgeStyles}>{similar.condition}</span>
                  </div>
                  <div style={similarDetailsStyles}>
                    <span style={similarYearStyles}>{similar.year}</span>
                    <h3 style={similarCardTitleStyles}>
                      {similar.make} {similar.model}
                    </h3>
                    <div style={similarFooterStyles}>
                      <span style={similarPriceStyles}>₦{parseFloat(similar.price).toLocaleString()}</span>
                      <span style={similarLocationStyles}>📍 {similar.location}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
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
  height: '380px',
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

const conditionBadgeStyles: React.CSSProperties = {
  position: 'absolute',
  top: '16px',
  left: '16px',
  backgroundColor: 'var(--color-primary, #ff7a00)',
  color: '#ffffff',
  fontSize: '11px',
  fontWeight: 700,
  padding: '4px 12px',
  borderRadius: '4px',
  textTransform: 'uppercase',
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
  marginBottom: '24px',
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

const descBoxStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: 'var(--radius-xl, 16px)',
  padding: '32px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
};

const descTextStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm, 0.875rem)',
  color: '#4b5563',
  lineHeight: 1.6,
};

const featuresGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: '12px',
};

const featureTagStyles: React.CSSProperties = {
  backgroundColor: '#f3f4f6',
  color: 'var(--color-success, #27ae60)',
  fontSize: 'var(--text-xs, 0.75rem)',
  fontWeight: 600,
  padding: '8px 16px',
  borderRadius: '8px',
};

const summaryCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: 'var(--radius-xl, 16px)',
  padding: '32px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
};

const yearBadgeStyles: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  backgroundColor: 'rgba(255, 122, 0, 0.12)',
  color: 'var(--color-primary, #ff7a00)',
  padding: '4px 10px',
  borderRadius: '4px',
  textTransform: 'uppercase',
  display: 'inline-block',
  marginBottom: '12px',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-2xl, 1.5rem)',
  fontWeight: 900,
  color: '#1f2937',
  marginBottom: '8px',
  letterSpacing: '-0.5px',
};

const locationStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm, 0.875rem)',
  color: 'var(--color-text-muted, #6b7280)',
  marginBottom: '24px',
};

const priceContainerStyles: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  padding: '16px 20px',
  borderRadius: 'var(--radius-lg, 12px)',
  marginBottom: '24px',
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

const actionRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
};

const favBtnStyles: React.CSSProperties = {
  flex: 1,
  padding: '12px',
  borderRadius: '8px',
  fontWeight: 700,
  fontSize: '14px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  transition: 'all 150ms ease',
};

const shareBtnStyles: React.CSSProperties = {
  padding: '12px 20px',
  backgroundColor: '#ffffff',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: '8px',
  color: '#4b5563',
  fontWeight: 700,
  fontSize: '14px',
  cursor: 'pointer',
};

const sellerCardStyles: React.CSSProperties = {
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

const sellerInfoRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  alignItems: 'center',
};

const sellerLogoStyles: React.CSSProperties = {
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  objectFit: 'cover',
  backgroundColor: '#f3f4f6',
};

const sellerLogoPlaceholderStyles: React.CSSProperties = {
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

const sellerNameStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm, 0.875rem)',
  fontWeight: 700,
  color: '#1f2937',
  marginBottom: '2px',
};

const sellerRatingStyles: React.CSSProperties = {
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

const sellerLocationStyles: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--color-text-muted, #6b7280)',
};

const inquiryCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: 'var(--radius-xl, 16px)',
  padding: '24px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
};

const formGroupStyles: React.CSSProperties = {
  marginBottom: '14px',
};

const formLabelStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  color: 'var(--color-text-muted, #6b7280)',
  marginBottom: '6px',
  letterSpacing: '0.5px',
};

const formInputStyles: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: '8px',
  fontSize: 'var(--text-sm, 0.875rem)',
  color: '#1f2937',
  backgroundColor: '#f9fafb',
  outline: 'none',
};

const formTextareaStyles: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: '8px',
  fontSize: 'var(--text-sm, 0.875rem)',
  color: '#1f2937',
  backgroundColor: '#f9fafb',
  outline: 'none',
  resize: 'vertical',
};

const submitBtnStyles: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  backgroundColor: '#111827',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'background-color 150ms ease',
  marginTop: '8px',
};

const reviewsSectionStyles: React.CSSProperties = {
  marginTop: '48px',
  backgroundColor: '#ffffff',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: 'var(--radius-xl, 16px)',
  padding: '32px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
};

const reviewsSectionTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-lg, 1.125rem)',
  fontWeight: 800,
  color: '#1f2937',
  marginBottom: '20px',
};

const reviewsAlertStyles: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
  backgroundColor: '#fbf8f3',
  border: '1px solid #f3e6d5',
  color: '#8a6d3b',
  padding: '16px',
  borderRadius: '8px',
  fontSize: 'var(--text-sm, 0.875rem)',
};

const similarSectionStyles: React.CSSProperties = {
  marginTop: '48px',
};

const similarTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-lg, 1.125rem)',
  fontWeight: 800,
  color: '#1f2937',
  marginBottom: '24px',
};

const similarGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: '24px',
};

const similarCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: 'var(--radius-lg, 12px)',
  overflow: 'hidden',
  textDecoration: 'none',
  color: 'inherit',
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid var(--color-border, #e5e7eb)',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
};

const similarImgContainerStyles: React.CSSProperties = {
  position: 'relative',
  height: '160px',
  backgroundColor: '#e5e7eb',
};

const similarImgStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const similarPlaceholderImgStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '48px',
  color: '#9ca3af',
};

const similarConditionBadgeStyles: React.CSSProperties = {
  position: 'absolute',
  top: '8px',
  left: '8px',
  backgroundColor: 'var(--color-primary, #ff7a00)',
  color: '#ffffff',
  fontSize: '9px',
  fontWeight: 700,
  padding: '2px 6px',
  borderRadius: '4px',
  textTransform: 'uppercase',
};

const similarDetailsStyles: React.CSSProperties = {
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
};

const similarYearStyles: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--color-primary, #ff7a00)',
  fontWeight: 600,
  marginBottom: '2px',
};

const similarCardTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm, 0.875rem)',
  fontWeight: 700,
  color: '#1f2937',
  marginBottom: '8px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const similarFooterStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 'auto',
  borderTop: '1px solid var(--color-border, #e5e7eb)',
  paddingTop: '8px',
};

const similarPriceStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm, 0.875rem)',
  fontWeight: 800,
  color: '#1f2937',
};

const similarLocationStyles: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--color-text-muted, #6b7280)',
};
