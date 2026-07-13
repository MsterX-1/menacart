import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminTransactions } from './hooks/useAdminTransactions';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { AdminTransactionDetailModal } from './components/AdminTransactionDetailModal';
import './AdminTransactionsPage.css';

export const AdminTransactionsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const pageSize = 20;

  const { data, isLoading, error } = useAdminTransactions(page, pageSize);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="admin-transactions-container loading">
        <LoadingSkeleton variant="text" width="200px" height={40} />
        <div className="skeleton-table">
          {[...Array(5)].map((_, i) => (
            <LoadingSkeleton key={i} variant="rect" height="60px" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="admin-transactions-container error">
        <h2>Failed to load transactions.</h2>
        <p>Please try again later.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="admin-transactions-container animate-fade-in"
    >
      <div className="transactions-header">
        <h1 className="transactions-title">Transaction History</h1>
        <p className="transactions-subtitle">Monitor incoming payments and order statuses.</p>
      </div>

      <div className="transactions-table-wrapper">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Method</th>
              <th>Status</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-table">No transactions found.</td>
              </tr>
            ) : (
              <AnimatePresence>
                {data.items.map((tx, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={tx.orderId} 
                    onClick={() => setSelectedOrderId(tx.orderId)}
                    className="clickable-row"
                  >
                    <td className="tx-id">#{tx.orderId}</td>
                    <td>
                      <div className="tx-customer">
                        <span className="customer-name">{tx.customerName}</span>
                        <span className="customer-email">{tx.customerEmail}</span>
                      </div>
                    </td>
                    <td className="tx-date">{formatDate(tx.createdAt)}</td>
                    <td className="tx-method">{tx.paymentMethod}</td>
                    <td>
                      <span className={`status-badge status-${tx.paymentStatus.toLowerCase()}`}>
                        {tx.paymentStatus}
                      </span>
                      {tx.orderStatus === 'Cancelled' && (
                        <span className="status-badge status-cancelled" style={{ marginLeft: '8px' }}>
                          Cancelled
                        </span>
                      )}
                    </td>
                    <td className="tx-amount">{formatCurrency(tx.totalAmount)}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>

      {data.totalPages > 1 && (
        <div className="pagination">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {page} of {data.totalPages}
          </span>
          <button 
            disabled={page === data.totalPages}
            onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}

      {selectedOrderId && (
        <AdminTransactionDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </motion.div>
  );
};

export default AdminTransactionsPage;
