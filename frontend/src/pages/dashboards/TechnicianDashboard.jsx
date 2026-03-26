import React from 'react';
import { APP_ROUTES } from '../../constants/routes';
import RoleDashboardBase from './RoleDashboardBase';

export default function TechnicianDashboard() {
  return (
    <RoleDashboardBase
      title="Technician Dashboard"
      subtitle="Track active work, queue pressure, and completions."
      endpoint="/dashboard/technician"
      metricsBuilder={(data) => {
        const today = data?.today_stats || {};
        return [
          { label: 'Assigned Repairs', value: today.assigned_repairs ?? data?.assigned_repairs ?? 0, icon: '🧰' },
          { label: 'In Repair', value: today.in_repair ?? data?.in_repair ?? 0, icon: '🔧' },
          { label: 'Ready for Delivery', value: today.ready_for_delivery ?? data?.ready_for_delivery ?? 0, icon: '✅' },
          { label: 'Completed Today', value: today.completed_today ?? data?.completed_today ?? 0, icon: '🏁' },
        ];
      }}
      actions={[
        { to: APP_ROUTES.REPAIR_ORDERS_QUEUE, label: 'Open Queue Board' },
        { to: APP_ROUTES.REPAIR_ORDERS_LIST, label: 'All Repair Orders' },
      ]}
    />
  );
}
