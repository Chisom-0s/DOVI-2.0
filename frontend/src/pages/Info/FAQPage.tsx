import { useState } from 'react';
import InfoLayout from './InfoLayout';

interface FAQ {
  category: string;
  q: string;
  a: string;
}

const faqs: FAQ[] = [
  {
    category: 'Orders & Buying',
    q: 'How do I place an order on Dovi?',
    a: 'Browse products or use the search bar, add items to your cart, and proceed to checkout. You can pay securely online via Debit/Credit Card, Bank Transfer, or USSD through our verified payment gateway. Once paid, your funds are safely held in Escrow until delivery.',
  },
  {
    category: 'Orders & Buying',
    q: 'How does 100% Escrow Buyer Protection work?',
    a: 'When you make a payment on Dovi, your money does not go directly to the vendor. Instead, it is held securely in Dovi Escrow. The seller is only paid after the item has arrived, you have inspected it, and the 48-hour inspection period has elapsed with no disputes.',
  },
  {
    category: 'Orders & Buying',
    q: 'What is the 48-hour inspection period?',
    a: 'Once your package is marked as Delivered, you have exactly 48 hours to unbox, test, and inspect the product. If anything is broken, defective, or different from what you ordered, you can click "Report Issue / Return" in your order dashboard to freeze payment release.',
  },
  {
    category: 'Save2Own Installments',
    q: 'What is Save2Own and how do I use it?',
    a: 'Save2Own is our zero-interest student savings program. Rather than borrowing money or taking high-interest loans, you select an item (e.g. laptop or phone), choose a target savings duration (daily, weekly, or monthly contributions), and lock in the price. Once your target is met, Dovi ships the product straight to your campus.',
  },
  {
    category: 'Save2Own Installments',
    q: 'Can I cancel my Save2Own goal and get my money back?',
    a: 'Yes. If you decide to cancel your Save2Own plan before completion, your accumulated contributions are refunded to your Dovi wallet or original bank account according to our Save2Own terms.',
  },
  {
    category: 'Shipping & Delivery',
    q: 'How long does campus delivery take?',
    a: 'Standard campus delivery takes between 24 and 72 hours for small parcels and electronics routed through our Onitsha Logistics Hub. Bulk items or deliveries to remote campus locations take 2 to 5 business days. You receive live SMS/Email tracking updates at every stage.',
  },
  {
    category: 'Shipping & Delivery',
    q: 'Where do I collect my order?',
    a: 'Depending on your campus and chosen checkout option, orders can be delivered directly to your hostel/residence address or to a designated Dovi Campus Pickup Point for fast, zero-delay collection.',
  },
  {
    category: 'Returns & Refunds',
    q: 'How do I return a damaged or wrong product?',
    a: 'Navigate to your Orders page, find the order within 48 hours of delivery, and tap "Request Refund / Return". Upload clear photos or videos of the issue. Our support team reviews disputes within 24 hours and issues a return authorization label.',
  },
  {
    category: 'Returns & Refunds',
    q: 'When do I receive my refund?',
    a: 'Once the returned item is inspected at our hub and verified, refunds are processed within 24 to 48 hours back to your original payment method or instantly to your Dovi wallet balance.',
  },
  {
    category: 'Vendors & Selling',
    q: 'How can I become a verified vendor on Dovi?',
    a: 'Click "Sell on Dovi" or register a Vendor account. You will submit government ID, business registration (if applicable), and bank account details. Once our team approves your store (usually 24 hours), you can list products and start selling to thousands of students.',
  },
  {
    category: 'Customer Support',
    q: 'How can I contact Dovi support if I need help?',
    a: 'Our support team is available via Live Chat (click the chat bubble at the bottom right of the screen), by email at support@dovishop.com or hello@dovishop.com, and by phone during operating hours (Mon-Sat, 8:00 AM – 8:00 PM WAT).',
  },
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const categories = ['All', 'Orders & Buying', 'Save2Own Installments', 'Shipping & Delivery', 'Returns & Refunds', 'Vendors & Selling', 'Customer Support'];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
    const matchesQuery =
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <InfoLayout
      badge="Help Center"
      title="Frequently Asked Questions"
      tagline="Find fast answers to common questions about buying, escrow, Save2Own, campus delivery, and returns."
    >
      {/* Search Input */}
      <div style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Search for answers (e.g., escrow, delivery, refund, Save2Own)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={searchInputStyles}
        />
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              ...filterPillStyles,
              ...(activeCategory === cat ? filterPillActiveStyles : {}),
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Accordion FAQ List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, index) => {
            const isOpen = expandedIndex === index;
            return (
              <div
                key={index}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  backgroundColor: 'var(--color-bg)',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => setExpandedIndex(isOpen ? null : index)}
                  style={accordionHeaderStyles}
                >
                  <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-text)', textAlign: 'left' }}>
                    {faq.q}
                  </span>
                  <span style={{ fontSize: '1.2rem', color: 'var(--color-primary)', marginLeft: '12px' }}>
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 1.25rem 1.25rem', color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem 0' }}>
            No questions matched your search. Contact us at <a href="mailto:support@dovishop.com" style={{ color: 'var(--color-primary)' }}>support@dovishop.com</a> for immediate assistance.
          </p>
        )}
      </div>
    </InfoLayout>
  );
}

const searchInputStyles: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '10px',
  border: '1px solid var(--color-border)',
  fontSize: '0.95rem',
  outline: 'none',
  backgroundColor: 'var(--color-bg)',
  color: 'var(--color-text)',
};

const filterPillStyles: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: '9999px',
  fontSize: '0.85rem',
  cursor: 'pointer',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-bg)',
  color: 'var(--color-text-muted)',
};

const filterPillActiveStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  borderColor: 'var(--color-primary)',
  fontWeight: 600,
};

const accordionHeaderStyles: React.CSSProperties = {
  width: '100%',
  padding: '1.25rem',
  background: 'none',
  border: 'none',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
};

