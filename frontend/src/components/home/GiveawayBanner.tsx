import { Link } from 'react-router-dom';
import { useGiveaway } from '@/contexts/GiveawayContext';

export default function GiveawayBanner() {
  const { promotion, isActive, isOutOfStock } = useGiveaway();

  // Automatically hide if promotion is disabled, expired, or out of stock
  if (!promotion || !isActive || isOutOfStock) {
    return null;
  }

  const remaining = promotion.available_stock;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #ff7a00 0%, #ea580c 45%, #059669 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(255, 122, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        margin: '12px 0 24px 0',
      }}
    >
      {/* Decorative background glow circle */}
      <div
        style={{
          position: 'absolute',
          top: '-60px',
          right: '-40px',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          flexWrap: 'wrap',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Left Content */}
        <div style={{ flex: '1 1 360px', maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.22)',
                backdropFilter: 'blur(4px)',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>🎁</span> DOVI LAUNCH GIVEAWAY
            </span>

            {remaining > 0 && remaining <= 10 && (
              <span
                style={{
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 800,
                }}
              >
                🔥 Only {remaining} Left!
              </span>
            )}
          </div>

          <h2
            style={{
              fontSize: 'clamp(1.35rem, 3.2vw, 2rem)',
              fontWeight: 900,
              margin: '0 0 8px 0',
              lineHeight: 1.15,
              color: '#ffffff',
              textShadow: '0 2px 4px rgba(0,0,0,0.12)',
            }}
          >
            SHOP ₦30,000 OR MORE AND GET A FREE EARPOD!
          </h2>

          <p
            style={{
              fontSize: 'clamp(0.85rem, 1.8vw, 0.975rem)',
              margin: '0 0 16px 0',
              color: 'rgba(255, 255, 255, 0.95)',
              lineHeight: 1.45,
            }}
          >
            Limited gifts available. Offer ends <strong>20 December 2026</strong>. One complimentary EarPod per customer on qualifying marketplace purchases.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <Link
              to="/products"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#ffffff',
                color: '#ea580c',
                padding: '10px 22px',
                borderRadius: '9999px',
                fontWeight: 800,
                fontSize: '14px',
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'transform 150ms ease, box-shadow 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
            >
              Shop Now &amp; Claim Gift →
            </Link>

            <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)', fontWeight: 600 }}>
              ⚡ {remaining} gifts currently available
            </span>
          </div>
        </div>

        {/* Right Image Feature */}
        <div
          style={{
            flex: '0 0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '140px',
              height: '140px',
              borderRadius: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              border: '2px solid rgba(255, 255, 255, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
            }}
          >
            <img
              src={promotion.gift_item?.image_url || 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=400&q=80'}
              alt="DOVI Free EarPod"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                borderRadius: '12px',
                filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.25))',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=400&q=80';
              }}
            />
            <span
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 900,
                padding: '3px 8px',
                borderRadius: '9999px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                border: '2px solid #ffffff',
              }}
            >
              FREE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
