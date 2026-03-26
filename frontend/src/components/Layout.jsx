import React from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="app-container flex min-h-screen bg-primary">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen relative">
        {/* Top Header Placeholder (can add breadcrumbs or global search later) */}
        <header className="h-16 border-b border-panel bg-secondary/50 backdrop-blur-md sticky top-0 z-40 flex items-center px-8 justify-between">
            <div className="text-sm text-secondary font-medium tracking-wide">
              {/* Could be dynamically populated breadcrumbs */}
              Lab448 <span className="mx-2 text-muted">/</span> Dashboard
            </div>
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
