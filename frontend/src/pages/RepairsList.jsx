import React, { useEffect, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { api } from '../services/api';
import { APP_ROUTES } from '../constants/routes';

export default function RepairsList() {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRepairs();
  }, []);

  const fetchRepairs = async () => {
    try {
      const res = await api.get('/repair-orders');
      setRepairs(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch repairs", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': 
        return <span className="badge badge-warning flex items-center gap-1"><span className="material-symbols-rounded" style={{fontSize: '14px'}}>pending_actions</span> Waiting</span>;
      case 'IN_REPAIR': 
        return <span className="badge badge-primary flex items-center gap-1"><span className="material-symbols-rounded" style={{fontSize: '14px'}}>build</span> In Progress</span>;
      case 'READY_FOR_DELIVERY': 
        return <span className="badge badge-success flex items-center gap-1"><span className="material-symbols-rounded" style={{fontSize: '14px'}}>verified</span> Ready</span>;
      case 'DELIVERED': 
        return <span className="badge badge-neutral flex items-center gap-1"><span className="material-symbols-rounded" style={{fontSize: '14px'}}>task_alt</span> Delivered</span>;
      default: 
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  const filtered = repairs.filter(r => 
    r.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.device?.modelName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      
      {/* Header */}
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold mb-1">Repair Orders</h1>
          <p className="text-secondary tracking-wide">Manage, track, and process active device repair orders.</p>
        </div>
        <div className="flex gap-3">
          <NavLink to={APP_ROUTES.NEW_REPAIR_ORDER} className="btn btn-primary">
            <span className="material-symbols-rounded icon-sm">add</span>
            New Intake
          </NavLink>
        </div>
      </header>

      {/* Main Table Card */}
      <div className="card p-0 overflow-hidden flex flex-col">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-panel bg-surface/30 flex justify-between items-center">
          <div className="relative w-72">
            <span className="material-symbols-rounded absolute left-3 top-2.5 text-muted icon-sm">search</span>
            <input 
              type="text" 
              placeholder="Search tickets, customers, devices..." 
              className="pl-9 py-2 text-sm bg-primary border-panel"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost" onClick={fetchRepairs} title="Refresh">
              <span className={`material-symbols-rounded icon-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
            </button>
            <button className="btn btn-ghost" title="Filter">
              <span className="material-symbols-rounded icon-sm">filter_list</span>
            </button>
          </div>
        </div>
        
        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/40">
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider border-b border-panel">Order ID</th>
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider border-b border-panel">Customer</th>
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider border-b border-panel">Device & Issue</th>
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider border-b border-panel">Status</th>
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider border-b border-panel text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-muted">
                    <span className="material-symbols-rounded icon-lg animate-spin text-accent-primary mb-2">refresh</span>
                    <p>Loading queue data...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center text-muted bg-surface/10">
                    <span className="material-symbols-rounded text-4xl mb-3 opacity-50">inbox</span>
                    <p className="text-base font-semibold">No repairs found</p>
                    <p className="text-sm">The queue is empty or no tickets match your search.</p>
                  </td>
                </tr>
              ) : filtered.map(repair => (
                <tr key={repair.id} className="border-b border-panel hover:bg-surface-hover transition-colors group cursor-pointer" onClick={() => navigate(APP_ROUTES.REPAIR_ORDER_DETAILS(repair.id))}>
                  <td className="py-4 px-6">
                    <div className="font-bold text-accent-primary">{repair.ticketNumber}</div>
                    <div className="text-xs text-muted mt-0.5">{new Date(repair.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-semibold text-primary">{repair.customer?.name || 'Unknown'}</div>
                    <div className="text-xs text-secondary mt-0.5">{repair.customer?.phone || 'No phone'}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-primary">
                      {repair.device?.brand} {repair.device?.modelName}
                    </div>
                    <div className="text-xs text-secondary mt-0.5 truncate max-w-xs" title={repair.intakeNotes}>
                      {repair.intakeNotes || 'Standard diag & repair'}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {getStatusBadge(repair.status)}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button 
                      className="btn btn-secondary text-xs py-1.5 px-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); navigate(APP_ROUTES.REPAIR_ORDER_DETAILS(repair.id)); }}
                    >
                      Workspace
                      <span className="material-symbols-rounded" style={{fontSize: '14px'}}>arrow_forward</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footer Pagination mock */}
        <div className="p-3 border-t border-panel bg-surface/20 flex items-center justify-between text-xs text-muted">
          <span>Showing {filtered.length} active tickets</span>
          <div className="flex gap-1">
            <button className="p-1 rounded hover:bg-surface disabled:opacity-50" disabled><span className="material-symbols-rounded icon-sm">chevron_left</span></button>
            <button className="p-1 rounded hover:bg-surface disabled:opacity-50" disabled><span className="material-symbols-rounded icon-sm">chevron_right</span></button>
          </div>
        </div>

      </div>
    </div>
  );
}
