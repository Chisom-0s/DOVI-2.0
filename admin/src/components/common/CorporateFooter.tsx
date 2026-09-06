import React from 'react';

export default function CorporateFooter() {
  const footerStyles: React.CSSProperties = {
    textAlign: 'center',
    padding: '24px 16px',
    fontSize: '13px',
    color: '#9ca3af',
    marginTop: 'auto',
    width: '100%',
    fontWeight: 500,
  };

  return (
    <footer style={footerStyles}>
      &copy; 2026 Dovi. A product of Malc Nexus Technologies Limited. All rights reserved.
    </footer>
  );
}
