import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { AdminAuthGuard } from '@/components/guards/AdminAuthGuard';
import AdminLayout from '@/components/layout/AdminLayout';

// Pages
import LoginPage from '@/pages/LoginPage';
import DashboardOverviewPage from '@/pages/DashboardOverviewPage';
import UsersPage from '@/pages/UsersPage';
import VendorsPage from '@/pages/VendorsPage';
import ProductsPage from '@/pages/ProductsPage';
import CategoriesPage from '@/pages/CategoriesPage';
import OrdersPage from '@/pages/OrdersPage';
import PaymentsPage from '@/pages/PaymentsPage';
import RefundsPage from '@/pages/RefundsPage';
import ReviewsPage from '@/pages/ReviewsPage';
import AuditLogsPage from '@/pages/AuditLogsPage';

import HomepageManagerPage from '@/pages/Homepage/HomepageManagerPage';
import Save2OwnGoalsPage from '@/pages/Save2Own/Save2OwnGoalsPage';
import Save2OwnGoalDetailPage from '@/pages/Save2Own/Save2OwnGoalDetailPage';
import AutoListingsPage from '@/pages/Auto/AutoListingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
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
            <Route path="save2own" element={<Save2OwnGoalsPage />} />
            <Route path="save2own/:id" element={<Save2OwnGoalDetailPage />} />
            <Route path="auto" element={<AutoListingsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="vendors" element={<VendorsPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="refunds" element={<RefundsPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
          </Route>
        </Routes>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </AdminAuthProvider>
    </BrowserRouter>
  );
}
