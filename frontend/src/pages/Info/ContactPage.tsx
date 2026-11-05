import React, { useState } from 'react';
import InfoLayout from './InfoLayout';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <InfoLayout
      badge="Support & Inquiries"
      title="Contact Dovi Support"
      tagline="Have a question about an order, delivery, escrow, or partnership? We're here to help you anytime."
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
        {/* Contact Information & Channels */}
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--color-text)' }}>
            Get in Touch
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={channelCardStyles}>
              <span style={{ fontSize: '1.5rem' }}>💬</span>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 600 }}>Live Chat (Instant)</h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  Click the chat widget on the bottom right of your screen to speak directly with an agent or Smartsupp AI.
                </p>
              </div>
            </div>

            <div style={channelCardStyles}>
              <span style={{ fontSize: '1.5rem' }}>✉️</span>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 600 }}>Email Customer Care</h4>
                <p style={{ margin: '0 0 4px', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  Support: <a href="mailto:support@dovishop.com" style={{ color: 'var(--color-primary)' }}>support@dovishop.com</a>
                </p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  General: <a href="mailto:hello@dovishop.com" style={{ color: 'var(--color-primary)' }}>hello@dovishop.com</a>
                </p>
              </div>
            </div>

            <div style={channelCardStyles}>
              <span style={{ fontSize: '1.5rem' }}>🕒</span>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 600 }}>Operating Hours</h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  Monday – Saturday: 8:00 AM – 8:00 PM WAT<br />
                  Sunday: 12:00 PM – 6:00 PM WAT (Urgent inquiries only)
                </p>
              </div>
            </div>

            <div style={channelCardStyles}>
              <span style={{ fontSize: '1.5rem' }}>📍</span>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 600 }}>Central Logistics Hub</h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  Dovi Central Hub & Fulfillment Facility<br />
                  Onitsha Commercial Corridor, Anambra State, Nigeria.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div style={{ backgroundColor: 'var(--color-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1rem' }}>Send Us a Message</h3>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <span style={{ fontSize: '2.5rem' }}>✅</span>
              <h4 style={{ margin: '0.75rem 0 0.5rem', fontSize: '1.1rem' }}>Message Received</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Thank you! Our customer support team will reply to <strong>{formData.email}</strong> within 4 business hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyles}>Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chisom Okonkwo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={inputStyles}
                />
              </div>

              <div>
                <label style={labelStyles}>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={inputStyles}
                />
              </div>

              <div>
                <label style={labelStyles}>Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Order Inquiry #DOV-1234, Delivery Delay"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  style={inputStyles}
                />
              </div>

              <div>
                <label style={labelStyles}>Message</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain how we can help you in detail..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  style={{ ...inputStyles, resize: 'vertical' }}
                />
              </div>

              <button type="submit" style={submitButtonStyles}>
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </InfoLayout>
  );
}

const channelCardStyles: React.CSSProperties = {
  display: 'flex',
  gap: '14px',
  alignItems: 'flex-start',
  padding: '12px 14px',
  borderRadius: '10px',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-bg)',
};

const labelStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 600,
  marginBottom: '4px',
  color: 'var(--color-text)',
};

const inputStyles: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  fontSize: '0.9rem',
  outline: 'none',
  backgroundColor: 'var(--color-card)',
  color: 'var(--color-text)',
  boxSizing: 'border-box',
};

const submitButtonStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  padding: '12px 20px',
  borderRadius: '8px',
  fontWeight: 700,
  fontSize: '0.95rem',
  cursor: 'pointer',
  marginTop: '4px',
};

