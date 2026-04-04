import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { APP_ROUTES } from '../constants/routes';

const SORT_KEYS = {
  name: (a, b) => a.name.localeCompare(b.name),
  phone: (a, b) => (a.phonePrimary || '').localeCompare(b.phonePrimary || ''),
  date: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState(1); // 1 = asc, -1 = desc
  const navigate = useNavigate();

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data.data || res.data || []);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d * -1);
    } else {
      setSortKey(key);
      setSortDir(1);
    }
  };

  const filtered = customers
    .filter(c =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phonePrimary?.includes(searchTerm) ||
      c.phoneSecondary?.includes(searchTerm) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => SORT_KEYS[sortKey](a, b) * sortDir);

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span className="material-symbols-rounded opacity-30" style={{ fontSize: 14 }}>unfold_more</span>;
    return (
      <span className="material-symbols-rounded" style={{ fontSize: 14, color: 'var(--accent-primary)' }}>
        {sortDir === 1 ? 'arrow_upward' : 'arrow_downward'}
      </span>
    );
  };

  const thClass = "py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider cursor-pointer select-none hover:text-primary transition-colors";

  return (
    <div className="animate-fade-in flex flex-col gap-6 w-full max-w-5xl mx-auto">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold mb-1">Customer Directory</h1>
          <p className="text-secondary">Manage Customers, view their devices, and track billing ledgers.</p>
        </div>
      </header>

      <div className="card p-0 flex flex-col overflow-hidden">

        {/* Toolbar */}
        <div className="p-4 border-b border-panel bg-surface/30 flex justify-between items-center gap-4">
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
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>{filtered.length} {filtered.length === 1 ? 'Customer' : 'Customers'}</span>
          </div>
          <button className="btn btn-primary" onClick={() => navigate(APP_ROUTES.NEW_CUSTOMER)}>
            <span className="material-symbols-rounded icon-sm">person_add</span> New Customer
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-secondary/40 border-b border-panel">
                <th className={thClass} onClick={() => handleSort('name')}>
                  <span className="flex items-center gap-1">Customer Profile <SortIcon col="name" /></span>
                </th>
                <th className={thClass} onClick={() => handleSort('phone')}>
                  <span className="flex items-center gap-1">Contact Info <SortIcon col="phone" /></span>
                </th>
                <th className={`${thClass} text-right`} onClick={() => handleSort('date')}>
                  <span className="flex items-center justify-end gap-1">Registered On <SortIcon col="date" /></span>
                </th>
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
                    <p className="font-semibold text-primary mt-2">No Customers found</p>
                    <button className="btn btn-ghost mt-4 text-sm" onClick={() => navigate(APP_ROUTES.NEW_CUSTOMER)}>
                      <span className="material-symbols-rounded icon-sm">add</span> Register first Customer
                    </button>
                  </td>
                </tr>
              ) : filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-panel hover:bg-surface-hover cursor-pointer group"
                  onClick={() => navigate(`/customers/${c.id}`)}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-accent-primary/20 text-accent-primary flex items-center justify-center font-bold text-lg flex-shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-primary group-hover:text-accent-primary transition-colors">{c.name}</div>
                        <div className="text-xs text-muted font-mono">#{c.id.substring(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-secondary font-medium flex items-center gap-1">
                      <span className="material-symbols-rounded icon-sm text-muted">call</span> {c.phonePrimary || '—'}
                    </div>
                    {c.phoneSecondary && (
                      <div className="text-sm text-muted mt-1 flex items-center gap-1">
                        <span className="material-symbols-rounded icon-sm opacity-60">call</span> {c.phoneSecondary}
                      </div>
                    )}
                    {c.email && (
                      <div className="text-sm text-muted mt-1 flex items-center gap-1">
                        <span className="material-symbols-rounded icon-sm opacity-60">mail</span> {c.email}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right text-sm text-secondary">
                    {new Date(c.createdAt).toLocaleDateString()}
                    <span className="material-symbols-rounded text-muted ml-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontSize: 16 }}>arrow_forward_ios</span>
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
