import React, { useState } from 'react';
import { usePendingProducts, useApproveProduct } from '../hooks/useProducts';
import { Button } from '../../../components/Button';
import { useToast } from '../../../components/Toast';
import './AdminProductQueuePage.css';

export const AdminProductQueuePage: React.FC = () => {
  const { error: toastError, success: toastSuccess } = useToast();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: products, isLoading, error, refetch } = usePendingProducts(page, pageSize);
  const approveMutation = useApproveProduct();

  // Rejection state
  const [rejectingProductId, setRejectingProductId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleApprove = async (productId: number) => {
    try {
      await approveMutation.mutateAsync({
        productId,
        data: { status: 'Approved' },
      });
      toastSuccess('Product approved successfully');
      refetch();
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || 'Failed to approve product');
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingProductId || !rejectionReason.trim()) return;

    try {
      await approveMutation.mutateAsync({
        productId: rejectingProductId,
        data: {
          status: 'Rejected',
          rejectionReason: rejectionReason.trim(),
        },
      });
      toastSuccess('Product rejected successfully');
      setRejectingProductId(null);
      setRejectionReason('');
      refetch();
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || 'Failed to reject product');
    }
  };

  if (isLoading) {
    return (
      <div className="admin-queue-container loading">
        <div className="loading-spinner"></div>
        <p>Loading pending queue...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-queue-container error">
        <p className="error-message">Error loading pending queue: {(error as any).message}</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="admin-queue-container">
      <div className="admin-queue-header">
        <div>
          <h1 className="admin-queue-title">Product Approval Queue</h1>
          <p className="admin-queue-subtitle">Review and verify vendor listings</p>
        </div>
      </div>

      {products && products.length === 0 ? (
        <div className="admin-queue-empty">
          <h2>No products pending review</h2>
          <p>The queue is completely clear. Good job!</p>
        </div>
      ) : (
        <div className="admin-queue-list">
          {products?.map((product) => (
            <div key={product.productId} className="pending-product-card">
              <div className="pending-product-details">
                {product.mainImageUrl ? (
                  <img
                    src={product.mainImageUrl}
                    alt={product.name}
                    className="pending-product-image"
                  />
                ) : (
                  <div className="pending-product-image placeholder">👗</div>
                )}
                <div className="pending-product-info">
                  <div className="pending-product-store">Store: {product.storeName}</div>
                  <h3 className="pending-product-name">{product.name}</h3>
                  {product.brand && <div className="pending-product-brand">Brand: {product.brand}</div>}
                  <div className="pending-product-category">Category: {product.categoryName}</div>
                  <div className="pending-product-price">Base Price: ${product.basePrice.toFixed(2)}</div>
                  {product.description && (
                    <p className="pending-product-desc">{product.description}</p>
                  )}
                </div>
              </div>

              {/* Variants Section */}
              <div className="pending-product-variants">
                <h4>Variants ({product.variants?.length || 0})</h4>
                <div className="variants-grid">
                  {product.variants?.map((v) => (
                    <div key={v.variantId} className="variant-mini-card">
                      <div className="variant-mini-sku">{v.sku}</div>
                      <div className="variant-mini-details">
                        {v.color && <span>Color: {v.color}</span>}
                        {v.size && <span>Size: {v.size}</span>}
                        <span>Price: ${v.price.toFixed(2)}</span>
                        <span>Stock: {v.stockQuantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pending-product-actions">
                <Button
                  onClick={() => handleApprove(product.productId)}
                  isLoading={approveMutation.isPending && rejectingProductId !== product.productId}
                  disabled={approveMutation.isPending}
                >
                  Approve Listing
                </Button>
                <Button
                  variant="secondary"
                  className="btn-reject"
                  onClick={() => setRejectingProductId(product.productId)}
                  disabled={approveMutation.isPending}
                >
                  Reject...
                </Button>
              </div>

              {/* Rejection Form Modal Overlay */}
              {rejectingProductId === product.productId && (
                <div className="rejection-modal-overlay">
                  <div className="rejection-modal">
                    <h3>Reject Product Listing</h3>
                    <p>Provide a reason for rejection. This will be shared with the seller.</p>
                    <form onSubmit={handleRejectSubmit}>
                      <textarea
                        required
                        rows={4}
                        placeholder="Rejection reason..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="rejection-textarea"
                      />
                      <div className="rejection-modal-actions">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            setRejectingProductId(null);
                            setRejectionReason('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="btn-danger-filled"
                          isLoading={approveMutation.isPending}
                          disabled={!rejectionReason.trim()}
                        >
                          Confirm Rejection
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="admin-pagination">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              Previous
            </Button>
            <span className="pagination-info">Page {page}</span>
            <Button
              variant="secondary"
              size="sm"
              disabled={products && products.length < pageSize}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
