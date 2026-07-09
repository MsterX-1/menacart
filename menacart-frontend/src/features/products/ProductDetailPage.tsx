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
  const isCustomer = isAuthenticated && roles.includes('Customer');
  const addCartItemMutation = useAddCartItem();
  
  const { data: wishlist } = useWishlist(isCustomer);
  const addToWishlistMutation = useAddToWishlist();
  const removeFromWishlistMutation = useRemoveFromWishlist();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
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

  if (error || !product) {
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

  const activeVariant = selectedVariant || (product.variants.length > 0 ? product.variants[0] : null);
  const displayPrice = activeVariant ? activeVariant.price : product.basePrice;

  const allImages: string[] = [];
  if (product.mainImageUrl) allImages.push(product.mainImageUrl);
  allImages.push(...product.productImages);
  if (activeVariant?.mainImageUrl && !allImages.includes(activeVariant.mainImageUrl)) {
    allImages.unshift(activeVariant.mainImageUrl);
  }

  const uniqueSizes = [...new Set(product.variants.map(v => v.size).filter(Boolean))] as string[];
  const uniqueColors = [...new Set(product.variants.map(v => v.color).filter(Boolean))] as string[];

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
    if (!roles.includes('Customer')) {
      toastError('Only customer accounts can add items to the cart.');
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

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    if (variant.mainImageUrl) {
      const idx = allImages.indexOf(variant.mainImageUrl);
      if (idx >= 0) setActiveImageIndex(idx);
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

          {uniqueColors.length > 0 && (
            <div className="variant-selector">
              <span className="variant-label">Color</span>
              <div className="variant-options">
                {product.variants
                  .filter((v, i, arr) => v.color && arr.findIndex(x => x.color === v.color) === i)
                  .map((v) => (
                    <button
                      key={v.variantId}
                      className={`variant-option ${activeVariant?.variantId === v.variantId ? 'active' : ''} ${v.stockQuantity === 0 ? 'disabled' : ''}`}
                      onClick={() => handleVariantSelect(v)}
                      disabled={v.stockQuantity === 0}
                    >
                      {v.color}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {uniqueSizes.length > 0 && (
            <div className="variant-selector">
              <span className="variant-label">Size</span>
              <div className="variant-options">
                {product.variants
                  .filter((v, i, arr) => v.size && arr.findIndex(x => x.size === v.size) === i)
                  .map((v) => (
                    <button
                      key={v.variantId}
                      className={`variant-option ${activeVariant?.variantId === v.variantId ? 'active' : ''} ${v.stockQuantity === 0 ? 'disabled' : ''}`}
                      onClick={() => handleVariantSelect(v)}
                      disabled={v.stockQuantity === 0}
                    >
                      {v.size}
                    </button>
                  ))}
              </div>
            </div>
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
