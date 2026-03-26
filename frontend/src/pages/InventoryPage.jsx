import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function InventoryPage() {
  const { hasPermission } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({
    sku: '',
    name: '',
    category: '',
    unitCostPrice: '',
    availableQuantity: 0,
    reorderThreshold: 0,
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/inventory/parts');
      setInventory(res.data || []);
    } catch (err) {
      console.error("Failed to load inventory", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = inventory.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const createPart = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      await api.post('/inventory/parts', {
        sku: form.sku.trim() || null,
        name: form.name.trim(),
        category: form.category.trim() || 'GENERAL',
        unitCostPrice: Number(form.unitCostPrice || 0),
        availableQuantity: Number(form.availableQuantity || 0),
        reorderThreshold: Number(form.reorderThreshold || 0),
      });
      setForm({
        sku: '',
        name: '',
        category: '',
        unitCostPrice: '',
        availableQuantity: 0,
        reorderThreshold: 0,
      });
      await fetchInventory();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create part');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6 w-full max-w-6xl mx-auto">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold mb-1">Parts & Inventory</h1>
          <p className="text-secondary tracking-wide">Manage stock levels, SKUs, and reorder alerts.</p>
        </div>
        {hasPermission('inventory:manage') && (
          <button className="btn btn-primary" onClick={() => document.getElementById('new-inventory-part-form')?.scrollIntoView({ behavior: 'smooth' })}>
            <span className="material-symbols-rounded icon-sm">add</span> Add Inventory Item
          </button>
        )}
      </header>

      {hasPermission('inventory:manage') && (
        <form id="new-inventory-part-form" className="card grid grid-cols-1 md:grid-cols-3 gap-3" onSubmit={createPart}>
          <input
            placeholder="Part Name *"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            required
          />
          <input
            placeholder="SKU (optional)"
            value={form.sku}
            onChange={(e) => setForm((s) => ({ ...s, sku: e.target.value }))}
          />
          <input
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
          />
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Unit Cost"
            value={form.unitCostPrice}
            onChange={(e) => setForm((s) => ({ ...s, unitCostPrice: e.target.value }))}
          />
          <input
            type="number"
            min="0"
            placeholder="Initial Stock"
            value={form.availableQuantity}
            onChange={(e) => setForm((s) => ({ ...s, availableQuantity: e.target.value }))}
          />
          <input
            type="number"
            min="0"
            placeholder="Reorder Threshold"
            value={form.reorderThreshold}
            onChange={(e) => setForm((s) => ({ ...s, reorderThreshold: e.target.value }))}
          />
          <div className="md:col-span-3 flex items-center gap-3">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setForm((s) => ({ ...s, sku: '' }))}
            >
              Auto SKU (LABSKU-*)
            </button>
            <button className="btn btn-primary" type="submit" disabled={creating}>
              {creating ? 'Adding...' : 'Create Part'}
            </button>
            {createError && <span className="text-danger text-sm">{createError}</span>}
          </div>
        </form>
      )}

      <div className="card p-0 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-panel bg-surface/30 flex justify-between items-center">
          <div className="relative w-72">
            <span className="material-symbols-rounded absolute left-3 top-2.5 text-muted icon-sm">search</span>
            <input 
              type="text" 
              placeholder="Search SKU or Part Name..." 
              className="pl-9 py-2 text-sm bg-primary border-panel"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-ghost" onClick={fetchInventory}>
             <span className={`material-symbols-rounded icon-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-secondary/40 border-b border-panel">
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider">SKU / Item</th>
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider text-right">In Stock</th>
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider text-right">Min Reorder</th>
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider text-right">Unit Cost</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-muted">Loading inventory data...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-muted">
                     <span className="material-symbols-rounded text-4xl mb-2 opacity-50">inventory_2</span>
                     <p>Stock catalog is currently empty.</p>
                  </td>
                </tr>
              ) : filtered.map(item => (
                <tr key={item.id} className="border-b border-panel hover:bg-surface-hover">
                  <td className="py-4 px-6">
                    <div className="font-bold text-primary">{item.name}</div>
                    <div className="text-xs text-muted font-mono">{item.sku || '—'}</div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className={`font-extrabold text-lg ${(item.availableQuantity || 0) <= (item.reorderThreshold || 0) ? 'text-danger' : 'text-success'}`}>
                      {item.availableQuantity ?? 0}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right text-muted">{item.reorderThreshold ?? 0}</td>
                  <td className="py-4 px-6 text-right font-medium">${Number(item.unitCostPrice || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
