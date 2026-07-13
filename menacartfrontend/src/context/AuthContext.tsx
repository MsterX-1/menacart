import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AuthContextType, RegisterRequestData, User, UserRole } from '../types/auth';
import { getCurrentUser, loginUser, logoutUser, registerUser, refreshToken, logoutAllDevices, googleLogin as googleLoginApi } from '../features/auth/api/authApi';
import { setAccessToken } from '../api/client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const queryClient = useQueryClient();

  const clearAuth = useCallback(() => {
    setUser(null);
    setTokenState(null);
    setRoles([]);
    setAccessToken(null);
    queryClient.clear();
  }, [queryClient]);

  const handleAuthSuccess = useCallback((accessToken: string, assignedRoles: string[]) => {
    setTokenState(accessToken);
    setAccessToken(accessToken);
    
    // Map backend roles correctly to UserRole type
    const mappedRoles = assignedRoles.map(r => {
      const normalized = r.toLowerCase();
      if (normalized === 'customer') return 'Customer';
      if (normalized === 'seller') return 'Seller';
      if (normalized === 'admin') return 'Admin';
      return null;
    }).filter(Boolean) as UserRole[];
    
    setRoles(mappedRoles);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const data = await refreshToken();
      handleAuthSuccess(data.token, data.roles);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      clearAuth();
    }
  }, [handleAuthSuccess, clearAuth]);

  // Restore session via silent refresh on initial mount
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        await refreshSession();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [refreshSession]);

  // Handle cross-tab logout notifications or dead sessions triggered by API interceptor
  useEffect(() => {
    const handleLogoutEvent = () => {
      clearAuth();
    };

    window.addEventListener('auth-logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('auth-logout', handleLogoutEvent);
    };
  }, [clearAuth]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await loginUser({ email, password });
      handleAuthSuccess(data.token, data.roles);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      clearAuth();
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequestData) => {
    setIsLoading(true);
    try {
      const responseData = await registerUser(data);
      // Do NOT set tokens here, just return the message
      return responseData;
    } catch (err) {
      clearAuth();
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtpAction = async (email: string, code: string) => {
    setIsLoading(true);
    try {
      const { verifyOtp } = await import('../features/auth/api/authApi');
      const responseData = await verifyOtp({ email, code });
      handleAuthSuccess(responseData.token, responseData.roles);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      clearAuth();
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    setIsLoading(true);
    try {
      const data = await googleLoginApi(idToken);
      handleAuthSuccess(data.token, data.roles);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      clearAuth();
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
    } catch (err) {
      // Proceed with local logout even if request fails
    } finally {
      clearAuth();
      setIsLoading(false);
    }
  };

  const logoutAll = async () => {
    setIsLoading(true);
    try {
      await logoutAllDevices();
    } catch (err) {
      // Proceed with local logout even if request fails
    } finally {
      clearAuth();
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    roles,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    register,
    verifyOtp: verifyOtpAction,
    loginWithGoogle,
    logout,
    logoutAll,
    clearAuth,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
