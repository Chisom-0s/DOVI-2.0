import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePromotion } from '@/contexts/PromotionContext';

/**
 * Timezone-safe date formatter that prevents UTC rollover (avoids 21 Dec bug).
 * Always consistently renders "20 December 2026" for the campaign end date.
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

  // Support seamless dismissal via Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        dismissPopup();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dismissPopup]);

  if (!isPopupOpen || !activePopupCampaign) {
    return null;
  }

  const {
    id,
    cta_url,
    image_url,
    end_date,
    is_giveaway,
  } = activePopupCampaign;

  const isGiveawayCampaign = is_giveaway || id === 'promo-launch-giveaway';
  const earpodImage = isGiveawayCampaign
    ? '/images/promotions/dovi_earpods_3d.png'
    : (image_url || '/images/promotions/dovi_earpods_3d.png');

  const handleCtaClick = () => {
    try {
      const clicks = Number(localStorage.getItem('dovi_promo_claim_clicks') || '0');
      localStorage.setItem('dovi_promo_claim_clicks', String(clicks + 1));
    } catch {}
    dismissPopup();
    navigate(cta_url || '/products');
  };

  const formattedEndDate = formatCampaignEndDate(end_date);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        backgroundColor: 'rgba(15, 23, 42, 0.76)',
        backdropFilter: 'blur(7px)',
        WebkitBackdropFilter: 'blur(7px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '14px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) dismissPopup();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="DOVI Launch Giveaway Gift Package"
    >
      <style>{`
        @keyframes doviPackageDrop {
          0% { transform: scale(0.85) translateY(24px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes doviFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes doviGlowPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.08); }
        }
        @keyframes doviShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes doviSparkleTwinkle {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.8; }
          50% { transform: scale(1.25) rotate(15deg); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .dovi-animated { animation: none !important; }
        }
      `}</style>

      {/* Gift Package Outer Wrapper */}
      <div
        className="dovi-animated"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '365px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: 'doviPackageDrop 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Floating Circular Close Button */}
        <button
          type="button"
          onClick={dismissPopup}
          style={{
            position: 'absolute',
            top: '-12px',
            right: '-6px',
            zIndex: 30,
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            border: '2px solid rgba(255, 122, 0, 0.4)',
            color: '#1e293b',
            fontSize: '16px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            transition: 'transform 0.15s ease',
            lineHeight: 1,
          }}
          aria-label="Close giveaway promotion"
        >
          ✕
        </button>

        {/* Decorative Top Gift Ribbon & Bow Knot (SHEIN-style Package Crown) */}
        <div
          style={{
            position: 'relative',
            zIndex: 20,
            marginBottom: '-16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* 3D Festive Ribbon Bow SVG */}
          <svg
            width="88"
            height="46"
            viewBox="0 0 100 52"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              filter: 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.28))',
            }}
          >
            {/* Left Ribbon Loop */}
            <path
              d="M50 26 C36 10, 8 8, 12 28 C15 42, 38 35, 50 26 Z"
              fill="url(#bowGradLeft)"
            />
            {/* Right Ribbon Loop */}
            <path
              d="M50 26 C64 10, 92 8, 88 28 C85 42, 62 35, 50 26 Z"
              fill="url(#bowGradRight)"
            />
            {/* Trailing Left Ribbon Tail */}
            <path
              d="M44 28 L28 48 L38 45 L46 32 Z"
              fill="url(#bowTailGrad)"
            />
            {/* Trailing Right Ribbon Tail */}
            <path
              d="M56 28 L72 48 L62 45 L54 32 Z"
              fill="url(#bowTailGrad)"
            />
            {/* Center Bow Knot */}
            <ellipse
              cx="50"
              cy="26"
              rx="9"
              ry="8"
              fill="url(#bowKnotGrad)"
              stroke="#fbbf24"
              strokeWidth="1.5"
            />
            <defs>
              <linearGradient id="bowGradLeft" x1="10" y1="15" x2="50" y2="30" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fef08a" />
                <stop offset="0.4" stopColor="#f59e0b" />
                <stop offset="1" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="bowGradRight" x1="90" y1="15" x2="50" y2="30" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fef08a" />
                <stop offset="0.4" stopColor="#f59e0b" />
                <stop offset="1" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="bowKnotGrad" x1="45" y1="20" x2="55" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fffbeb" />
                <stop offset="0.5" stopColor="#f59e0b" />
                <stop offset="1" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="bowTailGrad" x1="50" y1="28" x2="50" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f59e0b" />
                <stop offset="1" stopColor="#b45309" />
              </linearGradient>
            </defs>
          </svg>

          {/* Festive Sparkle Elements */}
          <div
            className="dovi-animated"
            style={{
              position: 'absolute',
              top: '-4px',
              left: '-16px',
              fontSize: '15px',
              animation: 'doviSparkleTwinkle 2.4s ease-in-out infinite',
            }}
          >
            ✨
          </div>
          <div
            className="dovi-animated"
            style={{
              position: 'absolute',
              top: '2px',
              right: '-16px',
              fontSize: '14px',
              animation: 'doviSparkleTwinkle 2.8s ease-in-out infinite reverse',
            }}
          >
            🌟
          </div>
        </div>

        {/* Gift-Package Container Body */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            background: 'linear-gradient(168deg, #ff7a00 0%, #ea580c 45%, #c2410c 100%)',
            borderRadius: '24px',
            boxShadow: '0 25px 60px -10px rgba(255, 122, 0, 0.45), 0 0 0 2px rgba(255, 255, 255, 0.25) inset',
            padding: '24px 14px 18px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Subtle Ambient Background Flare */}
          <div
            className="dovi-animated"
            style={{
              position: 'absolute',
              top: '-40px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '260px',
              height: '180px',
              background: 'radial-gradient(ellipse at center, rgba(254, 240, 138, 0.35) 0%, rgba(255, 122, 0, 0) 70%)',
              pointerEvents: 'none',
              animation: 'doviGlowPulse 3s ease-in-out infinite',
            }}
          />

          {/* Vertical Gift-Wrap Ribbon Stripe */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '32px',
              background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.24) 50%, rgba(255, 255, 255, 0.12) 100%)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />

          {/* Package Top Header Title */}
          <div
            style={{
              position: 'relative',
              zIndex: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginBottom: '10px',
            }}
          >
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 900,
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.35)',
              }}
            >
              DOVI LAUNCH GIVEAWAY 🎁
            </span>
          </div>

          {/* REWARD TICKET / COUPON PANEL (White Ticket Stub in Center) */}
          <div
            style={{
              position: 'relative',
              zIndex: 5,
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '18px',
              boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.18)',
              padding: '12px 14px 14px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Left & Right Ticket Notch Cutouts (Classic Coupon Aesthetic) */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '-9px',
                transform: 'translateY(-50%)',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: '#ea580c',
                boxShadow: 'inset -2px 0 3px rgba(0, 0, 0, 0.12)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '50%',
                right: '-9px',
                transform: 'translateY(-50%)',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: '#ea580c',
                boxShadow: 'inset 2px 0 3px rgba(0, 0, 0, 0.12)',
              }}
            />

            {/* 3D EarPods Product Showcase Pedestal */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '220px',
                height: '120px',
                borderRadius: '14px',
                background: 'radial-gradient(circle, #fff7ed 25%, #ffffff 80%)',
                border: '1px solid #fed7aa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '8px',
                boxShadow: '0 4px 14px rgba(255, 122, 0, 0.08)',
              }}
            >
              {/* Product Glow Halo */}
              <div
                className="dovi-animated"
                style={{
                  position: 'absolute',
                  width: '95px',
                  height: '95px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255, 122, 0, 0.22) 0%, transparent 70%)',
                  animation: 'doviGlowPulse 2.8s ease-in-out infinite',
                }}
              />

              {/* Realistic 3D EarPods & Open Case Render */}
              <img
                src={earpodImage}
                alt="DOVI Wireless Bluetooth EarPods with Charging Case"
                className="dovi-animated"
                style={{
                  maxWidth: '150px',
                  maxHeight: '105px',
                  objectFit: 'contain',
                  position: 'relative',
                  zIndex: 2,
                  filter: 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.16))',
                  animation: 'doviFloat 3.5s ease-in-out infinite',
                }}
              />

              {/* Complimentary Value Badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-8px',
                  zIndex: 3,
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  fontSize: '9.5px',
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  padding: '2.5px 9px',
                  borderRadius: '9999px',
                  boxShadow: '0 2px 6px rgba(5, 150, 105, 0.35)',
                  border: '1.5px solid #ffffff',
                }}
              >
                FREE GIFT · ₦0.00
              </div>
            </div>

            {/* Main Headline (Qualifying Offer) */}
            <h2
              style={{
                fontSize: '14.5px',
                fontWeight: 900,
                color: '#0f172a',
                margin: '6px 0 4px',
                lineHeight: 1.25,
                letterSpacing: '-0.01em',
                textTransform: 'uppercase',
              }}
            >
              SHOP ₦30,000 OR MORE AND GET A FREE EARPOD!
            </h2>

            {/* Supporting Explanation Message */}
            <p
              style={{
                fontSize: '11px',
                color: '#475569',
                margin: '0 0 8px',
                lineHeight: 1.4,
                maxWidth: '280px',
              }}
            >
              Unlock a complimentary DOVI Wireless EarPod with charging case when your qualifying marketplace product subtotal reaches ₦30,000.
            </p>

            {/* Offer Information Badge (NO STOCK COUNTER) */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '3px 10px',
                fontSize: '10.5px',
                color: '#64748b',
                fontWeight: 600,
              }}
            >
              <span>⏱️</span>
              <span>Limited-time offer. Ends {formattedEndDate}.</span>
            </div>
          </div>

          {/* Action Area Below Ticket */}
          <div
            style={{
              position: 'relative',
              zIndex: 5,
              width: '100%',
              marginTop: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {/* Main Prominent Claim CTA Button */}
            <button
              type="button"
              onClick={handleCtaClick}
              style={{
                position: 'relative',
                width: '100%',
                background: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 60%, #ffedd5 100%)',
                color: '#c2410c',
                border: 'none',
                padding: '12px 18px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 900,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(0, 0, 0, 0.25), 0 0 0 1.5px rgba(255, 255, 255, 0.8) inset',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                overflow: 'hidden',
              }}
            >
              {/* Shimmer Light Reflection */}
              <div
                className="dovi-animated"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '40%',
                  height: '100%',
                  background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%)',
                  transform: 'skewX(-20deg)',
                  animation: 'doviShimmer 3s infinite',
                  pointerEvents: 'none',
                }}
              />
              <span>CLAIM YOUR FREE EARPOD</span>
              <span style={{ fontSize: '14px' }}>🎁</span>
            </button>

            {/* Secondary Action: Continue Browsing */}
            <button
              type="button"
              onClick={dismissPopup}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
                padding: '4px 8px',
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
                transition: 'color 0.15s ease',
              }}
            >
              Continue Browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
