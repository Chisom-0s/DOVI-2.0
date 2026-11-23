const fs = require('fs');
const path = require('path');

// 1. Update AdminLayout.tsx
const layoutPath = path.join(__dirname, '..', 'admin', 'src', 'components', 'layout', 'AdminLayout.tsx');
let layout = fs.readFileSync(layoutPath, 'utf8');

// Add backdrop when mobileMenuOpen is true
layout = layout.replace(
  `      <div style={bodyWrapperStyles}>
        {/* Sidebar Nav */}`,
  `      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="mobile-nav-backdrop"
          aria-label="Close navigation menu"
        />
      )}

      <div style={bodyWrapperStyles}>
        {/* Sidebar Nav */}`
);

// Update bodyWrapperStyles
layout = layout.replace(
  `const bodyWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flex: 1,
};`,
  `const bodyWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  minHeight: 'calc(100vh - 64px)',
  position: 'relative',
};`
);

// Update sidebarStyles with sticky positioning, fixed viewport height, and independent overflow scrolling
layout = layout.replace(
  `const sidebarStyles: React.CSSProperties = {
  width: '260px',
  backgroundColor: '#ffffff',
  borderRight: '1px solid #e5e7eb',
  padding: '24px 0',
  flexDirection: 'column',
  gap: '8px',
};`,
  `const sidebarStyles: React.CSSProperties = {
  width: '260px',
  backgroundColor: '#ffffff',
  borderRight: '1px solid #e5e7eb',
  padding: '16px 0 32px 0',
  flexDirection: 'column',
  gap: '8px',
  position: 'sticky',
  top: '64px',
  height: 'calc(100vh - 64px)',
  maxHeight: 'calc(100vh - 64px)',
  overflowY: 'auto',
  overflowX: 'hidden',
  overscrollBehavior: 'contain',
  WebkitOverflowScrolling: 'touch',
  flexShrink: 0,
  zIndex: 50,
};`
);

// Update mainContentStyles with minWidth: 0 to prevent flex blowout
layout = layout.replace(
  `const mainContentStyles: React.CSSProperties = {
  flex: 1,
  padding: '32px',
  overflowY: 'auto',
  maxWidth: '1280px',
  margin: '0 auto',
  width: '100%',
};`,
  `const mainContentStyles: React.CSSProperties = {
  flex: 1,
  padding: '32px',
  minWidth: 0,
  maxWidth: '1280px',
  margin: '0 auto',
  width: '100%',
};`
);

fs.writeFileSync(layoutPath, layout, 'utf8');
console.log('✓ AdminLayout.tsx updated successfully.');

// 2. Update admin/src/index.css
const cssPath = path.join(__dirname, '..', 'admin', 'src', 'index.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Replace mobile sidebar CSS block
const oldMobileCss = `/* Custom layout rules for mobile/responsive sidebar */
@media (max-width: 768px) {
  .sidebar-aside {
    display: none !important;
  }
  .mobile-nav-open {
    display: flex !important;
    position: fixed;
    top: 64px;
    left: 0;
    width: 260px;
    height: calc(100vh - 64px);
    z-index: 99;
    box-shadow: 10px 0 25px rgba(0,0,0,0.1);
  }
  header button {
    display: block !important;
  }
}`;

const newMobileCss = `/* Custom layout rules for mobile/responsive sidebar */
@media (max-width: 768px) {
  .sidebar-aside {
    display: none !important;
  }
  .mobile-nav-open {
    display: flex !important;
    position: fixed !important;
    top: 64px;
    left: 0;
    width: min(280px, 85vw);
    height: calc(100vh - 64px);
    height: calc(100dvh - 64px);
    max-height: calc(100dvh - 64px);
    overflow-y: auto !important;
    overflow-x: hidden;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    z-index: 99;
    box-shadow: 10px 0 25px rgba(0,0,0,0.15);
    padding-bottom: max(32px, env(safe-area-inset-bottom, 32px)) !important;
    background-color: #ffffff;
  }
  .mobile-nav-backdrop {
    position: fixed;
    top: 64px;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    z-index: 98;
    animation: fadeIn 150ms ease-out;
  }
  header button {
    display: block !important;
  }
}

/* Independent smooth scrollbars for sidebar navigation */
.sidebar-aside,
.mobile-nav-open {
  scrollbar-width: thin;
  scrollbar-color: #e5e7eb transparent;
}

.sidebar-aside::-webkit-scrollbar,
.mobile-nav-open::-webkit-scrollbar {
  width: 5px;
}

.sidebar-aside::-webkit-scrollbar-track,
.mobile-nav-open::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-aside::-webkit-scrollbar-thumb,
.mobile-nav-open::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 4px;
}

.sidebar-aside::-webkit-scrollbar-thumb:hover,
.mobile-nav-open::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}`;

css = css.replace(oldMobileCss, newMobileCss);
fs.writeFileSync(cssPath, css, 'utf8');
console.log('✓ admin/src/index.css updated successfully.');
