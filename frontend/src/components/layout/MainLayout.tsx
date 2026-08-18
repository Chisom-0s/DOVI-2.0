import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function MainLayout() {
  return (
    <div style={layoutWrapperStyles}>
      {/* Universal Header */}
      <Header />

      {/* Main Content Area */}
      <main style={mainContentStyles}>
        <Outlet />
      </main>

      {/* Universal Footer */}
      <Footer />
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
