const fs = require('fs');

// 1. PromotionalBanner.tsx
const bannerCode = `import React from 'react';
import { Link } from 'react-router-dom';
import { usePromotion } from '@/contexts/PromotionContext';

export default function PromotionalBanner() {
  const { activeBannerCampaign } = usePromotion();

  if (!activeBannerCampaign || activeBannerCampaign.status !== 'ACTIVE') {
    return null;
  }

  const { theme, headline, description, badge_text, cta_text, cta_url, secondary_text, image_url, is_giveaway, giveaway_config } = activeBannerCampaign;

  const bg = theme?.bg_style === 'solid'
    ? (theme.primary_bg || '#ff7a00')
    : \`linear-gradient(135deg, \${theme?.primary_bg || '#ff7a00'} 0%, \${theme?.secondary_bg || '#059669'} 100%)\`;

  const availableStock = is_giveaway && giveaway_config ? giveaway_config.available_stock : null;

  return (
    <div
      className="dovi-promotional-banner"
      style={{
        background: bg,
        borderRadius: '12px',
        padding: '14px 18px',
        color: theme?.text_color || '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 14px rgba(255, 122, 0, 0.16)',
        margin: '10px 0 16px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',
        flexWrap: 'wrap',
      }}
    >
      {/* Subtle decorative glow */}
      <div
        style={{
          position: 'absolute',
          top: '-30px',
          right: '-20px',
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Left/Content Side */}
      <div style={{ flex: '1 1 260px', minWidth: 0, zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span
            style={{
              backgroundColor: theme?.badge_bg || 'rgba(255, 255, 255, 0.22)',
              color: theme?.badge_text_color || '#ffffff',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '10px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              lineHeight: 1.2,
            }}
          >
            <span>🎁</span> {badge_text || 'PROMOTION'}
          </span>

          {availableStock !== null && availableStock > 0 && availableStock <= 20 && (
            <span
              style={{
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                padding: '2px 7px',
                borderRadius: '9999px',
                fontSize: '10px',
                fontWeight: 800,
                lineHeight: 1.2,
              }}
            >
              🔥 Only {availableStock} Left!
            </span>
          )}
        </div>

        <h2
          style={{
            fontSize: 'clamp(1rem, 2.2vw, 1.25rem)',
            fontWeight: 900,
            margin: '0 0 3px 0',
            lineHeight: 1.2,
            color: theme?.text_color || '#ffffff',
            letterSpacing: '-0.01em',
          }}
        >
          {headline}
        </h2>

        <p
          style={{
            fontSize: '11px',
            margin: 0,
            color: 'rgba(255, 255, 255, 0.92)',
            lineHeight: 1.35,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {secondary_text || description}
        </p>
      </div>

      {/* Right/CTA and Thumbnail Image */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexShrink: 0,
          zIndex: 2,
        }}
      >
        {image_url && (
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: '1.5px solid rgba(255, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
          >
            <img
              src={image_url}
              alt="Promotion"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                borderRadius: '6px',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=400&q=80';
              }}
            />
          </div>
        )}

        <Link
          to={cta_url || '/products'}
          style={{
            backgroundColor: theme?.button_bg || '#ffffff',
            color: theme?.button_text_color || '#ea580c',
            padding: '8px 16px',
            borderRadius: '9999px',
            fontWeight: 800,
            fontSize: '12px',
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            whiteSpace: 'nowrap',
            transition: 'transform 0.15s ease',
            display: 'inline-block',
          }}
        >
          {cta_text || 'Claim Gift →'}
        </Link>
      </div>
    </div>
  );
}
`;

// 2. PromotionalPopup.tsx
const popupCode = `import React from 'react';
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
            background: \`linear-gradient(135deg, \${theme?.primary_bg || '#ff7a00'} 0%, \${theme?.secondary_bg || '#059669'} 100%)\`,
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
`;

fs.writeFileSync('frontend/src/components/home/PromotionalBanner.tsx', bannerCode, 'utf8');
fs.writeFileSync('frontend/src/components/common/PromotionalPopup.tsx', popupCode, 'utf8');
console.log('Created PromotionalBanner.tsx and PromotionalPopup.tsx');
