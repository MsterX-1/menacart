import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { loginSchema } from './api/types';
import type { LoginDto } from './api/types';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Check if redirection exists in router state
  const from = (location.state as any)?.from?.pathname || '/';

  const onSubmit = async (data: LoginDto) => {
    setServerError(null);
    setIsPending(true);
    try {
      await login(data.email, data.password);
      success('Logged in successfully.');
      navigate(from, { replace: true });
    } catch (err: any) {
      // Map API authentication errors to a single generic message to prevent user enumeration
      setServerError('Invalid email or password');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="login-page">
      <div className="auth-card-header">
        <h1 className="auth-card-title">Sign In</h1>
        <p className="auth-card-subtitle">Welcome back to MenaCart</p>
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

        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-8px', marginBottom: '16px' }}>
          <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: '#4f46e5', textDecoration: 'none' }}>
            Forgot password?
          </Link>
        </div>

        <Button type="submit" isLoading={isPending} className="auth-submit-btn">
          Sign In
        </Button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
        <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
        <span style={{ padding: '0 10px', color: '#6b7280', fontSize: '0.875rem' }}>Or continue with</span>
        <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', width: '100%' }}>
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            if (credentialResponse.credential) {
              try {
                await loginWithGoogle(credentialResponse.credential);
                success('Logged in with Google successfully.');
                navigate(from, { replace: true });
              } catch (err: any) {
                error(err.response?.data?.message || 'Google login failed');
              }
            }
          }}
          onError={() => {
            error('Google Login Failed');
          }}
          shape="pill"
          width="400"
          useOneTap
        />
      </div>

      <div className="auth-card-footer">
        <p className="auth-switch-text">
          New to MenaCart? <Link to="/register" className="auth-link">Create an account</Link>
        </p>
      </div>
    </div>
  );
};
