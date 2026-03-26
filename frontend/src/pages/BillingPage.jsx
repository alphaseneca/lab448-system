import React, { useState } from 'react';
import { api } from '../services/api';
import { FiDollarSign, FiSearch, FiPrinter } from 'react-icons/fi';


export default function BillingPage() {
  const [customerId, setCustomerId] = useState('');
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [isPaying, setIsPaying] = useState(false);

  const fetchLedger = async (e) => {
    e?.preventDefault();
    if (!customerId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await api.get(`/invoicing/customer/${customerId}`);
      setLedgerData(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load customer billing ledger');
      setLedgerData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLumpSumPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) return;

    setIsPaying(true);
    try {
      await api.post(`/invoicing/customer/${customerId}/pay`, {
        amount: Number(paymentAmount),
        paymentMethod
      });
      setPaymentAmount('');
      alert('Payment applied successfully!');
      fetchLedger(); // Refresh
    } catch (err) {
      alert(err.response?.data?.message || 'Payment failed');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FiDollarSign color="var(--success)" /> Customer Billing Ledger
        </h1>
        <p className="text-secondary">View consolidated invoices and apply payments.</p>
      </header>

      {/* Search Bar */}
      <form className="card flex gap-4 items-center" onSubmit={fetchLedger}>
        <div style={{ flex: 1, position: 'relative' }}>
          <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Enter exact Customer ID (e.g., 1)" 
            value={customerId}
            onChange={e => setCustomerId(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Searching...' : 'Lookup Ledger'}
        </button>
      </form>

      {error && <div className="text-danger" style={{ background: 'var(--danger-bg)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>{error}</div>}

      {ledgerData && Object.keys(ledgerData).length > 0 && (
        <div className="flex flex-col gap-6 animate-fade-in">
          
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            <div className="card text-center">
              <div className="text-sm text-secondary mb-2">Total Billed</div>
              <div className="text-2xl font-bold text-primary">Rs. {Number(ledgerData.summary.totalBilled).toFixed(2)}</div>
            </div>
            <div className="card text-center">
              <div className="text-sm text-secondary mb-2">Total Paid</div>
              <div className="text-2xl font-bold text-success">Rs. {Number(ledgerData.summary.totalPaid).toFixed(2)}</div>
            </div>
            <div className="card text-center" style={{ border: '1px solid var(--danger)' }}>
              <div className="text-sm text-secondary mb-2">Total Due</div>
              <div className="text-2xl font-bold text-danger">Rs. {Number(ledgerData.summary.totalDue).toFixed(2)}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
            {/* Ledger Items */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--panel-border)' }}>
                <h2 className="text-lg font-bold">Repair Tickets & Invoices</h2>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Ticket</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Device</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Paid</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerData.ledger.map(item => (
                    <tr key={item.repairId} style={{ borderBottom: '1px solid var(--panel-border)' }}>
                      <td style={{ padding: '1rem' }} className="font-medium">{item.ticketNumber}</td>
                      <td style={{ padding: '1rem' }}>
                        <div className="text-sm">{item.device?.modelName}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>Rs. {Number(item.total).toFixed(2)}</td>
                      <td style={{ padding: '1rem' }} className="text-success">Rs. {Number(item.paid).toFixed(2)}</td>
                      <td style={{ padding: '1rem' }} className={item.due > 0 ? "text-danger font-bold" : "text-secondary"}>
                        Rs. {Number(item.due).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {ledgerData.ledger.length === 0 && (
                    <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>No repairs found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Payment Panel */}
            <div className="card flex flex-col gap-4 h-fit">
              <h2 className="text-lg font-bold">Apply Payment</h2>
              <form onSubmit={handleLumpSumPayment} className="flex flex-col gap-4">
                <div>
                  <label className="text-sm text-secondary mb-2 block">Amount (Rs.)</label>
                  <input 
                    type="number" 
                    min="1" 
                    step="0.01" 
                    value={paymentAmount} 
                    onChange={e => setPaymentAmount(e.target.value)} 
                    placeholder="e.g. 500"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-secondary mb-2 block">Payment Method</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Credit/Debit Card</option>
                    <option value="QR">QR Code (eSewa/Khalti)</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isPaying || !paymentAmount || Number(ledgerData.summary.totalDue) <= 0}
                  style={{ marginTop: '0.5rem' }}
                >
                  {isPaying ? 'Processing...' : 'Pay Selected Amount'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
