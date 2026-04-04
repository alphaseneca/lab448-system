import React from 'react';
import { APP_ROUTES } from '../../constants/routes';
import RoleDashboardBase from './RoleDashboardBase';

export default function AdminDashboard() {
  return (
    <RoleDashboardBase
      title="Admin Dashboard"
      subtitle="System-wide overview and role navigation."
      endpoint="/dashboard/admin"
      metricsBuilder={(data) => {
        const sys = data?.system_overview || {};
        return [
          { label: 'Total Repair Orders', value: sys.total_repairs ?? 0, icon: '🔧' },
          { label: 'Active Users', value: sys.active_users ?? 0, icon: '👥' },
          { label: 'Revenue', value: `Rs. ${Number(sys.total_revenue || 0).toFixed(2)}`, icon: '💰' },
          { label: 'Roles Configured', value: data?.configuration_status?.roles_configured ?? 0, icon: '🛡️' },
        ];
      }}
      actions={[
        { to: APP_ROUTES.DASHBOARD_TECHNICIAN, label: 'Technician View' },
        { to: APP_ROUTES.DASHBOARD_FRONT_DESK, label: 'Front Desk View' },
        { to: APP_ROUTES.DASHBOARD_LOGISTICS, label: 'Logistics View' },
        { to: APP_ROUTES.DASHBOARD_FINANCE, label: 'Finance View' },
        { to: APP_ROUTES.DASHBOARD_MANAGER, label: 'Manager View' },
      ]}
    />
  );
}
