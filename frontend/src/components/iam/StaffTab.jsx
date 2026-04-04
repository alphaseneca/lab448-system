import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function StaffTab() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  
  const initialForm = { fullName: '', email: '', password: '', roleId: '', technicianRank: '', isActive: true };
  const [formData, setFormData] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffRes, rolesRes] = await Promise.all([
        api.get('/auth/staff'),
        api.get('/auth/roles')
      ]);
      setUsers(staffRes.data || []);
      setRoles(rolesRes.data || []);
    } catch (err) {
      console.error("Failed to load IAM data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingStaffId(null);
    setFormData({ ...initialForm, roleId: roles[0]?.id || '' });
    setShowPasswordReset(false);
    setShowModal(true);
  };

  const handleOpenEdit = (staff) => {
    setEditingStaffId(staff.id);
    setFormData({
      fullName: staff.fullName || '',
      email: staff.email || '',
      password: '', // Leave blank for edit
      roleId: staff.roleId || '',
      technicianRank: staff.technicianRank || '',
      isActive: staff.isActive,
    });
    setShowPasswordReset(false);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingStaffId) {
        // Edit Mode
        const payload = {
          fullName: formData.fullName,
          email: formData.email,
          roleId: formData.roleId,
          technicianRank: formData.technicianRank || null,
          isActive: formData.isActive,
          ...(formData.password ? { password: formData.password } : {})
        };
        await api.put(`/auth/staff/${editingStaffId}`, payload);
      } else {
        // Create Mode
        await api.post('/auth/staff', {
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          roleId: formData.roleId,
          technicianRank: formData.technicianRank || null,
        });
      }
      await fetchData();
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save staff member");
    } finally {
      setSaving(false);
    }
  };

  const filtered = users.filter(u =>
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="relative w-80">
          <span className="material-symbols-rounded absolute left-3 top-2.5 text-muted icon-sm">search</span>
          <input
            type="text"
            placeholder="Search personnel..."
            className="pl-9 py-2 text-sm bg-surface border-panel"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost" onClick={fetchData}>
            <span className={`material-symbols-rounded icon-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <span className="material-symbols-rounded icon-sm">person_add</span> Enlist Staff
          </button>
        </div>
      </div>

      <div className="card p-0 flex flex-col overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-secondary/40 border-b border-panel">
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider">Employee</th>
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider">Contact</th>
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider">Role & Rank</th>
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-muted flex items-center justify-center gap-2">
                    <span className="material-symbols-rounded animate-spin">progress_activity</span> Loading personnel data...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-muted">No staff found.</td>
                </tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="border-b border-panel hover:bg-surface-hover transition-colors cursor-pointer" onClick={() => handleOpenEdit(u)}>
                  <td className="py-4 px-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-primary/20 text-accent-primary flex items-center justify-center font-bold text-lg border border-accent-primary/30 shadow-inner">
                      {u.fullName?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-primary">{u.fullName}</div>
                      <div className="text-xs text-muted mt-0.5 font-mono opacity-60">ID: {u.id.substring(0, 8)}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm font-medium">{u.email}</div>
                    <div className="text-xs text-muted mt-0.5 flex items-center gap-1">
                      <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>call</span>
                      {u.phone || 'No direct dial'}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col items-start gap-1">
                      <span className="badge badge-primary">{u.role?.name || 'Unassigned'}</span>
                      {u.technicianRank && (
                        <span className="badge" style={{ backgroundColor: 'rgba(100,200,255,0.1)', color: '#64c8ff' }}>
                          Tech Rank: {u.technicianRank}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {u.isActive ? (
                      <span className="text-success text-sm font-bold flex items-center justify-end gap-1 px-2 py-1 bg-success/10 rounded-md inline-flex border border-success/20">
                        <span className="material-symbols-rounded icon-sm">check_circle</span> Active
                      </span>
                    ) : (
                      <span className="text-danger text-sm font-bold flex items-center justify-end gap-1 px-2 py-1 bg-danger/10 rounded-md inline-flex border border-danger/20">
                        <span className="material-symbols-rounded icon-sm">cancel</span> Suspended
                      </span>
                    )}
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
                <span className="material-symbols-rounded text-accent-primary">{editingStaffId ? 'edit_document' : 'person_add'}</span> 
                {editingStaffId ? 'Edit Staff Profile' : 'Register New Staff'}
              </h2>
              <button type="button" className="btn btn-ghost p-2" onClick={() => setShowModal(false)}>
                <span className="material-symbols-rounded">close</span>
              </button>
            </header>

            <form onSubmit={handleSave} className="p-6 flex flex-col gap-6 flex-1">
              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Full Name *</label>
                <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required className="w-full" />
              </div>
              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Email Address *</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="w-full" disabled={editingStaffId !== null} />
                {editingStaffId && <p className="text-xs text-muted mt-1">Email cannot be changed after registration.</p>}
              </div>

              {editingStaffId ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider block border-b-0 m-0">Account Security</label>
                    {!showPasswordReset && (
                      <button type="button" className="text-xs font-bold text-accent-primary hover:underline flex items-center gap-1" onClick={() => setShowPasswordReset(true)}>
                        <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>lock_reset</span> Change Password
                      </button>
                    )}
                  </div>
                  
                  {showPasswordReset ? (
                    <div className="animate-fade-in bg-surface p-4 rounded-xl border border-panel flex flex-col gap-2">
                      <label className="text-xs font-bold text-primary block">New Password</label>
                      <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" className="w-full text-sm" />
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] text-muted">Leave blank to cancel reset</span>
                        <button type="button" className="text-xs text-muted hover:text-danger underline" onClick={() => { setShowPasswordReset(false); setFormData({...formData, password: ''}); }}>Cancel Change</button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted bg-surface/50 p-3 rounded-lg border border-panel border-dashed">
                      Password is securely hashed. Staff members can log in with their existing credentials.
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Temporary Password *</label>
                  <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required className="w-full" />
                </div>
              )}

              <hr className="border-panel my-2" />

              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">System Role *</label>
                <div className="relative">
                  <select value={formData.roleId} onChange={e => setFormData({...formData, roleId: e.target.value})} className="w-full bg-primary appearance-none cursor-pointer">
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name} ({role.code})</option>
                    ))}
                  </select>
                  <span className="material-symbols-rounded absolute right-3 top-2.5 text-muted pointer-events-none">expand_more</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block flex items-center justify-between">
                  <span>Technician Rank</span>
                  <span className="text-muted normal-case font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <select value={formData.technicianRank} onChange={e => setFormData({...formData, technicianRank: e.target.value})} className="w-full bg-primary appearance-none cursor-pointer">
                    <option value="">— Not a technician —</option>
                    <option value="JUNIOR">Junior Technician</option>
                    <option value="SENIOR">Senior Technician</option>
                    <option value="EXPERT">Expert Technician</option>
                    <option value="MASTER">Master Technician</option>
                  </select>
                  <span className="material-symbols-rounded absolute right-3 top-2.5 text-muted pointer-events-none">expand_more</span>
                </div>
              </div>

              {editingStaffId && (
                <div className="mt-4 p-4 border border-panel rounded-xl bg-surface">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-bold text-sm">Account Status</div>
                      <div className="text-xs text-muted mt-0.5">{formData.isActive ? 'Staff member has login access' : 'Access revoked'}</div>
                    </div>
                    <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input 
                        type="checkbox" 
                        name="toggle" 
                        id="toggle" 
                        checked={formData.isActive}
                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out focus:outline-none"
                        style={{
                          transform: formData.isActive ? 'translateX(100%)' : 'translateX(0)',
                          borderColor: formData.isActive ? 'var(--accent-primary)' : 'var(--panel-border)'
                        }}
                      />
                      <label 
                        htmlFor="toggle" 
                        className="toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in-out"
                        style={{
                          backgroundColor: formData.isActive ? 'var(--accent-primary)' : 'var(--panel-border)'
                        }}
                      ></label>
                    </div>
                  </label>
                </div>
              )}

              <div className="mt-auto pt-6 border-t border-panel flex gap-3 pb-8">
                <button type="button" className="btn btn-ghost flex-1" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
                  {saving ? (
                    <><span className="material-symbols-rounded animate-spin icon-sm">progress_activity</span> Saving...</>
                  ) : (
                    <><span className="material-symbols-rounded icon-sm">save</span> {editingStaffId ? 'Save Profile' : 'Register'}</>
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
