import InfoLayout from './InfoLayout';

export default function PrivacyPolicyPage() {
  return (
    <InfoLayout
      badge="Data Protection & Privacy"
      title="Privacy Policy"
      tagline="How Dovi and Malc Nexus Technologies Limited collect, process, and protect your personal data in compliance with NDPR standards."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <section>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            1. Overview & Commitment
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Dovi is committed to protecting the privacy of students, buyers, and merchants. This Privacy Policy details how we handle information collected on <a href="https://dovishop.com" style={{ color: 'var(--color-primary)' }}>dovishop.com</a> and associated services in adherence to the Nigeria Data Protection Regulation (NDPR) and the Nigeria Data Protection Act (NDPA).
          </p>
        </section>

        <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1rem' }}>
            2. Information We Collect
          </h2>
          <ul style={{ paddingLeft: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Account Information:</strong> Name, student email address, campus institution name, phone number, and encrypted password.
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Fulfillment Information:</strong> Campus hostel, department, lodge address, and delivery instructions.
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Financial & Transaction Data:</strong> Transaction references, escrow release timestamps, and payout bank accounts (card details are tokenized securely by licensed PCI-DSS payment gateways like Paystack/Flutterwave; Dovi never stores raw CVVs or PINs).
            </li>
            <li>
              <strong>Live Chat & Support Data:</strong> Transcripts of conversations conducted through our Smartsupp live chat widget for customer service resolution.
            </li>
          </ul>
        </section>

        <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            3. How We Use Your Data
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Your information is strictly used to fulfill orders, verify campus student status, prevent fraudulent payment attempts, release escrow funds upon inspection, and provide transactional notifications regarding order progress.
          </p>
        </section>

        <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            4. Data Sharing & Third Parties
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            We do not sell student or user personal information to advertisers. We share limited delivery contact information with verified courier riders solely for package drop-off, and with payment processing partners for transaction verification.
          </p>
        </section>

        <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            5. Contact Our Data Protection Officer
          </h2>
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
            If you have questions about your personal data, want to request account deletion, or exercise your data rights, please contact our Data Protection Officer at <a href="mailto:privacy@dovishop.com" style={{ color: 'var(--color-primary)' }}>privacy@dovishop.com</a> or <a href="mailto:support@dovishop.com" style={{ color: 'var(--color-primary)' }}>support@dovishop.com</a>.
          </p>
        </section>
      </div>
    </InfoLayout>
  );
}

