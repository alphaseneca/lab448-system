import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '', roleId: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/staff');
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to load staff", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get('/auth/roles');
      setRoles(res.data || []);
      setNewUser((prev) => ({
        ...prev,
        roleId: prev.roleId || res.data?.[0]?.id || '',
      }));
    } catch (err) {
      console.error('Failed to load roles', err);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/auth/staff', {
        fullName: newUser.fullName,
        email: newUser.email,
        password: newUser.password,
        roleId: newUser.roleId,
      });
      await fetchUsers();
      setShowModal(false);
      setNewUser({ fullName: '', email: '', password: '', roleId: roles[0]?.id || '' });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create staff member");
    } finally {
      setCreating(false);
    }
  };

  const filtered = users.filter(u => 
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in flex flex-col gap-6 w-full max-w-5xl mx-auto">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold mb-1">Staff Directory</h1>
          <p className="text-secondary tracking-wide">Manage system administrators, technicians, and their access roles.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <span className="material-symbols-rounded icon-sm">person_add</span> Enlist Staff
        </button>
      </header>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
          <form onSubmit={handleCreateStaff} className="card w-full max-w-md flex flex-col gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
              <span className="material-symbols-rounded text-accent-primary">badge</span> Register New Staff
            </h2>
            
            <div>
              <label className="text-xs font-bold text-secondary mb-1 block">Full Name</label>
              <input type="text" value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} required />
            </div>
            <div>
              <label className="text-xs font-bold text-secondary mb-1 block">Email Address</label>
              <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required />
            </div>
            <div>
              <label className="text-xs font-bold text-secondary mb-1 block">Temporary Password</label>
              <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required />
            </div>
            <div>
              <label className="text-xs font-bold text-secondary mb-1 block">System Role</label>
              <select value={newUser.roleId} onChange={e => setNewUser({...newUser, roleId: e.target.value})} className="bg-primary">
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>{role.name} ({role.code})</option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-panel">
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? 'Registering...' : 'Register Staff'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card p-0 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-panel bg-surface/30 flex justify-between items-center">
          <div className="relative w-72">
            <span className="material-symbols-rounded absolute left-3 top-2.5 text-muted icon-sm">search</span>
            <input 
              type="text" 
              placeholder="Search personnel..." 
              className="pl-9 py-2 text-sm bg-primary border-panel"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-ghost" onClick={fetchUsers}>
             <span className={`material-symbols-rounded icon-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-secondary/40 border-b border-panel">
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider">Employee</th>
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider">Contact</th>
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider">Role</th>
                <th className="py-3 px-6 text-xs font-bold text-muted uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-muted">Loading personnel data...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-muted">No staff found.</td>
                </tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="border-b border-panel hover:bg-surface-hover">
                  <td className="py-4 px-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent-primary/20 text-accent-primary flex items-center justify-center font-bold text-sm">
                      {u.fullName?.charAt(0)}
                    </div>
                    <div className="font-bold text-primary">{u.fullName}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm font-medium">{u.email}</div>
                    <div className="text-xs text-muted mt-0.5">{u.phone || 'No direct dial'}</div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="badge badge-primary">{u.role?.name || 'Unassigned'}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {u.isActive ? (
                      <span className="text-success text-xs font-bold flex items-center justify-end gap-1"><span className="material-symbols-rounded icon-sm">check_circle</span> Active</span>
                    ) : (
                      <span className="text-danger text-xs font-bold flex items-center justify-end gap-1"><span className="material-symbols-rounded icon-sm">cancel</span> Suspended</span>
                    )}
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
