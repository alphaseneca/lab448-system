import React from 'react';
import Sidebar from './Sidebar';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../hooks/useAuth';

export default function Layout({ children }) {
  const { title, subtitle, icon } = usePageTitle();
  const { user } = useAuth();

  return (
    <div className="app-container flex min-h-screen bg-primary">
      <Sidebar />

      <main className="flex-1 ml-64 flex flex-col min-h-screen relative">
        {/* Top Header — Dynamic page title */}
        <header className="h-16 border-b border-panel bg-secondary/50 backdrop-blur-md sticky top-0 z-40 flex items-center px-8 justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-rounded text-accent-primary" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>
              {icon}
            </span>
            <div>
              <div className="text-sm font-bold text-primary leading-tight">{title}</div>
              {subtitle && (
                <div className="text-xs text-muted leading-tight hidden md:block">{subtitle}</div>
              )}
            </div>
          </div>

          {/* Right side — user info */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-primary">{user.fullName}</div>
                <div className="text-xs text-muted">{user.roleName}</div>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-accent-primary to-accent-secondary text-white text-xs font-bold shadow-glow">
                {user.fullName?.charAt(0)?.toUpperCase()}
              </div>
            </div>
          )}
        </header>

        {/* Scrollable Content Wrapper */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
