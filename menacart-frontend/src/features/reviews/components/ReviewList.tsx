import React, { useState } from 'react';
import { useProductReviews } from '../hooks/useReviews';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';
import './ReviewList.css';

interface ReviewListProps {
  productId: number;
  productRating?: number;
  productReviewCount?: number;
}

export const ReviewList: React.FC<ReviewListProps> = ({ 
  productId,
  productRating,
  productReviewCount
}) => {
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const { data: reviewsData, isLoading, error } = useProductReviews(productId, page, pageSize);

  if (isLoading) {
    return (
      <div className="reviews-list-loading">
        <LoadingSkeleton variant="text" width="150px" height={24} />
        <div style={{ marginTop: '15px' }}>
          <LoadingSkeleton variant="rect" height="100px" />
        </div>
        <div style={{ marginTop: '15px' }}>
          <LoadingSkeleton variant="rect" height="100px" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reviews-list-error">
        <p>Failed to load product reviews.</p>
      </div>
    );
  }

  const reviews = Array.isArray(reviewsData) ? reviewsData : [];
  const totalCount = productReviewCount ?? reviews.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Render Star Helper
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`review-star-icon ${i < rating ? 'filled' : 'empty'}`}>
        {i < rating ? '★' : '☆'}
      </span>
    ));
  };

  // Calculate review stats (rating breakdown)
  // Normally the backend would calculate this, but since we are showing reviews on the client side,
  // we can display a summary card. If the review count is 0, we show a clean message.
  const averageRating = productRating !== undefined 
    ? productRating.toFixed(1)
    : (reviews.length > 0 
        ? (reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length).toFixed(1)
        : '0.0');

  return (
    <div className="product-reviews-section">
      <h3 className="reviews-section-title">Customer Reviews ({totalCount})</h3>

      <div className="reviews-layout-grid">
        {/* Rating Summary Card */}
        <div className="rating-summary-card ">
          <div className="big-rating-number">{averageRating}</div>
          <div className="stars-row">{renderStars(Math.round(parseFloat(averageRating)))}</div>
          <div className="rating-help-text">Based on local customer ratings</div>
        </div>

        {/* Reviews List */}
        <div className="reviews-items-container">
          {reviews.length === 0 ? (
            <div className="reviews-empty-state ">
              <p>No reviews yet for this product. Be the first to share your experience!</p>
            </div>
          ) : (
            <div className="reviews-feed">
              {reviews.map((review) => {
                const formattedDate = new Date(review.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });

                return (
                  <div key={review.reviewId} className="review-item ">
                    <div className="review-item-header">
                      <div className="reviewer-info">
                        <span className="reviewer-avatar">
                          {review.userName[0]?.toUpperCase() || 'U'}
                        </span>
                        <div>
                          <span className="reviewer-name">{review.userName}</span>
                          <span className="review-date">{formattedDate}</span>
                        </div>
                      </div>
                      <div className="review-item-stars">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="review-item-comment">{review.comment}</p>
                    )}
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="reviews-pagination">
                  <button
                    className="pagination-btn"
                    disabled={page === 1}
                    onClick={() => setPage((prev) => prev - 1)}
                  >
                    &larr; Previous
                  </button>
                  <span className="pagination-info">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    className="pagination-btn"
                    disabled={page === totalPages}
                    onClick={() => setPage((prev) => prev + 1)}
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
