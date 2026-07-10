import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist, useRemoveFromWishlist } from './hooks/useWishlist';
import { useAddCartItem } from '../cart/hooks/useCart';
import { Button } from '../../components/Button';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useToast } from '../../components/Toast';
import './WishlistPage.css';

export const WishlistPage: React.FC = () => {
  const { data: wishlistItems, isLoading, error } = useWishlist();
  const removeMutation = useRemoveFromWishlist();
  const addToCartMutation = useAddCartItem();
  const { success: toastSuccess, error: toastError } = useToast();

  const handleRemove = async (variantId: number) => {
    try {
      await removeMutation.mutateAsync(variantId);
      toastSuccess('Item removed from wishlist.');
    } catch {
      toastError('Failed to remove item. Please try again.');
    }
  };

  const handleMoveToCart = async (variantId: number) => {
    try {
      await addToCartMutation.mutateAsync({ variantId, quantity: 1 });
      await removeMutation.mutateAsync(variantId);
      toastSuccess('Item moved to cart successfully!');
    } catch {
      toastError('Failed to move item to cart.');
    }
  };

  if (isLoading) {
    return (
      <div className="wishlist-page">
        <header className="wishlist-header">
          <LoadingSkeleton variant="text" width="200px" height={40} />
          <LoadingSkeleton variant="text" width="350px" height={20} />
        </header>
        <div className="wishlist-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="wishlist-card-skeleton" key={i}>
              <LoadingSkeleton variant="rect" height={200} />
              <div style={{ padding: 'var(--space-3)' }}>
                <LoadingSkeleton variant="text" width="80%" />
                <LoadingSkeleton variant="text" width="50%" />
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  <LoadingSkeleton variant="rect" height={36} width="50%" />
                  <LoadingSkeleton variant="rect" height={36} width="50%" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wishlist-page error-state ">
        <h2>Failed to Load Wishlist</h2>
        <p>There was a problem retrieving your wishlist items. Please try again later.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const isEmpty = !wishlistItems || wishlistItems.length === 0;

  return (
    <div className="wishlist-page animate-fade-in">
      <header className="wishlist-header">
        <h1 className="wishlist-title">My Wishlist</h1>
        <p className="wishlist-subtitle">Your curated catalog of favorite items and product variations.</p>
      </header>

      {isEmpty ? (
        <div className="wishlist-empty ">
          <div className="wishlist-empty-icon">❤️</div>
          <h2>Your wishlist is empty</h2>
          <p>Explore our products catalog and save items to buy them later.</p>
          <Link to="/products">
            <Button size="md">Browse Products</Button>
          </Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlistItems.map((item) => (
            <div className="wishlist-card " key={item.wishlistId}>
              <Link to={`/products/${item.productId}`} className="wishlist-card-image-link">
                <div className="wishlist-card-image">
                  {item.mainImageUrl ? (
                    <img src={item.mainImageUrl} alt={item.productName} loading="lazy" />
                  ) : (
                    <div className="image-placeholder">No Image</div>
                  )}
                  {item.stockQuantity === 0 && (
                    <span className="out-of-stock-badge">Out of Stock</span>
                  )}
                </div>
              </Link>

              <div className="wishlist-card-body">
                <Link to={`/products/${item.productId}`}>
                  <h3 className="wishlist-item-name">{item.productName}</h3>
                </Link>
                <div className="wishlist-item-details">
                  {item.sku && <span className="wishlist-item-sku">SKU: {item.sku}</span>}
                  <span className="wishlist-item-price">{item.price.toFixed(2)} EGP</span>
                </div>

                <div className="wishlist-actions">
                  <Button
                    size="sm"
                    className="move-to-cart-btn"
                    disabled={item.stockQuantity === 0}
                    onClick={() => handleMoveToCart(item.variantId)}
                  >
                    Move to Cart
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="remove-wishlist-btn"
                    onClick={() => handleRemove(item.variantId)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
