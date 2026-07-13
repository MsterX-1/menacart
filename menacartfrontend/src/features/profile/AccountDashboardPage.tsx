import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from './hooks/useProfile';
import { ProfileForm } from './components/ProfileForm';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Button } from '../../components/Button';
import { useNavigate } from 'react-router-dom';

export const AccountDashboardPage: React.FC = () => {
  const { user: authUser, roles } = useAuth();
  const navigate = useNavigate();
  
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

  const isSeller = roles?.includes('Seller');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {!isSeller && (
        <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', color: '#111827' }}>Ready to start selling?</h3>
            <p style={{ margin: 0, color: '#4b5563' }}>Apply to become a seller and start reaching millions of customers today.</p>
          </div>
          <Button onClick={() => navigate('/sell/apply')}>
            Apply for Seller
          </Button>
        </div>
      )}
      <ProfileForm user={profileUser} />
    </div>
  );
};

export default AccountDashboardPage;
