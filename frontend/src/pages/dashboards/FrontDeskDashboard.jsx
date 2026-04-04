import React from 'react';
import { APP_ROUTES } from '../../constants/routes';
import RoleDashboardBase from './RoleDashboardBase';

export default function FrontDeskDashboard() {
  return (
    <RoleDashboardBase
      title="Front Desk Dashboard"
      subtitle="Intake, customer handoff, and delivery tracking."
      endpoint="/dashboard/front-desk"
      metricsBuilder={(data) => {
        const today = data?.today_stats || {};
        const month = data?.current_month_stats || {};
        return [
          { label: 'New Intakes', value: today.new_intakes ?? 0, icon: '📥' },
          { label: 'Pending Deliveries', value: today.pending_deliveries ?? 0, icon: '📦' },
          { label: 'Customers Served', value: today.total_customers_served ?? 0, icon: '👤' },
          { label: 'Month Revenue', value: `Rs. ${Number(month.revenue_collected || 0).toFixed(2)}`, icon: '💰' },
        ];
      }}
      actions={[
        { to: APP_ROUTES.NEW_REPAIR_ORDER, label: 'New Repair Intake' },
        { to: APP_ROUTES.REPAIR_ORDERS_LIST, label: 'Open Repair Orders' },
        { to: APP_ROUTES.CUSTOMERS, label: 'Customers' },
      ]}
    />
  );
}
