import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '../Modal';
import FormField from '../FormField';

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
      const [rRes, pRes] = await Promise.all([
        api.get('/auth/roles'),
        api.get('/auth/permissions')
      ]);
      setRoles(rRes.data || []);
      setPermissions(pRes.data || []);
    } catch (err) {
      console.error(err);
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

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingRoleId) {
        await api.put(`/auth/roles/${editingRoleId}`, {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          permissionCodes: formData.permissionCodes
        });
      } else {
        await api.post('/auth/roles', {
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase().replace(/\s+/g, '_'),
          description: formData.description.trim() || null,
          permissionCodes: formData.permissionCodes
        });
      }
      await fetchData();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save role configuration');
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (code) => {
    setFormData(prev => {
      const exists = prev.permissionCodes.includes(code);
      if (exists) {
        return { ...prev, permissionCodes: prev.permissionCodes.filter(c => c !== code) };
      } else {
        return { ...prev, permissionCodes: [...prev.permissionCodes, code] };
      }
    });
  };

  const isSystemRole = (r) => {
    if (!r) return false;
    const systemCodes = ['ADMIN', 'TECHNICIAN', 'FRONT_DESK', 'LOGISTICS', 'FINANCE', 'MANAGER'];
    return r.isSystem || systemCodes.includes(r.code) || r.id?.startsWith('role_');
  };

  const handleDeleteRole = async (role, e) => {
    e.stopPropagation();
    if (isSystemRole(role)) {
      alert("System roles are protected and cannot be deleted.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete the role ${role.name}? This will affect staff assigned to it.`)) return;

    try {
      await api.delete(`/auth/roles/${role.id}`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete role');
    }
  };

  // Group permissions by their prefix (e.g., 'repairs', 'inventory')
  const groupedPermissions = permissions.reduce((acc, p) => {
    const group = p.code.split(':')[0].toUpperCase();
    if (!acc[group]) acc[group] = [];
    acc[group].push(p);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Role Templates</h2>
          <p className="text-sm text-secondary mt-1">Configure role permissions and access templates.</p>
        </div>
        <button className="btn btn-primary w-full sm:w-auto" onClick={handleOpenCreate}>
          <span className="material-symbols-rounded icon-sm">add</span> Create New Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-muted flex items-center justify-center gap-2">
            <span className="material-symbols-rounded animate-spin">progress_activity</span> Loading roles...
          </div>
        ) : roles.map((role) => (
          <div 
            key={role.id} 
            className="card hover:border-accent-primary/40 transition-all cursor-pointer flex flex-col justify-between"
            onClick={() => handleOpenEdit(role)}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs uppercase tracking-wider text-accent-primary bg-accent-primary/10 border border-accent-primary/20 px-2 py-0.5 rounded">
                  {role.code}
                </span>
                {isSystemRole(role) && (
                  <span className="text-[10px] uppercase font-bold text-muted border border-panel px-2 py-0.5 rounded">
                    Protected
                  </span>
                )}
              </div>
              <h3 className="font-bold text-lg text-text-primary">{role.name}</h3>
              <p className="text-sm text-muted mt-2 line-clamp-2">{role.description || 'No description provided.'}</p>
            </div>
            
            <div className="mt-6 pt-4 border-t border-panel flex items-center justify-between">
              <span className="text-xs text-muted font-semibold flex items-center gap-1">
                <span className="material-symbols-rounded text-xs" style={{ fontSize: '14px' }}>key</span>
                {role.permissions?.length || 0} permissions
              </span>
              {!isSystemRole(role) && (
                <button 
                  className="btn btn-ghost p-1.5 hover:bg-danger/20 hover:text-danger rounded"
                  onClick={(e) => handleDeleteRole(role, e)}
                  title="Delete Role"
                >
                  <span className="material-symbols-rounded text-sm" style={{ fontSize: '18px' }}>delete</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT ROLE MODAL */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} maxWidth="max-w-2xl">
        <ModalHeader 
          title={editingRoleId ? 'Edit Role Configuration' : 'Create System Role'} 
          icon="security" 
          onClose={() => setShowModal(false)} 
        />
        <ModalBody>
          <form id="role-form" onSubmit={handleSave} className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Role Name" required>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Finance Officer" required className="w-full" />
              </FormField>
              
              <FormField label="Machine Code" required optionalText="(UNIQUE)">
                <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_')})} placeholder="FINANCE_OFFICER" required className="w-full font-mono text-sm" disabled={editingRoleId !== null} />
              </FormField>
            </div>

            <FormField label="Description">
              <textarea 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                placeholder="Describe what this role is for..." 
                className="w-full min-h-[80px] p-3 text-sm bg-primary border-panel rounded-lg"
              />
            </FormField>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-4 border-b border-panel pb-2">
                <label className="text-base font-bold text-text-primary">Granular Permissions</label>
                <span className="badge">{formData.permissionCodes.length} Selected</span>
              </div>

              <div className="flex flex-col gap-8">
                {Object.entries(groupedPermissions).map(([group, perms]) => (
                  <div key={group} className="card p-5 bg-surface">
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
                              <span className={`font-bold text-sm ${isSelected ? 'text-text-primary' : 'text-text-secondary'}`}>{p.code}</span>
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
        </ModalBody>

        <ModalFooter>
          <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
          <button type="submit" form="role-form" className="btn btn-primary min-w-[120px]" disabled={saving}>
            {saving ? (
              <><span className="material-symbols-rounded animate-spin icon-sm">progress_activity</span> Saving...</>
            ) : (
              <><span className="material-symbols-rounded icon-sm">save</span> {editingRoleId ? 'Save Role' : 'Create Role'}</>
            )}
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
