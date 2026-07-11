import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
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
import { Heart, Star, ChevronRight, ShoppingBag } from 'lucide-react';
import './ProductDetailPage.css';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

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
        <div className="detail-layout">
          <div className="detail-image-section">
            <LoadingSkeleton variant="rect" height={600} />
          </div>
          <div className="detail-info-section">
            <LoadingSkeleton variant="text" width="60%" height={40} />
            <LoadingSkeleton variant="text" width="40%" height={24} />
            <LoadingSkeleton variant="text" width="30%" height={32} />
            <LoadingSkeleton variant="rect" height={160} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product || !product.isActive) {
    return (
      <motion.div className="product-detail-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2>Product not found</h2>
        <p>This product may have been removed or doesn't exist.</p>
        <Link to="/products">
          <Button variant="secondary">Back to Catalog</Button>
        </Link>
      </motion.div>
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
    <motion.div 
      className="product-detail-page"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.nav className="detail-breadcrumb" aria-label="Breadcrumb" variants={itemVariants}>
        <Link to="/products">Catalog</Link>
        <ChevronRight size={14} className="breadcrumb-icon" />
        <Link to={`/products?categoryId=${product.categoryId}`}>{product.categoryName}</Link>
        <ChevronRight size={14} className="breadcrumb-icon" />
        <span className="breadcrumb-current">{product.name}</span>
      </motion.nav>

      <div className="detail-layout">
        <motion.div className="detail-image-section" variants={itemVariants}>
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeImageIndex}
              className="detail-main-image"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {allImages.length > 0 ? (
                <img src={getOptimizedImageUrl(allImages[activeImageIndex])} alt={product.name} />
              ) : (
                <div className="detail-image-placeholder">No Image</div>
              )}
            </motion.div>
          </AnimatePresence>
          
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
        </motion.div>

        <div className="detail-info-section">
          <motion.span className="detail-category" variants={itemVariants}>{product.categoryName}</motion.span>
          <motion.h1 className="detail-name" variants={itemVariants}>{product.name}</motion.h1>

          <motion.div className="detail-meta" variants={itemVariants}>
            <span className="detail-store">by <strong>{product.storeName}</strong></span>
            {product.brand && <span className="detail-brand">{product.brand}</span>}
          </motion.div>

          <motion.div variants={itemVariants}>
            {product.reviewCount > 0 && (
              <div className="detail-rating">
                <span className="rating-stars">
                  <Star size={16} fill="currentColor" /> {product.averageRating.toFixed(1)}
                </span>
                <span className="rating-count">{product.reviewCount} review{product.reviewCount !== 1 ? 's' : ''}</span>
              </div>
            )}
          </motion.div>

          <motion.div className="detail-price-block" variants={itemVariants}>
            <span className="detail-price">{displayPrice.toFixed(2)} EGP</span>
            {isOutOfStock && <span className="stock-badge out-of-stock">Sold Out</span>}
            {!isOutOfStock && activeVariant && activeVariant.stockQuantity <= 5 && (
              <span className="stock-badge low-stock">Only {activeVariant.stockQuantity} left</span>
            )}
          </motion.div>

          {uniqueColors.length > 0 && (
            <motion.div className="variant-selector" variants={itemVariants}>
              <span className="variant-label">Select Color</span>
              <div className="variant-options color-options">
                {product.variants
                  .filter((v, i, arr) => v.color && arr.findIndex(x => x.color === v.color) === i)
                  .map((v) => (
                    <button
                      key={v.variantId}
                      className={`variant-pill ${activeVariant?.variantId === v.variantId ? 'active' : ''} ${v.stockQuantity === 0 ? 'disabled' : ''}`}
                      onClick={() => handleVariantSelect(v)}
                      disabled={v.stockQuantity === 0}
                    >
                      {v.color}
                    </button>
                  ))}
              </div>
            </motion.div>
          )}

          {uniqueSizes.length > 0 && (
            <motion.div className="variant-selector" variants={itemVariants}>
              <span className="variant-label">Select Size</span>
              <div className="variant-options size-options">
                {product.variants
                  .filter((v, i, arr) => v.size && arr.findIndex(x => x.size === v.size) === i)
                  .map((v) => (
                    <button
                      key={v.variantId}
                      className={`variant-pill ${activeVariant?.variantId === v.variantId ? 'active' : ''} ${v.stockQuantity === 0 ? 'disabled' : ''}`}
                      onClick={() => handleVariantSelect(v)}
                      disabled={v.stockQuantity === 0}
                    >
                      {v.size}
                    </button>
                  ))}
              </div>
            </motion.div>
          )}

          <motion.div className="detail-actions" variants={itemVariants}>
            <button
              className="editorial-btn-primary"
              disabled={isOutOfStock || addCartItemMutation.isPending}
              onClick={handleAddToCart}
            >
              <ShoppingBag size={20} />
              {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
            </button>
            {isCustomer && activeVariant && (
              <button
                onClick={handleWishlistToggle}
                className={`editorial-btn-icon ${isInWishlist ? 'is-active' : ''}`}
                title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                <Heart size={24} fill={isInWishlist ? 'currentColor' : 'none'} />
              </button>
            )}
          </motion.div>

          {product.description && (
            <motion.div className="detail-description" variants={itemVariants}>
              <h2 className="description-heading">Details</h2>
              <p>{product.description}</p>
            </motion.div>
          )}

          {activeVariant && (
            <motion.div className="detail-sku" variants={itemVariants}>
              SKU: {activeVariant.sku}
            </motion.div>
          )}
        </div>
      </div>

      <motion.div variants={itemVariants}>
        <ReviewList 
          productId={product.productId} 
          productRating={product.averageRating}
          productReviewCount={product.reviewCount}
        />
      </motion.div>
    </motion.div>
  );
};
