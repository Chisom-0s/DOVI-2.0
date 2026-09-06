import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from './Header';
import BottomNav from './BottomNav';

export default function MainLayout() {
  const location = useLocation();
  const { user } = useAuth();

  const isVendor = user?.role === 'VENDOR' || user?.profile?.vendor_status === 'APPROVED';

  return (
    <div style={layoutWrapperStyles}>
      {/* Universal Header */}
      <Header />

      {/* Main Content Area */}
      <main style={mainContentStyles}>
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
const layoutWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
};

const mainContentStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
};
