import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { PERMISSIONS, ROLES } from '../constants/constants';

const AuthContext = createContext(null);
const PERMISSION_MAP = {
  MANAGE_STAFF: PERMISSIONS.MANAGE_STAFF,
  REPAIR_VIEW: PERMISSIONS.REPAIR_VIEW,
  INTAKE_REPAIR: PERMISSIONS.REPAIR_CREATE,
  MANAGE_BILLING: PERMISSIONS.MANAGE_BILLING,
  TAKE_PAYMENT: PERMISSIONS.MANAGE_BILLING,
  MANAGE_INVENTORY: PERMISSIONS.INVENTORY_MANAGE,
  VIEW_DASHBOARD: PERMISSIONS.VIEW_DASHBOARD,
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (_e) {
          localStorage.removeItem('user');
        }
      }

      try {
        const res = await api.get('/auth/me');
        const me = res.data;
        const normalizedUser = {
          id: me.id,
          fullName: me.fullName || me.name,
          email: me.email,
          roleId: me.roleId,
          roleName: me.role?.name,
          roleCode: me.role?.code,
          permissions: Array.isArray(me.role?.permissions) ? me.role.permissions.map((p) => p.code) : [],
        };
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

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    const normalizedUser = {
      ...userData,
      fullName: userData.fullName || userData.name,
    };
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

  const hasPermission = (permission) => {
    const code = PERMISSION_MAP[permission] || permission;
    return user?.roleCode === ROLES.ADMIN || user?.permissions?.includes(code) || user?.permissions?.includes('*:*');
  };

  const hasRole = (roleCode) => {
    return user?.roleCode === roleCode || user?.roleCode === ROLES.ADMIN;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
