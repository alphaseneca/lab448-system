import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { FiPlus, FiSearch } from 'react-icons/fi';

export default function RepairsList() {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRepairs();
  }, []);

  const fetchRepairs = async () => {
    try {
      const res = await api.get('/repairs');
      setRepairs(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch repairs", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'badge-warning';
      case 'IN_REPAIR': return 'badge-neutral';
      case 'DELIVERED': return 'badge-success';
      default: return 'badge-neutral';
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Repair Orders</h1>
          <p className="text-secondary">Manage and track active device repairs.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/repairs/new')}>
          <FiPlus /> New Intake
        </button>
      </header>

      <div className="card" style={{ padding: '0' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--panel-border)' }} className="flex gap-4">
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', padding: '0 1rem', borderRadius: 'var(--radius-sm)', width: '300px' }}>
            <FiSearch color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search ticket or customer..." 
              style={{ border: 'none', background: 'transparent', outline: 'none', padding: '0.75rem', width: '100%', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Ticket</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Customer</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Device</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Loading repairs...</td></tr>
              ) : repairs.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No active repairs found.</td></tr>
              ) : repairs.map(repair => (
                <tr key={repair.id} style={{ borderBottom: '1px solid var(--panel-border)' }} className="card-hoverable">
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{repair.ticketNumber || 'TKT-001'}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>{repair.customer?.name || 'Unknown'}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div>{repair.device?.modelName || 'Unknown Device'}</div>
                    <div className="text-xs text-muted">S/N: {repair.device?.serialNumber || 'N/A'}</div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span className={`badge ${getStatusColor(repair.status)}`}>{repair.status}</span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <button className="btn btn-secondary text-sm" onClick={() => navigate(`/repairs/${repair.id}`)} style={{ padding: '0.5rem 1rem' }}>
                      Workspace
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
