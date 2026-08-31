import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import CookieConsentBanner from '@/components/common/CookieConsentBanner';
import PWAInstallPrompt from '@/components/common/PWAInstallPrompt';
import { RouteErrorBoundary } from '@/components/common/ErrorBoundary';
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

// Vendor Dashboard (Merchant Hub)
import VendorDashboardLayout from '@/pages/VendorDashboard/VendorDashboardLayout';
import VendorDashboardOverview from '@/pages/VendorDashboard/VendorDashboardOverview';
import VendorProductManager from '@/pages/VendorDashboard/VendorProductManager';
import VendorOrderManager from '@/pages/VendorDashboard/VendorOrderManager';

// Phase 6 — Save2Own
import Save2OwnGoalsPage from '@/pages/Save2Own/Save2OwnGoalsPage';
import Save2OwnGoalDetailPage from '@/pages/Save2Own/Save2OwnGoalDetailPage';
import Save2OwnCreateGoalPage from '@/pages/Save2Own/Save2OwnCreateGoalPage';

// Phase 10, 11 & 12 — Dovi Auto & Rentals
import AutoLandingPage from '@/pages/Auto/AutoLandingPage';
import CarListingsPage from '@/pages/Auto/CarListingsPage';
import CarDetailPage from '@/pages/Auto/CarDetailPage';
import PartListingsPage from '@/pages/Auto/PartListingsPage';
import PartDetailPage from '@/pages/Auto/PartDetailPage';
import AccessoryListingsPage from '@/pages/Auto/AccessoryListingsPage';
import AccessoryDetailPage from '@/pages/Auto/AccessoryDetailPage';
import RentalListingsPage from '@/pages/Auto/RentalListingsPage';
import RentalDetailPage from '@/pages/Auto/RentalDetailPage';
import RentalConfirmationPage from '@/pages/Auto/RentalConfirmationPage';
import MyRentalsPage from '@/pages/Auto/MyRentalsPage';

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
  {
    element: (
      <>
        <Outlet />
        <CookieConsentBanner />
        <PWAInstallPrompt />
      </>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
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
        errorElement: <RouteErrorBoundary />,
        children: [
          { path: '', element: <HomePage /> },
          { path: 'products', element: <ProductListingPage /> },
          { path: 'products/:id', element: <ProductDetailPage />, errorElement: <RouteErrorBoundary /> },
          { path: 'categories/:slug', element: <CategoryPage />, errorElement: <RouteErrorBoundary /> },
          { path: 'search', element: <SearchResultsPage />, errorElement: <RouteErrorBoundary /> },
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
          <RoleGuard role={['BUYER', 'VENDOR', 'ADMIN']}>
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
          { path: 'save2own', element: <Save2OwnGoalsPage /> },
          { path: 'reviews', element: <MyReviewsPage /> },
          { path: 'refunds', element: <RefundRequestPage /> },
          { path: 'refunds/:id', element: <RefundDetailPage /> },
          { path: 'notifications', element: <NotificationsPage /> },
          { path: 'rentals', element: <MyRentalsPage /> },
          { path: 'addresses', element: <AddressesPage /> },
          { path: 'payment-methods', element: <PaymentMethodsPage /> },
          { path: 'settings', element: <AccountSettingsPage /> },
          { path: 'security', element: <SecuritySettingsPage /> },
        ],
      },

      // ---- Vendor Dashboard (Phase 7 — Merchant Hub) ----
      {
        path: 'vendor/dashboard',
        element: (
          <RoleGuard role={['BUYER', 'VENDOR', 'ADMIN']}>
            <VendorDashboardLayout />
          </RoleGuard>
        ),
        children: [
          { path: '', element: <VendorDashboardOverview /> },
          { path: 'products', element: <VendorProductManager /> },
          { path: 'orders', element: <VendorOrderManager /> },
        ],
      },

      // ---- Save2Own (Phase 6) ----
      {
        path: 'save2own',
        element: (
          <RoleGuard role={['BUYER', 'VENDOR', 'ADMIN']}>
            <Save2OwnCreateGoalPage />
          </RoleGuard>
        ),
      },
      {
        path: 'save2own/goals/:id',
        element: (
          <RoleGuard role={['BUYER', 'VENDOR', 'ADMIN']}>
            <Save2OwnGoalDetailPage />
          </RoleGuard>
        ),
      },

      // ---- Dovi Auto (Phase 10, 11, 12) ----
      { path: 'auto', element: <AutoLandingPage /> },
      { path: 'auto/cars', element: <CarListingsPage /> },
      { path: 'auto/cars/:id', element: <CarDetailPage /> },
      { path: 'auto/parts', element: <PartListingsPage /> },
      { path: 'auto/parts/:id', element: <PartDetailPage /> },
      { path: 'auto/accessories', element: <AccessoryListingsPage /> },
      { path: 'auto/accessories/:id', element: <AccessoryDetailPage /> },
      { path: 'auto/rentals', element: <RentalListingsPage /> },
      { path: 'auto/rentals/:id', element: <RentalDetailPage /> },
      { path: 'auto/rentals/confirmation', element: <RentalConfirmationPage /> },
      {
        path: 'auto/rentals/bookings',
        element: (
          <RoleGuard role={['BUYER', 'VENDOR', 'ADMIN']}>
            <MyRentalsPage />
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
]
}
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
