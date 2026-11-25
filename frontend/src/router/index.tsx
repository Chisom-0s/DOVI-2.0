import React from 'react';
import { createBrowserRouter, RouterProvider, Outlet, Navigate, useParams } from 'react-router-dom';
import SmartPromptManager from '@/components/common/SmartPromptManager';
import { PromotionProvider } from '@/contexts/PromotionContext';
import PromotionalPopup from '@/components/common/PromotionalPopup';
import { RouteErrorBoundary } from '@/components/common/ErrorBoundary';
import RouteLoader from '@/components/common/RouteLoader';
import { AuthGuard } from '@/components/guards/AuthGuard';
import { RoleGuard } from '@/components/guards/RoleGuard';

const lazy = (React as any).lazy as <T extends React.ComponentType<any>>(factory: () => Promise<{ default: T }>) => T;
const Suspense = (React as any).Suspense as React.ComponentType<{ fallback?: React.ReactNode; children?: React.ReactNode }>;

// Eagerly loaded core shell components
import MainLayout from '@/components/layout/MainLayout';
import HomePage from '@/pages/Home/HomePage';

// Lazy-loaded Auth pages
const LoginPage = lazy(() => import('@/pages/Auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/Auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/Auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/Auth/ResetPasswordPage'));
const EmailVerificationPage = lazy(() => import('@/pages/Auth/EmailVerificationPage'));

// Lazy-loaded Catalogue & Promotional pages
const ProductListingPage = lazy(() => import('@/pages/Products/ProductListingPage'));
const CategoryPage = lazy(() => import('@/pages/Products/CategoryPage'));
const ProductDetailPage = lazy(() => import('@/pages/Products/Detail/ProductDetailPage'));
const CampaignCollectionPage = lazy(() => import('@/pages/Promotions/CampaignCollectionPage'));

function DynamicOrderRedirect() {
  const { ref } = useParams<{ ref: string }>();
  return <Navigate to={ref ? `/dashboard/orders/${ref}` : '/dashboard/orders'} replace />;
}

// Lazy-loaded Knowledge & Information Pages
const AboutPage = lazy(() => import('@/pages/Info/AboutPage'));
const FAQPage = lazy(() => import('@/pages/Info/FAQPage'));
const ContactPage = lazy(() => import('@/pages/Info/ContactPage'));
const ShippingPolicyPage = lazy(() => import('@/pages/Info/ShippingPolicyPage'));
const ReturnsPolicyPage = lazy(() => import('@/pages/Info/ReturnsPolicyPage'));
const TermsPage = lazy(() => import('@/pages/Info/TermsPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/Info/PrivacyPolicyPage'));

// Lazy-loaded Cart, Checkout, Orders, Payments, Refunds
const CartPage = lazy(() => import('@/pages/Cart/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/Checkout/CheckoutPage'));
const CheckoutSessionPage = lazy(() => import('@/pages/Checkout/CheckoutSessionPage'));
const PaymentSuccessPage = lazy(() => import('@/pages/Payment/PaymentSuccessPage'));
const PaymentFailedPage = lazy(() => import('@/pages/Payment/PaymentFailedPage'));
const OrderConfirmationPage = lazy(() => import('@/pages/Orders/OrderConfirmationPage'));
const OrderHistoryPage = lazy(() => import('@/pages/Orders/OrderHistoryPage'));
const OrderDetailPage = lazy(() => import('@/pages/Orders/OrderDetailPage'));
const RefundRequestPage = lazy(() => import('@/pages/Refunds/RefundRequestPage'));
const RefundDetailPage = lazy(() => import('@/pages/Refunds/RefundDetailPage'));

// Lazy-loaded Buyer Dashboard
const DashboardLayout = lazy(() => import('@/pages/Dashboard/DashboardLayout'));
const DashboardOverviewPage = lazy(() => import('@/pages/Dashboard/DashboardOverviewPage'));
const ProfilePage = lazy(() => import('@/pages/Dashboard/ProfilePage'));
const AddressesPage = lazy(() => import('@/pages/Dashboard/AddressesPage'));
const PaymentMethodsPage = lazy(() => import('@/pages/Dashboard/PaymentMethodsPage'));
const WishlistPage = lazy(() => import('@/pages/Dashboard/WishlistPage'));
const RecentlyViewedPage = lazy(() => import('@/pages/Dashboard/RecentlyViewedPage'));
const MyReviewsPage = lazy(() => import('@/pages/Dashboard/MyReviewsPage'));
const NotificationsPage = lazy(() => import('@/pages/Dashboard/NotificationsPage'));
const AccountSettingsPage = lazy(() => import('@/pages/Dashboard/AccountSettingsPage'));
const SecuritySettingsPage = lazy(() => import('@/pages/Dashboard/SecuritySettingsPage'));

