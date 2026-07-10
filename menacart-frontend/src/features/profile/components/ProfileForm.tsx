import React, { useState } from 'react';
import { useUpdateProfile, useChangePassword, useDeleteAccount } from '../hooks/useProfile';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { useToast } from '../../../components/Toast';
import type { User } from '../../../types/auth';

interface ProfileFormProps {
  user: User;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ user }) => {
  const { success: toastSuccess, error: toastError } = useToast();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();

  // Profile Form State
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');

  // Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Delete Account State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const deleteAccountMutation = useDeleteAccount();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toastError('First and last name are required.');
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        userId: user.userId,
        firstName,
        lastName,
      });
      toastSuccess('Profile updated successfully!');
    } catch (err: any) {
      toastError(err.response?.data || 'Failed to update profile.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        userId: user.userId,
        oldPassword,
        newPassword,
      });
      toastSuccess('Password updated successfully! Please log in again.');
      setIsPasswordModalOpen(false);
      // Clear forms
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // The backend logs the user out when the password changes. 
      // The refresh token is deleted automatically, so we can dispatch the auth-logout event to return to login.
      setTimeout(() => {
        window.dispatchEvent(new Event('auth-logout'));
      }, 1500);
    } catch (err: any) {
      const errMsg = err.response?.data || 'Failed to change password. Please check your current password.';
      setPasswordError(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmationText !== 'DELETE') {
      toastError('Please type DELETE to confirm account deletion.');
      return;
    }

    try {
      await deleteAccountMutation.mutateAsync(user.userId);
      toastSuccess('Your account has been deleted.');
      setIsDeleteModalOpen(false);
      
      // Dispatch logout to redirect to login page
      setTimeout(() => {
        window.dispatchEvent(new Event('auth-logout'));
      }, 1500);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to delete account.');
    }
  };

  return (
    <div className="profile-details-section">
      <h2 className="tab-title">Personal Information</h2>
      <p className="tab-subtitle">Update your personal details and manage your account security.</p>

      <form onSubmit={handleUpdateProfile} className="profile-form ">
        <div className="profile-grid">
          <Input
            label="First Name"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <Input
            label="Last Name"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>

        <Input
          label="Username"
          type="text"
          value={user.userName}
          disabled
          helperText="Username cannot be changed."
        />

        <Input
          label="Email Address"
          type="email"
          value={user.email}
          disabled
          helperText="Email address is associated with your account identity and cannot be edited."
        />

        <div className="form-actions-row">
          <Button
            type="submit"
            isLoading={updateProfileMutation.isPending}
            disabled={
              firstName === user.firstName &&
              lastName === user.lastName
            }
          >
            Save Changes
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsPasswordModalOpen(true)}
          >
            Change Password
          </Button>
        </div>
      </form>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="modal-backdrop fade-in" onClick={() => setIsPasswordModalOpen(false)}>
          <div className="modal-content slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Change Password</h3>
              <button className="modal-close-btn" onClick={() => setIsPasswordModalOpen(false)}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="modal-form">
              {passwordError && (
                <div className="password-error-alert" role="alert">
                  {passwordError}
                </div>
              )}

              <Input
                label="Current Password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />

              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <div className="modal-actions">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsPasswordModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={changePasswordMutation.isPending}
                >
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="profile-danger-zone">
        <h3 className="danger-zone-title">Danger Zone</h3>
        <p className="danger-zone-desc">
          Permanently delete your account and all associated data. This action is irreversible.
        </p>
        <Button
          type="button"
          variant="danger"
          onClick={() => setIsDeleteModalOpen(true)}
        >
          Delete Account
        </Button>
      </div>

      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="modal-backdrop fade-in" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-content slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#e53e3e' }}>Delete Account</h3>
              <button className="modal-close-btn" onClick={() => setIsDeleteModalOpen(false)}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleDeleteAccount} className="modal-form">
              <p style={{ fontSize: '0.9rem', color: '#4a5568', marginBottom: '1rem' }}>
                Are you absolutely sure you want to delete your account? This will permanently delete all your user profiles, products, wishlists, and order history.
              </p>
              
              <Input
                label='To confirm, type "DELETE" below:'
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                required
              />

              <div className="modal-actions">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  isLoading={deleteAccountMutation.isPending}
                  disabled={deleteConfirmationText !== 'DELETE'}
                >
                  Permanently Delete
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
