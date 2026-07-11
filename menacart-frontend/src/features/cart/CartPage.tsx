import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useCart, useUpdateCartItem, useRemoveCartItem, useClearCart } from './hooks/useCart';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { AlertTriangle, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import './CartPage.css';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
};

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
          <LoadingSkeleton variant="text" width="200px" height={40} />
        </header>
        <div className="cart-layout">
          <div className="cart-items-section">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="cart-item-skeleton">
                <LoadingSkeleton variant="rect" width="100px" height="120px" />
                <div className="skeleton-details">
                  <LoadingSkeleton variant="text" width="60%" height={24} />
                  <LoadingSkeleton variant="text" width="30%" height={20} />
                  <LoadingSkeleton variant="text" width="40%" height={20} />
                </div>
              </div>
            ))}
          </div>
          <div className="cart-summary-section">
            <LoadingSkeleton variant="rect" height="300px" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !cart) {
    return (
      <motion.div className="cart-empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2>Failed to load your cart</h2>
        <p>Please try reloading the page or check your connection status.</p>
        <Button variant="secondary" onClick={() => window.location.reload()}>Retry</Button>
      </motion.div>
    );
  }

  const isEmpty = cart.items.length === 0;

  return (
    <motion.div 
      className="cart-page"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <header className="cart-header">
        <motion.h1 className="cart-title" variants={itemVariants}>Shopping Cart</motion.h1>
        {!isEmpty && (
          <motion.button className="clear-cart-btn" onClick={handleClearCart} variants={itemVariants}>
            Clear Cart
          </motion.button>
        )}
      </header>

      {cart.warnings && cart.warnings.length > 0 && (
        <motion.div className="cart-warnings-alert" variants={itemVariants}>
          <AlertTriangle className="warning-alert-icon" size={24} />
          <div className="warning-alert-list">
            {cart.warnings.map((warn, idx) => (
              <p key={idx} className="warning-alert-item">{warn}</p>
            ))}
          </div>
        </motion.div>
      )}

      {isEmpty ? (
        <motion.div className="cart-empty-state" variants={itemVariants}>
          <div className="empty-icon-wrapper">
            <ShoppingBag size={48} strokeWidth={1} />
          </div>
          <h2>Your cart is empty</h2>
          <p>Browse our catalog to find fashion products and add them to your cart.</p>
          <Link to="/products">
            <button className="editorial-btn-primary" style={{ padding: '16px 32px', width: 'auto' }}>
              Start Shopping
            </button>
          </Link>
        </motion.div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items-section">
            <div className="cart-items-list">
              <AnimatePresence>
                {cart.items.map((item) => {
                  const hasStockWarning = item.quantity > item.stockQuantity;
                  return (
                    <motion.div 
                      key={item.cartItemId} 
                      className={`editorial-cart-item ${hasStockWarning ? 'has-warning' : ''}`}
                      variants={itemVariants}
                      layout
                    >
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

                        {hasStockWarning && (
                          <span className="item-stock-warning" role="alert">
                            Only {item.stockQuantity} items in stock. Reduce quantity to proceed.
                          </span>
                        )}
                      </div>

                      <div className="cart-item-price-block">
                        <span className="cart-item-unit-price">{item.unitPrice.toFixed(2)} EGP</span>
                        <div className="qty-picker">
                          <button
                            type="button"
                            className="qty-picker-btn"
                            disabled={item.quantity <= 1 || updateItemMutation.isPending}
                            onClick={() => handleQuantityChange(item.cartItemId, item.quantity, -1, item.stockQuantity)}
                            aria-label="Decrease quantity"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="qty-picker-value">{item.quantity}</span>
                          <button
                            type="button"
                            className="qty-picker-btn"
                            disabled={item.quantity >= item.stockQuantity || updateItemMutation.isPending}
                            onClick={() => handleQuantityChange(item.cartItemId, item.quantity, 1, item.stockQuantity)}
                            aria-label="Increase quantity"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="cart-item-total-block">
                        <span className="cart-item-line-total">{item.lineTotal.toFixed(2)} EGP</span>
                        <button
                          type="button"
                          className="remove-item-btn"
                          disabled={removeItemMutation.isPending}
                          onClick={() => handleRemoveItem(item.cartItemId)}
                          aria-label="Remove item"
                          title="Remove item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          <motion.div className="cart-summary-section" variants={itemVariants}>
            <div className="editorial-summary-card">
              <h2 className="summary-card-title">Order Summary</h2>
              
              <div className="summary-row">
                <span className="summary-label">Total Items</span>
                <span className="summary-value">{cart.totalItems}</span>
              </div>
              
              <div className="summary-row grand-total-row">
                <span className="summary-label">Grand Total</span>
                <span className="summary-value">{cart.grandTotal.toFixed(2)} EGP</span>
              </div>

              {cart.warnings && cart.warnings.length > 0 ? (
                <div className="checkout-disabled-warning">
                  Resolve the warnings above before checking out.
                </div>
              ) : (
                <button
                  className="editorial-btn-primary checkout-proceed-btn"
                  onClick={() => navigate('/checkout')}
                >
                  Proceed to Checkout
                </button>
              )}

              <Link to="/products" className="continue-shopping-link">
                Continue Shopping
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
