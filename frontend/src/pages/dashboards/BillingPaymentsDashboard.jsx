import React from 'react';
import { APP_ROUTES } from '../../constants/routes';
import RoleDashboardBase from './RoleDashboardBase';

export default function BillingPaymentsDashboard() {
  return (
    <RoleDashboardBase
      title="Billing & Payments"
      subtitle="Revenue, collections, outstanding invoices and payment records."
      endpoint="/dashboard/finance"
      metricsBuilder={(data) => {
        const fin = data?.finance_summary || data?.summary || {};
        return [
          {
            label: 'Revenue Today',
            value: `Rs. ${Number(fin.revenue_today || fin.today_revenue || 0).toFixed(2)}`,
            icon: 'payments',
          },
          {
            label: 'Total Outstanding',
            value: `Rs. ${Number(fin.total_outstanding || fin.outstanding_due || 0).toFixed(2)}`,
            icon: 'account_balance_wallet',
          },
          {
            label: 'Invoices This Month',
            value: fin.invoices_this_month ?? fin.monthly_invoices ?? '—',
            icon: 'receipt_long',
          },
          {
            label: 'Payments Today',
            value: fin.payments_today ?? '—',
            icon: 'point_of_sale',
          },
        ];
      }}
      actions={[
        { to: APP_ROUTES.REPAIR_ORDERS_LIST, label: 'All Repair Orders' },
        { to: APP_ROUTES.CUSTOMERS, label: 'Customer Directory' },
        { to: APP_ROUTES.DASHBOARD_FINANCE, label: 'Finance Overview' },
      ]}
    />
  );
}
