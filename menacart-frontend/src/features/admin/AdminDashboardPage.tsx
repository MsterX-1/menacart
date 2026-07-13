import { useNavigate } from 'react-router-dom';
import { useAdminDashboardStats } from './hooks/useAdminDashboard';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Button } from '../../components/Button';
import { motion } from 'framer-motion';
import { 
  LuUser, 
  LuPackage, LuStar, LuStarHalf
} from 'react-icons/lu';
import { 
  FiAlertTriangle, FiDollarSign, FiBriefcase 
} from 'react-icons/fi';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
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
        stars.push(<LuStar key={i} className="star-filled" fill="currentColor" size={14} />);
      } else if (i - rating < 1) {
        stars.push(<LuStarHalf key={i} className="star-half" fill="currentColor" size={14} />);
      } else {
        stars.push(<LuStar key={i} className="star-empty" size={14} />);
      }
    }
    return <div className="stars-wrapper" style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>{stars} <span className="rating-num" style={{marginLeft: '4px'}}>({rating.toFixed(1)})</span></div>;
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
      <div className="admin-dashboard-container error ">
        <h2 className="error-title">Failed to Load Platform Analytics</h2>
        <p className="error-desc">There was an issue fetching dashboard statistics from the server.</p>
        <Button onClick={() => refetch()}>Retry Loading</Button>
      </div>
    );
  }

  const maxSellerRevenue = Math.max(...stats.sellerRevenues.map(r => r.totalRevenue), 1);

  const colors = ['#4f46e5', '#7c3aed', '#db2777', '#e11d48', '#ea580c'];

  const summaryChartData = [
    { name: 'Registered Members', value: stats.totalUsers },
    { name: 'Active Stores', value: stats.totalSellers },
    { name: 'Total Transactions', value: stats.totalOrders },
    { name: 'Gross Volume', value: stats.totalRevenue },
    { name: 'Net Profit', value: stats.platformCommissionProfit },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="admin-dashboard-container animate-fade-in"
    >
      <div className="admin-dashboard-header">
        <div>
          <h1 className="admin-dashboard-title">Platform Insights</h1>
          <p className="admin-dashboard-subtitle">Real-time metrics, revenue distributions, and top merchants performance.</p>
        </div>
        <div className="admin-quick-actions">
          {stats.pendingSellerApplications > 0 && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="dashboard-badge-action-btn badge-warning" 
              onClick={() => navigate('/admin/sellers?status=Pending')}
            >
              <FiAlertTriangle size={16} /> {stats.pendingSellerApplications} Pending Sellers
            </motion.button>
          )}
          {stats.pendingPayouts > 0 && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="dashboard-badge-action-btn badge-info" 
              onClick={() => navigate('/admin/payouts')}
            >
              <FiDollarSign size={16} /> {stats.pendingPayouts} Pending Payouts
            </motion.button>
          )}
        </div>
      </div>

      {/* Summary Graph Section */}
      <div className="chart-section" style={{ marginBottom: '2rem' }}>
        <div className="chart-card" style={{ backgroundColor: 'var(--color-surface)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
          <div className="chart-container" style={{ height: '18rem', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summaryChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" />
                <XAxis dataKey="name" axisLine={{ stroke: '#64748b' }} tickLine={{ stroke: '#64748b' }} tick={{ fontSize: 12, fill: '#334155', fontWeight: 500 }} />
                <YAxis axisLine={{ stroke: '#64748b' }} tickLine={{ stroke: '#64748b' }} tick={{ fontSize: 12, fill: '#334155', fontWeight: 500 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                  labelStyle={{ color: '#475569', fontWeight: 500, paddingBottom: '4px' }}
                  formatter={(value: any, name: any, props: any) => [
                    props.payload.name.includes('Profit') || props.payload.name.includes('Volume') ? formatCurrency(Number(value)) : value,
                    props.payload.name
                  ]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {summaryChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Core Metrics Grid */}
      <div className="stats-grid">
        <motion.div whileHover={{ y: -4, boxShadow: 'var(--shadow-md)' }} className="metric-card ">
          <div className="metric-icon-wrapper user-icon"><LuUser size={24} /></div>
          <div className="metric-details">
            <span className="metric-label">Registered Members</span>
            <strong className="metric-value">{stats.totalUsers}</strong>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4, boxShadow: 'var(--shadow-md)' }} className="metric-card ">
          <div className="metric-icon-wrapper merchant-icon"><FiBriefcase size={24} /></div>
          <div className="metric-details">
            <span className="metric-label">Active Stores</span>
            <strong className="metric-value">{stats.totalSellers}</strong>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4, boxShadow: 'var(--shadow-md)' }} className="metric-card ">
          <div className="metric-icon-wrapper order-icon"><LuPackage size={24} /></div>
          <div className="metric-details">
            <span className="metric-label">Total Transactions</span>
            <strong className="metric-value">{stats.totalOrders}</strong>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4, boxShadow: 'var(--shadow-md)' }} className="metric-card highlighted">
          <div className="metric-icon-wrapper revenue-icon"><FiDollarSign size={24} /></div>
          <div className="metric-details">
            <span className="metric-label">Gross Platform Volume</span>
            <strong className="metric-value">{formatCurrency(stats.totalRevenue)}</strong>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4, boxShadow: 'var(--shadow-md)' }} className="metric-card success">
          <div className="metric-icon-wrapper profit-icon"><FiDollarSign size={24} /></div>
          <div className="metric-details">
            <span className="metric-label">Net Platform Profit</span>
            <strong className="metric-value">{formatCurrency(stats.platformCommissionProfit)}</strong>
          </div>
        </motion.div>
      </div>

      <div className="dashboard-sections-grid">
        <div className="dashboard-section-card ">
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
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(percentage, 5)}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="chart-item-bar" 
                      ></motion.div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                      {seller.pendingRevenue > 0 && (
                        <span className="chart-item-subtext" style={{ color: 'var(--color-warning)' }}>
                          Pending Return Period: <strong>{formatCurrency(seller.pendingRevenue)}</strong>
                        </span>
                      )}
                      {seller.pendingPayoutBalance > 0 && (
                        <span className="chart-item-subtext">
                          Pending Payout: <strong>{formatCurrency(seller.pendingPayoutBalance)}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="dashboard-section-card ">
          <h3 className="section-card-title">Best Sellers & Rated Products</h3>
          <p className="section-card-subtitle">Top products ranked by sales volume and review averages.</p>

          {stats.topProducts.length === 0 ? (
            <div className="section-card-empty">No product sales recorded yet.</div>
          ) : (
            <div className="top-products-list">
              {stats.topProducts.map((prod) => (
                <motion.div whileHover={{ scale: 1.01 }} key={prod.productId} className="product-ranking-item">
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
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboardPage;
