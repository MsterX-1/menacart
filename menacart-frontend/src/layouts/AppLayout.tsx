import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { Button } from '../components/Button';
import { useNotifications } from '../features/notifications/hooks/useNotifications';
import { NotificationsDropdown } from '../features/notifications/components/NotificationsDropdown';
import { useCart } from '../features/cart/hooks/useCart';
import { useWishlist } from '../features/wishlist/hooks/useWishlist';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, Heart, ShoppingCart, Bell, Menu, ChevronDown } from 'lucide-react';
import './AppLayout.css';

export const AppLayout: React.FC = () => {
  const { user, roles, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const isCustomer = roles.includes('Customer');
  const isSeller = roles.includes('Seller');
  const isAdmin = roles.includes('Admin');

  // Parallax background setup
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 50, stiffness: 100, mass: 1 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;
    mouseX.set(x);
    mouseY.set(y);
  };

  const x1 = useTransform(smoothX, [-1, 1], [30, -30]);
  const y1 = useTransform(smoothY, [-1, 1], [30, -30]);

  const x2 = useTransform(smoothX, [-1, 1], [-20, 20]);
  const y2 = useTransform(smoothY, [-1, 1], [-20, 20]);

  const x3 = useTransform(smoothX, [-1, 1], [-40, 40]);
  const y3 = useTransform(smoothY, [-1, 1], [40, -40]);

  const x4 = useTransform(smoothX, [-1, 1], [15, -15]);
  const y4 = useTransform(smoothY, [-1, 1], [-15, 15]);

  // Fetch cart & wishlist items to compute badges
  const { data: cart } = useCart(isAuthenticated && isCustomer);
  const { data: wishlist } = useWishlist(isAuthenticated && isCustomer);

  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const wishlistCount = wishlist?.length || 0;

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
    <div className="app-layout" onMouseMove={handleMouseMove}>
      <div className="app-bg-shapes">
        <motion.div className="app-shape app-shape-1" style={{ x: x1, y: y1 }}></motion.div>
        <motion.div className="app-shape app-shape-2" style={{ x: x2, y: y2 }}></motion.div>
        <motion.div className="app-shape app-shape-3" style={{ x: x3, y: y3 }}></motion.div>
        <motion.div className="app-shape app-shape-4" style={{ x: x4, y: y4 }}></motion.div>
      </div>

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
            <Menu size={24} />
          </button>

          <nav className={`app-nav ${mobileMenuOpen ? 'nav-open' : ''}`}>
            {/* Common Navigation */}
            <Link to="/products" className={`nav-link ${isActiveRoute('/products')}`} onClick={() => setMobileMenuOpen(false)}>
              Browse Catalog
            </Link>
            <Link to="/sellers" className={`nav-link ${isActiveRoute('/sellers')}`} onClick={() => setMobileMenuOpen(false)}>
              Sellers
            </Link>

            {/* Quick Links per role */}
            {isAuthenticated && isSeller && (
              <Link to="/seller/dashboard" className={`nav-link ${isActiveRoute('/seller/dashboard')}`} onClick={() => setMobileMenuOpen(false)}>
                Seller Dashboard
              </Link>
            )}

            {isAuthenticated && isAdmin && (
              <Link to="/admin/dashboard" className={`nav-link ${isActiveRoute('/admin/dashboard')}`} onClick={() => setMobileMenuOpen(false)}>
                Admin Dashboard
              </Link>
            )}

            {!isAuthenticated && (
              <Link to="/sell/apply" className={`nav-link ${isActiveRoute('/sell/apply')}`} onClick={() => setMobileMenuOpen(false)}>
                Sell on MenaCart
              </Link>
            )}

            {/* Mobile-Only Expanded Menu for quick access */}
            {mobileMenuOpen && isAuthenticated && (
              <div className="mobile-role-links-section" style={{ marginTop: 'var(--space-2)', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--space-2)' }}>
                {isCustomer && (
                  <>
                    <Link to="/account" className="nav-link" onClick={() => setMobileMenuOpen(false)}>My Account</Link>
                    <Link to="/orders" className="nav-link" onClick={() => setMobileMenuOpen(false)}>My Orders</Link>
                    <Link to="/wishlist" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Wishlist</Link>
                    <Link to="/cart" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Cart</Link>
                  </>
                )}
                {isSeller && (
                  <>
                    <Link to="/seller/settings" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Store Settings</Link>
                    <Link to="/seller/products" className="nav-link" onClick={() => setMobileMenuOpen(false)}>My Products</Link>
                    <Link to="/seller/shipping-rules" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Shipping Rules</Link>
                    <Link to="/seller/orders" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Fulfill Orders</Link>
                  </>
                )}
                {isAdmin && (
                  <>
                    <Link to="/admin/sellers" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Verify Sellers</Link>
                    <Link to="/admin/products" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Review Products</Link>
                    <Link to="/admin/categories" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Categories</Link>
                  </>
                )}
              </div>
            )}
          </nav>

          <div className="header-actions">
            <button 
              className={`theme-switch ${theme === 'dark' ? 'dark' : ''}`}
              onClick={toggleTheme} 
              aria-label="Toggle theme"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              style={{ justifyContent: theme === 'dark' ? 'flex-end' : 'flex-start' }}
            >
              <motion.div 
                className="switch-handle" 
                layout 
                transition={{ type: "spring", stiffness: 700, damping: 30 }}
              >
                {theme === 'light' ? <Sun size={14} /> : <Moon size={14} />}
              </motion.div>
            </button>

            {/* Customer Quick Icon Links */}
            {isAuthenticated && isCustomer && (
              <div className="customer-header-shortcuts">
                <Link to="/wishlist" className="header-icon-shortcut" title="Wishlist" aria-label="Wishlist">
                  <span className="shortcut-icon" aria-hidden="true"><Heart size={20} /></span>
                  {wishlistCount > 0 && (
                    <span className="shortcut-badge-count">{wishlistCount}</span>
                  )}
                </Link>
                <Link to="/cart" className="header-icon-shortcut" title="Shopping Cart" aria-label="Shopping Cart">
                  <span className="shortcut-icon" aria-hidden="true"><ShoppingCart size={20} /></span>
                  {cartCount > 0 && (
                    <span className="shortcut-badge-count">{cartCount}</span>
                  )}
                </Link>
              </div>
            )}

            {isAuthenticated && user && (
              <div className="notifications-bell-container">
                <button 
                  className="bell-toggle-btn"
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-label="Toggle notifications menu"
                >
                  <span className="bell-icon"><Bell size={20} /></span>
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
              <div className="user-profile-dropdown">
                <button className="profile-dropdown-trigger" aria-haspopup="menu">
                  <div className="avatar-circle">
                    {user.firstName[0]?.toUpperCase()}{user.lastName[0]?.toUpperCase()}
                  </div>
                  <span className="user-firstname-text">{user.firstName}</span>
                  <span className="dropdown-caret" aria-hidden="true"><ChevronDown size={14} /></span>
                </button>
                
                <div className="profile-dropdown-menu">
                  <div className="dropdown-user-info">
                    <span className="dropdown-user-name">{user.firstName} {user.lastName}</span>
                    <span className={`dropdown-role-badge role-${roles[0]?.toLowerCase()}`}>
                      {roles[0]}
                    </span>
                  </div>
                  
                  <div className="dropdown-divider"></div>
                  
                  {isCustomer && (
                    <>
                      <Link to="/account" className="dropdown-link-item">My Account</Link>
                      <Link to="/orders" className="dropdown-link-item">My Orders</Link>
                      <Link to="/returns" className="dropdown-link-item">My Returns</Link>
                      <Link to="/account/loyalty" className="dropdown-link-item">Loyalty Points</Link>
                      <Link to="/account/addresses" className="dropdown-link-item">Address Book</Link>
                    </>
                  )}
                  
                  {isSeller && (
                    <>
                      <Link to="/seller/dashboard" className="dropdown-link-item">Seller Dashboard</Link>
                      <Link to="/seller/settings" className="dropdown-link-item">Store Settings</Link>
                      <Link to="/seller/products" className="dropdown-link-item">My Products</Link>
                      <Link to="/seller/shipping-rules" className="dropdown-link-item">Shipping Rules</Link>
                      <Link to="/seller/orders" className="dropdown-link-item">Fulfill Orders</Link>
                      <Link to="/seller/returns" className="dropdown-link-item">Manage Returns</Link>
                      <Link to="/seller/payouts" className="dropdown-link-item">Payouts</Link>
                      <Link to="/seller/documents" className="dropdown-link-item">KYC Documents</Link>
                    </>
                  )}
                  
                  {isAdmin && (
                    <>
                      <Link to="/admin/dashboard" className="dropdown-link-item">Admin Dashboard</Link>
                      <Link to="/admin/sellers" className="dropdown-link-item">Verify Sellers</Link>
                      <Link to="/admin/products" className="dropdown-link-item">Review Products</Link>
                      <Link to="/admin/categories" className="dropdown-link-item">Categories</Link>
                      <Link to="/admin/coupons" className="dropdown-link-item">Coupons</Link>
                      <Link to="/admin/users" className="dropdown-link-item">Manage Users</Link>
                      <Link to="/admin/payouts" className="dropdown-link-item">Payouts</Link>
                    </>
                  )}
                  
                  <div className="dropdown-divider"></div>
                  
                  <button onClick={handleLogout} className="dropdown-logout-btn">
                    Logout
                  </button>
                </div>
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
