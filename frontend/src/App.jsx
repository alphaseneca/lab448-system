import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import DashboardRouter from './pages/DashboardRouter';
import RepairsList from './pages/RepairsList';
import IntakePage from './pages/IntakePage';
import RepairWorkspace from './pages/RepairWorkspace';
import BillingPage from './pages/BillingPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="app-container items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return <Layout>{children}</Layout>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <Routes>
            <Route path="/dashboard" element={<DashboardRouter />} />
            <Route path="/repairs" element={<RepairsList />} />
            <Route path="/repairs/new" element={<IntakePage />} />
            <Route path="/repairs/:id" element={<RepairWorkspace />} />
            <Route path="/billing" element={<BillingPage />} />
            {/* Additional routes will be added here */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </ProtectedRoute>
      } />
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
