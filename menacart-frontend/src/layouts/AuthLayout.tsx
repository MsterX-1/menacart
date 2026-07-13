import React from 'react';
import { Outlet } from 'react-router-dom';
import { Logo } from '../components/Logo';
import './AuthLayout.css';

export const AuthLayout: React.FC = () => {
  return (
    <div className="auth-layout">
      {/* Left Side: Editorial / Visual */}
      <div className="auth-visual-side">
        <div className="auth-visual-overlay"></div>
        <div className="auth-visual-content">
          <div className="auth-logo-wrapper">
            <Logo />
          </div>
          <h1 className="auth-visual-headline">
            Elevate your lifestyle.
          </h1>
          <p className="auth-visual-subheadline">
            Join the premier marketplace for independent creators and premium brands.
          </p>
        </div>
        {/* Abstract shapes for premium aesthetic */}
        <div className="auth-shape auth-shape-1"></div>
        <div className="auth-shape auth-shape-2"></div>
      </div>

      {/* Right Side: Form */}
      <div className="auth-form-side">
        <main className="auth-main">
          <div className="auth-mobile-header">
            <Logo />
          </div>
          <div className="auth-card">
            <Outlet />
          </div>
        </main>
        <footer className="auth-footer">
          <p>&copy; {new Date().getFullYear()} MenaCart. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};
