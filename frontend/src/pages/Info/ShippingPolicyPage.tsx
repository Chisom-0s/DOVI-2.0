import InfoLayout from './InfoLayout';

export default function ShippingPolicyPage() {
  return (
    <InfoLayout
      badge="Delivery Logistics"
      title="Shipping & Campus Delivery Policy"
      tagline="How Dovi consolidates orders, verifies quality at our Onitsha Hub, and dispatches packages to campuses across Nigeria."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <section>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            The Centralized Hub Model
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Unlike open classified boards where buyers take all shipping risks, Dovi enforces a <strong>Centralized Fulfillment Model</strong>. All vendor parcels are routed through our physical hub in Onitsha, Anambra State, for authenticity verification and shipment consolidation before final dispatch to student campuses.
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
                <strong>Estimated Delivery:</strong> 24 to 72 hours to major campuses.
              </p>
            </div>

            <div style={boxStyles}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 6px' }}>
                💻 Computing & Medium Parcels
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Laptops, monitors, backpacks, textbooks, and campus footwear.<br />
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
            Campus Pickup Points vs. Doorstep Delivery
          </h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
            At checkout, students can select their preferred delivery preference:
          </p>
          <ul style={{ paddingLeft: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Designated Campus Hub / Pickup Agent:</strong> Collect your order at an official campus representative station without waiting for a courier rider.
            </li>
            <li>
              <strong>Direct Residence / Hostel Delivery:</strong> Our logistics partners deliver straight to your specified campus hostel gate, lodge, or residential apartment.
            </li>
          </ul>
        </section>

        <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Multi-Vendor Consolidation
          </h2>
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
            Ordering from multiple vendors in one checkout? When eligible, Dovi bundles your items into a single consolidated shipment at our Onitsha Hub, dramatically cutting down separate delivery fees.
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
