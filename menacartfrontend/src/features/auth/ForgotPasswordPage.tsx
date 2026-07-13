import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { useToast } from '../../components/Toast';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { forgotPassword } from './api/authApi';
import './LoginPage.css';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const { success } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setServerError(null);
    setIsPending(true);
    try {
      await forgotPassword(data.email);
      setIsSent(true);
      success('Password reset link sent to your email.');
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Failed to send password reset email.');
    } finally {
      setIsPending(false);
    }
  };

  if (isSent) {
    return (
      <div className="login-page">
        <div className="auth-card-header">
          <h1 className="auth-card-title">Check Your Email</h1>
          <p className="auth-card-subtitle">We have sent a password reset link to your email address.</p>
        </div>
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Link to="/login">
            <Button>Return to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="auth-card-header">
        <h1 className="auth-card-title">Forgot Password</h1>
        <p className="auth-card-subtitle">Enter your email address to receive a password reset link.</p>
      </div>

      {serverError && (
        <div className="auth-error-alert" role="alert">
          <span className="auth-error-icon">&#9888;</span>
          <span className="auth-error-text">{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
        <Input
          label="Email Address"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <Button type="submit" isLoading={isPending} className="auth-submit-btn">
          Send Reset Link
        </Button>
      </form>

      <div className="auth-card-footer">
        <p className="auth-switch-text">
          Remembered your password? <Link to="/login" className="auth-link">Sign In</Link>
        </p>
      </div>
    </div>
  );
};
