import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';

const placeholderCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-8)',
  boxShadow: 'var(--shadow-sm)',
  maxWidth: 'var(--max-width-content)',
  margin: 'var(--space-8) auto',
  textAlign: 'center',
};

const titleStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-xl)',
  fontWeight: 'var(--font-weight-bold)',
  color: 'var(--color-text-main)',
  marginBottom: 'var(--space-2)',
  letterSpacing: '-0.02em',
};

const descStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--color-text-muted)',
  marginBottom: 'var(--space-6)',
  lineHeight: 1.6,
};

export const HomePlaceholder: React.FC = () => {
  const { isAuthenticated, user, roles } = useAuth();
  return (
    <div style={placeholderCardStyle}>
      <h1 style={titleStyle}>MenaCart Multi-Vendor E-Commerce</h1>
      <p style={descStyle}>
        Welcome to MenaCart. A clothing marketplace connecting buyers and sellers with built-in commission splitting, automatic order tracking, and returns validation.
      </p>
      {isAuthenticated && user ? (
        <div>
          <p style={{ ...descStyle, fontWeight: 'bold' }}>
            Logged in as {user.firstName} {user.lastName} ({roles.join(', ')})
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {roles.includes('Seller') && (
              <Link to="/seller/dashboard">
                <Button>Go to Seller Dashboard</Button>
              </Link>
            )}
            {roles.includes('Customer') && (
              <Link to="/products">
                <Button>Browse Products</Button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <Link to="/login">
            <Button variant="secondary">Sign In</Button>
          </Link>
          <Link to="/register">
            <Button>Create Account</Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export const ProductsPlaceholder: React.FC = () => (
  <div style={placeholderCardStyle}>
    <h1 style={titleStyle}>Product Catalog</h1>
    <p style={descStyle}>Browse approved fashion listings from independent vendors. Filter by size, color, and category.</p>
  </div>
);

export const CartPlaceholder: React.FC = () => (
  <div style={placeholderCardStyle}>
    <h1 style={titleStyle}>Your Shopping Cart</h1>
    <p style={descStyle}>Manage clothing items from multiple sellers. We will automatically split your checkout order safely.</p>
  </div>
);

export const OrdersPlaceholder: React.FC = () => (
  <div style={placeholderCardStyle}>
    <h1 style={titleStyle}>Your Orders</h1>
    <p style={descStyle}>Track shipping progress per seller, view sub-order statuses, and request exchanges or returns.</p>
  </div>
);

export const WishlistPlaceholder: React.FC = () => (
  <div style={placeholderCardStyle}>
    <h1 style={titleStyle}>My Wishlist</h1>
    <p style={descStyle}>Save variants of items you like. Transfer directly into your cart when ready to purchase.</p>
  </div>
);

export const LoyaltyPlaceholder: React.FC = () => (
  <div style={placeholderCardStyle}>
    <h1 style={titleStyle}>Loyalty Program</h1>
    <p style={descStyle}>Earn loyalty points with every purchase. Redeem points at checkout to receive dynamic discounts.</p>
  </div>
);

export const AccountPlaceholder: React.FC = () => {
  const { user } = useAuth();
  return (
    <div style={placeholderCardStyle}>
      <h1 style={titleStyle}>My Profile</h1>
      <p style={descStyle}>
        Manage your contact details, billing credentials, and default address book safely.
      </p>
      {user && (
        <div style={{ textAlign: 'left', display: 'inline-block', margin: '0 auto' }}>
          <p style={{ marginBottom: '5px' }}><strong>Username:</strong> {user.userName}</p>
          <p style={{ marginBottom: '5px' }}><strong>Email:</strong> {user.email}</p>
          <p style={{ marginBottom: '5px' }}><strong>First Name:</strong> {user.firstName}</p>
          <p style={{ marginBottom: '5px' }}><strong>Last Name:</strong> {user.lastName}</p>
        </div>
      )}
    </div>
  );
};

export const SellerDashboardPlaceholder: React.FC = () => (
  <div style={placeholderCardStyle}>
    <h1 style={titleStyle}>Seller Dashboard</h1>
    <p style={descStyle}>Monitor sales performance, request earnings payouts, and track commissions earned on your product variants.</p>
  </div>
);

export const SellerProductsPlaceholder: React.FC = () => (
  <div style={placeholderCardStyle}>
    <h1 style={titleStyle}>My Fashion Listings</h1>
    <p style={descStyle}>Manage clothing products, add variants (sizes/colors), update stock counts, and upload primary thumbnails.</p>
  </div>
);

export const SellerOrdersPlaceholder: React.FC = () => (
  <div style={placeholderCardStyle}>
    <h1 style={titleStyle}>Fulfill Sub-Orders</h1>
    <p style={descStyle}>Acknowledge newly placed sub-orders, assign tracking details, and mark shipments as delivered to customers.</p>
  </div>
);

export const SellerPayoutsPlaceholder: React.FC = () => (
  <div style={placeholderCardStyle}>
    <h1 style={titleStyle}>Earnings Payouts</h1>
    <p style={descStyle}>Submit bank information and request platform payouts for settled commissions after customer return windows close.</p>
  </div>
);

export const AdminProductsPlaceholder: React.FC = () => (
  <div style={placeholderCardStyle}>
    <h1 style={titleStyle}>Product Approval Queue</h1>
    <p style={descStyle}>Verify newly created vendor catalog submissions, inspect sizes/stock limits, and approve or reject listings.</p>
  </div>
);

export const AdminSellersPlaceholder: React.FC = () => (
  <div style={placeholderCardStyle}>
    <h1 style={titleStyle}>Seller Verification Queue</h1>
    <p style={descStyle}>Review KYC upload sheets, approve/reject merchants, and toggle registration status filters.</p>
  </div>
);

export const AdminCategoriesPlaceholder: React.FC = () => (
  <div style={placeholderCardStyle}>
    <h1 style={titleStyle}>Platform Category Tree</h1>
    <p style={descStyle}>Create clothing structure groupings and subcategories while preventing parent loops and self-references.</p>
  </div>
);

export const ForbiddenPage: React.FC = () => (
  <div style={placeholderCardStyle}>
    <h1 style={{ ...titleStyle, color: 'var(--color-error)' }}>403 Forbidden</h1>
    <p style={descStyle}>You do not possess the required privilege levels to view this dashboard area.</p>
    <Link to="/">
      <Button>Return Home</Button>
    </Link>
  </div>
);

export const NotFoundPage: React.FC = () => (
  <div style={placeholderCardStyle}>
    <h1 style={titleStyle}>404 Not Found</h1>
    <p style={descStyle}>The page you are looking for does not exist or has been moved.</p>
    <Link to="/">
      <Button>Return Home</Button>
    </Link>
  </div>
);
