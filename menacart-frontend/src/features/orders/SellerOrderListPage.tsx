import React, { useState } from 'react';
import { useSellerSubOrders, useUpdateSubOrderStatus } from './hooks/useSellerOrders';
import { useMySellerProfile } from '../seller-onboarding/hooks/useSellerOnboarding';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useToast } from '../../components/Toast';
import type { SubOrder } from '../../types/order';
import './SellerOrderListPage.css';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  Placed: ['Placed', 'Processing', 'Cancelled'],
  Processing: ['Processing', 'Shipped', 'Cancelled'],
  Shipped: ['Shipped', 'Delivered'],
  Delivered: ['Delivered'],
  Cancelled: ['Cancelled'],
};

export const SellerOrderListPage: React.FC = () => {
  const { error: toastError, success: toastSuccess } = useToast();
  
  // Status filter state
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Query
  const { data: subOrders, isLoading, error, refetch } = useSellerSubOrders(
    statusFilter || undefined,
    page,
    pageSize
  );

  const { data: profile } = useMySellerProfile();

  // Mutation
  const updateStatusMutation = useUpdateSubOrderStatus();

  // Modal / Form state for status update
  const [selectedSubOrder, setSelectedSubOrder] = useState<SubOrder | null>(null);
  const [newStatus, setNewStatus] = useState<string>('Processing');
  const [carrier, setCarrier] = useState('');

  const handleOpenStatusModal = (subOrder: SubOrder) => {
    setSelectedSubOrder(subOrder);
    setNewStatus(subOrder.status);
    setCarrier(subOrder.carrier || '');
  };

  const handleCloseStatusModal = () => {
    setSelectedSubOrder(null);
  };

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubOrder) return;

    if (newStatus === 'Shipped' && !carrier.trim()) {
      toastError('Carrier is required to ship this package.');
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        subOrderId: selectedSubOrder.subOrderId,
        data: {
          status: newStatus as any,
          carrier: newStatus === 'Shipped' ? carrier : undefined,
        },
      });

      toastSuccess(`Order #${selectedSubOrder.subOrderId} updated to "${newStatus}"!`);
      refetch();
      handleCloseStatusModal();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update order status.');
    }
  };

  if (isLoading) {
    return (
      <div className="seller-orders-page">
        <header className="seller-orders-header">
          <LoadingSkeleton variant="text" width="200px" height={32} />
        </header>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: '24px' }}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <LoadingSkeleton key={idx} variant="rect" height="80px" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !subOrders) {
    return (
      <div className="seller-orders-error">
        <h2>Failed to load shop orders</h2>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="seller-orders-page">
      <header className="seller-orders-header">
        <div>
          <h1 className="seller-orders-title">Shop Orders</h1>
          <p className="seller-orders-subtitle">Manage customer order packages, shipping details and status updates.</p>
        </div>

        <div className="filter-controls">
          <label className="filter-label">Filter Status</label>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Orders</option>
            <option value="Placed">Placed</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </header>

      {subOrders.length === 0 ? (
        <div className="seller-orders-empty">
          <div className="empty-box-icon">&#128229;</div>
          <h3>No orders matching this status</h3>
          <p>Once clients make orders from your shop, they will show up here.</p>
        </div>
      ) : (
        <div className="seller-orders-container">
          <div className="sub-orders-table-wrapper shadow-card">
            <table className="sub-orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Items</th>
                  <th>Total Amount</th>
                  <th>Shipping Cost</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subOrders.map((subOrder) => {
                  const totalValue = subOrder.items.reduce((sum, item) => sum + item.priceAtPurchase * item.quantity, 0);

                  return (
                    <tr key={subOrder.subOrderId}>
                      <td className="font-highlight">#{subOrder.subOrderId}</td>
                      <td>
                        <div className="items-cell-list">
                          {subOrder.items.map((item) => (
                            <span key={item.orderItemId} className="table-item-badge">
                              {item.quantity}x {item.productName}
                              {item.size && ` (${item.size})`}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="price-cell">{(totalValue + subOrder.shippingCost).toFixed(2)} EGP</td>
                      <td>{subOrder.shippingCost === 0 ? 'FREE' : `${subOrder.shippingCost.toFixed(2)} EGP`}</td>
                      <td>
                        <span className={`status-badge-text status-${subOrder.status.toLowerCase()}`}>
                          {subOrder.status}
                        </span>
                      </td>
                      <td>
                        {subOrder.status !== 'Delivered' && subOrder.status !== 'Cancelled' ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenStatusModal(subOrder)}
                          >
                            Update Status
                          </Button>
                        ) : (
                          <span style={{ color: 'var(--color-text-disabled)', paddingLeft: '8px' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {subOrders.length === pageSize && (
            <div className="pagination-row">
              <Button
                variant="secondary"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="page-number">Page {page}</span>
              <Button
                variant="secondary"
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modal for updating Status */}
      {selectedSubOrder && (
        <div className="status-modal-overlay">
          <div className="status-modal shadow-card">
            <h3 className="modal-title">Update Sub-Order Status</h3>
            <p className="modal-subtitle">Update processing or shipping state for Order #{selectedSubOrder.subOrderId}</p>

            <form onSubmit={handleUpdateStatusSubmit} className="status-update-form">
              <div className="input-group">
                <label className="input-label">Select Status</label>
                <select
                  className="input-field select-field"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  {(ALLOWED_TRANSITIONS[selectedSubOrder.status] || [selectedSubOrder.status]).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {newStatus === 'Shipped' && (
                <div className="shipping-fields-container animate-fade-in">
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Carrier Service</label>
                    {profile?.deliveryProviders && profile.deliveryProviders.length > 0 ? (
                      <select
                        className="input-field select-field"
                        value={carrier}
                        onChange={(e) => setCarrier(e.target.value)}
                        style={{ width: '100%' }}
                      >
                        <option value="" disabled>Select a Carrier</option>
                        {profile.deliveryProviders.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        label=""
                        placeholder="Aramex, DHL, etc."
                        value={carrier}
                        onChange={(e) => setCarrier(e.target.value)}
                      />
                    )}
                  </div>
                  
                  {selectedSubOrder.trackingNumber ? (
                    <div className="input-group" style={{ marginTop: '1rem' }}>
                      <label className="input-label" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Tracking Number (Auto-Generated)</label>
                      <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--color-bg-subtle)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)' }}>
                        {selectedSubOrder.trackingNumber}
                      </div>
                    </div>
                  ) : (
                    <div className="input-group" style={{ marginTop: '1rem' }}>
                      <label className="input-label" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Tracking Number</label>
                      <div style={{ fontSize: '14px', color: 'var(--color-text-tertiary)' }}>
                        Will be automatically generated upon saving.
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="status-modal-actions">
                <Button type="button" variant="secondary" onClick={handleCloseStatusModal}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={updateStatusMutation.isPending}>
                  Apply Update
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
