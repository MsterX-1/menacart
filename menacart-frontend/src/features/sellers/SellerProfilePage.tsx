import React from 'react';
import { Star } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPublicSellerProfile } from '../seller-onboarding/api/sellerOnboardingApi';
import { browseProducts } from '../products/api/productsApi';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { getOptimizedImageUrl } from '../../utils/cloudinary';
import { Button } from '../../components/Button';
import './SellerProfilePage.css';
import '../products/ProductListPage.css';

export const SellerProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const sellerId = Number(id);

  const { data: seller, isLoading: isSellerLoading, error: sellerError } = useQuery({
    queryKey: ['seller', 'public', sellerId],
    queryFn: () => getPublicSellerProfile(sellerId),
    enabled: !isNaN(sellerId),
  });

  const { data: products, isLoading: isProductsLoading } = useQuery({
    queryKey: ['products', 'seller', sellerId],
    queryFn: () => browseProducts({ sellerId, page: 1, pageSize: 50 }),
    enabled: !isNaN(sellerId),
  });

  if (sellerError || isNaN(sellerId)) {
    return (
      <div className="sellers-empty" style={{ padding: '4rem', textAlign: 'center' }}>
        <h2>Seller Not Found</h2>
        <p>This seller does not exist or has been removed.</p>
        <Link to="/sellers"><Button style={{ marginTop: '1rem' }}>Browse Sellers</Button></Link>
      </div>
    );
  }

  return (
    <div className="seller-profile-page">
      {/* Profile Header */}
      {isSellerLoading || !seller ? (
        <div className="seller-profile-header">
          <LoadingSkeleton variant="rect" height={200} />
          <div className="seller-profile-content">
            <div style={{ marginTop: -60 }}>
              <LoadingSkeleton variant="circle" width={120} height={120} />
            </div>
            <div style={{ marginTop: 20 }}>
              <LoadingSkeleton variant="text" width={200} height={40} />
            </div>
            <div style={{ marginTop: 10 }}>
              <LoadingSkeleton variant="text" width={300} />
            </div>
          </div>
        </div>
      ) : (
        <div className="seller-profile-header">
          {seller.storeBannerUrl ? (
            <img src={getOptimizedImageUrl(seller.storeBannerUrl)} alt="Banner" className="seller-profile-banner" />
          ) : (
            <div className="seller-profile-banner" />
          )}
          <div className="seller-profile-content">
            {seller.storeLogoUrl ? (
              <img src={getOptimizedImageUrl(seller.storeLogoUrl)} alt={seller.storeName} className="seller-profile-logo" />
            ) : (
              <div className="seller-profile-logo">
                {seller.storeName.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="seller-profile-name">{seller.storeName}</h1>
            <div className="seller-profile-meta">
              <span className="seller-profile-rating">
                <Star size={16} fill="currentColor" /> {seller.rating.toFixed(1)}
              </span>
              <span>Joined {new Date(seller.createdAt).getFullYear()}</span>
              {seller.isVerified && <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>✓ Verified</span>}
            </div>
            <p className="seller-profile-desc">{seller.storeDescription || 'Welcome to our store. Browse our latest fashion collection.'}</p>
          </div>
        </div>
      )}

      {/* Seller Products */}
      <div className="seller-products-section">
        <div className="seller-products-header">
          <h2 className="seller-products-title">All Products</h2>
        </div>

        {isProductsLoading ? (
          <div className="catalog-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div className="catalog-skeleton-card" key={i}>
                <LoadingSkeleton variant="rect" height={260} />
                <div className="skeleton-body">
                  <LoadingSkeleton variant="text" width="70%" />
                  <LoadingSkeleton variant="text" width="40%" />
                </div>
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="catalog-grid">
            {products.map((product) => (
              <Link to={`/products/${product.productId}`} key={product.productId} className="editorial-product-card">
                <div className="editorial-product-visual">
                  {product.mainImageUrl ? (
                    <img src={getOptimizedImageUrl(product.mainImageUrl)} alt={product.name} loading="lazy" />
                  ) : (
                    <div className="product-placeholder"><span>No image</span></div>
                  )}
                  {product.averageRating > 0 && (
                    <div className="editorial-product-rating-badge">
                      <Star size={12} fill="currentColor" className="star-icon" />
                      <span>{product.averageRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <div className="editorial-product-body">
                  <span className="editorial-product-category">{product.categoryName}</span>
                  <h3 className="editorial-product-name">{product.name}</h3>
                  <div className="editorial-product-footer">
                    <span className="editorial-product-price">
                      {product.variants.length > 0
                        ? `${Math.min(...product.variants.map(v => v.price)).toFixed(2)} EGP`
                        : `${product.basePrice.toFixed(2)} EGP`}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="catalog-empty">
            <p>This seller hasn't listed any products yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
