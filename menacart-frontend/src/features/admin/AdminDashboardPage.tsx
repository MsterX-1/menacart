import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminDashboardStats } from './hooks/useAdminDashboard';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Button } from '../../components/Button';
import './AdminDashboardPage.css';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading, error, refetch } = useAdminDashboardStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const floorRating = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      if (i <= floorRating) {
        stars.push(<span key={i} className="star-filled">★</span>);
      } else if (i - rating < 1) {
        stars.push(<span key={i} className="star-half">★</span>);
      } else {
        stars.push(<span key={i} className="star-empty">☆</span>);
      }
    }
    return <div className="stars-wrapper">{stars} <span className="rating-num">({rating.toFixed(1)})</span></div>;
  };

  if (isLoading) {
    return (
      <div className="admin-dashboard-container loading">
        <div className="header-skeleton-wrap">
          <LoadingSkeleton variant="text" width="300px" height={40} />
          <LoadingSkeleton variant="text" width="500px" height={20} />
        </div>
        <div className="stats-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton-card-container">
              <LoadingSkeleton variant="rect" height="120px" />
            </div>
          ))}
        </div>
        <div className="dashboard-sections-grid">
          <div className="skeleton-card-container">
            <LoadingSkeleton variant="rect" height="300px" />
          </div>
          <div className="skeleton-card-container">
            <LoadingSkeleton variant="rect" height="300px" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="admin-dashboard-container error glass-card">
        <h2 className="error-title">Failed to Load Platform Analytics</h2>
        <p className="error-desc">There was an issue fetching dashboard statistics from the server.</p>
        <Button onClick={() => refetch()}>Retry Loading</Button>
      </div>
    );
  }

  // Calculate platform sales or commission volume if we want to display it
  const maxSellerRevenue = Math.max(...stats.sellerRevenues.map(r => r.totalRevenue), 1);

  return (
    <div className="admin-dashboard-container animate-fade-in">
      <div className="admin-dashboard-header">
        <div>
          <h1 className="admin-dashboard-title">Platform Insights</h1>
          <p className="admin-dashboard-subtitle">Real-time metrics, revenue distributions, and top merchants performance.</p>
        </div>
        <div className="admin-quick-actions">
          {stats.pendingSellerApplications > 0 && (
            <button 
              className="dashboard-badge-action-btn badge-warning" 
              onClick={() => navigate('/admin/sellers?status=Pending')}
            >
              ⚠️ {stats.pendingSellerApplications} Pending Sellers
            </button>
          )}
          {stats.pendingPayouts > 0 && (
            <button 
              className="dashboard-badge-action-btn badge-info" 
              onClick={() => navigate('/admin/payouts')}
            >
              💸 {stats.pendingPayouts} Pending Payouts
            </button>
          )}
        </div>
      </div>

      {/* Core Metrics Grid */}
      <div className="stats-grid">
        <div className="metric-card glass-card">
          <div className="metric-icon-wrapper user-icon">👤</div>
          <div className="metric-details">
            <span className="metric-label">Registered Members</span>
            <strong className="metric-value">{stats.totalUsers}</strong>
          </div>
        </div>

        <div className="metric-card glass-card">
          <div className="metric-icon-wrapper merchant-icon">🏪</div>
          <div className="metric-details">
            <span className="metric-label">Active Stores</span>
            <strong className="metric-value">{stats.totalSellers}</strong>
          </div>
        </div>

        <div className="metric-card glass-card">
          <div className="metric-icon-wrapper order-icon">📦</div>
          <div className="metric-details">
            <span className="metric-label">Total Transactions</span>
            <strong className="metric-value">{stats.totalOrders}</strong>
          </div>
        </div>

        <div className="metric-card glass-card highlighted">
          <div className="metric-icon-wrapper revenue-icon">💰</div>
          <div className="metric-details">
            <span className="metric-label">Gross Platform Volume</span>
            <strong className="metric-value">{formatCurrency(stats.totalRevenue)}</strong>
          </div>
        </div>

        <div className="metric-card glass-card success">
          <div className="metric-icon-wrapper profit-icon">💵</div>
          <div className="metric-details">
            <span className="metric-label">Net Platform Profit</span>
            <strong className="metric-value">{formatCurrency(stats.platformCommissionProfit)}</strong>
          </div>
        </div>
      </div>

      <div className="dashboard-sections-grid">
        {/* Top Sellers / Merchant Performance Chart (Custom CSS bars) */}
        <div className="dashboard-section-card glass-card">
          <h3 className="section-card-title">Merchant Volume Breakdown</h3>
          <p className="section-card-subtitle">Highest grossing seller stores based on completed transactions.</p>
          
          {stats.sellerRevenues.length === 0 ? (
            <div className="section-card-empty">No merchant transaction data available yet.</div>
          ) : (
            <div className="bar-chart-custom">
              {stats.sellerRevenues.map((seller) => {
                const percentage = (seller.totalRevenue / maxSellerRevenue) * 100;
                return (
                  <div key={seller.sellerId} className="chart-item">
                    <div className="chart-item-header">
                      <span className="chart-item-name">{seller.storeName}</span>
                      <span className="chart-item-val">{formatCurrency(seller.totalRevenue)}</span>
                    </div>
                    <div className="chart-item-track">
                      <div 
                        className="chart-item-bar" 
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      ></div>
                    </div>
                    {seller.pendingPayoutBalance > 0 && (
                      <span className="chart-item-subtext">
                        Pending Payout: <strong>{formatCurrency(seller.pendingPayoutBalance)}</strong>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="dashboard-section-card glass-card">
          <h3 className="section-card-title">Best Sellers & Rated Products</h3>
          <p className="section-card-subtitle">Top products ranked by sales volume and review averages.</p>

          {stats.topProducts.length === 0 ? (
            <div className="section-card-empty">No product sales recorded yet.</div>
          ) : (
            <div className="top-products-list">
              {stats.topProducts.map((prod) => (
                <div key={prod.productId} className="product-ranking-item">
                  <div className="product-rank-details">
                    <span className="rank-prod-name">{prod.name}</span>
                    <div className="rank-prod-ratings">
                      {renderStars(prod.averageRating)}
                    </div>
                  </div>
                  <div className="product-rank-metrics">
                    <div className="rank-metric-col">
                      <span className="rank-metric-lbl">Sold</span>
                      <strong className="rank-metric-val">{prod.totalSold}</strong>
                    </div>
                    <div className="rank-metric-col">
                      <span className="rank-metric-lbl">Revenue</span>
                      <strong className="rank-metric-val">{formatCurrency(prod.revenue)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
