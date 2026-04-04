import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import { APP_ROUTES } from './constants/routes';
import { PERMISSIONS, ROLES } from './constants/constants';

// Pages
import Login from './pages/Login';
import DashboardRouter from './pages/DashboardRouter';
import RepairsList from './pages/RepairsList';
import RepairOrdersQueuePage from './pages/RepairOrdersQueuePage';
import IntakePage from './pages/IntakePage';
import RepairWorkspace from './pages/RepairWorkspace';
import BillingPage from './pages/BillingPage';
import QrScanPage from './pages/QrScanPage';
import CustomersPage from './pages/CustomersPage';
import NewCustomerPage from './pages/NewCustomerPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import InventoryPage from './pages/InventoryPage';
import UsersPage from './pages/UsersPage';

// Dashboards
import AdminDashboard from './pages/dashboards/AdminDashboard';
import TechnicianDashboard from './pages/dashboards/TechnicianDashboard';
import FrontDeskDashboard from './pages/dashboards/FrontDeskDashboard';
import LogisticsDashboard from './pages/dashboards/LogisticsDashboard';
import FinanceDashboard from './pages/dashboards/FinanceDashboard';
import ManagerDashboard from './pages/dashboards/ManagerDashboard';
import BillingPaymentsDashboard from './pages/dashboards/BillingPaymentsDashboard';

/**
 * ProtectedRoute — guards a route by:
 *   1. Authentication (always)
 *   2. Optional permission check (requiredPermission)
 *   3. Optional role check (requiredRole)
 * Wraps content in <Layout> automatically.
 */
const ProtectedRoute = ({ children, requiredPermission, requiredRole }) => {
  const { user, loading, hasPermission, hasRole, isAdmin } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-primary">
      <span className="material-symbols-rounded icon-lg animate-spin text-accent-primary">refresh</span>
    </div>
  );

  if (!user) return <Navigate to={APP_ROUTES.LOGIN} replace />;

  // Admins bypass all permission/role gates
  if (!isAdmin?.() && user?.roleCode !== ROLES.ADMIN) {
    if (requiredPermission && !hasPermission(requiredPermission)) {
      return <Navigate to={APP_ROUTES.DASHBOARD} replace />;
    }
    if (requiredRole && !hasRole(requiredRole)) {
      return <Navigate to={APP_ROUTES.DASHBOARD} replace />;
    }
  }

  return <Layout>{children}</Layout>;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Auth */}
      <Route
        path={APP_ROUTES.LOGIN}
        element={user ? <Navigate to={APP_ROUTES.DASHBOARD} replace /> : <Login />}
      />

      {/* Dashboards */}
      <Route path={APP_ROUTES.DASHBOARD} element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
      <Route path={APP_ROUTES.DASHBOARD_ADMIN} element={<ProtectedRoute requiredRole={ROLES.ADMIN}><AdminDashboard /></ProtectedRoute>} />
      <Route path={APP_ROUTES.DASHBOARD_TECHNICIAN} element={<ProtectedRoute requiredRole={ROLES.TECHNICIAN}><TechnicianDashboard /></ProtectedRoute>} />
      <Route path={APP_ROUTES.DASHBOARD_FRONT_DESK} element={<ProtectedRoute requiredRole={ROLES.FRONT_DESK}><FrontDeskDashboard /></ProtectedRoute>} />
      <Route path={APP_ROUTES.DASHBOARD_LOGISTICS} element={<ProtectedRoute requiredRole={ROLES.LOGISTICS}><LogisticsDashboard /></ProtectedRoute>} />
      <Route path={APP_ROUTES.DASHBOARD_FINANCE} element={<ProtectedRoute requiredRole={ROLES.FINANCE}><FinanceDashboard /></ProtectedRoute>} />
      <Route path={APP_ROUTES.DASHBOARD_MANAGER} element={<ProtectedRoute requiredRole={ROLES.MANAGER}><ManagerDashboard /></ProtectedRoute>} />
      <Route path={APP_ROUTES.DASHBOARD_BILLING_PAYMENTS} element={<ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_BILLING}><BillingPaymentsDashboard /></ProtectedRoute>} />

      {/* Repair Orders  (/api/repair-orders) */}
      <Route path={APP_ROUTES.NEW_REPAIR_ORDER} element={<ProtectedRoute requiredPermission={PERMISSIONS.REPAIR_CREATE}><IntakePage /></ProtectedRoute>} />
      <Route path={APP_ROUTES.REPAIR_ORDERS_LIST} element={<ProtectedRoute requiredPermission={PERMISSIONS.REPAIR_VIEW}><RepairsList /></ProtectedRoute>} />
      <Route path={APP_ROUTES.REPAIR_ORDERS_QUEUE} element={<ProtectedRoute requiredPermission={PERMISSIONS.REPAIR_VIEW}><RepairOrdersQueuePage /></ProtectedRoute>} />
      <Route path={APP_ROUTES.REPAIR_ORDER_DETAILS()} element={<ProtectedRoute requiredPermission={PERMISSIONS.REPAIR_VIEW}><RepairWorkspace /></ProtectedRoute>} />
      <Route path={APP_ROUTES.REPAIR_ORDER_BILLING()} element={<ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_BILLING}><BillingPage /></ProtectedRoute>} />

      {/* QR Scanner */}
      <Route path={APP_ROUTES.QR_SCAN} element={<ProtectedRoute requiredPermission={PERMISSIONS.REPAIR_VIEW}><QrScanPage /></ProtectedRoute>} />

      {/* Customer Directory (/api/customers) */}
      <Route path={APP_ROUTES.CUSTOMERS} element={<ProtectedRoute requiredPermission={PERMISSIONS.CUSTOMER_VIEW}><CustomersPage /></ProtectedRoute>} />
      <Route path={APP_ROUTES.NEW_CUSTOMER} element={<ProtectedRoute requiredPermission={PERMISSIONS.CUSTOMER_EDIT}><NewCustomerPage /></ProtectedRoute>} />
      <Route path={APP_ROUTES.CUSTOMER_DETAILS()} element={<ProtectedRoute requiredPermission={PERMISSIONS.CUSTOMER_VIEW}><CustomerDetailPage /></ProtectedRoute>} />

      {/* Inventory (/api/inventory) */}
      <Route path={APP_ROUTES.INVENTORY} element={<ProtectedRoute requiredPermission={PERMISSIONS.INVENTORY_MANAGE}><InventoryPage /></ProtectedRoute>} />

      {/* Staff & Roles (/api/auth/staff) */}
      <Route path={APP_ROUTES.USERS} element={<ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_STAFF}><UsersPage /></ProtectedRoute>} />

      {/* Fallbacks */}
      <Route path="/" element={<Navigate to={APP_ROUTES.DASHBOARD} replace />} />
      <Route path="*" element={<Navigate to={APP_ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
