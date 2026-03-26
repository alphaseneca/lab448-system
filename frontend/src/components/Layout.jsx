import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FiHome, FiUsers, FiTool, FiBox, FiDollarSign, FiLogOut } from 'react-icons/fi';

export default function Layout({ children }) {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div>
          <div className="sidebar-logo">Lab448 System</div>
          <nav className="flex flex-col">
            <NavLink to="/dashboard" className="nav-item" end>
              <FiHome /> Dashboard
            </NavLink>
            
            {hasPermission('repair:view') && (
              <NavLink to="/repairs" className="nav-item">
                <FiTool /> Repairs
              </NavLink>
            )}
            
            {hasPermission('customer:view') && (
              <NavLink to="/customers" className="nav-item">
                <FiUsers /> Customers
              </NavLink>
            )}

            {hasPermission('inventory:view') && (
              <NavLink to="/inventory" className="nav-item">
                <FiBox /> Inventory
              </NavLink>
            )}

            {hasPermission('billing:manage') && (
              <NavLink to="/billing" className="nav-item">
                <FiDollarSign /> Billing
              </NavLink>
            )}
          </nav>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
          <div className="text-sm font-medium" style={{ padding: '0 1rem 1rem', color: 'var(--text-primary)' }}>
            {user?.name || user?.email}
            <div className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>Role: {user?.roleCode}</div>
          </div>
          <button 
            type="button" 
            onClick={handleLogout} 
            className="nav-item" 
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
          >
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
