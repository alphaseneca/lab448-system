import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function IntakePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    deviceId: '',
    serviceTypeId: '',
    priority: 'NORMAL',
    intakeNotes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Stub submission
      const res = await api.post('/repairs', formData);
      navigate(`/repairs/${res.data.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to create repair ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header>
        <h1 className="text-2xl font-bold">New Intake</h1>
        <p className="text-secondary">Register a new device for repair or service.</p>
      </header>

      <form className="card" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-6">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Customer ID</label>
              <input 
                type="text" 
                placeholder="Select Customer..." 
                value={formData.customerId}
                onChange={e => setFormData({...formData, customerId: e.target.value})}
                required
              />
              <p className="text-xs text-muted">A proper searchable dropdown would go here.</p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Device ID</label>
              <input 
                type="text" 
                placeholder="Select Device..." 
                value={formData.deviceId}
                onChange={e => setFormData({...formData, deviceId: e.target.value})}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Service Type (Optional)</label>
              <input 
                type="text" 
                placeholder="General Service, Screen Replace..." 
                value={formData.serviceTypeId}
                onChange={e => setFormData({...formData, serviceTypeId: e.target.value})}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Priority</label>
              <select 
                value={formData.priority}
                onChange={e => setFormData({...formData, priority: e.target.value})}
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent (Expedited)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Intake Notes / Description</label>
            <textarea 
              rows="4" 
              placeholder="Describe the issue reported by the customer..."
              value={formData.intakeNotes}
              onChange={e => setFormData({...formData, intakeNotes: e.target.value})}
            ></textarea>
          </div>

          <div className="flex justify-end gap-4" style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--panel-border)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing...' : 'Create Ticket'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
