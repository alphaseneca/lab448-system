import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { printBarcodeLabel } from '../components/BarcodeLabelPrint';

export default function InventoryPage() {
  const { hasPermission } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  
  const initialForm = { sku: '', name: '', category: '', unitCostPrice: '', availableQuantity: 0, reorderThreshold: 0 };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
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

  const handleOpenCreate = () => {
    setForm(initialForm);
    setCreateError('');
    setShowModal(true);
  };

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
      await fetchInventory();
      setShowModal(false);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create part');
    } finally {
      setCreating(false);
    }
  };

  const handlePrintBarcode = (item, e) => {
    e.stopPropagation();
    if (!item.sku) {
      alert("This part has no SKU assigned.");
      return;
    }
    printBarcodeLabel(item.name || "Item", item.sku, {});
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6 w-full max-w-6xl mx-auto pb-12">
      <header className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold mb-1">Parts & Inventory</h1>
          <p className="text-secondary tracking-wide">Manage stock levels, SKUs, and reorder alerts.</p>
        </div>
      </header>

      <div className="flex items-center justify-between">
        <div className="relative w-80">
          <span className="material-symbols-rounded absolute left-3 top-2.5 text-muted icon-sm">search</span>
          <input
            type="text"
            placeholder="Search SKU or Part Name..."
            className="pl-9 py-2 text-sm bg-surface border-panel"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost" onClick={fetchInventory}>
            <span className={`material-symbols-rounded icon-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
          </button>
          {hasPermission('inventory:manage') && (
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              <span className="material-symbols-rounded icon-sm">add_box</span> Add Inventory Item
            </button>
          )}
        </div>
      </div>

      <div className="card p-0 flex flex-col overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-secondary/40 border-b border-panel">
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider">SKU / Item</th>
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider text-right">In Stock</th>
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider text-right">Min Reorder</th>
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider text-right">Unit Cost</th>
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider text-right">Label</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-muted flex items-center justify-center gap-2">
                    <span className="material-symbols-rounded animate-spin">progress_activity</span> Loading inventory...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-muted">
                     <span className="material-symbols-rounded text-4xl mb-2 opacity-50 block mx-auto w-fit">inventory_2</span>
                     <p>Stock catalog is currently empty.</p>
                  </td>
                </tr>
              ) : filtered.map(item => (
                <tr key={item.id} className="border-b border-panel hover:bg-surface-hover transition-colors">
                  <td className="py-4 px-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-secondary/20 text-accent-secondary flex items-center justify-center">
                      <span className="material-symbols-rounded icon-sm">build</span>
                    </div>
                    <div>
                      <div className="font-bold text-primary">{item.name}</div>
                      <div className="text-xs text-muted font-mono tracking-wider opacity-60">{item.sku || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className={`font-extrabold text-lg flex items-center justify-end gap-1 ${(item.availableQuantity || 0) <= (item.reorderThreshold || 0) ? 'text-danger' : 'text-success'}`}>
                      {(item.availableQuantity || 0) <= (item.reorderThreshold || 0) && (
                         <span className="material-symbols-rounded icon-sm text-danger">warning</span>
                      )}
                      {item.availableQuantity ?? 0}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right text-muted">{item.reorderThreshold ?? 0}</td>
                  <td className="py-4 px-6 text-right font-medium text-primary">Rs. {Number(item.unitCostPrice || 0).toFixed(2)}</td>
                  <td className="py-4 px-6 text-right">
                    <button className="btn btn-secondary py-1 px-3 text-xs flex items-center gap-1 inline-flex hover:bg-primary" onClick={(e) => handlePrintBarcode(item, e)}>
                      <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>print</span> Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex justify-end animate-fade-in p-0">
          <div className="w-full max-w-md h-full bg-secondary border-l border-panel shadow-2xl flex flex-col slide-in-right overflow-y-auto">
            <header className="p-6 border-b border-panel flex items-center justify-between sticky top-0 bg-secondary/90 backdrop-blur z-10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-rounded text-accent-primary">add_box</span> Add Inventory Part
              </h2>
              <button type="button" className="btn btn-ghost p-2" onClick={() => setShowModal(false)}>
                <span className="material-symbols-rounded">close</span>
              </button>
            </header>

            <form onSubmit={createPart} className="p-6 flex flex-col gap-6 flex-1">
              {createError && (
                <div className="p-3 bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg flex items-start gap-2">
                  <span className="material-symbols-rounded icon-sm mt-0.5">error</span>
                  <div>{createError}</div>
                </div>
              )}
              
              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Part Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. LCD Screen" required className="w-full" />
              </div>
              
              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block flex justify-between">
                  Inventory SKU <span className="text-[10px] text-muted normal-case font-normal">(Optional)</span>
                </label>
                <div className="flex gap-2">
                  <input type="text" value={form.sku} onChange={e => setForm({...form, sku: e.target.value.toUpperCase().replace(/\s+/g, '_')})} placeholder="LABSKU-..." className="w-full font-mono text-sm uppercase" />
                  <button type="button" className="btn btn-secondary whitespace-nowrap" onClick={() => setForm(s => ({ ...s, sku: `LABSKU-${Math.floor(1000 + Math.random() * 9000)}` }))}>
                    <span className="material-symbols-rounded icon-sm">magic_button</span> Auto
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Category</label>
                <div className="relative">
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-primary appearance-none cursor-pointer">
                    <option value="">GENERAL</option>
                    <option value="SCREEN">SCREEN</option>
                    <option value="BATTERY">BATTERY</option>
                    <option value="MOTHERBOARD">MOTHERBOARD</option>
                    <option value="CASING">CASING</option>
                  </select>
                  <span className="material-symbols-rounded absolute right-3 top-2.5 text-muted pointer-events-none">expand_more</span>
                </div>
              </div>

              <hr className="border-panel my-2" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Initial Stock</label>
                  <input type="number" min="0" value={form.availableQuantity} onChange={e => setForm({...form, availableQuantity: e.target.value})} className="w-full text-center" />
                </div>
                <div>
                  <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block flex items-center gap-1">
                    Min Reorder <span className="material-symbols-rounded text-disabled" style={{ fontSize: '14px' }}>help</span>
                  </label>
                  <input type="number" min="0" value={form.reorderThreshold} onChange={e => setForm({...form, reorderThreshold: e.target.value})} className="w-full text-center" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Unit Cost (Rs.)</label>
                <input type="number" step="0.01" min="0" value={form.unitCostPrice} onChange={e => setForm({...form, unitCostPrice: e.target.value})} className="w-full" placeholder="0.00" />
              </div>

              <div className="mt-auto pt-6 border-t border-panel flex gap-3 pb-8">
                <button type="button" className="btn btn-ghost flex-1" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-1" disabled={creating}>
                  {creating ? (
                    <><span className="material-symbols-rounded animate-spin icon-sm">progress_activity</span> Saving...</>
                  ) : (
                    <><span className="material-symbols-rounded icon-sm">inventory</span> Create Part</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
