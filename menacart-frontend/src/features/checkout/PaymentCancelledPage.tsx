import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import './PaymentCancelledPage.css';

export const PaymentCancelledPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const orderId = searchParams.get('orderId');
  const isTimeout = searchParams.get('timeout') === 'true';

  return (
    <div className="payment-cancelled-container">
      <div className="status-card shadow-card">
        <div className="status-icon-wrapper">
          <div className="cancel-circle">
            <span className="cross-icon">&times;</span>
          </div>
        </div>

        <h1 className="title">
          {isTimeout ? 'Verification Timeout' : 'Payment Cancelled'}
        </h1>
        <p className="description">
          {isTimeout
            ? "We couldn't verify your payment within the expected time. If your payment went through, please check your Order History shortly."
            : 'The payment process was cancelled or did not complete. Your order has been saved in a pending state. You can complete your payment anytime from your Order Details page.'}
        </p>

        {orderId && (
          <div className="sub-details">
            <span className="order-tag">Order #{orderId}</span>
          </div>
        )}

        <div className="action-row">
          {orderId ? (
            <Button onClick={() => navigate(`/orders/${orderId}`)}>
              View Order Details
            </Button>
          ) : (
            <Button onClick={() => navigate('/orders')}>
              Go to Order History
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate('/products')}>
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
};
