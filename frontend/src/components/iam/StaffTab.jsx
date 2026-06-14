import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '../Modal';
import FormField from '../FormField';

export default function StaffTab() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  
  const initialForm = { fullName: '', email: '', password: '', roleId: '', technicianRank: '', isActive: true };
  const [formData, setFormData] = useState(initialForm);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, rRes] = await Promise.all([
        api.get('/auth/staff'),
        api.get('/auth/roles')
      ]);
      setUsers(uRes.data || []);
      setRoles(rRes.data || []);
      if (rRes.data && rRes.data.length > 0 && !formData.roleId) {
        setFormData(prev => ({ ...prev, roleId: rRes.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingStaffId(null);
    setFormData({
      ...initialForm,
      roleId: roles[0]?.id || ''
    });
    setShowPasswordReset(false);
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setEditingStaffId(user.id);
    setFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      password: '',
      roleId: user.roleId || '',
      technicianRank: user.technicianRank || '',
      isActive: user.isActive ?? true
    });
    setShowPasswordReset(false);
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editingStaffId) {
        // Edit flow
        const payload = {
          fullName: formData.fullName.trim(),
          roleId: formData.roleId,
          technicianRank: formData.technicianRank || null,
          isActive: formData.isActive
        };
        // only submit password if user explicitly reset it
        if (showPasswordReset && formData.password) {
          payload.password = formData.password;
        }
        await api.put(`/auth/staff/${editingStaffId}`, payload);
      } else {
        // Create flow
        await api.post('/auth/staff', {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          roleId: formData.roleId,
          technicianRank: formData.technicianRank || null
        });
      }
      await fetchData();
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save staff record');
    } finally {
      setSaving(false);
    }
  };

  const filtered = users.filter(user => 
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <span className="material-symbols-rounded absolute left-3 top-2.5 text-muted icon-sm">search</span>
          <input
            type="text"
            placeholder="Search by Name, Email, Role..."
            className="pl-9 py-2 text-sm bg-surface border-panel"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
          <button className="btn btn-ghost" onClick={fetchData} title="Refresh">
            {loading ? (
              <span className="loading-spinner spinner-sm"></span>
            ) : (
              <span className="material-symbols-rounded icon-sm">refresh</span>
            )}
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <span className="material-symbols-rounded icon-sm">person_add</span> Enlist Staff Member
          </button>
        </div>
      </div>

      <div className="card p-0 flex flex-col overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-secondary/40 border-b border-panel">
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider">Staff Member</th>
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider">Role</th>
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider">Rank</th>
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-muted flex items-center justify-center gap-2">
                    <span className="material-symbols-rounded animate-spin">progress_activity</span> Loading staff accounts...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-muted">
                    <span className="material-symbols-rounded text-4xl mb-2 opacity-50 block mx-auto w-fit">group</span>
                    No staff records found.
                  </td>
                </tr>
              ) : filtered.map((user) => (
                <tr key={user.id} className="border-b border-panel last:border-0 hover:bg-surface transition-colors cursor-pointer" onClick={() => handleOpenEdit(user)}>
                  <td className="py-4 px-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-secondary/20 text-accent-secondary flex items-center justify-center">
                      <span className="material-symbols-rounded">person</span>
                    </div>
                    <div>
                      <div className="font-bold text-text-primary">{user.fullName}</div>
                      <div className="text-xs text-muted font-mono">{user.email}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm font-semibold text-text-primary">{user.role?.name || 'No Role'}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-xs text-muted font-mono uppercase tracking-wider">{user.technicianRank || '—'}</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {user.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-success/15 text-success border border-success/20">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-danger/15 text-danger border border-danger/20">
                        Suspended
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT STAFF MODAL */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <ModalHeader 
          title={editingStaffId ? 'Edit Staff Profile' : 'Register New Staff'} 
          icon={editingStaffId ? 'edit_document' : 'person_add'} 
          onClose={() => setShowModal(false)} 
        />
        <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
          <ModalBody>
            {error && (
              <div className="p-3 bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg flex items-start gap-2">
                <span className="material-symbols-rounded icon-sm mt-0.5">error</span>
                <div>{error}</div>
              </div>
            )}

            <FormField label="Full Name" required>
              <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required className="w-full" />
            </FormField>

            <FormField label="Email Address" required optionalText={editingStaffId ? "(Cannot change email)" : undefined}>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="w-full" disabled={editingStaffId !== null} />
            </FormField>

            {editingStaffId ? (
              <FormField label="Account Security">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center mb-1">
                    {!showPasswordReset ? (
                      <button type="button" className="text-xs font-bold text-accent-primary hover:underline flex items-center gap-1" onClick={() => setShowPasswordReset(true)}>
                        <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>lock_reset</span> Change Password
                      </button>
                    ) : (
                      <span className="text-[10px] text-muted">Resetting password...</span>
                    )}
                  </div>
                  {showPasswordReset ? (
                    <div className="animate-fade-in bg-surface p-4 rounded-xl border border-panel flex flex-col gap-2">
                      <label className="text-xs font-bold text-text-primary block">New Password</label>
                      <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" className="w-full text-sm" />
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] text-muted">Leave blank to cancel reset</span>
                        <button type="button" className="text-xs text-muted hover:text-danger underline" onClick={() => { setShowPasswordReset(false); setFormData({...formData, password: ''}); }}>Cancel Change</button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted bg-secondary/40 p-3 rounded-lg border border-panel border-dashed">
                      Password is securely hashed. Staff members can log in with their existing credentials.
                    </div>
                  )}
                </div>
              </FormField>
            ) : (
              <FormField label="Temporary Password" required>
                <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required className="w-full" />
              </FormField>
            )}

            <hr className="border-panel my-2" />

            <FormField label="System Role" required>
              <select value={formData.roleId} onChange={e => setFormData({...formData, roleId: e.target.value})} className="w-full">
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>{role.name} ({role.code})</option>
                ))}
              </select>
            </FormField>

            <FormField label="Technician Rank" optionalText="(Optional)">
              <select value={formData.technicianRank} onChange={e => setFormData({...formData, technicianRank: e.target.value})} className="w-full">
                <option value="">— Not a technician —</option>
                <option value="JUNIOR">Junior Technician</option>
                <option value="SENIOR">Senior Technician</option>
                <option value="EXPERT">Expert Technician</option>
                <option value="MASTER">Master Technician</option>
              </select>
            </FormField>

            {editingStaffId && (
              <div className="mt-4 p-4 border border-panel rounded-xl bg-surface">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-bold text-sm">Account Status</div>
                    <div className="text-xs text-muted mt-0.5">{formData.isActive ? 'Staff member has login access' : 'Access revoked'}</div>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer mr-2">
                    <input 
                      type="checkbox" 
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface-hover rounded-full peer peer-checked:bg-accent-primary border border-panel relative transition-colors duration-200 ease-in-out after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-200 peer-checked:after:translate-x-5"></div>
                  </div>
                </label>
              </div>
            )}
          </ModalBody>

          <ModalFooter>
            <button type="button" className="btn btn-ghost flex-1" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
              {saving ? (
                <><span className="material-symbols-rounded animate-spin icon-sm">progress_activity</span> Saving...</>
              ) : (
                <><span className="material-symbols-rounded icon-sm">save</span> {editingStaffId ? 'Save Profile' : 'Register'}</>
              )}
            </button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
