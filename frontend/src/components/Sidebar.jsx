import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { APP_ROUTES } from '../constants/routes';
import { PERMISSIONS, ROLES } from '../constants/constants';

function SidebarLink({ to, icon, label, exact = false }) {
  const location = useLocation();
  const isActive = exact
    ? location.pathname === to
    : location.pathname.startsWith(to) && (to !== '/dashboard' || location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/'));

  return (
    <NavLink
      to={to}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'text-accent-primary'
          : 'text-text-secondary hover:text-text-primary hover:bg-surface'
      }`}
      style={isActive ? {
        background: 'rgba(0, 174, 239, 0.12)',
        color: 'var(--accent-primary)',
        borderRight: '3px solid var(--accent-primary)',
      } : {}}
    >
      <span className="material-symbols-rounded icon-sm" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
        {icon}
      </span>
      {label}
    </NavLink>
  );
}

function NavSection({ label }) {
  return (
    <div className="text-xs font-bold text-muted uppercase tracking-wider mt-5 mb-2 px-3 first:mt-2">
      {label}
    </div>
  );
}

export default function Sidebar() {
  const { user, logout, hasPermission, hasRole, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const admin = isAdmin?.() ?? (user?.roleCode === ROLES.ADMIN);

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-secondary/80 backdrop-blur-3xl border-r border-panel flex flex-col z-50 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">

      {/* Brand */}
      <div className="p-6 pb-5 border-b border-panel flex items-center gap-4">
        <div className="bg-white rounded-md p-1 shadow-glow flex items-center justify-center">
          <img src="/lab448_icon.png" alt="Lab448" className="w-8 h-8 object-contain" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold tracking-tight" style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--text-primary))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Lab448
          </h1>
          <p className="text-xs text-muted font-medium uppercase tracking-wider">Repair System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 flex flex-col custom-scrollbar">

        {/* ── Core ── */}
        <NavSection label="Core" />
        <SidebarLink to={APP_ROUTES.DASHBOARD} icon="dashboard" label="Dashboard" />

        {(admin || hasPermission(PERMISSIONS.REPAIR_CREATE)) && (
          <SidebarLink to={APP_ROUTES.NEW_REPAIR_ORDER} icon="add_circle" label="New Intake" exact />
        )}

        {(admin || hasPermission(PERMISSIONS.REPAIR_VIEW)) && (
          <SidebarLink to={APP_ROUTES.REPAIR_ORDERS_LIST} icon="build_circle" label="Repair Orders" />
        )}

        {(admin || hasPermission(PERMISSIONS.REPAIR_VIEW)) && (
          <SidebarLink to={APP_ROUTES.REPAIR_ORDERS_QUEUE} icon="pending_actions" label="Queue Board" />
        )}

        {(admin || hasPermission(PERMISSIONS.REPAIR_VIEW)) && (
          <SidebarLink to={APP_ROUTES.QR_SCAN} icon="qr_code_scanner" label="QR Scanner" />
        )}

        {/* ── Finance ── */}
        {(admin || hasPermission(PERMISSIONS.MANAGE_BILLING)) && (
          <>
            <NavSection label="Finance" />
            <SidebarLink to={APP_ROUTES.DASHBOARD_BILLING_PAYMENTS} icon="receipt_long" label="Billing & Payments" />
          </>
        )}

        {/* ── Directory ── */}
        <NavSection label="Directory" />

        {(admin || hasPermission(PERMISSIONS.CUSTOMER_VIEW) || hasPermission(PERMISSIONS.REPAIR_VIEW)) && (
          <SidebarLink to={APP_ROUTES.CUSTOMERS} icon="groups" label="Customers" />
        )}

        {(admin || hasPermission(PERMISSIONS.INVENTORY_MANAGE)) && (
          <SidebarLink to={APP_ROUTES.INVENTORY} icon="inventory_2" label="Inventory" />
        )}

        {(admin || hasPermission(PERMISSIONS.MANAGE_STAFF)) && (
          <SidebarLink to={APP_ROUTES.USERS} icon="manage_accounts" label="Staff & Roles" />
        )}

        {/* ── Admin Dashboards ── */}
        {admin && (
          <>
            <NavSection label="Admin Access" />
            <SidebarLink to={APP_ROUTES.DASHBOARD_ADMIN} icon="admin_panel_settings" label="Admin Overview" />
            <SidebarLink to={APP_ROUTES.DASHBOARD_TECHNICIAN} icon="build" label="Technician View" />
            <SidebarLink to={APP_ROUTES.DASHBOARD_FRONT_DESK} icon="support_agent" label="Front Desk View" />
            <SidebarLink to={APP_ROUTES.DASHBOARD_LOGISTICS} icon="local_shipping" label="Logistics View" />
            <SidebarLink to={APP_ROUTES.DASHBOARD_FINANCE} icon="account_balance" label="Finance View" />
            <SidebarLink to={APP_ROUTES.DASHBOARD_MANAGER} icon="bar_chart" label="Manager View" />
          </>
        )}

      </nav>

      {/* User widget */}
      <div className="p-4 border-t border-panel" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.2), transparent)' }}>
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm text-white shadow-glow"
            style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}>
            {user?.fullName?.charAt(0)?.toUpperCase()}
          </div>
          <div className="overflow-hidden flex-1">
            <div className="text-sm font-bold text-primary truncate">{user?.fullName}</div>
            <div className="text-xs truncate flex items-center gap-1">
              {admin ? (
                <span className="text-accent-primary font-semibold">Full System Access</span>
              ) : (
                <span className="text-muted">{user?.roleName}</span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors hover:bg-surface"
          style={{ color: '#f87171' }}
        >
          <span className="material-symbols-rounded icon-sm">logout</span>
          Sign Out
        </button>
      </div>

    </aside>
  );
}
