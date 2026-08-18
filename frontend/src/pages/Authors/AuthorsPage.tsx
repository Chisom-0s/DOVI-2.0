import React from 'react';

export default function AuthorsPage() {
  return (
    <div className="container" style={containerStyles}>
      <h1 style={titleStyles}>DOVI Authors & Developers</h1>
      <p style={subtitleStyles}>
        Meet the engineering minds behind the DOVI 2.0 platform.
      </p>

      <div style={gridStyles}>
        {/* Author Card 1 */}
        <div style={cardStyles} className="author-card">
          <div style={avatarWrapperStyles}>
            <div style={avatarPlaceholderStyles}>DC</div>
          </div>
          <div style={infoStyles}>
            <h2 style={nameStyles}>Dieke Chisom</h2>
            <p style={roleStyles}>Lead Architect & Backend Engineer</p>
            <p style={bioStyles}>
              Specializes in building distributed systems, database schema designs, and high-performance APIs. Developed the core django microservices architecture for Dovi 2.0.
            </p>
            <div style={socialsStyles}>
              <span style={badgeStyles}>Python</span>
              <span style={badgeStyles}>Django</span>
              <span style={badgeStyles}>PostgreSQL</span>
              <span style={badgeStyles}>System Design</span>
            </div>
          </div>
        </div>

        {/* Author Card 2 (Antigravity) */}
        <div style={cardStyles} className="author-card">
          <div style={{ ...avatarWrapperStyles, backgroundColor: 'var(--color-primary)' }}>
            <div style={{ ...avatarPlaceholderStyles, color: 'white' }}>AG</div>
          </div>
          <div style={infoStyles}>
            <h2 style={nameStyles}>Antigravity</h2>
            <p style={roleStyles}>Pair Programming AI Assistant</p>
            <p style={bioStyles}>
              An advanced agentic AI coding companion designed by Google DeepMind. Assisted in developing the Vite React TypeScript frontend ecosystem, route guards, and component design patterns.
            </p>
            <div style={socialsStyles}>
              <span style={{ ...badgeStyles, backgroundColor: 'var(--color-primary)', color: 'white' }}>React</span>
              <span style={{ ...badgeStyles, backgroundColor: 'var(--color-primary)', color: 'white' }}>TypeScript</span>
              <span style={{ ...badgeStyles, backgroundColor: 'var(--color-primary)', color: 'white' }}>Vite</span>
              <span style={{ ...badgeStyles, backgroundColor: 'var(--color-primary)', color: 'white' }}>Pair Coding</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  paddingTop: 'var(--space-12)',
  paddingBottom: 'var(--space-16)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--space-6)',
  maxWidth: '800px',
  margin: '0 auto',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-3xl)',
  fontWeight: 'var(--font-bold)',
  textAlign: 'center',
  color: 'var(--color-text)',
};

const subtitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  color: 'var(--color-text-muted)',
  textAlign: 'center',
  maxWidth: '500px',
  marginBottom: 'var(--space-4)',
};

const gridStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-6)',
  width: '100%',
};

const cardStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  gap: 'var(--space-6)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-6)',
  alignItems: 'center',
  transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
  boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
};

const avatarWrapperStyles: React.CSSProperties = {
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  backgroundColor: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const avatarPlaceholderStyles: React.CSSProperties = {
  fontSize: 'var(--text-2xl)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-primary)',
};

const infoStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
  flex: 1,
};

const nameStyles: React.CSSProperties = {
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
};

const roleStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-primary)',
};

const bioStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
  lineHeight: 'var(--leading-relaxed)',
};

const socialsStyles: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--space-2)',
  marginTop: 'var(--space-1)',
};

const badgeStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 'var(--font-bold)',
  backgroundColor: 'var(--color-bg-subtle)',
  color: 'var(--color-text-muted)',
  padding: '2px 8px',
  borderRadius: 'var(--radius-full)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};
