import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { printBarcodeLabel } from '../utils/printService';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '../components/Modal';
import FormField from '../components/FormField';

export default function InventoryPage() {
  const { hasPermission } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const initialForm = {
    sku: '',
    name: '',
    description: '',
    category: '',
    unitCostPrice: '',
    unitSellPrice: '',
    availableQuantity: 0,
    reorderThreshold: 0
  };
  const [form, setForm] = useState(initialForm);

  // Detail / Edit Modal State
  const [selectedPart, setSelectedPart] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editError, setEditError] = useState('');
  const [updating, setUpdating] = useState(false);

  // Intake State
  const [addStockQty, setAddStockQty] = useState('');
  const [addStockNotes, setAddStockNotes] = useState('');
  const [addingStock, setAddingStock] = useState(false);
  const [addStockError, setAddStockError] = useState('');

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
        description: form.description.trim() || null,
        category: form.category.trim() || 'GENERAL',
        unitCostPrice: Number(form.unitCostPrice || 0),
        unitSellPrice: Number(form.unitSellPrice || 0),
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

  const handleRowClick = (item) => {
    setSelectedPart(item);
    setIsEditing(false);
    setEditForm({
      sku: item.sku || '',
      name: item.name || '',
      description: item.description || '',
      category: item.category || 'GENERAL',
      unitCostPrice: item.unitCostPrice || '',
      unitSellPrice: item.unitSellPrice || '',
      reorderThreshold: item.reorderThreshold || 0,
    });
    setEditError('');
    setAddStockQty('');
    setAddStockNotes('');
    setAddStockError('');
  };

  const handleUpdatePart = async (e) => {
    e.preventDefault();
    setEditError('');
    setUpdating(true);
    try {
      const res = await api.put(`/inventory/parts/${selectedPart.id}`, {
        sku: editForm.sku.trim() || null,
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        category: editForm.category.trim() || 'GENERAL',
        unitCostPrice: Number(editForm.unitCostPrice || 0),
        unitSellPrice: Number(editForm.unitSellPrice || 0),
        reorderThreshold: Number(editForm.reorderThreshold || 0),
      });
      const updatedPart = res.data;
      setInventory(prev => prev.map(item => item.id === selectedPart.id ? updatedPart : item));
      setSelectedPart(updatedPart);
      setIsEditing(false);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update part');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!addStockQty || Number(addStockQty) <= 0) {
      setAddStockError('Please enter a positive quantity.');
      return;
    }
    setAddStockError('');
    setAddingStock(true);
    try {
      const res = await api.post(`/inventory/parts/${selectedPart.id}/add-stock`, {
        quantity: Number(addStockQty),
        notes: addStockNotes.trim() || 'Manual stock intake',
      });
      const updatedPart = res.data;
      setInventory(prev => prev.map(item => item.id === selectedPart.id ? updatedPart : item));
      setSelectedPart(updatedPart);
      setAddStockQty('');
      setAddStockNotes('');
    } catch (err) {
      setAddStockError(err.response?.data?.message || 'Failed to add stock');
    } finally {
      setAddingStock(false);
    }
  };

  const handleDeletePart = async () => {
    if (!window.confirm(`Are you sure you want to disable ${selectedPart.name}?`)) return;
    try {
      await api.delete(`/inventory/parts/${selectedPart.id}`);
      setInventory(prev => prev.filter(item => item.id !== selectedPart.id));
      setSelectedPart(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to disable part');
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
    <div className="animate-fade-in flex flex-col gap-6 w-full pb-12">
      <header className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold mb-1">Parts & Inventory</h1>
          <p className="text-secondary tracking-wide">Manage stock levels, SKUs, and reorder alerts.</p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <span className="material-symbols-rounded absolute left-3 top-2.5 text-muted icon-sm">search</span>
          <input
            type="text"
            placeholder="Search SKU or Part Name..."
            className="pl-9 py-2 text-sm bg-surface border-panel"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 justify-between md:justify-end w-full md:w-auto">
          <button className="btn btn-ghost" onClick={fetchInventory} title="Refresh">
            {loading ? (
              <span className="loading-spinner spinner-sm"></span>
            ) : (
              <span className="material-symbols-rounded icon-sm">refresh</span>
            )}
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
              <tr className="bg-surface border-b border-panel">
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
                <tr key={item.id} className="border-b border-panel hover:bg-surface-hover transition-colors cursor-pointer" onClick={() => handleRowClick(item)}>
                  <td className="py-4 px-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-secondary/20 text-accent-secondary flex items-center justify-center">
                      <span className="material-symbols-rounded icon-sm">build</span>
                    </div>
                    <div>
                      <div className="font-bold text-text-primary">{item.name}</div>
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
                  <td className="py-4 px-6 text-right font-medium text-text-primary">Rs. {Number(item.unitCostPrice || 0).toFixed(2)}</td>
                  <td className="py-4 px-6 text-right">
                    <button className="btn btn-secondary py-1 px-3 text-xs inline-flex items-center gap-1 hover:bg-primary" onClick={(e) => handlePrintBarcode(item, e)}>
                      <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>print</span> Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <ModalHeader title="Add Inventory Part" icon="add_box" onClose={() => setShowModal(false)} />
        <form onSubmit={createPart} className="flex-1 flex flex-col overflow-hidden">
          <ModalBody>
            {createError && (
              <div className="p-3 bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg flex items-start gap-2">
                <span className="material-symbols-rounded icon-sm mt-0.5">error</span>
                <div>{createError}</div>
              </div>
            )}
            
            <FormField label="Part Name" required>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. LCD Screen" required className="w-full" />
            </FormField>
            
            <FormField label="Inventory SKU" optionalText="(Optional)">
              <div className="flex gap-2">
                <input type="text" value={form.sku} onChange={e => setForm({...form, sku: e.target.value.toUpperCase().replace(/\s+/g, '_')})} placeholder="LABSKU-..." className="w-full font-mono text-sm uppercase" />
                <button type="button" className="btn btn-secondary whitespace-nowrap" onClick={() => setForm(s => ({ ...s, sku: `LABSKU-${Math.floor(1000 + Math.random() * 9000)}` }))}>
                  <span className="material-symbols-rounded icon-sm">magic_button</span> Auto
                </button>
              </div>
            </FormField>

            <FormField label="Category">
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full">
                <option value="">GENERAL</option>
                <option value="SCREEN">SCREEN</option>
                <option value="BATTERY">BATTERY</option>
                <option value="MOTHERBOARD">MOTHERBOARD</option>
                <option value="CASING">CASING</option>
              </select>
            </FormField>

            <FormField label="Description / Specifications">
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Add specs, compatible models, notes..." className="w-full h-20 py-2 px-3 text-sm bg-primary border-panel" />
            </FormField>

            <hr className="border-panel" />

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Initial Stock">
                <input type="number" min="0" value={form.availableQuantity} onChange={e => setForm({...form, availableQuantity: e.target.value})} className="w-full text-center" />
              </FormField>
              <FormField label="Min Reorder">
                <input type="number" min="0" value={form.reorderThreshold} onChange={e => setForm({...form, reorderThreshold: e.target.value})} className="w-full text-center" />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Unit Cost (Rs.)">
                <input type="number" step="0.01" min="0" value={form.unitCostPrice} onChange={e => setForm({...form, unitCostPrice: e.target.value})} className="w-full" placeholder="0.00" />
              </FormField>
              <FormField label="Unit Sell Price (Rs.)">
                <input type="number" step="0.01" min="0" value={form.unitSellPrice} onChange={e => setForm({...form, unitSellPrice: e.target.value})} className="w-full" placeholder="0.00" />
              </FormField>
            </div>
          </ModalBody>

          <ModalFooter>
            <button type="button" className="btn btn-ghost flex-1" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary flex-1" disabled={creating}>
              {creating ? (
                <><span className="material-symbols-rounded animate-spin icon-sm">progress_activity</span> Saving...</>
              ) : (
                <><span className="material-symbols-rounded icon-sm">inventory</span> Create Part</>
              )}
            </button>
          </ModalFooter>
        </form>
      </Modal>

      {/* DETAIL / EDIT MODAL */}
      <Modal isOpen={!!selectedPart} onClose={() => setSelectedPart(null)}>
        <ModalHeader title={isEditing ? 'Edit Part Details' : 'Part Specifications'} icon="inventory" onClose={() => setSelectedPart(null)} />
        {isEditing ? (
          <form onSubmit={handleUpdatePart} className="flex-1 flex flex-col overflow-hidden">
            <ModalBody>
              {editError && (
                <div className="p-3 bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg flex items-start gap-2">
                  <span className="material-symbols-rounded icon-sm mt-0.5">error</span>
                  <div>{editError}</div>
                </div>
              )}

              <FormField label="Part Name" required>
                <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required className="w-full" />
              </FormField>

              <FormField label="Inventory SKU">
                <input type="text" value={editForm.sku} onChange={e => setEditForm({...editForm, sku: e.target.value.toUpperCase().replace(/\s+/g, '_')})} className="w-full font-mono text-sm uppercase" />
              </FormField>

              <FormField label="Category">
                <select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} className="w-full">
                  <option value="GENERAL">GENERAL</option>
                  <option value="SCREEN">SCREEN</option>
                  <option value="BATTERY">BATTERY</option>
                  <option value="MOTHERBOARD">MOTHERBOARD</option>
                  <option value="CASING">CASING</option>
                </select>
              </FormField>

              <FormField label="Description / Specifications">
                <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full h-24 py-2 px-3 text-sm bg-primary border-panel" />
              </FormField>

              <hr className="border-panel" />

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Min Reorder Threshold">
                  <input type="number" min="0" value={editForm.reorderThreshold} onChange={e => setEditForm({...editForm, reorderThreshold: e.target.value})} className="w-full text-center" />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Unit Cost (Rs.)">
                  <input type="number" step="0.01" min="0" value={editForm.unitCostPrice} onChange={e => setEditForm({...editForm, unitCostPrice: e.target.value})} className="w-full" />
                </FormField>
                <FormField label="Unit Sell Price (Rs.)">
                  <input type="number" step="0.01" min="0" value={editForm.unitSellPrice} onChange={e => setEditForm({...editForm, unitSellPrice: e.target.value})} className="w-full" />
                </FormField>
              </div>
            </ModalBody>

            <ModalFooter>
              <button type="button" className="btn btn-ghost flex-1" onClick={() => setIsEditing(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary flex-1" disabled={updating}>
                {updating ? (
                  <><span className="material-symbols-rounded animate-spin icon-sm">progress_activity</span> Saving...</>
                ) : (
                  <><span className="material-symbols-rounded icon-sm">save</span> Save Changes</>
                )}
              </button>
            </ModalFooter>
          </form>
        ) : selectedPart && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <ModalBody>
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-accent-secondary/20 text-accent-secondary px-2.5 py-1 rounded-full border border-accent-secondary/30">
                  {selectedPart.category || 'GENERAL'}
                </span>
                <h3 className="text-2xl font-bold mt-3 text-text-primary">{selectedPart.name}</h3>
                <p className="font-mono text-xs text-muted mt-1 opacity-70">SKU: {selectedPart.sku || 'N/A'}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Description / Specifications</h4>
                <p className="text-sm text-text-secondary bg-primary p-3 rounded-xl border border-panel leading-relaxed whitespace-pre-wrap">
                  {selectedPart.description || <span className="italic text-muted opacity-50">No additional specifications provided for this part.</span>}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface border border-panel p-4 rounded-xl">
                  <div className="text-xs font-semibold text-muted uppercase tracking-wide">Available Stock</div>
                  <div className={`text-2xl font-extrabold mt-1 ${(selectedPart.availableQuantity || 0) <= (selectedPart.reorderThreshold || 0) ? 'text-danger' : 'text-success'}`}>
                    {selectedPart.availableQuantity ?? 0}
                  </div>
                </div>
                <div className="bg-surface border border-panel p-4 rounded-xl">
                  <div className="text-xs font-semibold text-muted uppercase tracking-wide">Min Reorder</div>
                  <div className="text-2xl font-extrabold text-text-primary mt-1">
                    {selectedPart.reorderThreshold ?? 0}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface border border-panel p-4 rounded-xl">
                  <div className="text-xs font-semibold text-muted uppercase tracking-wide">Unit Cost Price</div>
                  <div className="text-lg font-bold text-text-secondary mt-1">
                    Rs. {Number(selectedPart.unitCostPrice || 0).toFixed(2)}
                  </div>
                </div>
                <div className="bg-surface border border-panel p-4 rounded-xl">
                  <div className="text-xs font-semibold text-muted uppercase tracking-wide">Unit Sell Price</div>
                  <div className="text-lg font-bold text-text-secondary mt-1">
                    Rs. {Number(selectedPart.unitSellPrice || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {hasPermission('inventory:manage') && (
                <>
                  <hr className="border-panel" />
                  <div className="bg-surface border border-panel p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">Intake / Receive New Stock</h4>
                    {addStockError && (
                      <div className="mb-3 text-xs text-danger flex items-center gap-1">
                        <span className="material-symbols-rounded icon-xs">error</span> {addStockError}
                      </div>
                    )}
                    <form onSubmit={handleAddStock} className="flex flex-col gap-3">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          value={addStockQty}
                          onChange={e => setAddStockQty(e.target.value)}
                          placeholder="Qty"
                          className="w-24 text-center text-sm"
                        />
                        <input
                          type="text"
                          value={addStockNotes}
                          onChange={e => setAddStockNotes(e.target.value)}
                          placeholder="Notes (e.g. Supplier invoice ref)"
                          className="flex-1 text-sm"
                        />
                      </div>
                      <button type="submit" className="btn btn-secondary text-xs py-1.5 flex items-center justify-center gap-1 w-full" disabled={addingStock}>
                        {addingStock ? 'Receiving...' : <><span className="material-symbols-rounded icon-xs">add</span> Add to Stock</>}
                      </button>
                    </form>
                  </div>
                </>
              )}
            </ModalBody>

            <ModalFooter className="flex gap-2">
              <button type="button" className="btn btn-ghost py-2 px-4" onClick={() => setSelectedPart(null)}>Close</button>
              {hasPermission('inventory:manage') && (
                <>
                  <button type="button" className="btn btn-secondary flex-1 py-2 px-4 flex items-center justify-center gap-1" onClick={() => setIsEditing(true)}>
                    <span className="material-symbols-rounded icon-sm">edit</span> Edit Details
                  </button>
                  <button type="button" className="btn btn-ghost hover:bg-danger/20 hover:text-danger p-2" onClick={handleDeletePart} title="Disable/Delete Part">
                    <span className="material-symbols-rounded">delete</span>
                  </button>
                </>
              )}
            </ModalFooter>
          </div>
        )}
      </Modal>
    </div>
  );
}
