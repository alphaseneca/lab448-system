import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import DashboardRouter from './pages/DashboardRouter';
import RepairsList from './pages/RepairsList';
import RepairOrdersQueuePage from './pages/RepairOrdersQueuePage';
import IntakePage from './pages/IntakePage';
import RepairWorkspace from './pages/RepairWorkspace';
import BillingPage from './pages/BillingPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import InventoryPage from './pages/InventoryPage';
import UsersPage from './pages/UsersPage';
import { APP_ROUTES } from './constants/routes';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import TechnicianDashboard from './pages/dashboards/TechnicianDashboard';
import FrontDeskDashboard from './pages/dashboards/FrontDeskDashboard';
import LogisticsDashboard from './pages/dashboards/LogisticsDashboard';
import FinanceDashboard from './pages/dashboards/FinanceDashboard';
import ManagerDashboard from './pages/dashboards/ManagerDashboard';

const ProtectedRoute = ({ children, requiredPermission, requiredRole }) => {
  const { user, loading, hasPermission, hasRole } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-primary">
      <span className="material-symbols-rounded icon-lg animate-spin text-accent-primary">refresh</span>
    </div>
  );
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path={APP_ROUTES.LOGIN} element={<Login />} />
      
      {/* Dashboard is the default landing for authenticated users */}
      <Route path={APP_ROUTES.DASHBOARD} element={
        <ProtectedRoute>
          <DashboardRouter />
        </ProtectedRoute>
      } />
      <Route path={APP_ROUTES.DASHBOARD_ADMIN} element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path={APP_ROUTES.DASHBOARD_TECHNICIAN} element={<ProtectedRoute><TechnicianDashboard /></ProtectedRoute>} />
      <Route path={APP_ROUTES.DASHBOARD_FRONT_DESK} element={<ProtectedRoute><FrontDeskDashboard /></ProtectedRoute>} />
      <Route path={APP_ROUTES.DASHBOARD_LOGISTICS} element={<ProtectedRoute><LogisticsDashboard /></ProtectedRoute>} />
      <Route path={APP_ROUTES.DASHBOARD_FINANCE} element={<ProtectedRoute><FinanceDashboard /></ProtectedRoute>} />
      <Route path={APP_ROUTES.DASHBOARD_MANAGER} element={<ProtectedRoute><ManagerDashboard /></ProtectedRoute>} />
      
      {/* Repair Orders */}
      <Route path={APP_ROUTES.REPAIR_ORDERS_LIST} element={
        <ProtectedRoute requiredPermission="repair:view">
          <RepairsList />
        </ProtectedRoute>
      } />

      <Route path={APP_ROUTES.REPAIR_ORDERS_QUEUE} element={
        <ProtectedRoute requiredPermission="repair:view">
          <RepairOrdersQueuePage />
        </ProtectedRoute>
      } />
      
      <Route path={APP_ROUTES.NEW_REPAIR_ORDER} element={
        <ProtectedRoute requiredPermission="repair:create">
          <IntakePage />
        </ProtectedRoute>
      } />
      
      <Route path={APP_ROUTES.REPAIR_ORDER_DETAILS()} element={
        <ProtectedRoute>
          <RepairWorkspace />
        </ProtectedRoute>
      } />

      <Route path={APP_ROUTES.REPAIR_ORDER_BILLING()} element={
        <ProtectedRoute>
          <BillingPage />
        </ProtectedRoute>
      } />

      {/* Directory */}
      <Route path={APP_ROUTES.CUSTOMERS} element={
        <ProtectedRoute>
          <CustomersPage />
        </ProtectedRoute>
      } />

      <Route path={APP_ROUTES.CUSTOMER_DETAILS()} element={
        <ProtectedRoute>
          <CustomerDetailPage />
        </ProtectedRoute>
      } />

      <Route path={APP_ROUTES.INVENTORY} element={
        <ProtectedRoute requiredPermission="inventory:manage">
          <InventoryPage />
        </ProtectedRoute>
      } />

      <Route path={APP_ROUTES.USERS} element={
        <ProtectedRoute requiredPermission="manage:staff">
          <UsersPage />
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="/" element={<Navigate to={APP_ROUTES.DASHBOARD} replace />} />
      <Route path="*" element={<Navigate to={APP_ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
