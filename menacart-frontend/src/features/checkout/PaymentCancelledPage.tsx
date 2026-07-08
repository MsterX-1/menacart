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
            : 'The payment process was cancelled or didn\'t complete. Don\'t worry, your items are still saved, and your order has not been placed.'}
        </p>

        {orderId && (
          <div className="sub-details">
            <span className="order-tag">Order #{orderId}</span>
          </div>
        )}

        <div className="action-row">
          <Button variant="secondary" onClick={() => navigate('/cart')}>
            Return to Cart
          </Button>
          <Button onClick={() => navigate('/checkout')}>
            Try Checkout Again
          </Button>
        </div>
      </div>
    </div>
  );
};
