import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthContextType, RegisterRequestData, User, UserRole } from '../types/auth';
import { getCurrentUser, loginUser, logoutUser, registerUser, refreshToken, logoutAllDevices } from '../features/auth/api/authApi';
import { setAccessToken } from '../api/client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const clearAuth = useCallback(() => {
    setUser(null);
    setTokenState(null);
    setRoles([]);
    setAccessToken(null);
  }, []);

  const handleAuthSuccess = useCallback((accessToken: string, assignedRoles: string[]) => {
    setTokenState(accessToken);
    setAccessToken(accessToken);
    
    // Map backend roles correctly to UserRole type
    const mappedRoles = assignedRoles.map(r => {
      if (r === 'Customer') return 'Customer';
      if (r === 'Seller') return 'Seller';
      if (r === 'Admin') return 'Admin';
      return null;
    }).filter(Boolean) as UserRole[];
    
    setRoles(mappedRoles);
  }, []);

  // Restore session via silent refresh on initial mount
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        const data = await refreshToken();
        if (isMounted) {
          handleAuthSuccess(data.token, data.roles);
          const currentUser = await getCurrentUser();
          if (isMounted) {
            setUser(currentUser);
          }
        }
      } catch (err) {
        // Safe to ignore silent refresh failure on mount - user is anonymous
        clearAuth();
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
  }, [handleAuthSuccess, clearAuth]);

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
    logout,
    logoutAll,
    clearAuth,
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
