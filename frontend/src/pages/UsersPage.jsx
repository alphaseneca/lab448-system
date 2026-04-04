import React, { useState } from 'react';
import StaffTab from '../components/iam/StaffTab';
import RolesTab from '../components/iam/RolesTab';

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState('STAFF'); // 'STAFF' or 'ROLES'

  return (
    <div className="animate-fade-in flex flex-col gap-6 w-full max-w-6xl mx-auto pb-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold mb-1">Staff & Roles</h1>
        <p className="text-secondary tracking-wide">Manage system administrators, technicians, and their access roles.</p>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-panel mt-2">
        <button
          className={`pb-3 font-bold text-sm tracking-wide transition-colors ${
            activeTab === 'STAFF' 
            ? 'text-accent-primary border-b-2 border-accent-primary' 
            : 'text-muted hover:text-primary'
          }`}
          onClick={() => setActiveTab('STAFF')}
        >
          Staff Directory
        </button>
        <button
          className={`pb-3 font-bold text-sm tracking-wide transition-colors ${
            activeTab === 'ROLES' 
            ? 'text-accent-primary border-b-2 border-accent-primary' 
            : 'text-muted hover:text-primary'
          }`}
          onClick={() => setActiveTab('ROLES')}
        >
          Roles & Permissions
        </button>
      </div>

      {activeTab === 'STAFF' && <StaffTab />}
      {activeTab === 'ROLES' && <RolesTab />}
    </div>
  );
}
