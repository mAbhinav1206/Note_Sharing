import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authApi from '../api/auth';

/**
 * AuthContext - single source of truth for "who is logged in".
 *
 * On first load it asks the server /auth/me (cookie is httpOnly, so the
 * browser sends it automatically). That restores the session after refresh.
 */
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // session check in progress

  // Restore session on page refresh.
  useEffect(() => {
    let active = true;
    authApi
      .fetchMe()
      .then((res) => active && setUser(res.data.user))
      .catch(() => active && setUser(null)) // not logged in (or session expired)
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (payload) => {
    const res = await authApi.login(payload);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await authApi.register(payload);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(() => authApi.fetchMe().then((res) => setUser(res.data.user)), []);

  const value = { user, setUser, loading, login, register, logout, refreshUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
