import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import { setAccessToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore authenticated session via HttpOnly cookie refresh
  const restoreSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const refreshResult = await authService.refreshToken();
      if (refreshResult?.data?.accessToken) {
        setAccessToken(refreshResult.data.accessToken);
        const meResult = await authService.getMe();
        if (meResult?.data?.user) {
          setUser(meResult.data.user);
        }
      }
    } catch {
      // No active refresh session or server offline; user is unauthenticated
      setUser(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (credentials) => {
    const result = await authService.login(credentials);
    if (result?.data?.user) {
      setUser(result.data.user);
    }
    return result;
  };

  const register = async (userData) => {
    const result = await authService.register(userData);
    if (result?.data?.user) {
      setUser(result.data.user);
    }
    return result;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  };

  // Helper getters
  const isAdmin = user?.role === 'admin' || user?.userType === 'admin';
  const isStaff = user?.role === 'staff';
  const isGuest = user?.role === 'guest' || user?.userType === 'customer';

  const value = {
    user,
    setUser,
    isAuthenticated: !!user,
    isLoading,
    isAdmin,
    isStaff,
    isGuest,
    login,
    register,
    logout,
    restoreSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
