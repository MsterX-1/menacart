import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart, useCheckoutPreview } from '../cart/hooks/useCart';
import { useAddresses } from '../addresses/hooks/useAddresses';
import { AddressFormModal } from '../addresses/components/AddressFormModal';
import { usePlaceOrder, useCoupon, useLoyalty } from '../orders/hooks/useOrders';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import './CheckoutPage.css';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { error: toastError, success: toastSuccess } = useToast();

  // Queries
  const { data: cart, isLoading: cartLoading, error: cartError } = useCart();
  const { data: addresses, isLoading: addrLoading, refetch: refetchAddresses } = useAddresses();
  const { data: loyalty, isLoading: loyaltyLoading } = useLoyalty();

  // States
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  // Preview Query
  const { data: checkoutPreview, isLoading: previewLoading } = useCheckoutPreview(selectedAddressId);

  // Mutations
  const placeOrderMutation = usePlaceOrder();

  const [couponInput, setCouponInput] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // Validate coupon query
  const {
    data: coupon,
    isLoading: couponLoading,
    error: couponError,
    refetch: validateCoupon,
  } = useCoupon(couponInput, false);

  // Set default address initially if present
  useEffect(() => {
    if (cart && cart.defaultAddressId) {
      setSelectedAddressId(cart.defaultAddressId);
    } else if (addresses && addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.isDefault);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.addressId);
      } else {
        setSelectedAddressId(addresses[0].addressId);
      }
    }
  }, [cart, addresses]);

  // Handle Apply Coupon
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    try {
      const result = await validateCoupon();
      if (result.data) {
        setAppliedCode(result.data.code);
        toastSuccess(`Coupon "${result.data.code}" applied successfully!`);
      } else {
        toastError('Invalid coupon code or coupon has expired.');
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to apply coupon.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCode(null);
    setCouponInput('');
    toastSuccess('Coupon removed.');
  };

  // Place Order
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toastError('Please select a shipping address.');
      return;
    }

    try {
      const response = await placeOrderMutation.mutateAsync({
        addressId: selectedAddressId,
        couponCode: appliedCode,
        redeemPoints,
      });

      toastSuccess('Order placed successfully!');
      
      // If backend returns stripe/payment session url, redirect to it
      if (response.paymentUrl) {
        window.location.href = response.paymentUrl;
      } else {
        navigate(`/checkout/success/${response.orderId}`);
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to place order.');
    }
  };

  if (cartLoading || addrLoading || loyaltyLoading) {
    return (
      <div className="checkout-page-loading">
        <div className="checkout-loading-grid">
          <div className="checkout-main-skeleton">
            <LoadingSkeleton variant="text" width="150px" height={32} />
            <LoadingSkeleton variant="rect" height="200px" />
            <LoadingSkeleton variant="rect" height="150px" />
          </div>
          <div className="checkout-side-skeleton">
            <LoadingSkeleton variant="rect" height="400px" />
          </div>
        </div>
      </div>
    );
  }

  if (cartError || !cart) {
    return (
      <div className="checkout-error-state">
        <h2>Failed to load checkout details</h2>
        <Button onClick={() => navigate('/cart')}>Back to Cart</Button>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="checkout-error-state">
        <h2>Your cart is empty</h2>
        <p>You cannot check out without items in your cart.</p>
        <Button onClick={() => navigate('/products')}>Browse Fashion</Button>
      </div>
    );
  }

  // Calculate Loyalty points discounts
  // Assume: 1 Point = 1 EGP discount for the sake of presentation
  const userPoints = loyalty?.balance || 0;
  const pointsValue = userPoints; // 1:1 ratio
  
  // Use preview data if available, otherwise fallback to cart subtotal
  const cartSubtotal = checkoutPreview ? checkoutPreview.subtotal : cart.grandTotal;
  const totalShippingCost = checkoutPreview ? checkoutPreview.totalShippingCost : 0;

  // Coupon discount calculation
  let couponDiscount = 0;
  if (coupon && appliedCode) {
    let applicableSubtotal = cartSubtotal;

    if (coupon.sellerId) {
      // Calculate subtotal only for this seller's items
      applicableSubtotal = cart.items
        .filter(item => item.sellerId === coupon.sellerId)
        .reduce((sum, item) => sum + item.lineTotal, 0);
    }

    if (coupon.discountType === 'Percentage') {
      couponDiscount = applicableSubtotal * (coupon.discountValue / 100);
    } else {
      // For fixed discounts, we just apply it, but it cannot exceed the applicable subtotal
      couponDiscount = coupon.discountValue;
    }
    
    // Cannot exceed applicable subtotal
    couponDiscount = Math.min(couponDiscount, applicableSubtotal);
  }

  // Points discount calculation
  const subtotalAfterCoupon = cartSubtotal - couponDiscount;
  const pointsDiscount = redeemPoints ? Math.min(pointsValue, subtotalAfterCoupon) : 0;
  
  // Final calculation including shipping
  const grandTotal = Math.max(0, subtotalAfterCoupon - pointsDiscount) + totalShippingCost;

  // Address rendering lists
  const shippingAddresses = addresses?.filter((a) => a.addressType === 'Shipping') || [];

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <header className="checkout-header">
          <h1 className="checkout-title">Secure Checkout</h1>
          <p className="checkout-subtitle">Review your shipping details and complete your fashion order.</p>
        </header>

        <div className="checkout-grid">
          {/* LEFT: Checkout Details Form */}
          <main className="checkout-form-section">
            
            {/* Shipping Address Step */}
            <section className="checkout-section shadow-card">
              <div className="section-header-row">
                <h2 className="section-title">1. Shipping Address</h2>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddressModalOpen(true)}
                >
                  + Add New Address
                </Button>
              </div>

              {shippingAddresses.length === 0 ? (
                <div className="no-address-state">
                  <p>You don't have any shipping addresses saved.</p>
                  <Button onClick={() => setIsAddressModalOpen(true)}>Create Address</Button>
                </div>
              ) : (
                <div className="address-grid">
                  {shippingAddresses.map((addr) => (
                    <div
                      key={addr.addressId}
                      className={`address-select-card ${
                        selectedAddressId === addr.addressId ? 'selected' : ''
                      }`}
                      onClick={() => setSelectedAddressId(addr.addressId)}
                    >
                      <div className="address-card-header">
                        <span className="address-label">
                          {addr.isDefault && <span className="default-badge">Default</span>}
                        </span>
                        <div className="selection-indicator"></div>
                      </div>
                      <p className="address-street">{addr.street}</p>
                      <p className="address-city-state">
                        {addr.city}, {addr.state || ''}
                      </p>
                      <p className="address-country-zip">
                        {addr.country} {addr.zipCode ? `, ${addr.zipCode}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Coupons & Promotions */}
            <section className="checkout-section shadow-card">
              <h2 className="section-title">2. Coupons & Promotions</h2>
              
              <form onSubmit={handleApplyCoupon} className="coupon-form">
                <input
                  type="text"
                  placeholder="Enter Promo Code"
                  className="coupon-input-field"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  disabled={!!appliedCode || couponLoading}
                />
                {appliedCode ? (
                  <Button type="button" variant="danger" onClick={handleRemoveCoupon}>
                    Remove
                  </Button>
                ) : (
                  <Button type="submit" isLoading={couponLoading} disabled={!couponInput.trim()}>
                    Apply
                  </Button>
                )}
              </form>

              {appliedCode && coupon && (
                <div className="coupon-applied-feedback">
                  <span className="check-icon">&#10003;</span>
                  <span>
                    Coupon <strong>{coupon.code}</strong> applied! (
                    {coupon.discountType === 'Percentage'
                      ? `${coupon.discountValue}% Off`
                      : `${coupon.discountValue} EGP Off`}
                    )
                  </span>
                </div>
              )}
              {couponError && !appliedCode && (
                <p className="coupon-error-msg">Invalid or expired promo code.</p>
              )}
            </section>

            {/* Loyalty Rewards */}
            <section className="checkout-section shadow-card">
              <h2 className="section-title">3. Loyalty Rewards</h2>
              <div className="loyalty-redeem-row">
                <div className="loyalty-info">
                  <p className="loyalty-balance-text">
                    Available Balance: <strong>{userPoints} Points</strong>
                  </p>
                  <p className="loyalty-desc">Redeem points for an immediate discount on your order (1 Point = 1.00 EGP).</p>
                </div>
                
                <div className="loyalty-toggle-container">
                  <input
                    type="checkbox"
                    id="redeem-points-toggle"
                    className="toggle-checkbox"
                    checked={redeemPoints}
                    disabled={userPoints === 0}
                    onChange={(e) => setRedeemPoints(e.target.checked)}
                  />
                  <label htmlFor="redeem-points-toggle" className="toggle-switch"></label>
                </div>
              </div>
            </section>
          </main>

          {/* RIGHT: Order Summary Sidebar (Sticky) */}
          <aside className="checkout-summary-section">
            <div className="checkout-summary-card shadow-card sticky-sidebar">
              <h3 className="summary-title">Order Summary</h3>
              
              <div className="summary-items-list">
                {cart.items.map((item) => (
                  <div key={item.cartItemId} className="summary-item-row">
                    <div className="summary-item-details">
                      <span className="summary-item-qty">{item.quantity}x</span>
                      <span className="summary-item-name">{item.productName}</span>
                      <div className="summary-item-specs">
                        {item.color && <span>{item.color}</span>}
                        {item.size && <span>{item.size}</span>}
                      </div>
                    </div>
                    <span className="summary-item-price">{(item.unitPrice * item.quantity).toFixed(2)} EGP</span>
                  </div>
                ))}
              </div>

              <div className="summary-calculations">
                <div className="calc-row">
                  <span>Subtotal</span>
                  <span>{cartSubtotal.toFixed(2)} EGP</span>
                </div>
                
                {couponDiscount > 0 && (
                  <div className="calc-row discount-row">
                    <span>Coupon Discount</span>
                    <span>-{couponDiscount.toFixed(2)} EGP</span>
                  </div>
                )}

                {pointsDiscount > 0 && (
                  <div className="calc-row discount-row">
                    <span>Loyalty Points Discount</span>
                    <span>-{pointsDiscount.toFixed(2)} EGP</span>
                  </div>
                )}

                <div className="calc-row shipping-row">
                  <span>Shipping</span>
                  {previewLoading ? (
                    <span className="calculating-text">Calculating...</span>
                  ) : totalShippingCost > 0 ? (
                    <span>{totalShippingCost.toFixed(2)} EGP</span>
                  ) : (
                    <span className="free-shipping">FREE</span>
                  )}
                </div>

                {checkoutPreview && checkoutPreview.sellerShipping.length > 1 && (
                  <div className="shipping-breakdown">
                    <p className="shipping-breakdown-title">Shipping Breakdown:</p>
                    {checkoutPreview.sellerShipping.map((s, idx) => (
                      <div key={idx} className="calc-row discount-row shipping-detail-row">
                        <span>{s.storeName}</span>
                        <span>{s.shippingCost > 0 ? `${s.shippingCost.toFixed(2)} EGP` : 'FREE'}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="calc-row total-row">
                  <span>Total Amount</span>
                  <span className="grand-total-amount">{grandTotal.toFixed(2)} EGP</span>
                </div>
              </div>

              <Button
                className="place-order-btn"
                size="lg"
                disabled={placeOrderMutation.isPending || !selectedAddressId}
                isLoading={placeOrderMutation.isPending}
                onClick={handlePlaceOrder}
              >
                Place Order
              </Button>

              <p className="payment-disclaimer">
                By placing this order you agree to MenaCart's Terms of Service and Privacy Policy. Payments are processed securely.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Address Form Modal */}
      <AddressFormModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        address={null}
        onSuccess={refetchAddresses}
      />
    </div>
  );
};
