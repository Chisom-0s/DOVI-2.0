const fs = require('fs');
const path = require('path');

// 1. Update AdminLayout.tsx
const layoutPath = path.join(__dirname, '..', 'admin', 'src', 'components', 'layout', 'AdminLayout.tsx');
let layout = fs.readFileSync(layoutPath, 'utf8');

// Normalize line endings to \n for matching, we can keep or write back with \r\n
const isCRLF = layout.includes('\r\n');
let norm = layout.replace(/\r\n/g, '\n');

// Add backdrop
norm = norm.replace(
  `      <div style={bodyWrapperStyles}>\n        {/* Sidebar Nav */}`,
  `      {mobileMenuOpen && (\n        <div\n          onClick={() => setMobileMenuOpen(false)}\n          className="mobile-nav-backdrop"\n          aria-label="Close navigation menu"\n        />\n      )}\n\n      <div style={bodyWrapperStyles}>\n        {/* Sidebar Nav */}`
);

// Update bodyWrapperStyles
norm = norm.replace(
  `const bodyWrapperStyles: React.CSSProperties = {\n  display: 'flex',\n  flex: 1,\n};`,
  `const bodyWrapperStyles: React.CSSProperties = {\n  display: 'flex',\n  flex: 1,\n  minHeight: 'calc(100vh - 64px)',\n  position: 'relative',\n};`
);

// Update sidebarStyles
norm = norm.replace(
  `const sidebarStyles: React.CSSProperties = {\n  width: '260px',\n  backgroundColor: '#ffffff',\n  borderRight: '1px solid #e5e7eb',\n  padding: '24px 0',\n  flexDirection: 'column',\n  gap: '8px',\n};`,
  `const sidebarStyles: React.CSSProperties = {\n  width: '260px',\n  backgroundColor: '#ffffff',\n  borderRight: '1px solid #e5e7eb',\n  padding: '16px 0 32px 0',\n  flexDirection: 'column',\n  gap: '8px',\n  position: 'sticky',\n  top: '64px',\n  height: 'calc(100vh - 64px)',\n  maxHeight: 'calc(100vh - 64px)',\n  overflowY: 'auto',\n  overflowX: 'hidden',\n  overscrollBehavior: 'contain',\n  WebkitOverflowScrolling: 'touch',\n  flexShrink: 0,\n  zIndex: 50,\n};`
);

// Update mainContentStyles
norm = norm.replace(
  `const mainContentStyles: React.CSSProperties = {\n  flex: 1,\n  padding: '32px',\n  overflowY: 'auto',\n  maxWidth: '1280px',\n  margin: '0 auto',\n  width: '100%',\n};`,
  `const mainContentStyles: React.CSSProperties = {\n  flex: 1,\n  padding: '32px',\n  minWidth: 0,\n  maxWidth: '1280px',\n  margin: '0 auto',\n  width: '100%',\n};`
);

if (isCRLF) {
  norm = norm.replace(/\n/g, '\r\n');
}
fs.writeFileSync(layoutPath, norm, 'utf8');
console.log('✓ AdminLayout.tsx successfully updated.');

// 2. Update admin/src/index.css
const cssPath = path.join(__dirname, '..', 'admin', 'src', 'index.css');
let css = fs.readFileSync(cssPath, 'utf8');
const isCssCRLF = css.includes('\r\n');
let cssNorm = css.replace(/\r\n/g, '\n');

const oldMobileCss = `/* Custom layout rules for mobile/responsive sidebar */\n@media (max-width: 768px) {\n  .sidebar-aside {\n    display: none !important;\n  }\n  .mobile-nav-open {\n    display: flex !important;\n    position: fixed;\n    top: 64px;\n    left: 0;\n    width: 260px;\n    height: calc(100vh - 64px);\n    z-index: 99;\n    box-shadow: 10px 0 25px rgba(0,0,0,0.1);\n  }\n  header button {\n    display: block !important;\n  }\n}`;

const newMobileCss = `/* Custom layout rules for mobile/responsive sidebar */\n@media (max-width: 768px) {\n  .sidebar-aside {\n    display: none !important;\n  }\n  .mobile-nav-open {\n    display: flex !important;\n    position: fixed !important;\n    top: 64px;\n    left: 0;\n    width: min(280px, 85vw);\n    height: calc(100vh - 64px);\n    height: calc(100dvh - 64px);\n    max-height: calc(100dvh - 64px);\n    overflow-y: auto !important;\n    overflow-x: hidden;\n    overscroll-behavior: contain;\n    -webkit-overflow-scrolling: touch;\n    z-index: 99;\n    box-shadow: 10px 0 25px rgba(0,0,0,0.15);\n    padding-bottom: max(32px, env(safe-area-inset-bottom, 32px)) !important;\n    background-color: #ffffff;\n  }\n  .mobile-nav-backdrop {\n    position: fixed;\n    top: 64px;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    background-color: rgba(0, 0, 0, 0.4);\n    backdrop-filter: blur(2px);\n    -webkit-backdrop-filter: blur(2px);\n    z-index: 98;\n    animation: fadeIn 150ms ease-out;\n  }\n  header button {\n    display: block !important;\n  }\n}\n\n/* Independent smooth scrollbars for sidebar navigation */\n.sidebar-aside,\n.mobile-nav-open {\n  scrollbar-width: thin;\n  scrollbar-color: #e5e7eb transparent;\n}\n\n.sidebar-aside::-webkit-scrollbar,\n.mobile-nav-open::-webkit-scrollbar {\n  width: 5px;\n}\n\n.sidebar-aside::-webkit-scrollbar-track,\n.mobile-nav-open::-webkit-scrollbar-track {\n  background: transparent;\n}\n\n.sidebar-aside::-webkit-scrollbar-thumb,\n.mobile-nav-open::-webkit-scrollbar-thumb {\n  background: #e5e7eb;\n  border-radius: 4px;\n}\n\n.sidebar-aside::-webkit-scrollbar-thumb:hover,\n.mobile-nav-open::-webkit-scrollbar-thumb:hover {\n  background: #cbd5e1;\n}`;

cssNorm = cssNorm.replace(oldMobileCss, newMobileCss);
if (isCssCRLF) {
  cssNorm = cssNorm.replace(/\n/g, '\r\n');
}
fs.writeFileSync(cssPath, cssNorm, 'utf8');
console.log('✓ admin/src/index.css successfully updated.');
