import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function RolesTab() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', code: '', description: '', permissionCodes: [] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRoles, resPerms] = await Promise.all([
        api.get('/auth/roles'),
        api.get('/auth/permissions')
      ]);
      setRoles(resRoles.data || []);
      setPermissions(resPerms.data || []);
    } catch (err) {
      console.error("Failed to load roles and permissions", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingRoleId(null);
    setFormData({ name: '', code: '', description: '', permissionCodes: [] });
    setShowModal(true);
  };

  const handleOpenEdit = (role) => {
    setEditingRoleId(role.id);
    setFormData({
      name: role.name || '',
      code: role.code || '',
      description: role.description || '',
      permissionCodes: role.permissions?.map(p => p.code) || []
    });
    setShowModal(true);
  };

  const togglePermission = (code) => {
    setFormData(prev => ({
      ...prev,
      permissionCodes: prev.permissionCodes.includes(code)
        ? prev.permissionCodes.filter(c => c !== code)
        : [...prev.permissionCodes, code]
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingRoleId) {
        await api.put(`/auth/roles/${editingRoleId}`, {
          name: formData.name,
          description: formData.description,
          permissionCodes: formData.permissionCodes
        });
      } else {
        await api.post('/auth/roles', formData);
      }
      await fetchData();
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by their prefix before ":" (e.g., "repair:create" -> "repair")
  const groupedPermissions = permissions.reduce((acc, p) => {
    const group = p.code.split(':')[0].toUpperCase();
    if (!acc[group]) acc[group] = [];
    acc[group].push(p);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          System roles define what users can access. Group permissions together into logical roles like 'Admin', 'Finance', or 'Repair Technician'.
        </p>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <span className="material-symbols-rounded icon-sm">add_moderator</span> Create Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-muted flex items-center justify-center gap-2">
            <span className="material-symbols-rounded animate-spin">progress_activity</span> Loading roles...
          </div>
        ) : roles.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted">No roles found.</div>
        ) : roles.map(role => (
          <div key={role.id} className="card p-6 flex flex-col hover:border-accent-primary/50 transition-colors">
            <div className="flex justify-between items-start mb-4 border-b border-panel pb-4">
              <div>
                <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                  {role.name}
                </h3>
                <div className="text-xs font-mono text-muted mt-1 uppercase tracking-wider">{role.code}</div>
              </div>
              <button className="btn btn-ghost p-2" onClick={() => handleOpenEdit(role)} title="Edit Role">
                <span className="material-symbols-rounded text-accent-primary">edit</span>
              </button>
            </div>
            
            <p className="text-sm text-secondary mb-6 flex-1">
              {role.description || 'No description provided.'}
            </p>
            
            <div className="flex justify-between items-end">
              <div className="text-xs font-bold text-muted">
                {role.permissions?.length || 0} Permissions Granted
              </div>
              <div className="flex -space-x-2">
                {role.permissions?.slice(0, 3).map((p, i) => (
                  <div key={p.id} className="w-8 h-8 rounded-full bg-surface border border-panel flex items-center justify-center text-[10px] font-bold z-10 relative" title={p.code} style={{ zIndex: 10 - i }}>
                    {p.code.substring(0, 2).toUpperCase()}
                  </div>
                ))}
                {role.permissions?.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-surface border border-panel flex items-center justify-center text-[10px] font-bold z-0 relative">
                    +{role.permissions.length - 3}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex justify-end animate-fade-in p-0">
          <div className="w-full max-w-2xl h-full bg-secondary border-l border-panel shadow-2xl flex flex-col slide-in-right overflow-hidden">
            <header className="p-6 border-b border-panel flex items-center justify-between bg-surface/50">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-rounded text-accent-primary">security</span> 
                {editingRoleId ? 'Edit Role Configuration' : 'Create System Role'}
              </h2>
              <button type="button" className="btn btn-ghost p-2" onClick={() => setShowModal(false)}>
                <span className="material-symbols-rounded">close</span>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              <form id="role-form" onSubmit={handleSave} className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Role Name *</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Finance Officer" required className="w-full" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block flex justify-between">
                      Machine Code * 
                      <span className="text-[10px] text-muted normal-case font-normal">(UNIQUE)</span>
                    </label>
                    <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_')})} placeholder="FINANCE_OFFICER" required className="w-full font-mono text-sm" disabled={editingRoleId !== null} />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Description</label>
                  <textarea 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    placeholder="Describe what this role is for..." 
                    className="w-full min-h-[80px] p-3 text-sm bg-primary border-panel rounded-lg"
                  />
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-4 border-b border-panel pb-2">
                    <label className="text-base font-bold text-primary">Granular Permissions</label>
                    <span className="badge">{formData.permissionCodes.length} Selected</span>
                  </div>

                  <div className="flex flex-col gap-8">
                    {Object.entries(groupedPermissions).map(([group, perms]) => (
                      <div key={group} className="card p-5 bg-surface/30">
                        <h4 className="text-sm font-bold uppercase tracking-wider mb-4 text-accent-secondary border-b border-panel pb-2">{group} MODULE</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {perms.map(p => {
                            const isSelected = formData.permissionCodes.includes(p.code);
                            return (
                              <label key={p.code} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${isSelected ? 'border-accent-primary bg-accent-primary/10' : 'border-panel hover:border-accent-primary/30'}`}>
                                <div className="mt-0.5">
                                  <input 
                                    type="checkbox" 
                                    checked={isSelected}
                                    onChange={() => togglePermission(p.code)}
                                    className="w-4 h-4 rounded border-panel text-accent-primary bg-primary focus:ring-accent-primary/50 cursor-pointer" 
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <span className={`font-bold text-sm ${isSelected ? 'text-primary' : 'text-secondary'}`}>{p.code}</span>
                                  <span className="text-xs text-muted mt-1 leading-snug">{p.description || 'No description mapping'}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            <footer className="p-6 border-t border-panel bg-secondary/90 flex justify-end gap-3 shrink-0">
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" form="role-form" className="btn btn-primary min-w-[120px]" disabled={saving}>
                {saving ? (
                  <><span className="material-symbols-rounded animate-spin icon-sm">progress_activity</span> Saving...</>
                ) : (
                  <><span className="material-symbols-rounded icon-sm">save</span> {editingRoleId ? 'Save Role' : 'Create Role'}</>
                )}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
