/**
 * Authentication state for the whole application.
 *
 * Holds the signed-in user and exposes the actions that change it. On first
 * mount it tries to restore a session from the stored token by asking the
 * server who the token belongs to — the token is never trusted for its
 * contents, only presented for verification.
 */
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { authApi } from '../api/endpoints';
import { getStoredToken, setStoredToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // `initialising` is distinct from a normal loading flag: it guards the first
  // render so protected routes do not bounce a signed-in visitor to the login
  // page before the session has been restored.
  const [initialising, setInitialising] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (!getStoredToken()) {
        setInitialising(false);
        return;
      }
      try {
        const me = await authApi.me();
        if (!cancelled) setUser(me);
      } catch {
        // The token was rejected; the interceptor has already cleared it.
        setStoredToken(null);
      } finally {
        if (!cancelled) setInitialising(false);
      }
    }

    restoreSession();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (credentials) => {
    const { user: signedIn, token } = await authApi.login(credentials);
    setStoredToken(token);
    setUser(signedIn);
    return signedIn;
  }, []);

  const register = useCallback(async (payload) => {
    const { user: created, token } = await authApi.register(payload);
    setStoredToken(token);
    setUser(created);
    return created;
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const updated = await authApi.updateProfile(payload);
    setUser(updated);
    return updated;
  }, []);

  const value = useMemo(() => ({
    user,
    initialising,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateProfile,
  }), [user, initialising, login, register, logout, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an <AuthProvider>.');
  return context;
}
