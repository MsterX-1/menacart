import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Mail, Lock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { loginSchema } from './api/types';
import type { LoginDto } from './api/types';
import './LoginPage.css';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// Google Icon SVG Component
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

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

  const from = (location.state as any)?.from?.pathname || '/';

  const onSubmit = async (data: LoginDto) => {
    setServerError(null);
    setIsPending(true);
    try {
      await login(data.email, data.password);
      success('Logged in successfully.');
      navigate(from, { replace: true });
    } catch (err: any) {
      setServerError('Invalid email or password');
    } finally {
      setIsPending(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Placeholder for Google Auth logic
    alert('Google Sign-In integration would open here!');
  };

  return (
    <motion.div 
      className="login-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="auth-card-header" variants={itemVariants}>
        <h1 className="auth-card-title">Sign In</h1>
        <p className="auth-card-subtitle">Welcome back to MenaCart</p>
      </motion.div>

      {serverError && (
        <motion.div className="auth-error-alert" role="alert" variants={itemVariants}>
          <AlertTriangle className="auth-error-icon" size={18} />
          <span className="auth-error-text">{serverError}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
        <motion.div variants={itemVariants}>
          <Input
            label="Email Address"
            type="email"
            autoComplete="email"
            icon={<Mail size={18} />}
            error={errors.email?.message}
            {...register('email')}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="password-input-group">
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            icon={<Lock size={18} />}
            error={errors.password?.message}
            {...register('password')}
          />
          <Link to="/forgot-password" className="forgot-password-link">Forgot password?</Link>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Button type="submit" isLoading={isPending} className="auth-submit-btn">
            Sign In
          </Button>
        </motion.div>
      </form>

      <motion.div variants={itemVariants} className="auth-divider">
        <span>or</span>
      </motion.div>

      <motion.div variants={itemVariants}>
        <button type="button" className="google-signin-btn" onClick={handleGoogleSignIn}>
          <GoogleIcon />
          <span>Sign in with Google</span>
        </button>
      </motion.div>

      <motion.div className="auth-card-footer" variants={itemVariants}>
        <p className="auth-switch-text">
          New to MenaCart? <Link to="/register" className="auth-link">Create an account</Link>
        </p>
      </motion.div>
    </motion.div>
  );
};
