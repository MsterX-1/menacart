import React from 'react';
import './Logo.css';

export const Logo: React.FC = () => {
  return (
    <div className="logo">
      <span className="logo-icon" aria-hidden="true">M</span>
      <span className="logo-text">Mena<span className="logo-highlight">Cart</span></span>
    </div>
  );
};
