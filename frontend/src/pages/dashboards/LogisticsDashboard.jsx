import React from 'react';
import { APP_ROUTES } from '../../constants/routes';
import RoleDashboardBase from './RoleDashboardBase';

export default function LogisticsDashboard() {
  return (
    <RoleDashboardBase
      title="Logistics Dashboard"
      subtitle="Inventory health and parts movement for active jobs."
      endpoint="/dashboard/logistics"
      metricsBuilder={(data) => {
        const overview = data?.inventory_overview || {};
        return [
          { label: 'Total Items', value: overview.total_items ?? 0, icon: '📦' },
          { label: 'Inventory Value', value: `Rs. ${Number(overview.total_value || 0).toFixed(2)}`, icon: '💎' },
          { label: 'Low Stock Items', value: overview.low_stock_items?.length ?? 0, icon: '⚠️' },
          { label: 'Recent Usage', value: data?.recent_usages?.length ?? 0, icon: '🧾' },
        ];
      }}
      actions={[
        { to: APP_ROUTES.INVENTORY, label: 'Manage Inventory' },
        { to: APP_ROUTES.REPAIR_ORDERS_QUEUE, label: 'Queue Board' },
      ]}
    />
  );
}
