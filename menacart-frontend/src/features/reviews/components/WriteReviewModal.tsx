import React, { useState } from 'react';
import { useSubmitProductReview, useSubmitSellerReview } from '../hooks/useReviews';
import { Button } from '../../../components/Button';
import { useToast } from '../../../components/Toast';
import './WriteReviewModal.css';

interface WriteReviewModalProps {
  targetType: 'product' | 'seller';
  targetId: number;
  targetName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  targetType,
  targetId,
  targetName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { success: toastSuccess } = useToast();
  
  const submitProductMutation = useSubmitProductReview();
  const submitSellerMutation = useSubmitSellerReview();

  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submitError, setSubmitError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (rating === 0) {
      setSubmitError('Please select a star rating.');
      return;
    }

    try {
      if (targetType === 'product') {
        await submitProductMutation.mutateAsync({
          productId: targetId,
          rating,
          comment,
        });
        toastSuccess(`Successfully reviewed ${targetName}!`);
      } else {
        await submitSellerMutation.mutateAsync({
          sellerId: targetId,
          rating,
          comment,
        });
        toastSuccess(`Successfully reviewed the seller: ${targetName}!`);
      }

      // Reset & close
      setRating(0);
      setComment('');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setSubmitError(
        err.response?.data?.message || 
        err.message || 
        'Failed to submit review. Make sure you have purchased this item first.'
      );
    }
  };

  return (
    <div className="modal-backdrop fade-in" onClick={onClose}>
      <div className="modal-content slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            Write a Review
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {submitError && (
            <div className="password-error-alert" role="alert">
              {submitError}
            </div>
          )}

          <div className="review-target-info">
            <span className="target-label">Reviewing {targetType === 'product' ? 'Product' : 'Seller'}:</span>
            <strong className="target-name">{targetName}</strong>
          </div>

          {/* Star selector */}
          <div className="star-selector-container">
            <span className="star-selector-label">Your Rating</span>
            <div className="star-selector-row">
              {Array.from({ length: 5 }, (_, i) => {
                const starVal = i + 1;
                const isSelected = starVal <= rating;
                const isHovered = starVal <= hoverRating;

                return (
                  <button
                    key={i}
                    type="button"
                    className={`star-selector-btn ${isSelected ? 'selected' : ''} ${isHovered ? 'hover' : ''}`}
                    onClick={() => setRating(starVal)}
                    onMouseEnter={() => setHoverRating(starVal)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    ★
                  </button>
                );
              })}
            </div>
          </div>

          <div className="input-container">
            <label htmlFor="review-comment-field" className="input-label">
              Review Comment
            </label>
            <div className="input-wrapper">
              <textarea
                id="review-comment-field"
                className="input-field textarea-field"
                placeholder="Share your experience (sizing, material quality, shipping speed)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={1000}
                rows={4}
              />
            </div>
            <span className="char-counter">{comment.length}/1000</span>
          </div>

          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={
                targetType === 'product' 
                  ? submitProductMutation.isPending 
                  : submitSellerMutation.isPending
              }
            >
              Submit Review
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
