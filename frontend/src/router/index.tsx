import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthGuard } from '@/components/guards/AuthGuard';
import { RoleGuard } from '@/components/guards/RoleGuard';

// Auth pages
import LoginPage from '@/pages/Auth/LoginPage';
import RegisterPage from '@/pages/Auth/RegisterPage';
import ForgotPasswordPage from '@/pages/Auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/Auth/ResetPasswordPage';
import EmailVerificationPage from '@/pages/Auth/EmailVerificationPage';

import MainLayout from '@/components/layout/MainLayout';
import HomePage from '@/pages/Home/HomePage';
import ProductListingPage from '@/pages/Products/ProductListingPage';
import CategoryPage from '@/pages/Products/CategoryPage';
import SearchResultsPage from '@/pages/Products/SearchResultsPage';
import ProductDetailPage from '@/pages/Products/Detail/ProductDetailPage';

// Phase 4 — Cart, Checkout, Orders, Payments, Refunds
import CartPage from '@/pages/Cart/CartPage';
import CheckoutPage from '@/pages/Checkout/CheckoutPage';
import CheckoutSessionPage from '@/pages/Checkout/CheckoutSessionPage';
import PaymentSuccessPage from '@/pages/Payment/PaymentSuccessPage';
import PaymentFailedPage from '@/pages/Payment/PaymentFailedPage';
import OrderConfirmationPage from '@/pages/Orders/OrderConfirmationPage';
import OrderHistoryPage from '@/pages/Orders/OrderHistoryPage';
import OrderDetailPage from '@/pages/Orders/OrderDetailPage';
import RefundRequestPage from '@/pages/Refunds/RefundRequestPage';
import RefundDetailPage from '@/pages/Refunds/RefundDetailPage';

// ============================================================
// Placeholder component — used for pages not yet built (Phase 5+)
// ============================================================
function Placeholder({ name }: { name: string }) {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>{name}</h2>
      <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
        This page will be built in a future phase.
      </p>
    </div>
  );
}

