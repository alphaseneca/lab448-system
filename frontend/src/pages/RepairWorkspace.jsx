import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { APP_ROUTES } from '../constants/routes';
import { ALLOWED_STATUS_TRANSITIONS, REPAIR_STATUSES } from '../constants/constants';

export default function RepairWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [repair, setRepair] = useState(null);
  const [loading, setLoading] = useState(true);

  // Status Update state
  const [isUpdating, setIsUpdating] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(true);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({ description: '', quantity: 1, unitPrice: '' });
  const [nextStatus, setNextStatus] = useState('');

  useEffect(() => {
    fetchRepair();
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  useEffect(() => {
    if (!repair?.status) return;
    const allowed = ALLOWED_STATUS_TRANSITIONS[repair.status] || [];
    setNextStatus(allowed[0] || '');
  }, [repair?.status]);

  const fetchRepair = async () => {
    try {
      const res = await api.get(`/repair-orders/${id}`);
      setRepair(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load workspace.');
      navigate(APP_ROUTES.REPAIR_ORDERS_LIST);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoice = async () => {
    setInvoiceLoading(true);
    try {
      const res = await api.get(`/invoicing/for-repair/${id}`);
      setInvoice(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setInvoice(null);
      } else {
        console.error('Failed to load invoice in workspace', err);
      }
    } finally {
      setInvoiceLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    setIsUpdating(true);
    try {
      await api.post(`/repair-orders/${id}/transition`, { newStatus, reason: `Status updated to ${newStatus} via Workspace UI` });
      await fetchRepair();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const createInvoice = async () => {
    setCreatingInvoice(true);
    try {
      await api.post(`/invoicing/for-repair/${id}`, { items: [] });
      await fetchInvoice();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create invoice');
    } finally {
      setCreatingInvoice(false);
    }
  };

  const addInvoiceItem = async (e) => {
    e.preventDefault();
    if (!invoice?.id) return;
    setAddingItem(true);
    try {
      await api.post(`/invoicing/${invoice.id}/add-items`, {
        description: newItem.description,
        quantity: Number(newItem.quantity),
        unitPrice: Number(newItem.unitPrice),
      });
      setNewItem({ description: '', quantity: 1, unitPrice: '' });
      await fetchInvoice();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add invoice item');
    } finally {
      setAddingItem(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case REPAIR_STATUSES.PENDING:
        return <span className="badge badge-warning">Waiting in Queue</span>;
      case REPAIR_STATUSES.IN_DIAGNOSTICS:
        return <span className="badge badge-primary">In Diagnostics</span>;
      case REPAIR_STATUSES.APPROVED:
        return <span className="badge badge-primary">Approved</span>;
      case REPAIR_STATUSES.IN_REPAIR:
        return <span className="badge badge-primary">In Repair</span>;
      case REPAIR_STATUSES.QUALITY_CONTROL:
        return <span className="badge badge-primary">Quality Control</span>;
      case REPAIR_STATUSES.READY_FOR_DELIVERY:
        return <span className="badge badge-success">Ready for Pickup</span>;
      case REPAIR_STATUSES.DELIVERED:
        return <span className="badge badge-neutral">Delivered</span>;
      case REPAIR_STATUSES.CANCELLED:
        return <span className="badge badge-danger">Cancelled</span>;
      default: 
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center min-h-[50vh]">
        <span className="material-symbols-rounded icon-lg animate-spin text-accent-primary mb-4">refresh</span>
        <p className="text-secondary font-medium tracking-wide">Initializing Workspace...</p>
    </div>
  );

  if (!repair) return null;

  return (
    <div className="animate-fade-in flex flex-col gap-6 max-w-6xl mx-auto pb-12">
      
      {/* Workspace Header */}
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-extrabold">{repair.ticketNumber || id}</h1>
            {getStatusBadge(repair.status)}
          </div>
          <p className="text-secondary text-lg">
            <span className="font-semibold text-primary">{repair.device?.brand} {repair.device?.modelName}</span>
            <span className="mx-2 text-muted">•</span>
            {repair.customer?.name}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-end">
          {(ALLOWED_STATUS_TRANSITIONS[repair.status] || []).length > 0 && (
            <>
              <div style={{ minWidth: 220 }}>
                <label className="text-xs text-muted font-bold uppercase tracking-wider mb-1 block">Next State</label>
                <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
                  {(ALLOWED_STATUS_TRANSITIONS[repair.status] || []).map((status) => (
                    <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <button
                className="btn btn-primary"
                disabled={isUpdating || !nextStatus}
                onClick={() => updateStatus(nextStatus)}
              >
                Apply Transition
              </button>
            </>
          )}

          <NavLink to={APP_ROUTES.REPAIR_ORDER_BILLING(repair.id)} className="btn btn-secondary flex items-center gap-2">
            <span className="material-symbols-rounded icon-sm">receipt_long</span> Invoice
          </NavLink>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        
        {/* Left Column (2/3 width) - Device Details & Notes */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="card !p-0 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-panel bg-surface/30 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-secondary">
                <span className="material-symbols-rounded icon-sm">description</span> Intake Information
              </h2>
            </div>
            <div className="p-6">
              <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Reported Issue</label>
              <div className="p-4 bg-primary border border-panel rounded-md text-sm leading-relaxed whitespace-pre-wrap">
                {repair.intakeNotes || 'No notes provided at intake.'}
              </div>

              <div className="grid grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Assigned Technician</label>
                  <p className="font-semibold text-primary">{repair.assignedTo?.fullName || repair.assignedTo?.name || <span className="text-muted italic">Unassigned</span>}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Intake Date</label>
                  <p className="text-sm text-primary">{new Date(repair.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card flex flex-col gap-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-secondary">
                <span className="material-symbols-rounded icon-sm">history</span> Status Log
              </h2>
            </div>
            
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
              {repair.statusLogs?.length > 0 ? repair.statusLogs.map((log, i) => (
                <div key={log.id} className="flex gap-3 p-2 rounded-md bg-surface/50 border border-panel hover:bg-surface transition-colors">
                  <div className="mt-0.5">
                    <span className="material-symbols-rounded text-accent-primary opacity-80" style={{fontSize: '16px'}}>
                      {i === 0 ? 'trip_origin' : 'radio_button_unchecked'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-bold text-primary">
                         {log.fromStatus || 'NONE'} <span className="material-symbols-rounded icon-sm text-muted mx-1 alignment-baseline">arrow_right_alt</span> <span className="text-accent-primary">{log.toStatus}</span>
                      </div>
                      <div className="text-xs text-muted">{new Date(log.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-xs text-secondary break-words">{log.notes || 'System status update.'}</div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6 border border-dashed border-panel rounded-md opacity-70">
                  <p className="text-sm text-muted">No historical events recorded.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width) - Customer & Device Context */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <div className="card !p-0 overflow-hidden shadow-sm">
             <div className="p-4 border-b border-panel bg-gradient-to-r from-accent-primary/10 to-transparent flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-accent-primary">
                <span className="material-symbols-rounded icon-sm">person</span> Contact
              </h2>
            </div>
            <div className="p-5 flex flex-col gap-4 text-sm">
              <div>
                <span className="text-muted block text-xs uppercase tracking-wider mb-1">Name</span>
                <p className="font-bold text-base">{repair.customer?.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-rounded text-muted icon-sm">call</span>
                <p className="font-medium text-secondary">{repair.customer?.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-rounded text-muted icon-sm">mail</span>
                <p className="font-medium text-secondary">{repair.customer?.email || 'No email on file'}</p>
              </div>
            </div>
          </div>

          <div className="card !p-0 overflow-hidden shadow-sm">
             <div className="p-4 border-b border-panel bg-surface/30">
              <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-secondary">
                <span className="material-symbols-rounded icon-sm">smartphone</span> Device Metrics
              </h2>
            </div>
            <div className="p-5 flex flex-col gap-4 text-sm">
              <div>
                <span className="text-muted block text-xs uppercase tracking-wider mb-1">Passcode / PIN</span>
                <div className="font-mono bg-primary/80 border border-panel px-3 py-2 rounded">
                  {repair.device?.devicePasscode || 'No Passcode provided'}
                </div>
              </div>
              <div>
                <span className="text-muted block text-xs uppercase tracking-wider mb-1">Serial Number / IMEI</span>
                <p className="font-semibold">{repair.device?.serialNumber || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="card !p-0 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-panel bg-surface/30">
              <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-secondary">
                <span className="material-symbols-rounded icon-sm">receipt_long</span> Billing Preview
              </h2>
            </div>
            <div className="p-5 flex flex-col gap-3 text-sm">
              {invoiceLoading ? (
                <p className="text-muted">Loading invoice...</p>
              ) : !invoice ? (
                <>
                  <p className="text-muted">No invoice exists for this repair order yet.</p>
                  <button className="btn btn-primary" onClick={createInvoice} disabled={creatingInvoice}>
                    {creatingInvoice ? 'Creating...' : 'Generate Invoice'}
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Invoice #</span>
                    <span className="font-semibold">{invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Status</span>
                    <span className="badge badge-neutral">{invoice.status}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Total</span>
                    <span className="font-semibold">₹{Number(invoice.totalAmount || 0).toFixed(2)}</span>
                  </div>

                  {!invoice.isLocked && (
                    <form onSubmit={addInvoiceItem} className="mt-2 flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Item description"
                        value={newItem.description}
                        onChange={(e) => setNewItem((s) => ({ ...s, description: e.target.value }))}
                        required
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem((s) => ({ ...s, quantity: e.target.value }))}
                          required
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Unit price"
                          value={newItem.unitPrice}
                          onChange={(e) => setNewItem((s) => ({ ...s, unitPrice: e.target.value }))}
                          required
                        />
                      </div>
                      <button type="submit" className="btn btn-secondary" disabled={addingItem}>
                        {addingItem ? 'Adding...' : 'Add Bill Item'}
                      </button>
                    </form>
                  )}

                  <NavLink to={APP_ROUTES.REPAIR_ORDER_BILLING(repair.id)} className="btn btn-ghost">
                    Open Full Billing Page
                  </NavLink>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
