import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AccountLayout.css';

export const AccountLayout: React.FC = () => {
  const { user, roles } = useAuth();
  
  if (!user) return null;

  return (
    <div className="account-layout-container">
      <div className="account-layout-grid">
        {/* Sidebar Nav */}
        <aside className="account-sidebar ">
          <div className="account-user-header">
            <div className="avatar-placeholder">
              {user.firstName[0]?.toUpperCase()}{user.lastName[0]?.toUpperCase()}
            </div>
            <div className="user-meta">
              <h3 className="user-full-name">{user.firstName} {user.lastName}</h3>
              <p className="user-email-subtitle">{user.email}</p>
            </div>
          </div>
          
          <nav className="account-nav-menu">
            <NavLink 
              to="/account" 
              end
              className={({ isActive }) => `account-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">&#128100;</span>
              Personal Details
            </NavLink>
            
            {roles.includes('Customer') && (
              <>
                <NavLink 
                  to="/account/addresses" 
                  className={({ isActive }) => `account-nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon">&#128205;</span>
                  Address Book
                </NavLink>

                <NavLink 
                  to="/account/loyalty" 
                  className={({ isActive }) => `account-nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon">&#127942;</span>
                  Loyalty Points
                </NavLink>

                <div className="nav-divider"></div>

                <NavLink 
                  to="/orders" 
                  className={({ isActive }) => `account-nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon">&#128230;</span>
                  My Orders
                </NavLink>

                <NavLink 
                  to="/returns" 
                  className={({ isActive }) => `account-nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon">&#8635;</span>
                  My Returns
                </NavLink>
              </>
            )}

            {roles.includes('Seller') && (
              <>
                <NavLink 
                  to="/seller/documents" 
                  className={({ isActive }) => `account-nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon">&#128196;</span>
                  KYC Verification
                </NavLink>

                <div className="nav-divider"></div>

                <NavLink 
                  to="/seller/dashboard" 
                  className={({ isActive }) => `account-nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon">&#128200;</span>
                  Seller Dashboard
                </NavLink>

                <NavLink 
                  to="/seller/products" 
                  className={({ isActive }) => `account-nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon">&#128085;</span>
                  My Products
                </NavLink>

                <NavLink 
                  to="/seller/orders" 
                  className={({ isActive }) => `account-nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon">&#128230;</span>
                  Fulfill Orders
                </NavLink>
              </>
            )}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="account-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default AccountLayout;
