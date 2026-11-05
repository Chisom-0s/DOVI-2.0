import InfoLayout from './InfoLayout';

export default function TermsPage() {
  return (
    <InfoLayout
      badge="Legal & Governance"
      title="Terms of Service"
      tagline="Terms and conditions governing the use of the Dovi marketplace platform by buyers, students, and merchant vendors."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <section>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            1. Agreement to Terms
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Welcome to Dovi (https://dovishop.com). These Terms of Service constitute a legally binding agreement between you and <strong>Malc Nexus Technologies Limited</strong>, operating the Dovi marketplace. By creating an account, browsing listings, placing orders, or registering as a merchant, you agree to comply with and be bound by these terms.
          </p>
        </section>

        <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            2. Centralized Escrow Architecture
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            All payments made on the Dovi marketplace are processed through our authorized payment gateways and credited to Dovi Escrow accounts. Direct peer-to-peer or off-platform money transfers between buyers and vendors are strictly prohibited. Off-platform transactions void all Dovi buyer protections, guarantees, and refunds.
          </p>
        </section>

        <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            3. Vendor Responsibilities & Authenticity
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Vendors warrant that all items listed are genuine, legally acquired, and accurately represented. The listing of counterfeit goods, stolen electronics, replica fashion disguised as originals, or prohibited narcotics results in immediate account termination, forfeiture of escrow balances, and reporting to relevant Nigerian law enforcement agencies.
          </p>
        </section>

        <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            4. Save2Own Installment Agreement
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Save2Own is a pre-funded installment savings plan. Goods are held reserved or sourced upon completion of all scheduled contributions. Save2Own plans carry zero percent (0%) interest. In the event of buyer-initiated cancellation prior to goal completion, funds are refunded subject to our administrative processing schedule.
          </p>
        </section>

        <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            5. Governing Law & Dispute Resolution
          </h2>
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
            These Terms shall be interpreted in accordance with the laws of the Federal Republic of Nigeria. Any disputes arising from the use of the platform that cannot be resolved amicably through Dovi Customer Care shall be referred to arbitration in accordance with Nigerian arbitration laws.
          </p>
        </section>
      </div>
    </InfoLayout>
  );
}
