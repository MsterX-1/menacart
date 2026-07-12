import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { resetPassword } from './api/authApi';
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import './ResetPasswordPage.css';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !token) {
      toast.error('Invalid password reset link.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      await resetPassword({ email, token, newPassword: password });
      toast.success('Password reset successfully. You can now log in.');
      navigate('/login');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to reset password. The link might be expired.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!email || !token) {
    return (
      <div className="reset-password-container">
        <div className="invalid-link-card">
          <h2 className="invalid-link-title">Invalid Link</h2>
          <p className="invalid-link-subtitle">This password reset link is invalid or has expired.</p>
          <div>
            <Link to="/forgot-password" className="invalid-link-action">
              Request a new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <div className="reset-password-header">
          <h1 className="reset-password-title">Create New Password</h1>
          <p className="reset-password-subtitle">
            Your new password must be different from previous used passwords.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="reset-password-form">
          <div className="form-group">
            <label className="form-label">New Password</label>
            <div className="input-wrapper">
              <div className="input-icon-left">
                <FiLock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="reset-input"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FiEyeOff className="w-5 h-5" />
                ) : (
                  <FiEye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="input-wrapper">
              <div className="input-icon-left">
                <FiLock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="reset-input"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="reset-submit-btn"
          >
            {loading ? <LoadingSpinner size="sm" color="white" /> : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
