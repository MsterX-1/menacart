import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMyOrders } from './hooks/useOrders';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Button } from '../../components/Button';
import './OrderListPage.css';

export const OrderListPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: orders, isLoading, error } = useMyOrders(page, pageSize);

  if (isLoading) {
    return (
      <div className="orders-list-page">
        <header className="orders-header">
          <LoadingSkeleton variant="text" width="180px" height={32} />
        </header>
        <div className="orders-skeleton-list">
          {Array.from({ length: 3 }).map((_, idx) => (
            <LoadingSkeleton key={idx} variant="rect" height="140px" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !orders) {
    return (
      <div className="orders-error-container">
        <h2>Failed to load your orders</h2>
        <p>There was a problem loading your history. Please try again.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const isEmpty = orders.length === 0;

  return (
    <div className="orders-list-page">
      <header className="orders-header">
        <h1 className="orders-title">Your Orders</h1>
        <p className="orders-subtitle">Track and review details of all your fashion purchases.</p>
      </header>

      {isEmpty ? (
        <div className="orders-empty-state">
          <div className="empty-orders-icon">&#128230;</div>
          <h2>No orders placed yet</h2>
          <p>Once you purchase items, they will show up here for you to track.</p>
          <Link to="/products">
            <Button>Explore Products</Button>
          </Link>
        </div>
      ) : (
        <div className="orders-layout-container">
          <div className="orders-list">
            {orders.map((order) => {
              // Gather total items in the order
              const totalItemsCount = order.subOrders.reduce(
                (sum, sub) => sum + sub.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
                0
              );

              return (
                <div key={order.orderId} className="order-list-card shadow-card">
                  <div className="order-card-header">
                    <div className="order-header-meta">
                      <div className="meta-col">
                        <span className="meta-title">Order Placed</span>
                        <span className="meta-data">
                          {new Date(order.createdAt).toLocaleDateString(undefined, {
                            dateStyle: 'medium',
                          })}
                        </span>
                      </div>
                      <div className="meta-col">
                        <span className="meta-title">Total</span>
                        <span className="meta-data highlight-price">
                          {order.totalAmount.toFixed(2)} EGP
                        </span>
                      </div>
                      <div className="meta-col">
                        <span className="meta-title">Order ID</span>
                        <span className="meta-data">#{order.orderId}</span>
                      </div>
                    </div>

                    <div className="order-header-actions">
                      <Link to={`/orders/${order.orderId}`}>
                        <Button variant="secondary" size="sm">
                          Order Details
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="order-card-body">
                    <div className="order-status-row">
                      <div className="status-indicator">
                        <span className="status-label">Status:</span>
                        <span className={`status-badge-text status-${order.status.toLowerCase()}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="status-indicator">
                        <span className="status-label">Payment:</span>
                        <span className={`status-badge-text payment-${order.paymentStatus.toLowerCase()}`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Previews of items */}
                    <div className="order-items-preview">
                      <ul className="preview-items-list">
                        {order.subOrders.flatMap((sub) => sub.items).slice(0, 3).map((item) => (
                          <li key={item.orderItemId} className="preview-item">
                            <span className="preview-item-qty">{item.quantity}x</span>
                            <span className="preview-item-name">{item.productName}</span>
                            {(item.color || item.size) && (
                              <span className="preview-item-specs">
                                ({[item.color, item.size].filter(Boolean).join(', ')})
                              </span>
                            )}
                          </li>
                        ))}
                        {totalItemsCount > 3 && (
                          <li className="preview-item-more">
                            + {totalItemsCount - 3} more item{totalItemsCount - 3 > 1 ? 's' : ''}
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Simple Pagination Controls */}
          {orders.length === pageSize && (
            <div className="pagination-row">
              <Button
                variant="secondary"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous Page
              </Button>
              <span className="page-number">Page {page}</span>
              <Button
                variant="secondary"
                onClick={() => setPage((p) => p + 1)}
              >
                Next Page
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
