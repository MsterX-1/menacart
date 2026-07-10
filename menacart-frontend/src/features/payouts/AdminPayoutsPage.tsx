import React, { useState } from 'react';
import { useAdminPayouts, useReviewPayout } from './hooks/usePayouts';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useToast } from '../../components/Toast';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import './AdminPayoutsPage.css';

export const AdminPayoutsPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>(''); // '' means All
  const { data: payouts, isLoading } = useAdminPayouts(statusFilter || undefined);
  const reviewPayoutMutation = useReviewPayout();

  // Keep track of which row is being reviewed inline
  const [reviewingPayoutId, setReviewingPayoutId] = useState<number | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [newStatus, setNewStatus] = useState<'Paid' | 'Failed'>('Paid');
  const [actionError, setActionError] = useState('');

  const handleStartReview = (payoutId: number, currentMethod: string) => {
    setReviewingPayoutId(payoutId);
    setActionError('');
    // Auto-generate transaction ref for Stripe payouts to prompt the user
    if (currentMethod.toLowerCase() === 'stripe') {
      setTransactionRef('stripe-transfer-auto');
    } else {
      setTransactionRef('');
    }
    setNewStatus('Paid');
  };

  const handleCancelReview = () => {
    setReviewingPayoutId(null);
    setTransactionRef('');
  };

  const handleSubmitReview = async (payoutId: number) => {
    setActionError('');
    if (!transactionRef.trim()) {
      setActionError('Transaction reference is required.');
      return;
    }

    try {
      await reviewPayoutMutation.mutateAsync({
        payoutId,
        data: {
          status: newStatus,
          transactionRef: transactionRef.trim(),
        },
      });
      toastSuccess(`Payout request marked as ${newStatus} successfully!`);
      setReviewingPayoutId(null);
      setTransactionRef('');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to review payout.';
      setActionError(msg);
      toastError(msg);
    }
  };

  return (
    <div className="admin-payouts-container fade-in">
      <header className="admin-payouts-header">
        <h1 className="admin-payouts-title">Manage Payout Requests</h1>
        <p className="admin-payouts-subtitle">
          Process and audit payout requests submitted by platform merchants. Approve bank transfers or trigger Stripe transfers.
        </p>
      </header>

      {/* Filter Tabs */}
      <div className="filter-bar">
        <button
          className={`filter-tab ${statusFilter === '' ? 'active' : ''}`}
          onClick={() => { setStatusFilter(''); handleCancelReview(); }}
        >
          All Payouts
        </button>
        <button
          className={`filter-tab ${statusFilter === 'Pending' ? 'active' : ''}`}
          onClick={() => { setStatusFilter('Pending'); handleCancelReview(); }}
        >
          Pending
        </button>
        <button
          className={`filter-tab ${statusFilter === 'Paid' ? 'active' : ''}`}
          onClick={() => { setStatusFilter('Paid'); handleCancelReview(); }}
        >
          Paid
        </button>
        <button
          className={`filter-tab ${statusFilter === 'Failed' ? 'active' : ''}`}
          onClick={() => { setStatusFilter('Failed'); handleCancelReview(); }}
        >
          Failed
        </button>
      </div>

      {isLoading ? (
        <div className="admin-payouts-loading">
          <LoadingSkeleton variant="text" width="200px" height={24} />
          <div style={{ marginTop: '16px' }}>
            <LoadingSkeleton variant="rect" height="400px" />
          </div>
        </div>
      ) : !payouts || payouts.length === 0 ? (
        <div className="empty-payouts-state">
          <span className="empty-icon">💸</span>
          <p className="empty-text">No payout requests found matching the current status.</p>
        </div>
      ) : (
        <div className="table-responsive-wrapper">
          <table className="admin-payouts-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Seller ID</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Requested Date</th>
                <th>Status</th>
                <th>Reference</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => {
                const isReviewing = reviewingPayoutId === p.payoutId;
                let statusClass = 'status-badge-pending';
                if (p.status === 'Paid') statusClass = 'status-badge-paid';
                if (p.status === 'Failed') statusClass = 'status-badge-failed';
                if (p.status === 'Processing') statusClass = 'status-badge-processing';

                return (
                  <React.Fragment key={p.payoutId}>
                    <tr className={isReviewing ? 'row-reviewing' : ''}>
                      <td>#{p.payoutId}</td>
                      <td>Seller #{p.sellerId}</td>
                      <td>
                        <span className="method-tag">
                          {p.paymentMethod.toLowerCase() === 'stripe' ? '💳 Stripe' : '🏦 Bank'}
                        </span>
                      </td>
                      <td className="amount-col">{p.amount.toLocaleString('en-EG', { style: 'currency', currency: 'EGP' })}</td>
                      <td>{new Date(p.createdAt).toLocaleDateString('en-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                      <td>
                        <span className={`status-badge ${statusClass}`}>{p.status}</span>
                      </td>
                      <td>
                        {p.transactionRef ? (
                          <code className="ref-code" title={p.transactionRef}>{p.transactionRef.substring(0, 16)}...</code>
                        ) : (
                          <span className="no-ref-text">—</span>
                        )}
                      </td>
                      <td>
                        {p.status === 'Pending' || p.status === 'Processing' ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleStartReview(p.payoutId, p.paymentMethod)}
                            disabled={isReviewing}
                          >
                            Review
                          </Button>
                        ) : (
                          <span className="action-done-txt">Settled</span>
                        )}
                      </td>
                    </tr>

                    {/* Expandable Inline Review Panel */}
                    {isReviewing && (
                      <tr className="inline-review-row">
                        <td colSpan={8}>
                          <div className="inline-review-panel slide-down">
                            <h4 className="panel-title">Review Payout #{p.payoutId}</h4>
                            <p className="panel-desc">
                              {p.paymentMethod.toLowerCase() === 'stripe'
                                ? 'This seller has requested payout via Stripe. Marking as Paid will trigger an automated test transfer to the configured seller Stripe Account.'
                                : 'Ensure you have processed the manual bank transfer request before marking this payout as Paid.'}
                            </p>

                            <div className="review-form">
                              <div className="form-group">
                                <label className="input-label">Outcome Status</label>
                                <div className="outcome-selector">
                                  <button
                                    type="button"
                                    className={`outcome-btn success-outcome ${newStatus === 'Paid' ? 'active' : ''}`}
                                    onClick={() => setNewStatus('Paid')}
                                  >
                                    Approve & Mark Paid
                                  </button>
                                  <button
                                    type="button"
                                    className={`outcome-btn error-outcome ${newStatus === 'Failed' ? 'active' : ''}`}
                                    onClick={() => setNewStatus('Failed')}
                                  >
                                    Mark Failed
                                  </button>
                                </div>
                              </div>

                              <div className="form-group">
                                <Input
                                  label="Transaction Reference / Note"
                                  placeholder={
                                    p.paymentMethod.toLowerCase() === 'stripe'
                                      ? 'e.g. stripe-transfer-id'
                                      : 'e.g. Bank receipt number or rejection reason'
                                  }
                                  value={transactionRef}
                                  onChange={(e) => setTransactionRef(e.target.value)}
                                  required
                                  helperText="This reference ID will be visible to the merchant on their dashboard."
                                />
                              </div>

                              {actionError && <div className="review-error-alert">{actionError}</div>}

                              <div className="form-actions">
                                <Button
                                  variant="primary"
                                  isLoading={reviewPayoutMutation.isPending}
                                  onClick={() => handleSubmitReview(p.payoutId)}
                                >
                                  Submit Decision
                                </Button>
                                <Button variant="ghost" onClick={handleCancelReview}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPayoutsPage;
