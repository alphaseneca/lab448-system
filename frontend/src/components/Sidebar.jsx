import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { APP_ROUTES } from '../constants/routes';

export default function Sidebar() {
  const { user, logout, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-secondary border-r border-panel flex flex-col z-50 transition-all duration-300">
      
      {/* Brand & Logo */}
      <div className="p-6 pb-4 border-b border-panel flex items-center gap-3">
        <div className="bg-white rounded-md p-0.5 shadow-glow flex items-center justify-center">
          <img src="/lab448_icon.png" alt="Lab448 Logo" className="w-8 h-8 object-contain" />
        </div>
        <div>
          <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent to-accent-hover tracking-tight" style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--text-primary))',
            WebkitBackgroundClip: 'text',
          }}>
            Lab448
          </h1>
          <p className="text-xs text-muted font-medium uppercase tracking-wider">Repair System</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1 custom-scrollbar">
        
        <div className="text-xs font-bold text-muted uppercase tracking-wider mt-2 mb-2 px-2">Core</div>

        {/* Dashboard mapping based on role defaults */}
        <SidebarLink to="/dashboard" icon="dashboard" label="Dashboard" />

        {hasPermission('REPAIR_VIEW') && (
          <SidebarLink to={APP_ROUTES.REPAIR_ORDERS_LIST} icon="build" label="Repair Orders" />
        )}

        {hasPermission('REPAIR_VIEW') && (
          <SidebarLink to={APP_ROUTES.REPAIR_ORDERS_QUEUE} icon="pending_actions" label="Queue Board" />
        )}
        
        {(hasPermission('MANAGE_BILLING') || hasPermission('TAKE_PAYMENT')) && (
          <SidebarLink to={APP_ROUTES.DASHBOARD_FINANCE} icon="receipt_long" label="Billing & Payments" />
        )}

        <div className="text-xs font-bold text-muted uppercase tracking-wider mt-6 mb-2 px-2">Directory</div>

        {(hasPermission('VIEW_DASHBOARD') || hasPermission('INTAKE_REPAIR')) && (
          <SidebarLink to={APP_ROUTES.CUSTOMERS} icon="groups" label="Customers" />
        )}

        {hasPermission('MANAGE_INVENTORY') && (
          <SidebarLink to={APP_ROUTES.INVENTORY} icon="inventory_2" label="Inventory" />
        )}

        {hasPermission('MANAGE_STAFF') && (
          <SidebarLink to={APP_ROUTES.USERS} icon="manage_accounts" label="Staff & Roles" />
        )}
        
      </nav>

      {/* User Profile Widget */}
      <div className="p-4 border-t border-panel bg-gradient-to-t from-black/20 to-transparent">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-accent-primary to-accent-secondary text-white font-bold shadow-glow">
            {user?.fullName?.charAt(0)?.toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-bold text-primary truncate">{user?.fullName}</div>
            <div className="text-xs text-muted truncate">{user?.roleName}</div>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded text-sm font-medium text-danger hover:bg-danger-bg transition-colors"
        >
          <span className="material-symbols-rounded icon-sm">logout</span>
          Sign Out
        </button>
      </div>

    </aside>
  );
}

function SidebarLink({ to, icon, label }) {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to) && (to !== '/dashboard' || location.pathname === '/dashboard');

  return (
    <NavLink
      to={to}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
        isActive 
          ? 'bg-accent-primary/15 text-accent-primary border-r-2 border-accent-primary' 
          : 'text-text-secondary hover:text-text-primary hover:bg-surface'
      }`}
      style={isActive ? { background: 'rgba(0, 174, 239, 0.15)', color: 'var(--accent-primary)', borderRight: '3px solid var(--accent-primary)' } : {}}
    >
      <span className="material-symbols-rounded icon-sm" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
      {label}
    </NavLink>
  );
}
