import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { APP_ROUTES } from '../constants/routes';
import { ROLES } from '../constants/constants';
import AdminDashboard from './dashboards/AdminDashboard';
import TechnicianDashboard from './dashboards/TechnicianDashboard';
import FrontDeskDashboard from './dashboards/FrontDeskDashboard';
import LogisticsDashboard from './dashboards/LogisticsDashboard';
import FinanceDashboard from './dashboards/FinanceDashboard';
import ManagerDashboard from './dashboards/ManagerDashboard';

export default function DashboardRouter() {
  const { user } = useAuth();

  if (!user?.roleCode) {
    return <Navigate to={APP_ROUTES.LOGIN} replace />;
  }

  if (user.roleCode === ROLES.ADMIN) return <AdminDashboard />;
  if (user.roleCode === ROLES.TECHNICIAN) return <TechnicianDashboard />;
  if (user.roleCode === ROLES.FRONT_DESK) return <FrontDeskDashboard />;
  if (user.roleCode === ROLES.LOGISTICS) return <LogisticsDashboard />;
  if (user.roleCode === ROLES.FINANCE) return <FinanceDashboard />;
  if (user.roleCode === ROLES.MANAGER) return <ManagerDashboard />;

  return <AdminDashboard />;
}
