import { useLocation, useParams } from 'react-router-dom';

/**
 * usePageTitle — maps current route to { title, subtitle, icon }
 * for rendering in the Layout header.
 */
export function usePageTitle() {
  const location = useLocation();
  const pathname = location.pathname;

  // Ordered from most-specific to least-specific
  if (pathname.startsWith('/repair-orders/new')) {
    return { title: 'New Repair Intake', subtitle: 'Register a device for service', icon: 'add_circle' };
  }
  if (pathname.match(/^\/repair-orders\/[^/]+\/billing/)) {
    return { title: 'Invoice & Billing', subtitle: 'Charges, payments and settlement', icon: 'receipt' };
  }
  if (pathname.match(/^\/repair-orders\/[^/]+/)) {
    return { title: 'Repair Workspace', subtitle: 'Case details and status management', icon: 'handyman' };
  }
  if (pathname === '/repair-orders/list' || pathname === '/repair-orders') {
    return { title: 'Repair Orders', subtitle: 'All repair cases and history', icon: 'build_circle' };
  }
  if (pathname === '/repair-orders/queue') {
    return { title: 'Queue Board', subtitle: 'Active repairs awaiting action', icon: 'pending_actions' };
  }
  if (pathname === '/qr-scan') {
    return { title: 'QR Scanner', subtitle: 'Scan device QR code or browse queue', icon: 'qr_code_scanner' };
  }
  if (pathname.match(/^\/customers\/[^/]+/)) {
    return { title: 'Customer Profile', subtitle: 'Contact details and repair history', icon: 'person' };
  }
  if (pathname === '/customers') {
    return { title: 'Customer Directory', subtitle: 'Search and manage customer records', icon: 'groups' };
  }
  if (pathname === '/inventory') {
    return { title: 'Inventory', subtitle: 'Parts, stock levels and movements', icon: 'inventory_2' };
  }
  if (pathname === '/users') {
    return { title: 'Staff & Roles', subtitle: 'Manage team members and access control', icon: 'manage_accounts' };
  }
  if (pathname === '/dashboard/admin') {
    return { title: 'Admin Dashboard', subtitle: 'System-wide overview and configuration', icon: 'admin_panel_settings' };
  }
  if (pathname === '/dashboard/technician') {
    return { title: 'Technician Dashboard', subtitle: 'Assigned repairs and work stats', icon: 'build' };
  }
  if (pathname === '/dashboard/front-desk') {
    return { title: 'Front Desk', subtitle: 'Intakes, deliveries and customer queue', icon: 'desk' };
  }
  if (pathname === '/dashboard/logistics') {
    return { title: 'Logistics', subtitle: 'Inventory health and stock movements', icon: 'local_shipping' };
  }
  if (pathname === '/dashboard/finance') {
    return { title: 'Finance', subtitle: 'Revenue, collections and outstanding invoices', icon: 'account_balance' };
  }
  if (pathname === '/dashboard/manager') {
    return { title: 'Manager Overview', subtitle: 'Operations, staff utilization and bottlenecks', icon: 'bar_chart' };
  }
  if (pathname === '/dashboard/billing-payments') {
    return { title: 'Billing & Payments', subtitle: 'Collections, invoices and payment records', icon: 'receipt_long' };
  }
  if (pathname.startsWith('/dashboard')) {
    return { title: 'Dashboard', subtitle: 'Welcome back', icon: 'dashboard' };
  }

  return { title: 'Lab448', subtitle: '', icon: 'home' };
}
