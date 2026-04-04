/**
 * APP_ROUTES — Single source of truth for all frontend navigation paths.
 * Keep in sync with App.jsx route definitions.
 */
export const APP_ROUTES = {
  // Auth
  LOGIN: '/login',

  // Dashboards
  DASHBOARD: '/dashboard',
  DASHBOARD_ADMIN: '/dashboard/admin',
  DASHBOARD_TECHNICIAN: '/dashboard/technician',
  DASHBOARD_FRONT_DESK: '/dashboard/front-desk',
  DASHBOARD_LOGISTICS: '/dashboard/logistics',
  DASHBOARD_FINANCE: '/dashboard/finance',
  DASHBOARD_MANAGER: '/dashboard/manager',
  DASHBOARD_BILLING_PAYMENTS: '/dashboard/billing-payments',

  // Repair Orders (/api/repair-orders)
  REPAIR_ORDERS: '/repair-orders',
  REPAIR_ORDERS_LIST: '/repair-orders/list',
  REPAIR_ORDERS_QUEUE: '/repair-orders/queue',
  NEW_REPAIR_ORDER: '/repair-orders/new',
  REPAIR_ORDER_DETAILS: (id = ':id') => `/repair-orders/${id}`,
  REPAIR_ORDER_BILLING: (id = ':id') => `/repair-orders/${id}/billing`,

  // QR Scanner
  QR_SCAN: '/qr-scan',

  // Customer Directory (/api/customers)
  CUSTOMERS: '/customers',
  NEW_CUSTOMER: '/customers/new',
  CUSTOMER_DETAILS: (id = ':id') => `/customers/${id}`,

  // Inventory (/api/inventory)
  INVENTORY: '/inventory',

  // Staff & Roles (/api/auth/staff)
  USERS: '/users',
};
