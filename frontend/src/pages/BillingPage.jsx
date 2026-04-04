import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, NavLink } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { APP_ROUTES } from '../constants/routes';
import { PERMISSIONS, PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '../constants/constants';

/**
 * BillingPage — Full invoice management for a repair order.
 * Backend domain: /api/invoicing
 *   GET  /invoicing/for-repair/:repairId         → load invoice
 *   POST /invoicing/for-repair/:repairId         → generate invoice
 *   POST /invoicing/:invoiceId/add-items         → add line items
 *   POST /invoicing/:invoiceId/pay               → record payment
 */
export default function BillingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const [repair, setRepair] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invoiceLoading, setInvoiceLoading] = useState(true);
  const [error, setError] = useState('');

  // Add line item form
  const [newItem, setNewItem] = useState({ description: '', quantity: 1, unitPrice: '' });
  const [addingItem, setAddingItem] = useState(false);
  const [addItemError, setAddItemError] = useState('');

  // Payment form
  const [payment, setPayment] = useState({ amount: '', method: PAYMENT_METHODS.CASH });
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Generating invoice
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  const canManageBilling = hasPermission(PERMISSIONS.MANAGE_BILLING);

  // ── Data loaders ────────────────────────────────────────────────────
  const fetchRepair = async () => {
    try {
      const res = await api.get(`/repair-orders/${id}`);
      setRepair(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load repair details.');
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
      if (err.response?.status === 404) setInvoice(null);
      else console.error('Invoice load failed', err);
    } finally {
      setInvoiceLoading(false);
    }
  };

  useEffect(() => { fetchRepair(); fetchInvoice(); }, [id]);

  // ── Actions ─────────────────────────────────────────────────────────
  const generateInvoice = async () => {
    setGeneratingInvoice(true);
    try {
      await api.post(`/invoicing/for-repair/${id}`, { items: [] });
      await fetchInvoice();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate invoice.');
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!invoice?.id) return;
    setAddItemError('');
    setAddingItem(true);
    try {
      await api.post(`/invoicing/${invoice.id}/add-items`, {
        description: newItem.description.trim(),
        quantity: Number(newItem.quantity),
        unitPrice: Number(newItem.unitPrice),
      });
      setNewItem({ description: '', quantity: 1, unitPrice: '' });
      await fetchInvoice();
    } catch (err) {
      setAddItemError(err.response?.data?.message || 'Failed to add item.');
    } finally {
      setAddingItem(false);
    }
  };

  const recordPayment = async (e) => {
    e.preventDefault();
    if (!invoice?.id) return;
    setPaymentError('');
    setRecordingPayment(true);
    try {
      await api.post(`/invoicing/${invoice.id}/pay`, {
        amount: Number(payment.amount),
        method: payment.method,
      });
      setPayment({ amount: '', method: PAYMENT_METHODS.CASH });
      await fetchInvoice();
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Failed to record payment.');
    } finally {
      setRecordingPayment(false);
    }
  };

  // ── Derived state ────────────────────────────────────────────────────
  const totalAmount = Number(invoice?.totalAmount || 0);
  const paidAmount = (invoice?.payments || []).reduce((s, p) => s + Number(p.amount), 0);
  const dueAmount = totalAmount - paidAmount;
  const isLocked = invoice?.status === 'PAID' || invoice?.isLocked;

  // ── Loading / error states ───────────────────────────────────────────
  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center min-h-[50vh]">
      <span className="material-symbols-rounded icon-lg animate-spin text-accent-primary mb-4">refresh</span>
      <p className="text-secondary font-medium">Loading billing data...</p>
    </div>
  );

  if (error && !repair) return (
    <div className="flex flex-col gap-4 max-w-lg">
      <div className="p-4 rounded-md badge-danger flex items-center gap-3 text-sm">
        <span className="material-symbols-rounded icon-md">error</span>{error}
      </div>
      <button className="btn btn-ghost self-start" onClick={() => navigate(APP_ROUTES.REPAIR_ORDERS_LIST)}>
        ← Back to Repair Orders
      </button>
    </div>
  );

  return (
    <div className="animate-fade-in flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold mb-1">{repair?.ticketNumber || `Repair #${id}`}</h1>
          <p className="text-secondary">
            <span className="font-semibold text-primary">{repair?.customer?.name}</span>
            <span className="mx-2 text-muted">·</span>
            {repair?.device?.brand} {repair?.device?.modelName}
          </p>
        </div>
        <NavLink to={APP_ROUTES.REPAIR_ORDER_DETAILS(id)} className="btn btn-ghost self-start flex items-center gap-2">
          <span className="material-symbols-rounded icon-sm">arrow_back</span> Workspace
        </NavLink>
      </header>

      {error && (
        <div className="p-4 rounded-md badge-danger flex items-center gap-3 text-sm">
          <span className="material-symbols-rounded icon-md">warning</span>{error}
        </div>
      )}

      {/* Invoice not yet created */}
      {!invoiceLoading && !invoice && (
        <section className="card p-8 flex flex-col items-center gap-4 text-center">
          <span className="material-symbols-rounded" style={{ fontSize: 48, opacity: 0.4 }}>receipt_long</span>
          <h2 className="text-lg font-bold">No invoice yet</h2>
          <p className="text-secondary text-sm max-w-sm">Generate an invoice to begin adding line items and recording payments for this repair order.</p>
          {canManageBilling && (
            <button className="btn btn-primary" onClick={generateInvoice} disabled={generatingInvoice}>
              {generatingInvoice ? 'Generating...' : 'Generate Invoice'}
            </button>
          )}
        </section>
      )}

      {invoice && (
        <>
          {/* ── Invoice Summary ──────────────────────────────────────── */}
          <section className="card !p-0 overflow-hidden">
            <div className="p-4 border-b border-panel bg-surface/30 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
                <span className="material-symbols-rounded icon-sm">receipt</span> Invoice Summary
              </h2>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted">#{invoice.invoiceNumber}</span>
                <span className={`badge ${invoice.status === 'PAID' ? 'badge-success' : invoice.status === 'PARTIAL' ? 'badge-warning' : 'badge-neutral'}`}>
                  {invoice.status}
                </span>
              </div>
            </div>
            <div className="p-6 grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-xs text-muted uppercase tracking-wider mb-1">Total</p>
                <p className="text-2xl font-extrabold">Rs. {totalAmount.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted uppercase tracking-wider mb-1">Paid</p>
                <p className="text-2xl font-extrabold" style={{ color: 'var(--accent-secondary)' }}>Rs. {paidAmount.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted uppercase tracking-wider mb-1">Balance Due</p>
                <p className="text-2xl font-extrabold" style={{ color: dueAmount > 0 ? '#f87171' : 'inherit' }}>
                  Rs. {dueAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </section>

          {/* ── Line Items ───────────────────────────────────────────── */}
          <section className="card !p-0 overflow-hidden">
            <div className="p-4 border-b border-panel bg-surface/30 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
                <span className="material-symbols-rounded icon-sm">list_alt</span> Invoice Items
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-panel bg-surface/30">
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-muted uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-muted uppercase tracking-wider">Unit Price</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-muted uppercase tracking-wider">Subtotal</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.items || invoice.invoiceItems || []).length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-muted text-sm">No items yet. Add the first item below.</td></tr>
                  ) : (
                    (invoice.items || invoice.invoiceItems || []).map(item => (
                      <tr key={item.id} className="border-b border-panel last:border-0 hover:bg-surface/50 transition-colors">
                        <td className="px-4 py-3 font-medium">{item.description}</td>
                        <td className="px-4 py-3 text-right text-secondary">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-secondary">Rs. {Number(item.unitPrice).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-semibold">Rs. {(Number(item.unitPrice) * Number(item.quantity)).toFixed(2)}</td>
                        <td className="px-4 py-3 text-xs text-muted">{item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Add item form */}
            {canManageBilling && !isLocked && (
              <div className="p-4 border-t border-panel bg-primary/30">
                <form onSubmit={addItem} className="flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-48">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Description</label>
                    <input type="text" value={newItem.description} onChange={e => setNewItem(s => ({ ...s, description: e.target.value }))} placeholder="e.g. Screen replacement" required />
                  </div>
                  <div className="w-24">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Qty</label>
                    <input type="number" min="1" value={newItem.quantity} onChange={e => setNewItem(s => ({ ...s, quantity: e.target.value }))} required />
                  </div>
                  <div className="w-36">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Unit Price (Rs. )</label>
                    <input type="number" min="0" step="0.01" value={newItem.unitPrice} onChange={e => setNewItem(s => ({ ...s, unitPrice: e.target.value }))} placeholder="0.00" required />
                  </div>
                  <button type="submit" className="btn btn-secondary" disabled={addingItem}>
                    {addingItem ? 'Adding...' : <><span className="material-symbols-rounded icon-sm">add</span> Add Item</>}
                  </button>
                </form>
                {addItemError && <p className="text-xs mt-2" style={{ color: '#f87171' }}>{addItemError}</p>}
              </div>
            )}
          </section>

          {/* ── Payments table + record form ──────────────────────────── */}
          <section className="card !p-0 overflow-hidden">
            <div className="p-4 border-b border-panel bg-surface/30 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
                <span className="material-symbols-rounded icon-sm">payments</span> Payment Records
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-panel bg-surface/30">
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Method</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-muted uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.payments || []).length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-muted text-sm">No payments recorded yet.</td></tr>
                  ) : (
                    (invoice.payments || []).map(p => (
                      <tr key={p.id} className="border-b border-panel last:border-0 hover:bg-surface/50 transition-colors">
                        <td className="px-4 py-3 text-secondary">{p.receivedAt ? new Date(p.receivedAt).toLocaleString() : '—'}</td>
                        <td className="px-4 py-3">{PAYMENT_METHOD_LABELS[p.method] || p.method}</td>
                        <td className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--accent-secondary)' }}>Rs. {Number(p.amount).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Record payment form */}
            {canManageBilling && !isLocked && dueAmount > 0 && (
              <div className="p-4 border-t border-panel bg-primary/30">
                <form onSubmit={recordPayment} className="flex flex-wrap gap-3 items-end">
                  <div className="w-36">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Amount (Rs. )</label>
                    <input
                      type="number" step="0.01" min="0.01" max={dueAmount}
                      value={payment.amount} onChange={e => setPayment(s => ({ ...s, amount: e.target.value }))}
                      placeholder={dueAmount.toFixed(2)} required
                    />
                  </div>
                  <div className="w-48">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Payment Method</label>
                    <select value={payment.method} onChange={e => setPayment(s => ({ ...s, method: e.target.value }))}>
                      {Object.entries(PAYMENT_METHOD_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={recordingPayment}>
                    {recordingPayment ? 'Recording...' : <><span className="material-symbols-rounded icon-sm">point_of_sale</span> Record Payment</>}
                  </button>
                </form>
                {paymentError && <p className="text-xs mt-2" style={{ color: '#f87171' }}>{paymentError}</p>}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
