import { useNavigate } from 'react-router-dom';
import { usePromotion } from '@/contexts/PromotionContext';

/**
 * Bulletproof date formatter that avoids UTC-to-local timezone rollover.
 * Consistently returns "20 December 2026" for the campaign end date.
 */
function formatCampaignEndDate(endDateStr?: string | null): string {
  if (!endDateStr) return '20 December 2026';
  try {
    const dateMatch = endDateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      const year = parseInt(dateMatch[1], 10);
      const monthIndex = parseInt(dateMatch[2], 10) - 1;
      const day = parseInt(dateMatch[3], 10);
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${day} ${months[monthIndex]} ${year}`;
    }
    const d = new Date(endDateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  } catch {
    return '20 December 2026';
  }
}

export default function PromotionalPopup() {
  const { activePopupCampaign, isPopupOpen, dismissPopup } = usePromotion();
  const navigate = useNavigate();

  if (!isPopupOpen || !activePopupCampaign) {
    return null;
  }

  const {
    id,
    headline,
    description,
    badge_text,
    cta_text,
    cta_url,
    image_url,
    end_date,
    is_giveaway,
    giveaway_config,
  } = activePopupCampaign;

  const isGiveawayCampaign = is_giveaway || id === 'promo-launch-giveaway';
  const earpodImage = isGiveawayCampaign
    ? '/images/promotions/dovi_earpods_3d.jpg'
    : (image_url || '/images/promotions/dovi_earpods_3d.jpg');

  const handleCtaClick = () => {
    dismissPopup();
    navigate(cta_url || '/products');
  };

  const formattedEndDate = formatCampaignEndDate(end_date);
  const availableStock = giveaway_config?.available_stock ?? 20;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) dismissPopup();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={headline || 'DOVI Promotional Offer'}
    >
      <style>{`
        @keyframes doviPopIn {
          0% { transform: scale(0.92) translateY(12px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes doviFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes doviPulseRing {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.04); opacity: 0.4; }
        }
      `}</style>

      {/* Main Modal Box — SHEIN-Style Gift Package / Reward Ticket */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '390px',
          maxHeight: '92vh',
          backgroundColor: '#ffffff',
          borderRadius: '22px',
          boxShadow: '0 25px 60px -12px rgba(255, 122, 0, 0.35), 0 0 0 1px rgba(255, 122, 0, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'doviPopIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Floating Close Button */}
        <button
          type="button"
          onClick={dismissPopup}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 10,
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.88)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            color: '#1e293b',
            fontSize: '18px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
            transition: 'all 0.15s ease',
            lineHeight: 1,
          }}
          aria-label="Close promotion"
        >
          ✕
        </button>

        {/* Decorative Top Gift Header & Ribbon Band */}
        <div
          style={{
            background: 'linear-gradient(135deg, #ff7a00 0%, #ea580c 60%, #c2410c 100%)',
            padding: '14px 16px 12px',
            textAlign: 'center',
            position: 'relative',
            color: '#ffffff',
            borderBottom: '3px solid #f97316',
          }}
        >
          {/* Subtle gift ribbon pattern */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              padding: '4px 12px',
              borderRadius: '9999px',
              backdropFilter: 'blur(4px)',
            }}
          >
            <span style={{ fontSize: '13px' }}>🎁</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {badge_text || 'DOVI LAUNCH GIVEAWAY'}
            </span>
            <span style={{ fontSize: '12px' }}>✨</span>
          </div>
        </div>

        {/* Gift Showcase & EarPod Pedestal */}
        <div
          style={{
            padding: '16px 20px 18px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            overflowY: 'auto',
          }}
        >
          {/* Spotlight Pedestal Container */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '240px',
              height: '135px',
              margin: '2px auto 12px',
              borderRadius: '16px',
              background: 'radial-gradient(circle, #fff7ed 15%, #ffffff 75%)',
              border: '1.5px solid #fed7aa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px -4px rgba(255, 122, 0, 0.12)',
            }}
          >
            {/* Glowing Aura Ring */}
            <div
              style={{
                position: 'absolute',
                width: '115px',
                height: '115px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255, 122, 0, 0.18) 0%, transparent 70%)',
                animation: 'doviPulseRing 2.6s ease-in-out infinite',
                pointerEvents: 'none',
              }}
            />

            {/* Premium 3D EarPod Render Image */}
            <img
              src={earpodImage}
              alt="DOVI Wireless Bluetooth EarPods with Charging Case"
              style={{
                maxWidth: '155px',
                maxHeight: '115px',
                objectFit: 'contain',
                position: 'relative',
                zIndex: 2,
                filter: 'drop-shadow(0 8px 14px rgba(0, 0, 0, 0.14))',
                animation: 'doviFloat 3.2s ease-in-out infinite',
              }}
            />

            {/* Free Gift Value Tag */}
            <div
              style={{
                position: 'absolute',
                bottom: '-9px',
                zIndex: 3,
                backgroundColor: '#059669',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                padding: '3px 10px',
                borderRadius: '9999px',
                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.35)',
                border: '1.5px solid #ffffff',
              }}
            >
              FREE REWARD · ₦0.00
            </div>
          </div>

          {/* Main Headline */}
          <h2
            style={{
              fontSize: 'clamp(15px, 4vw, 17.5px)',
              fontWeight: 900,
              color: '#0f172a',
              margin: '6px 0 6px',
              lineHeight: 1.25,
              letterSpacing: '-0.01em',
              textTransform: 'uppercase',
            }}
          >
            {headline || 'SHOP ₦30,000 OR MORE AND GET A FREE EARPOD!'}
          </h2>

          {/* Offer Explanation */}
          <p
            style={{
              fontSize: '12px',
              color: '#475569',
              margin: '0 0 12px',
              lineHeight: 1.45,
              maxWidth: '320px',
            }}
          >
            {description || 'Unlock a complimentary DOVI Wireless EarPod with charging case when your qualifying marketplace product subtotal reaches ₦30,000.'}
          </p>

          {/* Offer Status & Guarantee Badges */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '16px',
              width: '100%',
            }}
          >
            {/* Live Stock Counter */}
            <div
              style={{
                backgroundColor: availableStock <= 10 ? '#fef2f2' : '#f0fdf4',
                border: `1px solid ${availableStock <= 10 ? '#fecaca' : '#bbf7d0'}`,
                color: availableStock <= 10 ? '#dc2626' : '#15803d',
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>⚡</span>
              <span>{availableStock} gifts available</span>
            </div>

            {/* Campaign Expiry Date (Consistent 20 December 2026) */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#475569',
                fontSize: '11px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>📅</span>
              <span>Ends {formattedEndDate}</span>
            </div>
          </div>

          {/* Primary CTA: SHOP & CLAIM GIFT */}
          <button
            type="button"
            onClick={handleCtaClick}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #ff7a00 0%, #ea580c 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '9999px',
              fontSize: '13.5px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(255, 122, 0, 0.38)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>{cta_text || 'SHOP & CLAIM GIFT'}</span>
            <span style={{ fontSize: '15px' }}>→</span>
          </button>

          {/* Secondary Action: Continue Browsing */}
          <button
            type="button"
            onClick={dismissPopup}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '11.5px',
              fontWeight: 500,
              cursor: 'pointer',
              padding: '8px 12px 2px',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
          >
            Continue Browsing
          </button>
        </div>
      </div>
    </div>
  );
}
