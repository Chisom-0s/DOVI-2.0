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
    : `linear-gradient(135deg, ${theme?.primary_bg || '#ff7a00'} 0%, ${theme?.secondary_bg || '#059669'} 100%)`;

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