// Lazy-loaded Save2Own
const Save2OwnGoalsPage = lazy(() => import('@/pages/Save2Own/Save2OwnGoalsPage'));
const Save2OwnGoalDetailPage = lazy(() => import('@/pages/Save2Own/Save2OwnGoalDetailPage'));
const Save2OwnCreateGoalPage = lazy(() => import('@/pages/Save2Own/Save2OwnCreateGoalPage'));

// ============================================================
// Router
// ============================================================
const router = createBrowserRouter([
  {
    element: (
      <PromotionProvider>
        <Suspense fallback={<RouteLoader />}>
          <Outlet />
        </Suspense>
        <SmartPromptManager />
        <PromotionalPopup />
      </PromotionProvider>
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
          { path: 'promotions/:slug', element: <CampaignCollectionPage />, errorElement: <RouteErrorBoundary /> },
          { path: 'campaigns/:slug', element: <CampaignCollectionPage />, errorElement: <RouteErrorBoundary /> },
          { path: 'deals', element: <ProductListingPage />, errorElement: <RouteErrorBoundary /> },
          { path: 'search', element: <ProductListingPage />, errorElement: <RouteErrorBoundary /> },
          { path: 'about', element: <AboutPage /> },
          { path: 'faq', element: <FAQPage /> },
          { path: 'contact', element: <ContactPage /> },
          { path: 'shipping', element: <ShippingPolicyPage /> },
          { path: 'returns', element: <ReturnsPolicyPage /> },
          { path: 'terms', element: <TermsPage /> },
          { path: 'privacy', element: <PrivacyPolicyPage /> },

          // ---- Cart & Checkout (Phase 4 — LIVE) ----
          {
            path: 'cart',
            element: <CartPage />,
          },
      {
        path: 'checkout',
        element: <CheckoutPage />,
      },
      {
        path: 'checkout/:id',
        element: (
          <AuthGuard>
            <CheckoutSessionPage />
          </AuthGuard>
        ),
      },

      
      // Order redirect aliases & backward compatibility
      { path: 'orders', element: <Navigate to="/dashboard/orders" replace /> },
      { path: 'order/:ref', element: <DynamicOrderRedirect /> },
      { path: 'profile/orders', element: <Navigate to="/dashboard/orders" replace /> },
      { path: 'profile/orders/:ref', element: <DynamicOrderRedirect /> },

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

      // ---- Customer Dashboard (Phase 5 — LIVE Layout) ----
      {
        path: 'dashboard',
        element: (
          <RoleGuard role={['BUYER', 'ADMIN']}>
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
          { path: 'addresses', element: <AddressesPage /> },
          { path: 'payment-methods', element: <PaymentMethodsPage /> },
          { path: 'settings', element: <AccountSettingsPage /> },
          { path: 'security', element: <SecuritySettingsPage /> },
        ],
      },

      // ---- Save2Own (Phase 6) ----
      {
        path: 'save2own',
        element: <Save2OwnCreateGoalPage />,
      },
      {
        path: 'save2own/goals',
        element: (
          <RoleGuard role={['BUYER', 'ADMIN']}>
            <div className="container" style={{ padding: 'var(--space-6) var(--space-4)', maxWidth: '1200px', margin: '0 auto', minHeight: '60vh' }}>
              <Save2OwnGoalsPage />
            </div>
          </RoleGuard>
        ),
      },
      {
        path: 'save2own/goals/:id',
        element: (
          <RoleGuard role={['BUYER', 'ADMIN']}>
            <Save2OwnGoalDetailPage />
          </RoleGuard>
        ),
      },
      {
        path: 'save2own/:id',
        element: (
          <RoleGuard role={['BUYER', 'ADMIN']}>
            <Save2OwnGoalDetailPage />
          </RoleGuard>
        ),
      },

      // ---- Dovi Auto Redirects to Marketplace ----
      { path: 'auto', element: <Navigate to="/products" replace /> },
      { path: 'auto/*', element: <Navigate to="/products" replace /> },
      { path: 'categories/auto', element: <Navigate to="/products" replace /> },
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
