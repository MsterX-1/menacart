import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { Button } from '../components/Button';
import { useNotifications } from '../features/notifications/hooks/useNotifications';
import { NotificationsDropdown } from '../features/notifications/components/NotificationsDropdown';
import './AppLayout.css';

export const AppLayout: React.FC = () => {
  const { user, roles, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isCustomer = roles.includes('Customer');
  const isSeller = roles.includes('Seller');
  const isAdmin = roles.includes('Admin');

  const [showNotifications, setShowNotifications] = useState(false);
  const { data: notifications } = useNotifications(isAuthenticated);
  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-container">
          <Link to="/" aria-label="Go to home">
            <Logo />
          </Link>
          
          <button 
            className="mobile-menu-toggle" 
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            &#9776;
          </button>

          <nav className={`app-nav ${mobileMenuOpen ? 'nav-open' : ''}`}>
            {/* Common Navigation */}
            <Link to="/products" className={`nav-link ${isActiveRoute('/products')}`} onClick={() => setMobileMenuOpen(false)}>
              Browse Catalog
            </Link>

            {/* Role-Specific Navigation (Absent if not authorized) */}
            {isAuthenticated && isCustomer && (
              <>
                <Link to="/cart" className={`nav-link ${isActiveRoute('/cart')}`} onClick={() => setMobileMenuOpen(false)}>
                  Cart
                </Link>
                <Link to="/orders" className={`nav-link ${isActiveRoute('/orders')}`} onClick={() => setMobileMenuOpen(false)}>
                  My Orders
                </Link>
                <Link to="/wishlist" className={`nav-link ${isActiveRoute('/wishlist')}`} onClick={() => setMobileMenuOpen(false)}>
                  Wishlist
                </Link>
                <Link to="/account/loyalty" className={`nav-link ${isActiveRoute('/account/loyalty')}`} onClick={() => setMobileMenuOpen(false)}>
                  Loyalty Points
                </Link>
                <Link to="/account/addresses" className={`nav-link ${isActiveRoute('/account/addresses')}`} onClick={() => setMobileMenuOpen(false)}>
                  Address Book
                </Link>
              </>
            )}

            {isAuthenticated && isSeller && (
              <>
                <Link to="/seller/dashboard" className={`nav-link ${isActiveRoute('/seller/dashboard')}`} onClick={() => setMobileMenuOpen(false)}>
                  Seller Dashboard
                </Link>
                <Link to="/seller/products" className={`nav-link ${isActiveRoute('/seller/products')}`} onClick={() => setMobileMenuOpen(false)}>
                  My Products
                </Link>
                <Link to="/seller/orders" className={`nav-link ${isActiveRoute('/seller/orders')}`} onClick={() => setMobileMenuOpen(false)}>
                  Fulfill Orders
                </Link>
                <Link to="/seller/payouts" className={`nav-link ${isActiveRoute('/seller/payouts')}`} onClick={() => setMobileMenuOpen(false)}>
                  Payouts
                </Link>
              </>
            )}

            {isAuthenticated && isAdmin && (
              <>
                <Link to="/admin/dashboard" className={`nav-link ${isActiveRoute('/admin/dashboard')}`} onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
                </Link>
                <Link to="/admin/users" className={`nav-link ${isActiveRoute('/admin/users')}`} onClick={() => setMobileMenuOpen(false)}>
                  Users
                </Link>
                <Link to="/admin/products" className={`nav-link ${isActiveRoute('/admin/products')}`} onClick={() => setMobileMenuOpen(false)}>
                  Product Approval
                </Link>
                <Link to="/admin/sellers" className={`nav-link ${isActiveRoute('/admin/sellers')}`} onClick={() => setMobileMenuOpen(false)}>
                  Seller Verification
                </Link>
                <Link to="/admin/payouts" className={`nav-link ${isActiveRoute('/admin/payouts')}`} onClick={() => setMobileMenuOpen(false)}>
                  Payouts
                </Link>
                <Link to="/admin/categories" className={`nav-link ${isActiveRoute('/admin/categories')}`} onClick={() => setMobileMenuOpen(false)}>
                  Categories
                </Link>
              </>
            )}

            {!isAuthenticated && (
              <Link to="/sell/apply" className={`nav-link ${isActiveRoute('/sell/apply')}`} onClick={() => setMobileMenuOpen(false)}>
                Sell on MenaCart
              </Link>
            )}
          </nav>

          <div className="header-actions">
            {isAuthenticated && user && (
              <div className="notifications-bell-container">
                <button 
                  className="bell-toggle-btn"
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-label="Toggle notifications menu"
                >
                  <span className="bell-icon">🔔</span>
                  {unreadCount > 0 && (
                    <span className="bell-badge-count">{unreadCount}</span>
                  )}
                </button>
                {showNotifications && (
                  <NotificationsDropdown 
                    onClose={() => setShowNotifications(false)}
                    isAuthenticated={isAuthenticated}
                  />
                )}
              </div>
            )}

            {isAuthenticated && user ? (
              <div className="user-profile-menu">
                <span className="user-greeting">
                  Hello, <Link to="/account" className="user-name-link">{user.firstName}</Link>
                </span>
                {/* Visual indicator of highest privilege */}
                <span className={`role-badge role-${roles[0]?.toLowerCase()}`}>
                  {roles[0]}
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">Register</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="app-main-content">
        <Outlet />
      </main>

      <footer className="app-footer">
        <div className="footer-container">
          <p>&copy; {new Date().getFullYear()} MenaCart Multi-Vendor E-Commerce. All rights reserved.</p>
          <div className="footer-links">
            <Link to="/products">Browse</Link>
            {!isAuthenticated && <Link to="/sell/apply">Become a Seller</Link>}
          </div>
        </div>
      </footer>
    </div>
  );
};
