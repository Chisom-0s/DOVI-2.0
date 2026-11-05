import InfoLayout from './InfoLayout';

export default function AboutPage() {
  return (
    <InfoLayout
      badge="About Dovi"
      title="Shop Smart. Feel Good."
      tagline="Nigeria's premier centralized student-focused marketplace, built from the ground up to solve trust, affordability, and campus delivery."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <section>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-text)' }}>
            Our Mission
          </h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            Dovi was created to eliminate the rampant scams, substandard products, and erratic delivery times that Nigerian students face when buying online. Campus life moves fast, and students need access to essential electronics, laptops, fashion, and study supplies without financial anxiety or fear of loss.
          </p>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Under our core brand philosophy — <strong>Dovi — Shop Smart. Feel Good.</strong> — we provide a modern, safe, and transparent commerce environment that empowers students and verified campus vendors alike.
          </p>
        </section>

        <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text)' }}>
            The 4 Pillars of Dovi
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div style={cardFeatureStyles}>
              <span style={{ fontSize: '1.75rem', marginBottom: '8px' }}>🛡️</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '4px 0 8px' }}>100% Escrow Protection</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Every transaction on Dovi is held in secure escrow. Sellers are only paid when you inspect and confirm your package within our 48-hour inspection period.
              </p>
            </div>

            <div style={cardFeatureStyles}>
              <span style={{ fontSize: '1.75rem', marginBottom: '8px' }}>💰</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '4px 0 8px' }}>Save2Own Program</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Students can acquire high-value assets — like laptops and smartphones — by locking in fixed prices and making micro-installments with zero interest and zero debt.
              </p>
            </div>

            <div style={cardFeatureStyles}>
              <span style={{ fontSize: '1.75rem', marginBottom: '8px' }}>🏢</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '4px 0 8px' }}>Onitsha Logistics Hub</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Our centralized hub physically inspects incoming stock, rejects substandard duplicates, and consolidates multi-vendor shipments to minimize student shipping fees.
              </p>
            </div>

            <div style={cardFeatureStyles}>
              <span style={{ fontSize: '1.75rem', marginBottom: '8px' }}>🎓</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '4px 0 8px' }}>Campus-First Delivery</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Our logistics network connects directly to major Nigerian universities, student residential areas, and campus pickup points for reliable 24–72 hour arrival.
              </p>
            </div>
          </div>
        </section>

        <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-text)' }}>
            Company & Governance
          </h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
            Dovi is developed and operated by <strong>Malc Nexus Technologies Limited</strong>, a Nigerian technology corporation committed to building digital infrastructure for emerging African markets.
          </p>
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
            Central Hub & Operations: Onitsha Commercial Hub, Anambra State, Nigeria. Reach out to our management and support team at <a href="mailto:hello@dovishop.com" style={{ color: 'var(--color-primary)' }}>hello@dovishop.com</a>.
          </p>
        </section>
      </div>
    </InfoLayout>
  );
}

const cardFeatureStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '12px',
  padding: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
};

