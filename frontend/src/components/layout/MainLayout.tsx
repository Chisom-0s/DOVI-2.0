import { Outlet } from 'react-router-dom';
import type { CSSProperties } from 'react';
import Header from './Header';
import BottomNav from './BottomNav';

export default function MainLayout() {
  return (
    <div style={layoutWrapperStyles}>
      {/* Universal Header */}
      <Header />

      {/* Main Content Area */}
      <main style={mainContentStyles} className="main-content-area">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav />
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const layoutWrapperStyles: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
};

const mainContentStyles: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
};
