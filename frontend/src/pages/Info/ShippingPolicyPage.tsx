import InfoLayout from './InfoLayout';

export default function ShippingPolicyPage() {
  return (
    <InfoLayout
      badge="Delivery Logistics"
      title="Shipping & Destination Delivery Policy"
      tagline="How DOVI sources products and arranges direct delivery to customer destinations across Nigeria."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <section>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Direct-to-Destination Delivery Model
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Unlike open classified boards where buyers take all shipping risks, DOVI enforces a <strong>Direct-to-Destination Delivery Model</strong>. When a customer places an order, DOVI handles sourcing, quality checks, and arranges delivery directly to the customer's selected state and town at clear, admin-configured delivery rates.
          </p>
        </section>

        <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1rem' }}>
            Delivery Timelines & Classifications
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div style={boxStyles}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 6px' }}>
                📦 Small Parcels & Tech Gadgets
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Phones, smartwatches, power banks, earbuds, and accessories.<br />
                <strong>Estimated Delivery:</strong> 24 to 72 hours to supported locations.
              </p>
            </div>

            <div style={boxStyles}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 6px' }}>
                💻 Computing & Medium Parcels
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Laptops, monitors, backpacks, textbooks, and footwear.<br />
                <strong>Estimated Delivery:</strong> 48 to 96 hours.
              </p>
            </div>

            <div style={boxStyles}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 6px' }}>
                🛋️ Bulky & Home Living
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Washing machines, TVs, mini-fridges, and room furniture.<br />
                <strong>Estimated Delivery:</strong> 3 to 7 business days via dedicated freight.
              </p>
            </div>
          </div>
        </section>

        <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Direct Doorstep & Location Delivery
          </h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
            At checkout, customers specify their delivery address:
          </p>
          <ul style={{ paddingLeft: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Admin-Configured Destinations:</strong> If your state and town are configured by DOVI, your delivery fee is automatically calculated and added to your subtotal.
            </li>
            <li>
              <strong>Unlisted Locations:</strong> If your location is not yet configured, select "Arrange Delivery via WhatsApp" at checkout to arrange custom delivery with DOVI Support.
            </li>
          </ul>
        </section>

        <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Multi-Item Consolidation
          </h2>
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
            Ordering multiple items in one checkout? DOVI consolidates your items into direct shipments to your destination, giving you a clear, single checkout payment for products and delivery together.
          </p>
        </section>
      </div>
    </InfoLayout>
  );
}

const boxStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  padding: '1.25rem',
};
