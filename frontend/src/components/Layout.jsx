import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../hooks/useAuth';

export default function Layout({ children }) {
  const { title, subtitle, icon } = usePageTitle();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-container flex min-h-screen bg-primary overflow-x-hidden">
      {/* Backdrop overlay for mobile view */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 ml-0 lg:ml-64 flex flex-col min-h-screen relative w-full overflow-x-hidden">
        {/* Top Header — Dynamic page title */}
        <header className="h-16 border-b border-panel bg-secondary/50 backdrop-blur-md sticky top-0 z-30 flex items-center px-4 md:px-8 justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Burger Menu Button */}
            <button 
              className="lg:hidden btn btn-ghost p-1.5 rounded-md text-text-primary hover:bg-panel"
              onClick={() => setSidebarOpen(true)}
              title="Open Navigation Menu"
            >
              <span className="material-symbols-rounded">menu</span>
            </button>

            <span className="material-symbols-rounded text-accent-primary hidden sm:inline-block" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>
              {icon}
            </span>
            <div>
              <div className="text-sm font-bold text-text-primary leading-tight">{title}</div>
              {subtitle && (
                <div className="text-xs text-muted leading-tight hidden md:block">{subtitle}</div>
              )}
            </div>
          </div>

          {/* Right side — user info */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-text-primary">{user.fullName}</div>
                <div className="text-xs text-muted">{user.roleName}</div>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-accent-primary to-accent-secondary text-white text-xs font-bold shadow-glow">
                {user.fullName?.charAt(0)?.toUpperCase()}
              </div>
            </div>
          )}
        </header>

        {/* Scrollable Content Wrapper */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
