import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { APP_ROUTES } from '../constants/routes';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phonePrimary: '',
    phoneSecondary: '',
    email: '',
    isCompany: false,
    companyContactPerson: '',
    panNumber: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data.data || []);
    } catch (err) {
      console.error("Failed to load customers", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phonePrimary?.includes(searchTerm) ||
    c.phoneSecondary?.includes(searchTerm) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const createCustomer = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      await api.post('/customers', {
        name: newCustomer.name.trim(),
        phonePrimary: newCustomer.phonePrimary.trim() || null,
        phoneSecondary: newCustomer.phoneSecondary.trim() || null,
        email: newCustomer.email.trim() || null,
        isCompany: newCustomer.isCompany,
        companyContactPerson: newCustomer.companyContactPerson.trim() || null,
        panNumber: newCustomer.panNumber.trim() || null,
      });
      setNewCustomer({
        name: '',
        phonePrimary: '',
        phoneSecondary: '',
        email: '',
        isCompany: false,
        companyContactPerson: '',
        panNumber: '',
      });
      await fetchCustomers();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create customer');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6 w-full max-w-5xl mx-auto">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold mb-1">Customer Directory</h1>
          <p className="text-secondary tracking-wide">Manage clients, view their devices, and track billing ledgers.</p>
        </div>
      </header>

      <div className="card p-0 flex flex-col overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-panel bg-surface/30 flex justify-between items-center">
          <div className="relative w-72">
            <span className="material-symbols-rounded absolute left-3 top-2.5 text-muted icon-sm">search</span>
            <input 
              type="text" 
              placeholder="Search by name, phone, email..." 
              className="pl-9 py-2 text-sm bg-primary border-panel"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => navigate(APP_ROUTES.NEW_REPAIR_ORDER)}>
            <span className="material-symbols-rounded icon-sm">person_add</span> New Client Intake
          </button>
        </div>

        {/* Data List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-secondary/40 border-b border-panel">
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider">Client Profile</th>
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider">Contact Info</th>
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider text-right">Registered On</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" className="py-12 text-center text-muted">
                    <span className="material-symbols-rounded icon-lg animate-spin text-accent-primary mb-2">refresh</span>
                    <p>Loading directory...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="3" className="py-16 text-center text-muted">
                    <span className="material-symbols-rounded text-4xl mb-2 opacity-50">group_off</span>
                    <p className="font-semibold text-primary">No clients found</p>
                  </td>
                </tr>
              ) : filtered.map((c) => (
                <tr key={c.id} className="border-b border-panel hover:bg-surface-hover cursor-pointer group" onClick={() => navigate(`/customers/${c.id}`)}>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-accent-primary/20 text-accent-primary flex items-center justify-center font-bold text-lg">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-primary group-hover:text-accent-primary transition-colors">{c.name}</div>
                        <div className="text-xs text-muted">ID: {c.id.substring(0,8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-secondary font-medium flex items-center gap-1">
                      <span className="material-symbols-rounded icon-sm text-muted">call</span> {c.phonePrimary || '—'}
                    </div>
                    {c.phoneSecondary && (
                      <div className="text-sm text-muted mt-1 flex items-center gap-1">
                        <span className="material-symbols-rounded icon-sm opacity-70">call</span> {c.phoneSecondary}
                      </div>
                    )}
                    {c.email && (
                      <div className="text-sm text-muted mt-1 flex items-center gap-1">
                        <span className="material-symbols-rounded icon-sm opacity-70">mail</span> {c.email}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right text-sm text-secondary">
                    {new Date(c.createdAt).toLocaleDateString()}
                    <span className="material-symbols-rounded text-muted ml-4 opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward_ios</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <form className="card grid grid-cols-1 md:grid-cols-3 gap-3" onSubmit={createCustomer}>
        <h2 className="md:col-span-3 text-sm font-bold uppercase tracking-wider text-secondary">Create Customer</h2>
        <input
          placeholder="Customer / Company Name *"
          value={newCustomer.name}
          onChange={(e) => setNewCustomer((s) => ({ ...s, name: e.target.value }))}
          required
        />
        <input
          placeholder="Primary Phone *"
          value={newCustomer.phonePrimary}
          onChange={(e) => setNewCustomer((s) => ({ ...s, phonePrimary: e.target.value }))}
          required
        />
        <input
          placeholder="Secondary Phone"
          value={newCustomer.phoneSecondary}
          onChange={(e) => setNewCustomer((s) => ({ ...s, phoneSecondary: e.target.value }))}
        />
        <input
          placeholder="Email"
          value={newCustomer.email}
          onChange={(e) => setNewCustomer((s) => ({ ...s, email: e.target.value }))}
        />
        <div className="flex items-center gap-2">
          <input
            id="new-customer-is-company"
            type="checkbox"
            checked={newCustomer.isCompany}
            onChange={(e) => setNewCustomer((s) => ({ ...s, isCompany: e.target.checked }))}
          />
          <label htmlFor="new-customer-is-company" className="text-sm">Company Account</label>
        </div>
        <div />
        {newCustomer.isCompany && (
          <>
            <input
              placeholder="Company Contact Person"
              value={newCustomer.companyContactPerson}
              onChange={(e) => setNewCustomer((s) => ({ ...s, companyContactPerson: e.target.value }))}
            />
            <input
              placeholder="PAN / Tax ID"
              value={newCustomer.panNumber}
              onChange={(e) => setNewCustomer((s) => ({ ...s, panNumber: e.target.value }))}
            />
          </>
        )}
        <div className="md:col-span-3 flex items-center gap-3">
          <button className="btn btn-primary" type="submit" disabled={creating}>
            {creating ? 'Creating...' : 'Add Customer'}
          </button>
          {createError && <span className="text-danger text-sm">{createError}</span>}
        </div>
      </form>
    </div>
  );
}
