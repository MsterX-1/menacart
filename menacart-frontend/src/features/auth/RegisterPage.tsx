import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { registerSchema } from './api/types';
import type { RegisterFormValues } from './api/types';
import './RegisterPage.css';

export const RegisterPage: React.FC = () => {
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      userName: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'Customer',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null);
    setIsPending(true);
    try {
      await signup({
        userName: data.userName,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: data.role,
      });
      navigate('/verify-otp', { state: { email: data.email } });
    } catch (err: any) {
      setServerError(err.response?.data?.message || err.response?.data || err.message || 'Registration failed. Please try again.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="register-page">
      <div className="auth-card-header">
        <h1 className="auth-card-title">Create Account</h1>
        <p className="auth-card-subtitle">Get started with your MenaCart account</p>
      </div>

      {serverError && (
        <div className="auth-error-alert" role="alert">
          <span className="auth-error-icon">&#9888;</span>
          <span className="auth-error-text">{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
        <div className="role-selector-container">
          <span className="role-selector-label">I want to register as a:</span>
          <div className="role-options">
            <button
              type="button"
              className={`role-option-card ${selectedRole === 'Customer' ? 'active' : ''}`}
              onClick={() => setValue('role', 'Customer')}
            >
              <span className="role-option-title">Customer</span>
              <span className="role-option-desc">Browse & buy products</span>
            </button>
            <button
              type="button"
              className={`role-option-card ${selectedRole === 'Seller' ? 'active' : ''}`}
              onClick={() => setValue('role', 'Seller')}
            >
              <span className="role-option-title">Seller</span>
              <span className="role-option-desc">List products & fulfill orders</span>
            </button>
          </div>
          {errors.role && <span className="input-error">{errors.role.message}</span>}
        </div>

        <Input
          label="Username"
          type="text"
          autoComplete="username"
          error={errors.userName?.message}
          {...register('userName')}
        />

        <div className="auth-name-grid">
          <Input
            label="First Name"
            type="text"
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            label="Last Name"
            type="text"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

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
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm Password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" isLoading={isPending} className="auth-submit-btn">
          Create Account
        </Button>
      </form>

      <div className="auth-card-footer">
        <p className="auth-switch-text">
          Already have an account? <Link to="/login" className="auth-link">Sign In</Link>
        </p>
      </div>
    </div>
  );
};
