import React from 'react';
import { Outlet } from 'react-router-dom';
import { Logo } from '../components/Logo';
import './AuthLayout.css';

export const AuthLayout: React.FC = () => {
  return (
    <div className="auth-layout">
      <header className="auth-header">
        <Logo />
      </header>
      <main className="auth-main">
        <div className="auth-card">
          <Outlet />
        </div>
      </main>
      <footer className="auth-footer">
        <p>&copy; {new Date().getFullYear()} MenaCart. All rights reserved.</p>
      </footer>
    </div>
  );
};
