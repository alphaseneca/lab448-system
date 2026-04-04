import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { APP_ROUTES } from '../constants/routes';
import DarkSelect from '../components/DarkSelect';
import { PAYMENT_METHODS } from '../constants/constants';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phonePrimary: '', phoneSecondary: '', email: '', addressLine: '', latitude: '', longitude: '' });

  // Lump Sum Payment Form
  const [payment, setPayment] = useState({ amount: '', paymentMethod: 'CASH', referenceNumber: '' });
  const paymentMethodOptions = [
    { value: PAYMENT_METHODS.CASH, label: 'Cash' },
    { value: PAYMENT_METHODS.CARD, label: 'Card' },
    { value: PAYMENT_METHODS.BANK_TRANSFER, label: 'Bank Transfer' },
    { value: PAYMENT_METHODS.QR_CODE, label: 'QR Code' },
  ];
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  const fetchCustomerData = async () => {
    try {
      const [ledgerRes, profileRes] = await Promise.all([
        api.get(`/invoicing/customer/${id}`),
        api.get(`/customers/${id}`),
      ]);
      setData(ledgerRes.data);
      setProfile(profileRes.data);
      setForm({
        name: profileRes.data?.name || '',
        phonePrimary: profileRes.data?.phonePrimary || '',
        phoneSecondary: profileRes.data?.phoneSecondary || '',
        email: profileRes.data?.email || '',
        addressLine: profileRes.data?.addresses?.[0]?.addressLine || '',
        latitude: profileRes.data?.addresses?.[0]?.latitude || '',
        longitude: profileRes.data?.addresses?.[0]?.longitude || '',
      });
    } catch (err) {
      console.error("Failed to load customer", err);
      alert("Failed to load customer details");
      navigate('/customers');
    } finally {
      setLoading(false);
    }
  };

  const handleLumpSumPayment = async (e) => {
    e.preventDefault();
    if (!payment.amount || !payment.paymentMethod) return;
    setProcessing(true);
    try {
      await api.post(`/invoicing/customer/${id}/pay`, payment);
      await fetchCustomerData();
      setPayment({ amount: '', paymentMethod: 'CASH', referenceNumber: '' });
      alert("Payment successfully distributed to unpaid invoices.");
    } catch (err) {
      alert(err.response?.data?.message || "Payment processing failed.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center min-h-[50vh]">
      <span className="material-symbols-rounded icon-lg animate-spin text-accent-primary">refresh</span>
    </div>
  );

  if (!data) return null;

  const { customer, summary, ledger } = data;
  const balanceDue = summary.totalDue;

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/customers/${id}`, {
        name: form.name.trim(),
        phonePrimary: form.phonePrimary.trim() || null,
        phoneSecondary: form.phoneSecondary.trim() || null,
        email: form.email.trim() || null,
      });
      if (profile?.addresses?.[0]?.id) {
        await api.put(`/customers/${id}/addresses/${profile.addresses[0].id}`, {
          label: profile.addresses[0].label || 'Primary',
          addressLine: form.addressLine.trim() || null,
          latitude: form.latitude !== '' ? Number(form.latitude) : null,
          longitude: form.longitude !== '' ? Number(form.longitude) : null,
          isDefault: true,
        });
      } else if (form.addressLine.trim() || form.latitude !== '' || form.longitude !== '') {
        await api.post(`/customers/${id}/addresses`, {
          label: 'Primary',
          addressLine: form.addressLine.trim() || null,
          latitude: form.latitude !== '' ? Number(form.latitude) : null,
          longitude: form.longitude !== '' ? Number(form.longitude) : null,
          isDefault: true,
        });
      }
      setProfile(res.data);
      await fetchCustomerData();
      setEditing(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save customer details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6 max-w-6xl mx-auto pb-12">
      
      {/* Header Profile */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-panel pb-6 pt-2">
        <div className="flex items-center gap-5">
           <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center font-bold text-3xl text-white shadow-glow">
              {customer.name.charAt(0)}
           </div>
           <div>
             <h1 className="text-3xl font-extrabold text-primary mb-1">{profile?.name || customer.name}</h1>
            <p className="text-secondary font-medium tracking-wide">Customer profile and account ledger</p>
           </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => setEditing((v) => !v)}>
            {editing ? 'Cancel Edit' : 'Edit Customer'}
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/customers')}>
            <span className="material-symbols-rounded icon-sm">arrow_back</span> Back to Directory
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
        
        {/* Left Column: Ledger & Payment Collection */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="card">
            <h2 className="text-sm font-bold uppercase tracking-wider text-secondary mb-3">Customer Details</h2>
            {!editing ? (
              <div className="text-sm flex flex-col gap-2">
                <div><span className="text-muted">Phone:</span> {profile?.phonePrimary || '—'}</div>
                <div><span className="text-muted">Alt Phone:</span> {profile?.phoneSecondary || '—'}</div>
                <div><span className="text-muted">Email:</span> {profile?.email || '—'}</div>
                <div><span className="text-muted">Address:</span> {profile?.addresses?.[0]?.addressLine || '—'}</div>
                <div><span className="text-muted">Latitude:</span> {profile?.addresses?.[0]?.latitude || '—'}</div>
                <div><span className="text-muted">Longitude:</span> {profile?.addresses?.[0]?.longitude || '—'}</div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name" />
                <input value={form.phonePrimary} onChange={(e) => setForm((f) => ({ ...f, phonePrimary: e.target.value }))} placeholder="Primary phone" />
                <input value={form.phoneSecondary} onChange={(e) => setForm((f) => ({ ...f, phoneSecondary: e.target.value }))} placeholder="Secondary phone" />
                <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email" />
                <textarea rows={2} value={form.addressLine} onChange={(e) => setForm((f) => ({ ...f, addressLine: e.target.value }))} placeholder="Address" />
                <input type="number" step="0.00000001" value={form.latitude} onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))} placeholder="Latitude" />
                <input type="number" step="0.00000001" value={form.longitude} onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))} placeholder="Longitude" />
                <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
          
          <div className="card shadow-glow border-accent-primary/20 bg-gradient-to-b from-primary to-secondary">
            <h2 className="text-sm font-bold uppercase tracking-wider text-accent-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-rounded icon-sm">account_balance</span> Financial Ledger
            </h2>
            
            <div className="flex justify-between items-center mb-3">
              <span className="text-muted text-sm font-medium">Lifetime Billed</span>
              <span className="font-bold text-lg">Rs. {Number(summary.totalBilled).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-panel">
              <span className="text-muted text-sm font-medium">Lifetime Paid</span>
              <span className="font-bold text-lg text-success">-Rs. {Number(summary.totalPaid).toFixed(2)}</span>
            </div>
            
            <div className={`p-4 rounded-md border text-center ${balanceDue > 0 ? 'bg-warning-bg border-warning/30 text-warning' : 'bg-success-bg border-success/30 text-success'}`}>
              <div className="font-bold uppercase tracking-wider text-xs mb-1">
                {balanceDue > 0 ? 'Outstanding Balance' : 'Account Settled'}
              </div>
              <div className="font-extrabold text-3xl">
                Rs. {Math.max(0, balanceDue).toFixed(2)}
              </div>
            </div>
          </div>

          {balanceDue > 0 && (
            <form onSubmit={handleLumpSumPayment} className="card p-5 border border-dashed border-warning/50">
              <h3 className="text-sm font-bold uppercase tracking-wider text-warning mb-4 flex items-center gap-2">
                <span className="material-symbols-rounded icon-sm">payments</span> Distribute Payment
              </h3>
              <p className="text-xs text-muted mb-4 border-b border-panel pb-4">
                Lump sum payments are automatically distributed to the oldest unpaid invoices first.
              </p>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-secondary mb-1 block">Amount (Rs. )</label>
                  <input type="number" step="0.01" max={balanceDue} value={payment.amount} onChange={e => setPayment({...payment, amount: e.target.value})} placeholder="0.00" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-secondary mb-1 block">Method</label>
                  <DarkSelect
                    value={payment.paymentMethod}
                    onChange={(method) => setPayment({ ...payment, paymentMethod: method })}
                    options={paymentMethodOptions}
                  />
                </div>
                <button type="submit" className="btn mt-2 bg-warning-bg text-warning border-warning/50 hover:bg-warning hover:text-white" disabled={processing}>
                  {processing ? 'Processing...' : 'Apply Payment'}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Right Column: Devices and Order History */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="card p-0 overflow-hidden">
             <div className="p-4 bg-surface/30 border-b border-panel flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-secondary">
                  <span className="material-symbols-rounded icon-sm">history</span> Repair & Billing History
                </h2>
             </div>

             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead>
                   <tr className="bg-primary/20 border-b border-panel">
                     <th className="py-3 px-4 text-xs font-bold text-muted uppercase tracking-wider">Order</th>
                     <th className="py-3 px-4 text-xs font-bold text-muted uppercase tracking-wider">Device</th>
                     <th className="py-3 px-4 text-xs font-bold text-muted uppercase tracking-wider">Status</th>
                     <th className="py-3 px-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Financials</th>
                     <th className="py-3 px-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {ledger.length === 0 ? (
                     <tr><td colSpan="5" className="text-center py-8 text-muted">No history for this client.</td></tr>
                   ) : ledger.map(item => (
                     <tr key={item.repairId} className="border-b border-panel/50 hover:bg-surface-hover">
                       <td className="py-3 px-4">
                         <div className="font-bold text-accent-primary">{item.ticketNumber}</div>
                       </td>
                       <td className="py-3 px-4">
                         <div className="font-medium">{item.device?.brand} {item.device?.modelName}</div>
                         <div className="text-xs text-muted">S/N: {item.device?.serialNumber || 'N/A'}</div>
                       </td>
                       <td className="py-3 px-4">
                          <span className="badge badge-neutral text-xs">{item.status}</span>
                       </td>
                       <td className="py-3 px-4 text-right">
                         <div className="font-bold">Rs. {Number(item.total).toFixed(2)}</div>
                         {item.due > 0 ? (
                            <div className="text-xs text-warning font-bold">Due: Rs. {Number(item.due).toFixed(2)}</div>
                         ) : (
                            <div className="text-xs text-success font-bold">Paid</div>
                         )}
                       </td>
                       <td className="py-3 px-4 text-right">
                         <div className="flex justify-end gap-2">
                           <button className="btn btn-ghost" onClick={() => navigate(APP_ROUTES.REPAIR_ORDER_DETAILS(item.repairId))}>
                             Workspace
                           </button>
                           <button className="btn btn-secondary" onClick={() => navigate(APP_ROUTES.REPAIR_ORDER_BILLING(item.repairId))}>
                             Billing
                           </button>
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
