import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg-base)',
        color: 'var(--color-text-muted)'
      }}>
        <div className="skeleton-loader" style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login while preserving target route in state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
