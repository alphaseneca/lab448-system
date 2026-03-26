import React from 'react';
import { APP_ROUTES } from '../../constants/routes';
import RoleDashboardBase from './RoleDashboardBase';

export default function ManagerDashboard() {
  return (
    <RoleDashboardBase
      title="Manager Dashboard"
      subtitle="Operational bottlenecks, team load, and throughput."
      endpoint="/dashboard/manager"
      metricsBuilder={(data) => {
        const ops = data?.operations_overview || {};
        const metrics = data?.performance_metrics || {};
        return [
          { label: 'Active Repairs', value: ops.active_repairs ?? 0, icon: '🔧' },
          { label: 'Completed (Month)', value: metrics.month_completed ?? 0, icon: '✅' },
          { label: 'Avg Turnaround (hrs)', value: Number(metrics.avg_turnaround_hours || 0).toFixed(1), icon: '⏱️' },
          { label: 'Bottlenecks', value: data?.bottlenecks?.length ?? 0, icon: '🚨' },
        ];
      }}
      actions={[
        { to: APP_ROUTES.REPAIR_ORDERS_QUEUE, label: 'Queue Board' },
        { to: APP_ROUTES.USERS, label: 'Staff & Roles' },
        { to: APP_ROUTES.REPAIR_ORDERS_LIST, label: 'Repair Orders' },
      ]}
    />
  );
}
