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

// Phase 5 — Buyer Dashboard
import DashboardLayout from '@/pages/Dashboard/DashboardLayout';
import DashboardOverviewPage from '@/pages/Dashboard/DashboardOverviewPage';
import ProfilePage from '@/pages/Dashboard/ProfilePage';
import AddressesPage from '@/pages/Dashboard/AddressesPage';
import PaymentMethodsPage from '@/pages/Dashboard/PaymentMethodsPage';
import WishlistPage from '@/pages/Dashboard/WishlistPage';
import RecentlyViewedPage from '@/pages/Dashboard/RecentlyViewedPage';
import MyReviewsPage from '@/pages/Dashboard/MyReviewsPage';
import NotificationsPage from '@/pages/Dashboard/NotificationsPage';
import AccountSettingsPage from '@/pages/Dashboard/AccountSettingsPage';
import SecuritySettingsPage from '@/pages/Dashboard/SecuritySettingsPage';

// ============================================================
// Placeholder component — used for pages not yet built (Phase 6+)
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

      // ---- Buyer Dashboard (Phase 5 — LIVE Layout) ----
      {
        path: 'dashboard',
        element: (
          <RoleGuard role="BUYER">
            <DashboardLayout />
          </RoleGuard>
        ),
        children: [
          { path: '', element: <DashboardOverviewPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'orders', element: <OrderHistoryPage /> },
          { path: 'orders/:ref', element: <OrderDetailPage /> },
          { path: 'wishlist', element: <WishlistPage /> },
          { path: 'recently-viewed', element: <RecentlyViewedPage /> },
          { path: 'save2own', element: <Placeholder name="Save2Own Goals" /> },
          { path: 'reviews', element: <MyReviewsPage /> },
          { path: 'refunds', element: <RefundRequestPage /> },
          { path: 'refunds/:id', element: <RefundDetailPage /> },
          { path: 'notifications', element: <NotificationsPage /> },
          { path: 'addresses', element: <AddressesPage /> },
          { path: 'payment-methods', element: <PaymentMethodsPage /> },
          { path: 'settings', element: <AccountSettingsPage /> },
          { path: 'security', element: <SecuritySettingsPage /> },
        ],
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
