import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderDetails } from '../orders/hooks/useOrders';
import { Button } from '../../components/Button';
import './PaymentProcessingPage.css';

export const PaymentProcessingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const parsedOrderId = orderId ? parseInt(orderId, 10) : 0;
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState(0);

  const { data: order, error, refetch } = useOrderDetails(parsedOrderId);

  // Poll order details to check payment status
  useEffect(() => {
    if (!parsedOrderId) return;

    const interval = setInterval(() => {
      refetch();
      setAttempts((prev) => prev + 1);
    }, 2000);

    return () => clearInterval(interval);
  }, [parsedOrderId, refetch]);

  // Handle status transitions
  useEffect(() => {
    if (!order) return;

    const status = order.paymentStatus.toLowerCase();
    if (status === 'paid') {
      navigate(`/checkout/success/${parsedOrderId}`);
    } else if (status === 'failed') {
      navigate(`/payment/cancelled?orderId=${parsedOrderId}`);
    }

    // Timeout after 30 attempts (60 seconds)
    if (attempts >= 30) {
      navigate(`/payment/cancelled?orderId=${parsedOrderId}&timeout=true`);
    }
  }, [order, navigate, parsedOrderId, attempts]);

  if (error) {
    return (
      <div className="payment-processing-container error-state">
        <div className="status-card shadow-card">
          <div className="error-icon">&#9888;</div>
          <h2 className="title">Unable to Verify Payment</h2>
          <p className="description">
            There was an error communicating with our payment verification servers.
          </p>
          <Button onClick={() => navigate('/orders')}>Go to My Orders</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-processing-container">
      <div className="status-card shadow-card">
        {/* Luxury Loading Animation */}
        <div className="premium-loader-wrapper">
          <div className="loader-ring"></div>
          <div className="loader-inner-circle"></div>
          <div className="loader-glow"></div>
        </div>

        <h1 className="title">Securing Your Order</h1>
        <p className="description">
          We are currently verifying your payment details with Stripe.
          Please do not refresh the page or click back.
        </p>

        <div className="sub-details">
          <span className="order-tag">Order #{parsedOrderId}</span>
          <span className="dot">•</span>
          <span className="processing-tag">Processing secure payment...</span>
        </div>
      </div>
    </div>
  );
};
