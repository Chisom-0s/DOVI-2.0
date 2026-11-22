import { useNavigate } from 'react-router-dom';
import { usePromotion } from '@/contexts/PromotionContext';

export default function PromotionalPopup() {
  const { activePopupCampaign, isPopupOpen, dismissPopup } = usePromotion();
  const navigate = useNavigate();

  if (!isPopupOpen || !activePopupCampaign) {
    return null;
  }

  const {
    headline,
    description,
    badge_text,
    cta_text,
    cta_url,
    secondary_text,
    image_url,
    theme,
    end_date,
    is_giveaway,
    giveaway_config,
  } = activePopupCampaign;

  const handleCtaClick = () => {
    dismissPopup();
    navigate(cta_url || '/products');
  };

  const formattedEndDate = end_date ? new Date(end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
  const stock = is_giveaway && giveaway_config ? giveaway_config.available_stock : null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(3px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) dismissPopup();
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          maxWidth: '420px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.3)',
          border: '1.5px solid #ff7a00',
          animation: 'doviFadeIn 0.2s ease-out',
        }}
      >
        {/* Top Header Bar with Brand Color */}
        <div
          style={{
            background: `linear-gradient(135deg, ${theme?.primary_bg || '#ff7a00'} 0%, ${theme?.secondary_bg || '#059669'} 100%)`,
            padding: '12px 16px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '15px' }}>🎁</span>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {badge_text || 'DOVI Special Offer'}
            </span>
          </div>

          <button
            type="button"
            onClick={dismissPopup}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontSize: '20px',
              fontWeight: 700,
              cursor: 'pointer',
              lineHeight: 1,
              padding: 0,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', textAlign: 'center' }}>
          {/* Centered Image */}
          {image_url && (
            <div
              style={{
                width: '84px',
                height: '84px',
                margin: '0 auto 14px',
                borderRadius: '14px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
              }}
            >
              <img
                src={image_url}
                alt="Promotion"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: '8px',
                }}
              />
            </div>
          )}

          <h3
            style={{
              fontSize: '17px',
              fontWeight: 900,
              color: '#0f172a',
              margin: '0 0 8px',
              lineHeight: 1.3,
            }}
          >
            {headline}
          </h3>

          <p
            style={{
              fontSize: '12.5px',
              color: '#4b5563',
              margin: '0 0 14px',
              lineHeight: 1.5,
            }}
          >
            {description}
          {secondary_text && <p style={{ fontSize: '11px', color: '#6b7280', margin: '4px 0 0' }}>{secondary_text}</p>}
          </p>

          {/* Details Pill (End Date & Stock) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #f1f5f9',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '11px',
              color: '#64748b',
              marginBottom: '18px',
              flexWrap: 'wrap',
            }}
          >
            {formattedEndDate && (
              <span>📅 Ends: <strong>{formattedEndDate}</strong></span>
            )}
            {stock !== null && (
              <span style={{ color: stock <= 10 ? '#dc2626' : '#15803d', fontWeight: 700 }}>
                ⚡ {stock} gifts available
              </span>
            )}
          </div>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={handleCtaClick}
              style={{
                backgroundColor: theme?.primary_bg || '#ff7a00',
                color: '#ffffff',
                border: 'none',
                padding: '12px 18px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(255, 122, 0, 0.28)',
                transition: 'all 0.15s ease',
              }}
            >
              {cta_text || 'Shop Now & Claim Gift →'}
            </button>

            <button
              type="button"
              onClick={dismissPopup}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '11.5px',
                cursor: 'pointer',
                padding: '6px',
                textDecoration: 'underline',
              }}
            >
              Continue browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
