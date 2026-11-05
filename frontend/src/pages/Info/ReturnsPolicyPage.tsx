import InfoLayout from './InfoLayout';

export default function ReturnsPolicyPage() {
  return (
    <InfoLayout
      badge="Buyer Protection"
      title="Returns & Refunds Policy"
      tagline="Shop with complete confidence. Every order on Dovi is covered by our 48-hour inspection guarantee and full escrow protection."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <section>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            The 48-Hour Inspection Guarantee
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            We know trust is the single most important factor when purchasing goods online in Nigeria. That is why Dovi introduces an unconditional <strong>48-Hour Buyer Inspection Window</strong>. Sellers do not receive payout until this period ends and you have confirmed that the goods are satisfactory.
          </p>
        </section>

        <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1rem' }}>
            Eligible Reasons for Returns & Refunds
          </h2>
          <ul style={{ paddingLeft: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Damaged on Arrival:</strong> The product arrived with physical damage, broken screens, dents, or non-functional electronics.
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Item Not as Described:</strong> The product specifications, color, size, storage capacity, or brand received differs significantly from the seller's catalog listing.
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Counterfeit / Substandard:</strong> An item listed as original or brand new is determined to be non-genuine.
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Missing Components / Accessories:</strong> Essential parts or accessories promised in the listing are missing from the package.
            </li>
          </ul>
        </section>

        <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1rem' }}>
            Step-by-Step Return Process
          </h2>
          <ol style={{ paddingLeft: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            <li style={{ marginBottom: '0.75rem' }}>
              <strong>Initiate Request within 48 Hours:</strong> Go to your Dovi Order History, open the relevant order, and click "Request Return / Refund".
            </li>
            <li style={{ marginBottom: '0.75rem' }}>
              <strong>Provide Evidence:</strong> Upload clear photos or short video clips showing the defect or discrepancy and the packaging label.
            </li>
            <li style={{ marginBottom: '0.75rem' }}>
              <strong>Escrow Hold Activated:</strong> Vendor payout is immediately frozen while our dispute management team reviews the evidence within 24 hours.
            </li>
            <li style={{ marginBottom: '0.75rem' }}>
              <strong>Drop-off / Pickup:</strong> Hand the packaged item to your local Dovi Campus Pickup Agent or courier return partner.
            </li>
            <li>
              <strong>Instant Refund:</strong> Once the package is received and verified at our Onitsha Hub, your refund is credited within 24 to 48 hours.
            </li>
          </ol>
        </section>

        <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Non-Returnable Items
          </h2>
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
            For hygiene and health safety reasons, opened intimate apparel, underwear, swimwear, opened cosmetics/personal care liquids, and perishable groceries cannot be returned unless delivered broken or defective.
          </p>
        </section>
      </div>
    </InfoLayout>
  );
}

