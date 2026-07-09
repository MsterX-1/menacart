import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from './hooks/useProfile';
import { ProfileForm } from './components/ProfileForm';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export const AccountDashboardPage: React.FC = () => {
  const { user: authUser } = useAuth();
  
  // Fetch fresh profile data to make sure it's up to date
  const { data: profileUser, isLoading, error } = useProfile(authUser?.userId || '');

  if (isLoading) {
    return (
      <div className="profile-loading-skeleton">
        <LoadingSkeleton variant="text" width="200px" height={32} />
        <div style={{ marginTop: '8px' }}>
          <LoadingSkeleton variant="text" width="300px" height={16} />
        </div>
        <div style={{ marginTop: '30px' }}>
          <LoadingSkeleton variant="rect" height={60} />
          <div style={{ marginTop: '20px' }}>
            <LoadingSkeleton variant="rect" height={60} />
          </div>
          <div style={{ marginTop: '20px' }}>
            <LoadingSkeleton variant="rect" height={60} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="profile-error-state " style={{ padding: '20px', textAlign: 'center' }}>
        <p className="error-text">Failed to load profile details. Please try again later.</p>
      </div>
    );
  }

  return <ProfileForm user={profileUser} />;
};

export default AccountDashboardPage;
