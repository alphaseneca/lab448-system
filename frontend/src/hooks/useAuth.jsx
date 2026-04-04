import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { PERMISSIONS, ROLES } from '../constants/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try { setUser(JSON.parse(storedUser)); } catch (_) {}
      }
      try {
        const res = await api.get('/auth/me');
        const me = res.data;
        const normalizedUser = normalizeUser(me);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        setUser(normalizedUser);
      } catch (_err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const normalizeUser = (userData) => ({
    id: userData.id,
    fullName: userData.fullName || userData.name,
    email: userData.email,
    roleId: userData.roleId,
    roleName: userData.role?.name,
    roleCode: userData.role?.code || userData.roleCode,
    commissionRate: userData.commissionRate,
    technicianRank: userData.technicianRank,
    permissions: Array.isArray(userData.role?.permissions)
      ? userData.role.permissions.map((p) => (typeof p === 'string' ? p : p.code))
      : (userData.permissions || []),
  });

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    const normalizedUser = normalizeUser({ ...userData, role: userData.role });
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    return normalizedUser;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin = () =>
    user?.roleCode === ROLES.ADMIN || user?.permissions?.includes('*:*');

  /**
   * hasPermission(permissionCode) — accepts both raw codes ('billing:manage')
   * and PERMISSION constant keys ('MANAGE_BILLING') for convenience.
   */
  const hasPermission = (permission) => {
    if (!user) return false;
    if (isAdmin()) return true;
    // Accept either a raw code or a key from the PERMISSIONS object
    const code = PERMISSIONS[permission] || permission;
    return user.permissions?.includes(code) || user.permissions?.includes('*:*');
  };

  const hasRole = (roleCode) => {
    return user?.roleCode === roleCode || isAdmin();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, hasPermission, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
