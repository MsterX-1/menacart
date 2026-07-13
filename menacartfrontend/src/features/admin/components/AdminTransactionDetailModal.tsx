import React from 'react';
import { useAdminTransactionDetails } from '../hooks/useAdminTransactions';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';
import './AdminTransactionDetailModal.css';

interface AdminTransactionDetailModalProps {
  orderId: number | null;
  onClose: () => void;
}

export const AdminTransactionDetailModal: React.FC<AdminTransactionDetailModalProps> = ({ orderId, onClose }) => {
  const { data: tx, isLoading, error } = useAdminTransactionDetails(orderId);

  if (!orderId) return null;

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

  return (
    <div className="admin-tx-modal-overlay" onClick={onClose}>
      <div className="admin-tx-modal-content animate-slide-up" onClick={e => e.stopPropagation()}>
        <button className="admin-tx-modal-close" onClick={onClose}>&times;</button>
        
        {isLoading ? (
          <div className="admin-tx-modal-loading">
            <LoadingSkeleton variant="text" width="200px" height={32} />
            <div style={{ margin: '1rem 0' }}>
              <LoadingSkeleton variant="rect" height={100} />
            </div>
            <LoadingSkeleton variant="rect" height={200} />
          </div>
        ) : error || !tx ? (
          <div className="admin-tx-modal-error">
            <h3>Error loading transaction details</h3>
            <p>Please try again.</p>
          </div>
        ) : (
          <div className="admin-tx-detail">
            <div className="tx-detail-header">
              <div className="tx-header-left">
                <h2>Transaction #{tx.orderId}</h2>
                <span className="tx-date">{formatDate(tx.createdAt)}</span>
              </div>
              <div className="tx-header-right">
                <span className={`status-badge status-${tx.orderStatus.toLowerCase()}`}>
                  Order: {tx.orderStatus}
                </span>
                <span className={`status-badge status-${tx.paymentStatus.toLowerCase()}`}>
                  Payment: {tx.paymentStatus}
                </span>
              </div>
            </div>

            <div className="tx-summary-cards">
              <div className="tx-summary-card">
                <h4>Customer Details</h4>
                <p><strong>Name:</strong> {tx.customerName}</p>
                <p><strong>Email:</strong> {tx.customerEmail}</p>
              </div>
              <div className="tx-summary-card">
                <h4>Payment Info</h4>
                <p><strong>Method:</strong> {tx.paymentMethod}</p>
                {tx.couponCode && (
                  <p><strong>Coupon:</strong> <span className="coupon-tag">{tx.couponCode}</span> (-{formatCurrency(tx.couponDiscount ?? tx.platformDiscount ?? 0)})</p>
                )}
                <div className="tx-total-amount">
                  <strong>Total Paid:</strong> <span>{formatCurrency(tx.totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="tx-suborders-section">
              <h3>Sub-Orders ({tx.subOrders.length})</h3>
              <p className="tx-suborders-desc">Breakdown of this transaction by seller.</p>
              
              {tx.subOrders.map(subOrder => (
                <div key={subOrder.subOrderId} className="tx-suborder-card">
                  <div className="suborder-header">
                    <div className="store-info">
                      <span className="store-name">{subOrder.storeName}</span>
                      <span className="suborder-id">Sub-Order #{subOrder.subOrderId}</span>
                    </div>
                    <span className={`status-badge status-${subOrder.status.toLowerCase()}`}>
                      {subOrder.status}
                    </span>
                  </div>

                  <table className="suborder-items-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Options</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="item-name">{item.productName}</td>
                          <td className="item-options">
                            {item.color && <span>Color: {item.color}</span>}
                            {item.size && <span>Size: {item.size}</span>}
                          </td>
                          <td>{formatCurrency(item.priceAtPurchase)}</td>
                          <td>x{item.quantity}</td>
                          <td className="text-right font-semibold">{formatCurrency(item.saleAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="suborder-footer">
                    <div className="shipping-info">
                      <span className="shipping-label">Shipping Cost:</span>
                      <span className="shipping-value">{formatCurrency(subOrder.shippingCost)}</span>
                      {subOrder.carrier && (
                        <span className="shipping-carrier">({subOrder.carrier}: {subOrder.trackingNumber || 'Pending'})</span>
                      )}
                    </div>
                    <div className="suborder-total">
                      <span>Sub-Order Total:</span>
                      <strong>{formatCurrency(subOrder.subOrderTotal)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
