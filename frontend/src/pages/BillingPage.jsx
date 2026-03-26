import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { APP_ROUTES } from '../constants/routes';
import { getNextBillNumber, printThermalBill } from '../components/ThermalBillPrint';
import { INVOICE_STATUSES, PAYMENT_METHODS } from '../constants/constants';
import DarkSelect from '../components/DarkSelect';

export default function BillingPage() {
  const { id: repairId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Line Item Form State
  const [newItem, setNewItem] = useState({ description: '', quantity: 1, unitPrice: '', chargeTypeId: '' });
  const [addingItem, setAddingItem] = useState(false);
  const [chargeTypes, setChargeTypes] = useState([]);

  // Payment Form State
  const [payment, setPayment] = useState({ amount: '', paymentMethod: PAYMENT_METHODS.CASH, referenceNumber: '' });
  const [processingPayment, setProcessingPayment] = useState(false);
  const [repairOrder, setRepairOrder] = useState(null);
  const paymentMethodOptions = [
    { value: PAYMENT_METHODS.CASH, label: 'Cash' },
    { value: PAYMENT_METHODS.CARD, label: 'Credit / Debit Card' },
    { value: PAYMENT_METHODS.BANK_TRANSFER, label: 'Bank Transfer' },
    { value: PAYMENT_METHODS.QR_CODE, label: 'QR Code' },
  ];
  const canMutateInvoice = user && (user.roleCode === 'ADMIN' || user.permissions?.includes('billing:manage') || user.permissions?.includes('billing:take_payment') || user.permissions?.includes('*:*'));

  useEffect(() => {
    if (!repairId) {
      alert("Missing Repair ID. Navigating away.");
      navigate(APP_ROUTES.REPAIR_ORDERS_LIST);
      return;
    }
    fetchInvoice();
    fetchRepairOrder();
    fetchChargeTypes();
  }, [repairId]);

  const fetchRepairOrder = async () => {
    try {
      const res = await api.get(`/repair-orders/${repairId}`);
      setRepairOrder(res.data);
    } catch (err) {
      console.error('Failed to fetch repair order', err);
    }
  };

  const fetchInvoice = async () => {
    try {
      const res = await api.get(`/invoicing/for-repair/${repairId}`);
      setInvoice(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setInvoice(null);
      } else {
        console.error("Failed to fetch invoice", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchChargeTypes = async () => {
    try {
      const res = await api.get('/invoicing/charge-types');
      const rows = res.data || [];
      setChargeTypes(rows);
      setNewItem((prev) => ({
        ...prev,
        chargeTypeId: prev.chargeTypeId || rows[0]?.id || '',
      }));
    } catch (err) {
      console.error('Failed to fetch charge types', err);
    }
  };

  const generateInvoice = async () => {
    setGenerating(true);
    try {
      await api.post(`/invoicing/for-repair/${repairId}`, { items: [] });
      await fetchInvoice();
    } catch (err) {
      alert("Failed to generate invoice.");
    } finally {
      setGenerating(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.description || !newItem.unitPrice || !newItem.chargeTypeId) return;
    setAddingItem(true);
    try {
      await api.post(`/invoicing/${invoice.id}/add-items`, {
        description: newItem.description.trim(),
        chargeTypeId: newItem.chargeTypeId,
        quantity: Math.max(1, Number(newItem.quantity)),
        unitPrice: Number(newItem.unitPrice),
      });
      await fetchInvoice();
      setNewItem((prev) => ({ ...prev, description: '', quantity: 1, unitPrice: '' }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add item.");
    } finally {
      setAddingItem(false);
    }
  };
  const balanceDue = Math.max(0, Number(invoice?.totalAmount || 0) - Number(invoice?.totalPaidAmount || 0));

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!payment.amount || !payment.paymentMethod) return;
    setProcessingPayment(true);
    try {
      await api.post(`/invoicing/${invoice.id}/pay`, {
        ...payment,
        amount: Number(payment.amount),
      });
      await fetchInvoice();
      setPayment({ amount: '', paymentMethod: PAYMENT_METHODS.CASH, referenceNumber: '' });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to process payment.");
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center min-h-[50vh]">
      <span className="material-symbols-rounded icon-lg animate-spin text-accent-primary">refresh</span>
    </div>
  );

  return (
    <div className="animate-fade-in flex flex-col gap-6 max-w-5xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold mb-1">Billing & Invoicing</h1>
          <p className="text-secondary tracking-wide">Manage line items, invoice totals, and payment collection for Repair Order #{repairId}</p>
        </div>
        <div>
          <button className="btn btn-ghost" onClick={() => navigate(APP_ROUTES.REPAIR_ORDER_DETAILS(repairId))}>
            <span className="material-symbols-rounded icon-sm">arrow_back</span> Return to Workspace
          </button>
          {!!invoice && (
            <button
              className="btn btn-secondary ml-2"
              onClick={() =>
                printThermalBill({
                  billNumber: getNextBillNumber(),
                  customerName: repairOrder?.customer?.name,
                  customerPhone: repairOrder?.customer?.phone,
                  lines: (invoice.items || []).map((item) => ({
                    description: item.description,
                    rate: Number(item.unitPrice),
                    amount: Number(item.amount),
                  })),
                  total: Number(invoice.totalAmount || 0),
                })
              }
            >
              <span className="material-symbols-rounded icon-sm">print</span> Print Bill
            </button>
          )}
        </div>
      </header>

      {!invoice ? (
        <div className="card text-center py-16 flex flex-col items-center justify-center border-dashed border-2">
          <span className="material-symbols-rounded text-6xl text-muted mb-4 opacity-50">receipt_long</span>
          <h2 className="text-xl font-bold mb-2">No Invoice Yet</h2>
          <p className="text-secondary mb-6 max-w-md">Create an initial invoice draft, then add charge items and collect payments.</p>
          <button className="btn btn-primary" onClick={generateInvoice} disabled={generating}>
            {generating ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Invoice Items Column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            <div className="card p-0 overflow-hidden">
              <div className="p-4 bg-surface/30 border-b border-panel flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-secondary">
                  <span className="material-symbols-rounded icon-sm">list_alt</span> Invoice Line Items
                </h2>
                <div className={`badge ${invoice.status === INVOICE_STATUSES.PAID ? 'badge-success' : 'badge-warning'}`}>
                  {invoice.status}
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-panel bg-primary/20">
                      <th className="py-2 px-4 text-xs font-bold text-muted uppercase tracking-wider">Description</th>
                      <th className="py-2 px-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Qty</th>
                      <th className="py-2 px-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Price</th>
                      <th className="py-2 px-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items?.length === 0 && (
                      <tr><td colSpan="4" className="text-center py-6 text-muted text-sm">No items added to this invoice yet.</td></tr>
                    )}
                    {invoice.items?.map(item => (
                      <tr key={item.id} className="border-b border-panel/50 hover:bg-surface-hover">
                        <td className="py-3 px-4 font-medium">{item.description}</td>
                        <td className="py-3 px-4 text-right text-secondary">{item.quantity}</td>
                        <td className="py-3 px-4 text-right text-secondary">₹{Number(item.unitPrice).toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-bold">₹{Number(item.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-primary/40">
                    <tr>
                      <td colSpan="3" className="py-3 px-4 text-right text-sm text-secondary font-bold">Subtotal</td>
                      <td className="py-3 px-4 text-right font-bold">₹{Number(invoice.subtotalAmount).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="py-3 px-4 text-right text-sm text-secondary font-bold">Tax ({Number(invoice.taxRate)*100}%)</td>
                      <td className="py-3 px-4 text-right font-bold text-danger">+₹{Number(invoice.taxAmount).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="py-4 px-4 text-right text-base text-primary font-extrabold uppercase tracking-wider">Total Billed</td>
                      <td className="py-4 px-4 text-right text-lg text-accent-primary font-extrabold">₹{Number(invoice.totalAmount).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Add Item Form */}
            {!invoice.isLocked && invoice.status !== INVOICE_STATUSES.PAID && canMutateInvoice && (
              <form onSubmit={handleAddItem} className="card p-4 border border-dashed border-panel bg-primary">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Add New Charge</h3>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-4">
                    <label className="text-xs font-bold text-secondary mb-1 block">Charge Type</label>
                    <DarkSelect
                      value={newItem.chargeTypeId}
                      onChange={(value) => setNewItem({ ...newItem, chargeTypeId: value })}
                      options={chargeTypes.map((c) => ({ value: c.id, label: c.name }))}
                      disabled={chargeTypes.length === 0}
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="text-xs font-bold text-secondary mb-1 block">Description</label>
                    <input type="text" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} placeholder="e.g. Screen Replacement Labor" required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-secondary mb-1 block">Qty</label>
                    <input type="number" min="1" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} required className="text-center" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-secondary mb-1 block">Unit Price (₹)</label>
                    <input type="number" min="0" step="0.01" value={newItem.unitPrice} onChange={e => setNewItem({...newItem, unitPrice: e.target.value})} placeholder="0.00" required />
                  </div>
                  <button type="submit" className="btn btn-secondary md:col-span-1 h-10 px-3" disabled={addingItem || !newItem.chargeTypeId}>
                    <span className="material-symbols-rounded icon-sm text-accent-primary">add_circle</span>
                  </button>
                </div>
              </form>
            )}

          </div>

          {/* Right Column: Ledger and Collection */}
          <div className="flex flex-col gap-6">
            
            {/* Payment Ledger Summary */}
            <div className="card shadow-glow border-accent-primary/20 bg-gradient-to-b from-primary to-secondary">
              <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-accent-primary mb-4">
                <span className="material-symbols-rounded icon-sm">account_balance_wallet</span> Ledger Summary
              </h2>
              
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted text-sm font-medium">Invoice Total</span>
                <span className="font-bold text-lg">₹{Number(invoice.totalAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-panel">
                <span className="text-muted text-sm font-medium">Total Paid</span>
                <span className="font-bold text-lg text-success">-₹{Number(invoice.totalPaidAmount || 0).toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center bg-surface/50 p-3 rounded-md border border-panel">
                <span className="font-bold uppercase tracking-wider text-sm">Balance Due</span>
                <span className="font-extrabold text-2xl text-warning">
                  ₹{Math.max(0, Number(invoice.totalAmount) - Number(invoice.totalPaidAmount || 0)).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Collect Payment Form */}
            {invoice.status !== INVOICE_STATUSES.PAID && canMutateInvoice && (
              <form onSubmit={handlePayment} className="card p-0 overflow-hidden">
                <div className="p-3 bg-surface/30 border-b border-panel">
                  <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-success">
                    <span className="material-symbols-rounded icon-sm">payments</span> Process Payment
                  </h3>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-bold text-secondary mb-1 block">Amount to Pay (₹)</label>
                    <input type="number" min="0.01" step="0.01" max={balanceDue} value={payment.amount} onChange={e => setPayment({...payment, amount: e.target.value})} placeholder={balanceDue.toFixed(2)} required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-secondary mb-1 block">Payment Method</label>
                    <DarkSelect
                      value={payment.paymentMethod}
                      onChange={(method) => setPayment({ ...payment, paymentMethod: method })}
                      options={paymentMethodOptions}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-secondary mb-1 block">Reference # (Optional)</label>
                    <input type="text" value={payment.referenceNumber} onChange={e => setPayment({...payment, referenceNumber: e.target.value})} placeholder="Txn ID or Cheque No." />
                  </div>
                  <button type="submit" className="btn btn-primary w-full mt-1 h-10" disabled={processingPayment || balanceDue <= 0}>
                    {processingPayment ? 'Processing...' : `Collect Payment`}
                  </button>
                </div>
              </form>
            )}

            {/* Payment History Log */}
            <div className="card p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4 border-b border-panel pb-2">Payment History</h3>
              {invoice.payments?.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">No payments recorded yet.</p>
              ) : (
                <div className="flex flex-col gap-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                  {invoice.payments?.map(p => (
                    <div key={p.id} className="flex flex-col bg-surface/40 p-3 rounded border border-panel text-sm">
                      <div className="flex justify-between font-bold mb-1">
                        <span>{p.paymentMethod}</span>
                        <span className="text-success">₹{Number(p.amount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted">
                        <span>{new Date(p.receivedAt).toLocaleDateString()}</span>
                        <span>{p.referenceNumber || 'No Ref'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
