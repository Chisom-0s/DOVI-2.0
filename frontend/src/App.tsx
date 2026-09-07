import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { PromptEngineProvider } from '@/contexts/PromptEngineContext';
import AppRouter from '@/router';
import DoviSplashScreen from '@/components/common/DoviSplashScreen';

// ============================================================
// App
// Root component — wraps everything in:
//   ErrorBoundary → AuthProvider → CartProvider → Router
// Toaster is outside router so toasts work on any page.
// ============================================================
export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <PromptEngineProvider>
          <CartProvider>
            {showSplash ? (
              <DoviSplashScreen onComplete={() => setShowSplash(false)} />
            ) : (
              <>
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
              </>
            )}
          </CartProvider>
        </PromptEngineProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

