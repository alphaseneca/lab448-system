import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function RepairWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [repair, setRepair] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRepair();
  }, [id]);

  const fetchRepair = async () => {
    try {
      const res = await api.get(`/repairs/${id}`);
      setRepair(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load workspace.');
      navigate('/repairs');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      await api.put(`/repairs/${id}/status`, { newStatus, reason: 'Status updated via Workspace UI' });
      fetchRepair();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) return <div>Loading workspace...</div>;
  if (!repair) return null;

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Workspace: {repair.ticketNumber || id}</h1>
          <p className="text-secondary">
            {repair.device?.brand} {repair.device?.modelName} - {repair.customer?.name}
          </p>
        </div>
        <div className="flex gap-2">
          {repair.status === 'PENDING' && (
            <button className="btn btn-primary" onClick={() => updateStatus('IN_REPAIR')}>
              Start Repair
            </button>
          )}
          {repair.status === 'IN_REPAIR' && (
            <button className="btn btn-success" onClick={() => updateStatus('READY_FOR_DELIVERY')} style={{ background: 'var(--success)' }}>
              Mark Ready
            </button>
          )}
          {repair.status === 'READY_FOR_DELIVERY' && (
            <button className="btn btn-primary" onClick={() => updateStatus('DELIVERED')}>
              Mark Delivered
            </button>
          )}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem' }}>
        <div className="card flex flex-col gap-4">
          <h2 className="text-lg font-bold">Repair Details</h2>
          <div className="text-sm text-secondary">
            <strong>Notes:</strong> {repair.intakeNotes || 'No notes provided.'}
          </div>
          <div className="text-sm text-secondary">
            <strong>Assigned to:</strong> {repair.assignedTo?.fullName || 'Unassigned'}
          </div>
          <div className="text-sm text-secondary">
             <strong>Status:</strong> <span className="badge badge-neutral">{repair.status}</span>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--panel-border)', margin: '1rem 0' }} />

          <h2 className="text-lg font-bold">Action Log</h2>
          <div className="flex flex-col gap-2">
            {repair.statusLogs?.length > 0 ? repair.statusLogs.map(log => (
              <div key={log.id} style={{ padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                <div className="text-xs text-muted">
                   from {log.fromStatus || 'NONE'} to {log.toStatus} - {new Date(log.createdAt).toLocaleString()}
                </div>
                <div className="text-sm">{log.notes}</div>
              </div>
            )) : <p className="text-muted text-sm">No status changes yet.</p>}
          </div>

        </div>

        <div className="card flex flex-col gap-4">
          <h2 className="text-lg font-bold">Customer Info</h2>
          <div className="text-sm">
            <div><strong>Name:</strong> {repair.customer?.name}</div>
            <div><strong>Phone:</strong> {repair.customer?.phone}</div>
            <div><strong>Email:</strong> {repair.customer?.email || 'N/A'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
