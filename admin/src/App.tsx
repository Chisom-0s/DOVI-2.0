import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { AdminAuthGuard } from '@/components/guards/AdminAuthGuard';
import AdminLayout from '@/components/layout/AdminLayout';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import AdminRouteLoader from '@/components/common/AdminRouteLoader';

// Code-split route pages: loaded on demand to minimize bundle size and speed up transitions
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardOverviewPage = lazy(() => import('@/pages/DashboardOverviewPage'));
const UsersPage = lazy(() => import('@/pages/UsersPage'));
const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'));
const OrdersPage = lazy(() => import('@/pages/OrdersPage'));
const DeliveryManagementPage = lazy(() => import('@/pages/DeliveryManagementPage'));
const PaymentsPage = lazy(() => import('@/pages/PaymentsPage'));
const RefundsPage = lazy(() => import('@/pages/RefundsPage'));
const ReviewsPage = lazy(() => import('@/pages/ReviewsPage'));
const AuditLogsPage = lazy(() => import('@/pages/AuditLogsPage'));

const HomepageManagerPage = lazy(() => import('@/pages/Homepage/HomepageManagerPage'));
const GiveawayManagerPage = lazy(() => import('@/pages/Promotions/GiveawayManagerPage'));
const Save2OwnDashboardPage = lazy(() => import('@/pages/Save2Own/Save2OwnDashboardPage'));
const Save2OwnGoalsPage = lazy(() => import('@/pages/Save2Own/Save2OwnGoalsPage'));
const Save2OwnGoalDetailPage = lazy(() => import('@/pages/Save2Own/Save2OwnGoalDetailPage'));
const Save2OwnContributionsPage = lazy(() => import('@/pages/Save2Own/Save2OwnContributionsPage'));
const Save2OwnParticipantsPage = lazy(() => import('@/pages/Save2Own/Save2OwnParticipantsPage'));
const Save2OwnRefundsPage = lazy(() => import('@/pages/Save2Own/Save2OwnRefundsPage'));
const PaymentAccountsPage = lazy(() => import('@/pages/PaymentAccounts/PaymentAccountsPage'));
const EmailManagementPage = lazy(() => import('@/pages/EmailManagementPage'));

export default function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <ErrorBoundary>
          <Suspense fallback={<AdminRouteLoader />}>
            <Routes>
              {/* Public login route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected admin routing group */}
              <Route
                path="/"
                element={
                  <AdminAuthGuard>
                    <AdminLayout />
                  </AdminAuthGuard>
                }
              >
                <Route index element={<DashboardOverviewPage />} />
                <Route path="homepage" element={<HomepageManagerPage />} />
                <Route path="giveaway" element={<GiveawayManagerPage />} />
                <Route path="promotions" element={<GiveawayManagerPage />} />
                <Route path="save2own/dashboard" element={<Save2OwnDashboardPage />} />
                <Route path="save2own" element={<Save2OwnGoalsPage />} />
                <Route path="save2own/contributions" element={<Save2OwnContributionsPage />} />
                <Route path="save2own/participants" element={<Save2OwnParticipantsPage />} />
                <Route path="save2own/refunds" element={<Save2OwnRefundsPage />} />
                <Route path="save2own/:id" element={<Save2OwnGoalDetailPage />} />
                <Route path="payment-accounts" element={<PaymentAccountsPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="delivery" element={<DeliveryManagementPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="refunds" element={<RefundsPage />} />
                <Route path="reviews" element={<ReviewsPage />} />
                <Route path="audit-logs" element={<AuditLogsPage />} />
                <Route path="emails" element={<EmailManagementPage />} />
              </Route>
            </Routes>
          </Suspense>
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </ErrorBoundary>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}
