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
    >
      {(data) => {
        const rolesDist = data?.user_management_summary?.roles_distribution || {};
        const config = data?.configuration_status || {};
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="card flex flex-col gap-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-rounded text-accent-primary">bar_chart</span> Roles Distribution
              </h2>
              {Object.keys(rolesDist).length === 0 ? (
                <p className="text-secondary text-sm">No data available.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {Object.entries(rolesDist).map(([role, count]) => (
                    <div key={role} className="flex justify-between items-center py-2 border-b border-panel last:border-0">
                      <span className="text-sm font-medium">{role}</span>
                      <span className="badge badge-neutral">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="card flex flex-col gap-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-rounded text-accent-primary">settings</span> Configuration Status
              </h2>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between py-2 border-b border-panel">
                  <span className="text-secondary">Roles Configured</span>
                  <span className="font-semibold text-text-primary">{config.roles_configured ?? '—'}</span>
                </div>
                <div className="flex justify-between py-2 last:border-0">
                  <span className="text-secondary">System Status</span>
                  <span className="text-green-400 font-semibold flex items-center gap-1.5 animate-fade-in">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      }}
    </RoleDashboardBase>
  );
}
