import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, Package, Truck, ClipboardList, Undo2, Banknote, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/Button';

export const SellerDashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem', fontSize: '2.5rem', fontWeight: 700 }}>
        Welcome back, {user?.firstName}!
      </h1>
      <p style={{ marginBottom: '2.5rem', color: 'var(--color-text-subtle)', fontSize: '1.1rem' }}>
        Manage your store, track your orders, and configure your settings from here.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Store Settings */}
        <div className="shadow-card" style={{ padding: '2.5rem', backgroundColor: 'var(--color-bg-base)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ marginBottom: '1rem' }}><Settings size={36} strokeWidth={1.5} color="var(--color-primary)" /></div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Store Settings</h2>
          <p style={{ color: 'var(--color-text-subtle)', marginBottom: '1.5rem', flex: 1 }}>
            Update your store name, description, address, and logo.
          </p>
          <Link to="/seller/settings" style={{ width: '100%' }}>
            <Button style={{ width: '100%' }}>Manage Settings</Button>
          </Link>
        </div>

        {/* My Products */}
        <div className="shadow-card" style={{ padding: '2.5rem', backgroundColor: 'var(--color-bg-base)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ marginBottom: '1rem' }}><Package size={36} strokeWidth={1.5} color="var(--color-primary)" /></div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>My Products</h2>
          <p style={{ color: 'var(--color-text-subtle)', marginBottom: '1.5rem', flex: 1 }}>
            Add new products, edit existing listings, and manage inventory.
          </p>
          <Link to="/seller/products" style={{ width: '100%' }}>
            <Button style={{ width: '100%' }}>Manage Products</Button>
          </Link>
        </div>

        {/* Shipping Rules */}
        <div className="shadow-card" style={{ padding: '2.5rem', backgroundColor: 'var(--color-bg-base)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ marginBottom: '1rem' }}><Truck size={36} strokeWidth={1.5} color="var(--color-primary)" /></div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Shipping Rules</h2>
          <p style={{ color: 'var(--color-text-subtle)', marginBottom: '1.5rem', flex: 1 }}>
            Define where you deliver and set your custom shipping rates.
          </p>
          <Link to="/seller/shipping-rules" style={{ width: '100%' }}>
            <Button style={{ width: '100%' }}>Configure Shipping</Button>
          </Link>
        </div>

        {/* Fulfill Orders */}
        <div className="shadow-card" style={{ padding: '2.5rem', backgroundColor: 'var(--color-bg-base)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ marginBottom: '1rem' }}><ClipboardList size={36} strokeWidth={1.5} color="var(--color-primary)" /></div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Fulfill Orders</h2>
          <p style={{ color: 'var(--color-text-subtle)', marginBottom: '1.5rem', flex: 1 }}>
            View and process incoming orders from customers.
          </p>
          <Link to="/seller/orders" style={{ width: '100%' }}>
            <Button style={{ width: '100%' }}>View Orders</Button>
          </Link>
        </div>

        {/* Manage Returns */}
        <div className="shadow-card" style={{ padding: '2.5rem', backgroundColor: 'var(--color-bg-base)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ marginBottom: '1rem' }}><Undo2 size={36} strokeWidth={1.5} color="var(--color-primary)" /></div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Manage Returns</h2>
          <p style={{ color: 'var(--color-text-subtle)', marginBottom: '1.5rem', flex: 1 }}>
            Review and handle customer return requests.
          </p>
          <Link to="/seller/returns" style={{ width: '100%' }}>
            <Button style={{ width: '100%' }}>Handle Returns</Button>
          </Link>
        </div>

        {/* Payouts */}
        <div className="shadow-card" style={{ padding: '2.5rem', backgroundColor: 'var(--color-bg-base)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ marginBottom: '1rem' }}><Banknote size={36} strokeWidth={1.5} color="var(--color-primary)" /></div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Payouts</h2>
          <p style={{ color: 'var(--color-text-subtle)', marginBottom: '1.5rem', flex: 1 }}>
            Check your balance, available earnings, and request payouts.
          </p>
          <Link to="/seller/payouts" style={{ width: '100%' }}>
            <Button style={{ width: '100%' }}>View Earnings</Button>
          </Link>
        </div>

        {/* KYC Documents */}
        <div className="shadow-card" style={{ padding: '2.5rem', backgroundColor: 'var(--color-bg-base)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ marginBottom: '1rem' }}><FileText size={36} strokeWidth={1.5} color="var(--color-primary)" /></div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>KYC Documents</h2>
          <p style={{ color: 'var(--color-text-subtle)', marginBottom: '1.5rem', flex: 1 }}>
            Upload and manage your identity and business verification files.
          </p>
          <Link to="/seller/documents" style={{ width: '100%' }}>
            <Button style={{ width: '100%' }}>Manage KYC</Button>
          </Link>
        </div>

      </div>
    </div>
  );
};
