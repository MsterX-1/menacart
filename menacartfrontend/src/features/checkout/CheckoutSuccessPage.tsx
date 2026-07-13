import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrderDetails } from '../orders/hooks/useOrders';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Button } from '../../components/Button';
import './CheckoutSuccessPage.css';

export const CheckoutSuccessPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const parsedOrderId = orderId ? parseInt(orderId, 10) : 0;

  const { data: order, isLoading, error } = useOrderDetails(parsedOrderId);

  if (isLoading) {
    return (
      <div className="checkout-success-loading">
        <LoadingSkeleton variant="text" width="200px" height={40} />
        <LoadingSkeleton variant="rect" width="100%" height={300} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="checkout-success-error">
        <div className="success-icon error-state">&#9888;</div>
        <h2>Order confirmed, but details could not be retrieved.</h2>
        <p>Your order ID is: <strong>#{parsedOrderId}</strong></p>
        <p>You can check your order status inside your Order History shortly.</p>
        <Link to="/orders">
          <Button>View Order History</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="checkout-success-page">
      <div className="success-card shadow-card">
        {/* Animated Checkmark */}
        <div className="checkmark-wrapper">
          <svg className="checkmark-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
            <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>

        <h1 className="success-title">Thank You For Your Order!</h1>
        <p className="success-subtitle">
          Your order has been placed successfully. Order ID: <strong>#{order.orderId}</strong>
        </p>

        <div className="order-details-summary">
          <div className="order-meta-grid">
            <div className="meta-box">
              <span className="meta-label">Payment Status</span>
              <span className={`status-badge payment-${order.paymentStatus.toLowerCase()}`}>
                {order.paymentStatus}
              </span>
            </div>
            <div className="meta-box">
              <span className="meta-label">Total Paid</span>
              <span className="meta-value font-highlight">{order.totalAmount.toFixed(2)} EGP</span>
            </div>
            <div className="meta-box">
              <span className="meta-label">Created At</span>
              <span className="meta-value">
                {new Date(order.createdAt).toLocaleDateString(undefined, {
                  dateStyle: 'medium',
                })}
              </span>
            </div>
          </div>

          <h3 className="section-title-minor">Multi-Vendor Breakdown</h3>
          <div className="sub-orders-summary-list">
            {order.subOrders.map((subOrder) => (
              <div key={subOrder.subOrderId} className="sub-order-summary-row">
                <div className="sub-order-shop-info">
                  <span className="shop-name">{subOrder.storeName}</span>
                  <span className="items-count">({subOrder.items.length} items)</span>
                </div>
                <span className="sub-order-status-badge">{subOrder.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="success-actions">
          <Link to="/orders">
            <Button variant="secondary">View Order History</Button>
          </Link>
          <Link to="/products">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
