import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bidzone_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Synchronize user profile on startup if token exists
  useEffect(() => {
    const verifyUserSession = async () => {
      const token = localStorage.getItem('bidzone_access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.success && response.user) {
          setUser(response.user);
          localStorage.setItem('bidzone_user', JSON.stringify(response.user));
        }
      } catch (err) {
        console.warn('[AuthContext] Session expired or invalid:', err.message);
        api.clearTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyUserSession();

    const handleExpired = () => {
      setUser(null);
    };

    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    if (data.success) {
      api.setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      localStorage.setItem('bidzone_user', JSON.stringify(data.user));
      return data.user;
    }
    throw new Error(data.message || 'Login failed');
  };

  const register = async (name, email, password, role) => {
    const data = await api.post('/auth/register', { name, email, password, role });
    if (data.success) {
      api.setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      localStorage.setItem('bidzone_user', JSON.stringify(data.user));
      return data.user;
    }
    throw new Error(data.message || 'Registration failed');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      api.clearTokens();
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isSeller: user?.role === 'seller',
    isBidder: user?.role === 'bidder',
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout
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
