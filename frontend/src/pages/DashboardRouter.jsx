import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { FiActivity, FiTool, FiCheckCircle, FiClock } from 'react-icons/fi';

export default function DashboardRouter() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/admin');
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">Welcome back, {user?.name || 'User'}</h1>
        <p className="text-secondary">Here's what's happening today.</p>
      </header>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <StatCard 
          icon={<FiTool size={24} color="var(--accent-primary)" />}
          title="Active Repairs"
          value={stats?.totalActive || 0}
        />
        <StatCard 
          icon={<FiClock size={24} color="var(--warning)" />}
          title="Pending Items"
          value={stats?.statusCounts?.PENDING || 0}
        />
        <StatCard 
          icon={<FiCheckCircle size={24} color="var(--success)" />}
          title="Completed Today"
          value={stats?.completedToday || 0}
        />
        <StatCard 
          icon={<FiActivity size={24} color="var(--accent-secondary)" />}
          title="Total Devices"
          value={stats?.totalDevices || 0}
        />
      </div>

      {/* Main Layout Area */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem', marginTop: '1rem' }}>
        <div className="card">
          <h2 className="text-lg font-bold mb-4" style={{ marginBottom: '1rem' }}>Recent Activity</h2>
          <div className="text-sm text-secondary">
            Activity stream feature coming soon.
          </div>
        </div>
        <div className="card">
          <h2 className="text-lg font-bold" style={{ marginBottom: '1rem' }}>Quick Actions</h2>
          <div className="flex flex-col gap-2">
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'flex-start' }}>+ New Intake</button>
            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>Generate Invoice</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div className="card card-hoverable flex items-center justify-between">
      <div>
        <div className="text-sm text-secondary font-medium" style={{ marginBottom: '0.5rem' }}>{title}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
      <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '50%' }}>
        {icon}
      </div>
    </div>
  );
}
