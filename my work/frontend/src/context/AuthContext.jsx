import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const verifySession = useCallback(async () => {
    const token = localStorage.getItem('pv_admin_token');
    if (!token) {
      setAdmin(null);
      setLoading(false);
      return;
    }

    try {
      const data = await authApi.me();
      setAdmin(data.admin);
    } catch {
      localStorage.removeItem('pv_admin_token');
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  const login = async (email, password) => {
    const data = await authApi.login({ email, password });
    localStorage.setItem('pv_admin_token', data.token);
    setAdmin(data.admin);
    return data.admin;
  };

  const changeAdminEmail = async (payload) => {
    const data = await authApi.changeEmail(payload);
    if (data.token) {
      localStorage.setItem('pv_admin_token', data.token);
    }
    if (data.admin) {
      setAdmin(data.admin);
    }
    return data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore network failures on client logout
    }
    localStorage.removeItem('pv_admin_token');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAuthenticated: Boolean(admin),
        loading,
        login,
        changeAdminEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
