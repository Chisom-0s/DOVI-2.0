import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import AppRouter from '@/router';

// ============================================================
// App
// Root component — wraps everything in:
//   ErrorBoundary → AuthProvider → CartProvider → Router
// Toaster is outside router so toasts work on any page.
// ============================================================
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <AppRouter />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                fontSize: '0.875rem',
                fontFamily: 'var(--font-sans)',
              },
            }}
          />
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

