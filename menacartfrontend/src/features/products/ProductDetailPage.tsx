import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProductDetail } from './hooks/useProducts';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { useAddCartItem } from '../cart/hooks/useCart';
import type { ProductVariant } from '../../types/product';
import { ReviewList } from '../reviews/components/ReviewList';
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from '../wishlist/hooks/useWishlist';
import { getOptimizedImageUrl } from '../../utils/cloudinary';
import './ProductDetailPage.css';

export const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const { data: product, isLoading, error } = useProductDetail(Number(productId));
  const { error: toastError, success: toastSuccess } = useToast();
  const { roles, isAuthenticated } = useAuth();
  const isCustomer = isAuthenticated && (roles.includes('Customer') || roles.includes('Seller'));
  const addCartItemMutation = useAddCartItem();
  
  const { data: wishlist } = useWishlist(isCustomer);
  const addToWishlistMutation = useAddToWishlist();
  const removeFromWishlistMutation = useRemoveFromWishlist();
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(product?.variants[0]?.variantId || null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="product-detail-page">
        <div className="detail-image-section">
          <LoadingSkeleton variant="rect" height={500} />
        </div>
        <div className="detail-info-section">
          <LoadingSkeleton variant="text" width="60%" height={32} />
          <LoadingSkeleton variant="text" width="40%" height={20} />
          <LoadingSkeleton variant="text" width="30%" height={28} />
          <LoadingSkeleton variant="rect" height={120} />
        </div>
      </div>
    );
  }

  if (error || !product || !product.isActive) {
    return (
      <div className="product-detail-error">
        <h2>Product not found</h2>
        <p>This product may have been removed or doesn't exist.</p>
        <Link to="/products">
          <Button variant="secondary">Back to Catalog</Button>
        </Link>
      </div>
    );
  }

  let activeVariant = product.variants.find(v => v.variantId === selectedVariantId) 
                   || (product.variants.length > 0 ? product.variants[0] : null);

  const displayPrice = activeVariant ? activeVariant.price : product.basePrice;

  const allImages: string[] = [];
  if (product.mainImageUrl) allImages.push(product.mainImageUrl);
  allImages.push(...product.productImages);
  if (activeVariant?.mainImageUrl && !allImages.includes(activeVariant.mainImageUrl)) {
    allImages.unshift(activeVariant.mainImageUrl);
  }

  const uniqueSizes = [...new Set(product.variants.map(v => v.size).filter(Boolean))] as string[];
  const uniqueColors = [...new Set(product.variants.map(v => v.color).filter(Boolean))] as string[];

  // Determine if there are variants with the exact same color AND size. 
  // If so, Color/Size buttons are insufficient to distinguish them.
  const isAmbiguous = product.variants.length > 1 && product.variants.some((v, i, arr) => 
    arr.findIndex(x => (x.color || '') === (v.color || '') && (x.size || '') === (v.size || '')) !== i
  );

  const isInWishlist = activeVariant
    ? wishlist?.some((item) => item.variantId === activeVariant.variantId) ?? false
    : false;

  const handleWishlistToggle = async () => {
    if (!activeVariant) return;
    try {
      if (isInWishlist) {
        await removeFromWishlistMutation.mutateAsync(activeVariant.variantId);
        toastSuccess('Removed from wishlist.');
      } else {
        await addToWishlistMutation.mutateAsync(activeVariant.variantId);
        toastSuccess('Added to wishlist!');
      }
    } catch {
      toastError('Failed to update wishlist.');
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toastError('Please sign in to add items to your cart.');
      return;
    }
    if (!roles.includes('Customer') && !roles.includes('Seller')) {
      toastError('Only customer or seller accounts can add items to the cart.');
      return;
    }
    if (!activeVariant) return;

    try {
      await addCartItemMutation.mutateAsync({
        variantId: activeVariant.variantId,
        quantity: 1,
      });
      toastSuccess(`${product.name} (${activeVariant.color || ''} ${activeVariant.size || ''}) added to cart.`);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to add item to cart.');
    }
  };

  const updateImageForVariant = (variant: ProductVariant) => {
    if (variant.mainImageUrl) {
      const idx = allImages.indexOf(variant.mainImageUrl);
      if (idx >= 0) setActiveImageIndex(idx);
    }
  };

  const handleDirectVariantSelect = (variant: ProductVariant) => {
    setSelectedVariantId(variant.variantId);
    updateImageForVariant(variant);
  };

  const handleColorSelect = (color: string) => {
    const currentSize = activeVariant?.size;
    let variant = product.variants.find(v => v.color === color && v.size === currentSize);
    if (!variant) {
      variant = product.variants.find(v => v.color === color);
    }
    if (variant) {
      setSelectedVariantId(variant.variantId);
      updateImageForVariant(variant);
    }
  };

  const handleSizeSelect = (size: string) => {
    const currentColor = activeVariant?.color;
    let variant = product.variants.find(v => v.color === currentColor && v.size === size);
    if (!variant) {
      variant = product.variants.find(v => v.size === size);
    }
    if (variant) {
      setSelectedVariantId(variant.variantId);
      updateImageForVariant(variant);
    }
  };

  const isOutOfStock = activeVariant ? activeVariant.stockQuantity === 0 : true;

  return (
    <div className="product-detail-page">
      <nav className="detail-breadcrumb" aria-label="Breadcrumb">
        <Link to="/products">Catalog</Link>
        <span className="breadcrumb-sep">/</span>
        <Link to={`/products?categoryId=${product.categoryId}`}>{product.categoryName}</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{product.name}</span>
      </nav>

      <div className="detail-layout">
        <div className="detail-image-section">
          <div className="detail-main-image">
            {allImages.length > 0 ? (
              <img src={getOptimizedImageUrl(allImages[activeImageIndex])} alt={product.name} loading="lazy" />
            ) : (
              <div className="detail-image-placeholder">No image available</div>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="detail-image-thumbnails">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  className={`thumbnail-btn ${idx === activeImageIndex ? 'active' : ''}`}
                  onClick={() => setActiveImageIndex(idx)}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img src={getOptimizedImageUrl(img)} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="detail-info-section">
          <span className="detail-category">{product.categoryName}</span>
          <h1 className="detail-name">{product.name}</h1>

          <div className="detail-meta">
            <span className="detail-store">
              Sold by <strong>{product.storeName}</strong>
            </span>
            {product.brand && <span className="detail-brand">{product.brand}</span>}
          </div>

          {product.reviewCount > 0 && (
            <div className="detail-rating">
              <span className="rating-stars">★ {product.averageRating.toFixed(1)}</span>
              <span className="rating-count">{product.reviewCount} review{product.reviewCount !== 1 ? 's' : ''}</span>
            </div>
          )}

          <div className="detail-price-block">
            <span className="detail-price">{displayPrice.toFixed(2)} EGP</span>
            {isOutOfStock && <span className="stock-badge out-of-stock">Out of Stock</span>}
            {!isOutOfStock && activeVariant && activeVariant.stockQuantity <= 5 && (
              <span className="stock-badge low-stock">Only {activeVariant.stockQuantity} left</span>
            )}
          </div>

          {isAmbiguous ? (
            <div className="variant-selector">
              <span className="variant-label">Option</span>
              <div className="variant-options" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                {product.variants.map((v) => {
                  const labelParts = [];
                  if (v.color) labelParts.push(v.color);
                  if (v.size) labelParts.push(v.size);
                  const label = labelParts.length > 0 ? `${labelParts.join(' ')} - SKU: ${v.sku}` : `SKU: ${v.sku}`;
                  return (
                    <button
                      key={v.variantId}
                      className={`variant-option ${activeVariant?.variantId === v.variantId ? 'active' : ''} ${v.stockQuantity === 0 ? 'disabled' : ''}`}
                      onClick={() => handleDirectVariantSelect(v)}
                      disabled={v.stockQuantity === 0}
                      style={{ width: '100%', textAlign: 'left', justifyContent: 'flex-start' }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {uniqueColors.length > 0 && (
                <div className="variant-selector">
                  <span className="variant-label">Color</span>
                  <div className="variant-options">
                    {uniqueColors.map((color) => {
                      const isAvailable = product.variants.some(v => v.color === color && v.stockQuantity > 0);
                      return (
                        <button
                          key={color}
                          className={`variant-option ${activeVariant?.color === color ? 'active' : ''} ${!isAvailable ? 'disabled' : ''}`}
                          onClick={() => handleColorSelect(color)}
                          disabled={!isAvailable}
                        >
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {uniqueSizes.length > 0 && (
                <div className="variant-selector">
                  <span className="variant-label">Size</span>
                  <div className="variant-options">
                    {uniqueSizes.map((size) => {
                      const isAvailable = product.variants.some(v => v.size === size && v.stockQuantity > 0);
                      return (
                        <button
                          key={size}
                          className={`variant-option ${activeVariant?.size === size ? 'active' : ''} ${!isAvailable ? 'disabled' : ''}`}
                          onClick={() => handleSizeSelect(size)}
                          disabled={!isAvailable}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="detail-actions">
            <Button
              disabled={isOutOfStock || addCartItemMutation.isPending}
              isLoading={addCartItemMutation.isPending}
              onClick={handleAddToCart}
              className="add-to-cart-btn"
            >
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
            {isCustomer && activeVariant && (
              <Button
                variant="secondary"
                onClick={handleWishlistToggle}
                className={`detail-wishlist-btn ${isInWishlist ? 'is-active' : ''}`}
                title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                {isInWishlist ? '❤️ In Wishlist' : '🤍 Add to Wishlist'}
              </Button>
            )}
          </div>

          {product.description && (
            <div className="detail-description">
              <h2 className="description-heading">Description</h2>
              <p>{product.description}</p>
            </div>
          )}

          {activeVariant && (
            <div className="detail-sku">
              SKU: {activeVariant.sku}
            </div>
          )}
        </div>
      </div>

      <ReviewList 
        productId={product.productId} 
        productRating={product.averageRating}
        productReviewCount={product.reviewCount}
      />
    </div>
  );
};
