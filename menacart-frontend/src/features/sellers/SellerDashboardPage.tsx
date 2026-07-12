import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { getSellerDashboardStats } from './api/sellerDashboardApi';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { 
  FiSettings, FiBox, FiTruck, FiClipboard, 
  FiCornerUpLeft, FiDollarSign, FiTrendingUp 
} from 'react-icons/fi';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import './SellerDashboardPage.css';

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP' }).format(val);

const QuickLinkCard = ({ to, icon: Icon, title, desc, color }: any) => (
  <Link to={to} className="quick-link-card">
    <div className={`quick-link-icon-wrapper ${color}`}>
      <Icon className="quick-link-icon" />
    </div>
    <h3 className="quick-link-title">
      {title}
    </h3>
    <p className="quick-link-desc">
      {desc}
    </p>
  </Link>
);

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: any }) => (
  <div className="stat-card">
    <div>
      <p className="stat-title">{title}</p>
      <h4 className="stat-value">{value}</h4>
    </div>
    <div className="stat-icon-wrapper">
      <Icon className="stat-icon" />
    </div>
  </div>
);

export const SellerDashboardPage: React.FC = () => {
  const { user } = useAuth();

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['sellerDashboardStats'],
    queryFn: getSellerDashboardStats,
  });

  if (isLoading) {
    return (
      <div className="loading-container">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="error-container">
        Failed to load dashboard statistics.
      </div>
    );
  }

  const chartData = stats.topProducts.map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    sold: p.totalSold,
    revenue: p.revenue
  }));

  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'];

  return (
    <div className="seller-dashboard-container">
      {/* Header section */}
      <div className="seller-dashboard-header">
        <div>
          <h1 className="seller-dashboard-title">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="seller-dashboard-subtitle">
            Here's what's happening with your store today.
          </p>
        </div>
        <div>
          <Link to="/seller/products/new" className="add-product-btn">
            + Add Product
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard title="Net Profit" value={formatCurrency(stats.netProfit)} icon={FiTrendingUp} />
        <StatCard title="Total Orders" value={stats.totalOrders} icon={FiClipboard} />
        <StatCard title="Available Payout" value={formatCurrency(stats.availableBalance)} icon={FiDollarSign} />
        <StatCard title="Active Products" value={stats.totalProducts} icon={FiBox} />
      </div>

      <div className="dashboard-main-grid">
        {/* Charts & Analytics */}
        <div className="chart-section">
          <div className="chart-card">
            <h3 className="section-title">Top Performing Products (Revenue)</h3>
            {chartData.length > 0 ? (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `EGP ${val}`} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => formatCurrency(Number(value))}
                    />
                    <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="no-data-msg">
                No product data available yet.
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="links-section">
          <h3 className="section-title">Quick Links</h3>
          <div className="quick-links-grid">
            <QuickLinkCard 
              to="/seller/orders" 
              icon={FiClipboard} 
              title="Fulfill Orders" 
              desc="View and process customer orders."
              color="color-blue"
            />
            <QuickLinkCard 
              to="/seller/products" 
              icon={FiBox} 
              title="Inventory" 
              desc="Manage your product catalog."
              color="color-indigo"
            />
            <QuickLinkCard 
              to="/seller/payouts" 
              icon={FiDollarSign} 
              title="Payouts" 
              desc="Withdraw your available earnings."
              color="color-emerald"
            />
            <QuickLinkCard 
              to="/seller/returns" 
              icon={FiCornerUpLeft} 
              title="Returns" 
              desc="Review customer return requests."
              color="color-orange"
            />
            <QuickLinkCard 
              to="/seller/shipping-rules" 
              icon={FiTruck} 
              title="Shipping Rules" 
              desc="Configure your delivery rates."
              color="color-purple"
            />
            <QuickLinkCard 
              to="/seller/settings" 
              icon={FiSettings} 
              title="Store Settings" 
              desc="Update store profile and details."
              color="color-gray"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
