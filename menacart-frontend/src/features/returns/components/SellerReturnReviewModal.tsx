import React, { useState, useEffect } from 'react';
import { useUpdateReturnStatus } from '../hooks/useSellerReturns';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { useToast } from '../../../components/Toast';
import type { ReturnResponse } from '../../../types/return';
import './SellerReturnReviewModal.css';

interface SellerReturnReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  ret: ReturnResponse | null;
  onSuccess: () => void;
}

export const SellerReturnReviewModal: React.FC<SellerReturnReviewModalProps> = ({
  isOpen,
  onClose,
  ret,
  onSuccess,
}) => {
  const { error: toastError, success: toastSuccess } = useToast();
  const updateStatusMutation = useUpdateReturnStatus();

  const [decision, setDecision] = useState<'Approved' | 'Rejected' | 'Completed'>('Approved');
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');

  // Default refund amount when return is opened
  useEffect(() => {
    if (ret) {
      const defaultRefund = ret.priceAtPurchase * ret.quantity;
      setRefundAmount(defaultRefund.toString());
      setNote('');
      if (ret.status === 'Approved') {
        setDecision('Completed');
      } else {
        setDecision('Approved');
      }
    }
  }, [ret]);

  if (!isOpen || !ret) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let parsedRefund: number | undefined = undefined;
    if (ret.status === 'Requested' && decision === 'Approved' && ret.type === 'Return') {
      parsedRefund = refundAmount ? parseFloat(refundAmount) : undefined;
      if (parsedRefund !== undefined && (isNaN(parsedRefund) || parsedRefund < 0)) {
        toastError('Please enter a valid refund amount.');
        return;
      }
    }

    try {
      await updateStatusMutation.mutateAsync({
        returnId: ret.returnId,
        data: {
          status: ret.status === 'Approved' ? 'Completed' : decision,
          refundAmount: parsedRefund,
          note: decision === 'Rejected' ? note : undefined,
        },
      });

      toastSuccess(`Return request status updated successfully.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toastError(
        err.response?.data?.message || 'Failed to update return request status.'
      );
    }
  };

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal-container" onClick={(e) => e.stopPropagation()}>
        <header className="review-modal-header">
          <h3 className="review-modal-title">Review Return / Exchange</h3>
          <button className="review-modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </header>

        <form onSubmit={handleSubmit} className="review-modal-form">
          <div className="request-summary-card">
            <div className="summary-row">
              <span className="summary-lbl">Request ID:</span>
              <span className="summary-val font-bold">#{ret.returnId}</span>
            </div>
            <div className="summary-row">
              <span className="summary-lbl">Type:</span>
              <span className="summary-val type-badge font-bold">{ret.type}</span>
            </div>
            <div className="summary-row">
              <span className="summary-lbl">Current Status:</span>
              <span className={`status-badge-text status-${ret.status.toLowerCase()}`}>
                {ret.status}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-lbl">Product:</span>
              <span className="summary-val">{ret.productName}</span>
            </div>
            <div className="summary-row">
              <span className="summary-lbl">Specs:</span>
              <span className="summary-val">
                {[
                  ret.color ? `Color: ${ret.color}` : '',
                  ret.size ? `Size: ${ret.size}` : '',
                  `Qty: ${ret.quantity}`,
                ]
                  .filter(Boolean)
                  .join(' | ')}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-lbl">Client Reason:</span>
              <span className="summary-val italic-text">"{ret.reason}"</span>
            </div>
            {ret.exchangeVariantSku && (
              <div className="summary-row highlight-row">
                <span className="summary-lbl">Exchange Variant:</span>
                <span className="summary-val sku-badge">{ret.exchangeVariantSku}</span>
              </div>
            )}
          </div>

          {ret.status === 'Requested' && (
            <div className="decision-section">
              <label className="form-label">Make a Decision</label>
              <div className="decision-radios">
                <label className="radio-label-tile">
                  <input
                    type="radio"
                    name="decision"
                    value="Approved"
                    checked={decision === 'Approved'}
                    onChange={() => setDecision('Approved')}
                  />
                  <div className="tile-content">
                    <span className="tile-title">Approve</span>
                    <span className="tile-desc">
                      Accept request and proceed to next step.
                    </span>
                  </div>
                </label>

                <label className="radio-label-tile">
                  <input
                    type="radio"
                    name="decision"
                    value="Rejected"
                    checked={decision === 'Rejected'}
                    onChange={() => setDecision('Rejected')}
                  />
                  <div className="tile-content">
                    <span className="tile-title">Reject</span>
                    <span className="tile-desc">
                      Decline request and notify client.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {ret.status === 'Requested' && decision === 'Approved' && ret.type === 'Return' && (
            <div className="form-group animate-reveal">
              <Input
                label="Refund Amount (EGP)"
                type="number"
                step="0.01"
                placeholder="Leave blank for full refund"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
              <span className="helper-text">
                Full original price is {(ret.priceAtPurchase * ret.quantity).toFixed(2)} EGP.
              </span>
            </div>
          )}

          {ret.status === 'Requested' && decision === 'Rejected' && (
            <div className="form-group animate-reveal">
              <label htmlFor="note" className="form-label">
                Rejection Note / Feedback
              </label>
              <textarea
                id="note"
                className="form-textarea-control"
                placeholder="Provide details on why this request is being rejected..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                required
              />
            </div>
          )}

          {ret.status === 'Approved' && (
            <div className="completion-info animate-reveal">
              <p className="completion-desc">
                This request was previously approved. Clicking the button below will mark this
                request as **Completed** (finalizing any customer payment refunds or product inventory
                restocking in the system).
              </p>
            </div>
          )}

          <div className="review-modal-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={updateStatusMutation.isPending}>
              {ret.status === 'Approved' ? 'Mark Completed' : `${decision} Request`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
