import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { loginSchema } from './api/types';
import type { LoginDto } from './api/types';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { success } = useToast();
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

        <Button type="submit" isLoading={isPending} className="auth-submit-btn">
          Sign In
        </Button>
      </form>

      <div className="auth-card-footer">
        <p className="auth-switch-text">
          New to MenaCart? <Link to="/register" className="auth-link">Create an account</Link>
        </p>
      </div>
    </div>
  );
};
