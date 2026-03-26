import React from 'react';
import { APP_ROUTES } from '../../constants/routes';
import RoleDashboardBase from './RoleDashboardBase';

export default function FinanceDashboard() {
  return (
    <RoleDashboardBase
      title="Finance Dashboard"
      subtitle="Revenue tracking, due balances, and payment visibility."
      endpoint="/dashboard/finance"
      metricsBuilder={(data) => {
        const month = data?.current_month || {};
        return [
          { label: 'Today Collections', value: `₹${Number(data?.today_collections || 0).toFixed(2)}`, icon: '📅' },
          { label: 'Month Revenue', value: `₹${Number(month.total_revenue || 0).toFixed(2)}`, icon: '📊' },
          { label: 'Outstanding', value: `₹${Number(month.outstanding_payments || 0).toFixed(2)}`, icon: '⏳' },
          { label: 'Recent Payments', value: data?.recent_payments?.length ?? 0, icon: '💳' },
        ];
      }}
      actions={[
        { to: APP_ROUTES.CUSTOMERS, label: 'Billing & Payments' },
        { to: APP_ROUTES.REPAIR_ORDERS_LIST, label: 'Repair Orders' },
      ]}
    />
  );
}
