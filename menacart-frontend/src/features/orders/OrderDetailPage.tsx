import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrderDetails, useCancelOrder } from './hooks/useOrders';
import { useMyReturns } from '../returns/hooks/useReturns';
import { ReturnRequestModal } from '../returns/components/ReturnRequestModal';
import { WriteReviewModal } from '../reviews/components/WriteReviewModal';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import type { OrderItem } from '../../types/order';
import { getDisplayStatus } from '../../utils/orderStatus';
import './OrderDetailPage.css';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { error: toastError, success: toastSuccess } = useToast();
  const [selectedItemForReturn, setSelectedItemForReturn] = useState<OrderItem | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  // Review states
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewTargetType, setReviewTargetType] = useState<'product' | 'seller'>('product');
  const [selectedProductItem, setSelectedProductItem] = useState<OrderItem | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<{ id: number; name: string } | null>(null);

  const parsedOrderId = id ? parseInt(id, 10) : 0;
  const { data: order, isLoading, error, refetch } = useOrderDetails(parsedOrderId);
  const { data: myReturns, refetch: refetchReturns } = useMyReturns();
  const cancelOrderMutation = useCancelOrder();

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    try {
      await cancelOrderMutation.mutateAsync(parsedOrderId);
      toastSuccess('Order has been cancelled successfully.');
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to cancel the order.');
    }
  };

  if (isLoading) {
    return (
      <div className="order-details-page">
        <LoadingSkeleton variant="text" width="200px" height={32} />
        <LoadingSkeleton variant="rect" height="300px" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-details-error-container">
        <h2>Order Not Found</h2>
        <p>The order you are looking for does not exist or you do not have permission to view it.</p>
        <Link to="/orders">
          <Button>Back to Orders</Button>
        </Link>
      </div>
    );
  }

  // Check if order is eligible for cancellation (must be Placed status and no sub-orders processing)
  const isCancellable =
    order.status === 'Placed' &&
    order.subOrders.every((sub) => sub.status === 'Placed');

  return (
    <div className="order-details-page">
      <header className="details-header">
        <div className="back-link-row">
          <Link to="/orders" className="back-to-orders-btn">
            &larr; Back to Order History
          </Link>
        </div>
        <div className="title-row">
          <h1 className="details-title">Order Details</h1>
          {isCancellable && (
            <Button
              variant="danger"
              size="sm"
              isLoading={cancelOrderMutation.isPending}
              onClick={handleCancelOrder}
            >
              Cancel Order
            </Button>
          )}
        </div>
        <div className="header-meta-summary">
          <span>Order ID: <strong>#{order.orderId}</strong></span>
          <span className="dot-divider"></span>
          <span>
            Placed on:{' '}
            <strong>
              {new Date(order.createdAt).toLocaleDateString(undefined, {
                dateStyle: 'medium',
              })}
            </strong>
          </span>
        </div>
      </header>

      <div className="details-grid">
        {/* Main Details (Sub-orders / packages) */}
        <div className="details-main-section">
          <h2 className="section-group-title">Packages in your Order</h2>
          <p className="section-group-desc">
            Your items are split into packages managed by individual sellers.
          </p>

          <div className="packages-list">
            {order.subOrders.map((subOrder) => (
              <div key={subOrder.subOrderId} className="package-card shadow-card">
                <div className="package-header">
                  <div className="seller-shop-info">
                    <span className="shop-icon">&#127978;</span>
                    <div>
                      <h4 className="shop-title-name">
                        {subOrder.storeName}
                        {subOrder.status === 'Delivered' && (
                          <button
                            className="review-seller-inline-btn"
                            title="Write a review for this seller"
                            onClick={() => {
                              setReviewTargetType('seller');
                              setSelectedSeller({ id: subOrder.sellerId, name: subOrder.storeName });
                              setIsReviewModalOpen(true);
                            }}
                          >
                            ★ Review Seller
                          </button>
                        )}
                      </h4>
                      <span className="seller-label">Seller Package</span>
                    </div>
                  </div>
                  <div className="package-status-col">
                    <span className={`status-badge-text status-${subOrder.status.toLowerCase()}`}>
                      {subOrder.status}
                    </span>
                  </div>
                </div>

                <div className="package-items-table">
                  {(subOrder.status === 'Shipped' || subOrder.status === 'Delivered') && subOrder.carrier && subOrder.trackingNumber && (
                    <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border-subtle)', fontSize: '0.9rem' }}>
                      <strong>Shipping via {subOrder.carrier}</strong> - Tracking: {subOrder.trackingNumber}
                    </div>
                  )}
                  {subOrder.items.map((item) => {
                    const returnRequest = myReturns?.find((r) => r.orderItemId === item.orderItemId);
                    return (
                      <div key={item.orderItemId} className="package-item-row">
                        <div className="item-info">
                          <span className="item-name-text">{item.productName}</span>
                          <div className="item-specs-row">
                            {item.color && <span className="spec-badge">Color: {item.color}</span>}
                            {item.size && <span className="spec-badge">Size: {item.size}</span>}
                            {returnRequest && (
                              <span className={`return-status-badge status-${returnRequest.status.toLowerCase()}`}>
                                {returnRequest.type}: {returnRequest.status}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="item-qty-price">
                          <span className="item-qty">{item.quantity}x</span>
                          <span className="item-price">
                            {(item.priceAtPurchase * item.quantity).toFixed(2)} EGP
                          </span>
                          {subOrder.status === 'Delivered' && (
                            <div className="item-actions-col" style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                              {!returnRequest && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedItemForReturn(item);
                                    setIsReturnModalOpen(true);
                                  }}
                                >
                                  Return / Exchange
                                </Button>
                              )}
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setSelectedProductItem(item);
                                  setReviewTargetType('product');
                                  setIsReviewModalOpen(true);
                                }}
                              >
                                Write Review
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="package-shipping-row">
                  <span className="shipping-label">Package Shipping Cost</span>
                  <span className="shipping-value">
                    {subOrder.shippingCost === 0 ? 'FREE' : `${subOrder.shippingCost.toFixed(2)} EGP`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="details-sidebar-section">
          <div className="order-summary-box shadow-card">
            <h3 className="summary-box-title">Payment & Summary</h3>

            <div className="summary-section-row">
              <span className="row-label">Order Status</span>
              <span className={`status-badge-text status-${getDisplayStatus(order).toLowerCase().replace(' ', '-')}`}>
                {getDisplayStatus(order)}
              </span>
            </div>

            <div className="summary-section-row">
              <span className="row-label">Payment Status</span>
              <span className={`status-badge-text payment-${order.paymentStatus.toLowerCase()}`}>
                {order.paymentStatus}
              </span>
            </div>

            <div className="summary-divider"></div>

            <div className="total-calculation-details">
              <div className="calc-row-detail">
                <span>Items Subtotal</span>
                <span>{(order.subOrders.reduce((sum, sub) => sum + sub.items.reduce((s, i) => s + (i.priceAtPurchase * i.quantity), 0), 0)).toFixed(2)} EGP</span>
              </div>
              <div className="calc-row-detail">
                <span>Shipping</span>
                <span>
                  {order.subOrders.reduce((sum, sub) => sum + sub.shippingCost, 0) === 0 
                    ? <span className="free-shipping">FREE</span> 
                    : `${order.subOrders.reduce((sum, sub) => sum + sub.shippingCost, 0).toFixed(2)} EGP`}
                </span>
              </div>
              <div className="calc-row-detail total-highlight">
                <span>Total Amount</span>
                <span className="grand-total-val">{order.totalAmount.toFixed(2)} EGP</span>
              </div>
            </div>

            {order.paymentStatus === 'Pending' && order.paymentUrl && (
              <a href={order.paymentUrl} className="pay-now-button-link">
                <Button className="pay-now-btn">Complete Payment</Button>
              </a>
            )}
          </div>
        </div>
      </div>
      <ReturnRequestModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        item={selectedItemForReturn}
        onSuccess={() => {
          refetch();
          refetchReturns();
        }}
      />
      {selectedProductItem && reviewTargetType === 'product' && (
        <WriteReviewModal
          targetType="product"
          targetId={selectedProductItem.productId}
          targetName={selectedProductItem.productName}
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedProductItem(null);
          }}
          onSuccess={refetch}
        />
      )}
      {selectedSeller && reviewTargetType === 'seller' && (
        <WriteReviewModal
          targetType="seller"
          targetId={selectedSeller.id}
          targetName={selectedSeller.name}
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedSeller(null);
          }}
          onSuccess={refetch}
        />
      )}
    </div>
  );
};
