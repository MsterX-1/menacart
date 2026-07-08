import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth';

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ children, allowedRoles }) => {
  const { roles, isAuthenticated, isLoading } = useAuth();

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
    return <Navigate to="/login" replace />;
  }

  const hasRole = roles.some((role) => allowedRoles.includes(role));

  if (!hasRole) {
    // Redirect to a forbidden/403 page instead of rendering the restricted page
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
};
