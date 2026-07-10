import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart, useUpdateCartItem, useRemoveCartItem, useClearCart } from './hooks/useCart';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import './CartPage.css';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { error: toastError, success: toastSuccess } = useToast();
  const { data: cart, isLoading, error } = useCart();
  const updateItemMutation = useUpdateCartItem();
  const removeItemMutation = useRemoveCartItem();
  const clearCartMutation = useClearCart();

  const handleQuantityChange = async (cartItemId: number, currentQty: number, change: number, stockQty: number) => {
    const newQty = currentQty + change;
    if (newQty < 1) return;
    if (newQty > stockQty) {
      toastError(`Cannot add more items. Only ${stockQty} units are in stock.`);
      return;
    }
    try {
      await updateItemMutation.mutateAsync({ cartItemId, quantity: newQty });
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update quantity.');
    }
  };

  const handleRemoveItem = async (cartItemId: number) => {
    try {
      await removeItemMutation.mutateAsync(cartItemId);
      toastSuccess('Item removed from cart.');
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to remove item.');
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your shopping cart?')) return;
    try {
      await clearCartMutation.mutateAsync();
      toastSuccess('Cart cleared successfully.');
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to clear cart.');
    }
  };

  if (isLoading) {
    return (
      <div className="cart-page">
        <header className="cart-header">
          <LoadingSkeleton variant="text" width="200px" height={32} />
        </header>
        <div className="cart-layout">
          <div className="cart-items-section">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="cart-item-skeleton">
                <LoadingSkeleton variant="rect" width="80px" height="100px" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <LoadingSkeleton variant="text" width="60%" />
                  <LoadingSkeleton variant="text" width="30%" />
                </div>
              </div>
            ))}
          </div>
          <div className="cart-summary-section">
            <LoadingSkeleton variant="rect" height="200px" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !cart) {
    return (
      <div className="cart-error-container">
        <h2>Failed to load your cart</h2>
        <p>Please try reloading the page or check your connection status.</p>
        <Button variant="secondary" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const isEmpty = cart.items.length === 0;

  return (
    <div className="cart-page">
      <header className="cart-header">
        <h1 className="cart-title">Your Shopping Cart</h1>
        {!isEmpty && (
          <button className="clear-cart-btn" onClick={handleClearCart}>
            Clear Cart
          </button>
        )}
      </header>

      {/* Warnings Block (Strictly complying with Impeccable: No side-stripes, full borders) */}
      {cart.warnings && cart.warnings.length > 0 && (
        <div className="cart-warnings-alert">
          <span className="warning-alert-icon">&#9888;</span>
          <div className="warning-alert-list">
            {cart.warnings.map((warn, idx) => (
              <p key={idx} className="warning-alert-item">{warn}</p>
            ))}
          </div>
        </div>
      )}

      {isEmpty ? (
        <div className="cart-empty-state">
          <h2>Your cart is empty</h2>
          <p>Browse our catalog to find fashion products and add them to your cart.</p>
          <Link to="/products">
            <Button>Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items-section">
            <div className="cart-items-list">
              {cart.items.map((item) => {
                const hasStockWarning = item.quantity > item.stockQuantity;
                return (
                  <div key={item.cartItemId} className={`cart-item-card ${hasStockWarning ? 'has-warning' : ''}`}>
                    <div className="cart-item-image">
                      {item.mainImageUrl ? (
                        <img src={item.mainImageUrl} alt={item.productName} />
                      ) : (
                        <div className="cart-item-image-placeholder">No image</div>
                      )}
                    </div>

                    <div className="cart-item-details">
                      <Link to={`/products/${item.productId}`} className="cart-item-name">
                        {item.productName}
                      </Link>
                      
                      <div className="cart-item-specs">
                        {item.color && (
                          <span className="spec-badge">Color: {item.color}</span>
                        )}
                        {item.size && (
                          <span className="spec-badge">Size: {item.size}</span>
                        )}
                      </div>

                      <div className="cart-item-price-info">
                        <span className="cart-item-unit-price">{item.unitPrice.toFixed(2)} EGP</span>
                        <span className="cart-item-line-total">Total: {item.lineTotal.toFixed(2)} EGP</span>
                      </div>

                      {hasStockWarning && (
                        <span className="item-stock-warning" role="alert">
                          Only {item.stockQuantity} items in stock. Reduce quantity to proceed.
                        </span>
                      )}
                    </div>

                    <div className="cart-item-actions">
                      <div className="qty-picker">
                        <button
                          type="button"
                          className="qty-picker-btn"
                          disabled={item.quantity <= 1 || updateItemMutation.isPending}
                          onClick={() => handleQuantityChange(item.cartItemId, item.quantity, -1, item.stockQuantity)}
                          aria-label="Decrease quantity"
                        >
                          &minus;
                        </button>
                        <span className="qty-picker-value">{item.quantity}</span>
                        <button
                          type="button"
                          className="qty-picker-btn"
                          disabled={item.quantity >= item.stockQuantity || updateItemMutation.isPending}
                          onClick={() => handleQuantityChange(item.cartItemId, item.quantity, 1, item.stockQuantity)}
                          aria-label="Increase quantity"
                        >
                          &#43;
                        </button>
                      </div>

                      <button
                        type="button"
                        className="remove-item-btn"
                        disabled={removeItemMutation.isPending}
                        onClick={() => handleRemoveItem(item.cartItemId)}
                        aria-label="Remove item"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="cart-summary-section">
            <div className="cart-summary-card">
              <h2 className="summary-card-title">Order Summary</h2>
              
              <div className="summary-row">
                <span>Total Items</span>
                <span>{cart.totalItems}</span>
              </div>
              
              <div className="summary-row grand-total-row">
                <span>Grand Total</span>
                <span>{cart.grandTotal.toFixed(2)} EGP</span>
              </div>

              {cart.warnings && cart.warnings.length > 0 ? (
                <div className="checkout-disabled-warning">
                  Resolve the warnings above before checking out.
                </div>
              ) : (
                <Button
                  className="checkout-proceed-btn"
                  onClick={() => navigate('/checkout')}
                >
                  Proceed to Checkout
                </Button>
              )}

              <Link to="/products" className="continue-shopping-link">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
