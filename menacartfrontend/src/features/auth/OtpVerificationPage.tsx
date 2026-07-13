import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { resendOtp } from './api/authApi';
import { useToast } from '../../components/Toast';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { FiCheckCircle, FiMail } from 'react-icons/fi';
import './OtpVerificationPage.css';

export const OtpVerificationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp } = useAuth();
  const { success, error: showError } = useToast();
  
  const email = location.state?.email as string;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(30);

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  // If no email in state, they shouldn't be here
  if (!email) {
    return <Navigate to="/register" replace />;
  }

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next input
    if (element.nextSibling && element.value) {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Focus previous input on backspace if current is empty
    if (e.key === 'Backspace' && !otp[index] && e.currentTarget.previousSibling) {
      (e.currentTarget.previousSibling as HTMLInputElement).focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, 6).split('');
    if (pastedData.some(char => isNaN(Number(char)))) return;

    const newOtp = [...otp];
    pastedData.forEach((value, index) => {
      newOtp[index] = value;
    });
    setOtp(newOtp);
    
    // Focus the last input or the first empty one
    const nextEmptyIndex = newOtp.findIndex(val => val === '');
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    const inputs = document.querySelectorAll('.otp-input');
    if (inputs[focusIndex]) {
      (inputs[focusIndex] as HTMLInputElement).focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setServerError('Please enter the complete 6-digit code.');
      return;
    }

    setServerError(null);
    setIsVerifying(true);

    try {
      await verifyOtp(email, code);
      success('Email verified successfully!');
      navigate('/');
    } catch (err: any) {
      setServerError(err.response?.data?.message || err.message || 'Verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setServerError(null);
    try {
      await resendOtp(email);
      success('A new verification code has been sent to your email.');
    } catch (err: any) {
      showError(err.response?.data?.message || err.message || 'Failed to resend code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="otp-container">
      <div className="otp-card">
        <div className="otp-header">
          <div className="otp-icon-wrapper">
            <FiMail className="w-8 h-8 text-brand-600" />
          </div>
          <h1 className="otp-title">Verify your email</h1>
          <p className="otp-subtitle">
            We've sent a 6-digit verification code to <br />
            <strong className="text-gray-900">{email}</strong>
          </p>
        </div>

        {serverError && (
          <div className="otp-error">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="otp-form">
          <div className="otp-input-group" onPaste={handlePaste}>
            {otp.map((data, index) => (
              <input
                className="otp-input"
                type="text"
                name="otp"
                maxLength={1}
                key={index}
                value={data}
                onChange={e => handleChange(e.target, index)}
                onFocus={e => e.target.select()}
                onKeyDown={e => handleKeyDown(e, index)}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isVerifying || otp.join('').length !== 6}
            className="otp-submit-btn"
          >
            {isVerifying ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              <>
                <FiCheckCircle />
                Verify Account
              </>
            )}
          </button>
        </form>

        <div className="otp-footer">
          <p className="text-sm text-gray-600">
            Didn't receive the code?{' '}
            <button
              onClick={handleResend}
              disabled={isResending}
              className="otp-resend-btn"
            >
              {isResending ? 'Sending...' : 'Click to resend'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