// ============================================================
// Router
// All routes defined here. Placeholder pages will be replaced
// phase by phase as the application is built.
// ============================================================
const router = createBrowserRouter([
  // ---- Public routes ----
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/verify-email', element: <EmailVerificationPage /> },

  // ---- Public marketplace routes inside MainLayout (Phase 2 & 3) ----
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: '', element: <HomePage /> },
      { path: 'products', element: <ProductListingPage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },
      { path: 'categories/:slug', element: <CategoryPage /> },
      { path: 'search', element: <SearchResultsPage /> },
      { path: 'vendors/:id', element: <Placeholder name="Vendor Store" /> },
      { path: 'faq', element: <Placeholder name="FAQ" /> },
      { path: 'contact', element: <Placeholder name="Contact Support" /> },
      { path: 'terms', element: <Placeholder name="Terms & Conditions" /> },

      // ---- Cart & Checkout (Phase 4 — LIVE) ----
      {
        path: 'cart',
        element: (
          <AuthGuard>
            <CartPage />
          </AuthGuard>
        ),
      },
      {
        path: 'checkout',
        element: (
          <AuthGuard>
            <CheckoutPage />
          </AuthGuard>
        ),
      },
      {
        path: 'checkout/:id',
        element: (
          <AuthGuard>
            <CheckoutSessionPage />
          </AuthGuard>
        ),
      },

      // ---- Order & Payment results (Phase 4 — LIVE) ----
      {
        path: 'orders/:ref',
        element: (
          <AuthGuard>
            <OrderConfirmationPage />
          </AuthGuard>
        ),
      },
      {
        path: 'payment/success',
        element: (
          <AuthGuard>
            <PaymentSuccessPage />
          </AuthGuard>
        ),
      },
      {
        path: 'payment/failed',
        element: (
          <AuthGuard>
            <PaymentFailedPage />
          </AuthGuard>
        ),
      },

      // ---- Buyer Dashboard (Phase 4 & 5) ----
      {
        path: 'dashboard',
        element: (
          <RoleGuard role="BUYER">
            <Placeholder name="Dashboard Overview" />
          </RoleGuard>
        ),
      },
      {
        path: 'dashboard/profile',
        element: (
          <RoleGuard role="BUYER">
            <Placeholder name="Profile" />
          </RoleGuard>
        ),
      },
      {
        path: 'dashboard/orders',
        element: (
          <RoleGuard role="BUYER">
            <OrderHistoryPage />
          </RoleGuard>
        ),
      },
      {
        path: 'dashboard/orders/:ref',
        element: (
          <RoleGuard role="BUYER">
            <OrderDetailPage />
          </RoleGuard>
        ),
      },
      {
        path: 'dashboard/wishlist',
        element: (
          <RoleGuard role="BUYER">
            <Placeholder name="Wishlist" />
          </RoleGuard>
        ),
      },
      {
        path: 'dashboard/recently-viewed',
        element: (
          <RoleGuard role="BUYER">
            <Placeholder name="Recently Viewed" />
          </RoleGuard>
        ),
      },
      {
        path: 'dashboard/save2own',
        element: (
          <RoleGuard role="BUYER">
            <Placeholder name="Save2Own Goals" />
          </RoleGuard>
        ),
      },
      {
        path: 'dashboard/reviews',
        element: (
          <RoleGuard role="BUYER">
            <Placeholder name="My Reviews" />
          </RoleGuard>
        ),
      },
      {
        path: 'dashboard/refunds',
        element: (
          <RoleGuard role="BUYER">
            <RefundRequestPage />
          </RoleGuard>
        ),
      },
      {
        path: 'dashboard/refunds/:id',
        element: (
          <RoleGuard role="BUYER">
            <RefundDetailPage />
          </RoleGuard>
        ),
      },
      {
        path: 'dashboard/notifications',
        element: (
          <RoleGuard role="BUYER">
            <Placeholder name="Notifications" />
          </RoleGuard>
        ),
      },
      {
        path: 'dashboard/addresses',
        element: (
          <RoleGuard role="BUYER">
            <Placeholder name="Saved Addresses" />
          </RoleGuard>
        ),
      },
      {
        path: 'dashboard/payment-methods',
        element: (
          <RoleGuard role="BUYER">
            <Placeholder name="Payment Methods" />
          </RoleGuard>
        ),
      },
      {
        path: 'dashboard/settings',
        element: (
          <RoleGuard role="BUYER">
            <Placeholder name="Account Settings" />
          </RoleGuard>
        ),
      },
      {
        path: 'dashboard/security',
        element: (
          <RoleGuard role="BUYER">
            <Placeholder name="Security Settings" />
          </RoleGuard>
        ),
      },

      // ---- Save2Own (Phase 6) ----
      { path: 'save2own', element: <Placeholder name="Save2Own" /> },
      {
        path: 'save2own/goals/:id',
        element: (
          <RoleGuard role="BUYER">
            <Placeholder name="Save2Own Goal Detail" />
          </RoleGuard>
        ),
      },

      // ---- Dovi Auto (Phase 10, 11, 12) ----
      { path: 'auto', element: <Placeholder name="Dovi Auto" /> },
      { path: 'auto/cars', element: <Placeholder name="Cars" /> },
      { path: 'auto/cars/:id', element: <Placeholder name="Car Listing Detail" /> },
      { path: 'auto/parts', element: <Placeholder name="Car Parts" /> },
      { path: 'auto/parts/:id', element: <Placeholder name="Part Detail" /> },
      { path: 'auto/accessories', element: <Placeholder name="Accessories" /> },
      { path: 'auto/accessories/:id', element: <Placeholder name="Accessory Detail" /> },
      { path: 'auto/rentals', element: <Placeholder name="Rentals" /> },
      { path: 'auto/rentals/:id', element: <Placeholder name="Rental Detail" /> },
      {
        path: 'auto/rentals/bookings',
        element: (
          <RoleGuard role="BUYER">
            <Placeholder name="My Rental Bookings" />
          </RoleGuard>
        ),
      },
    ],
  },

  // ---- 404 ----
  {
    path: '*',
    element: (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <h1>404</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
          Page not found.
        </p>
        <a href="/" style={{ color: 'var(--color-primary)', marginTop: '1rem', display: 'inline-block' }}>
          Go home
        </a>
      </div>
    ),
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
