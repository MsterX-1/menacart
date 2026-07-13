import React from 'react';
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
              <div className="seller-profile-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 'bold', color: '#ccc' }}>
                {seller.storeName.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="seller-profile-name">{seller.storeName}</h1>
            <div className="seller-profile-meta">
              <span className="seller-profile-rating">
                ★ {seller.rating.toFixed(1)}
              </span>
              <span>Joined {new Date(seller.createdAt).getFullYear()}</span>
              {seller.isVerified && <span style={{ color: 'var(--color-primary)' }}>✓ Verified</span>}
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
          <div className="product-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div className="product-card-skeleton" key={i}>
                <LoadingSkeleton variant="rect" height={220} />
                <div style={{ padding: 'var(--space-3)' }}>
                  <LoadingSkeleton variant="text" width="70%" />
                  <LoadingSkeleton variant="text" width="40%" />
                </div>
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="product-grid">
            {products.map((product) => (
              <Link to={`/products/${product.productId}`} key={product.productId} className="product-card">
                <div className="product-card-image">
                  {product.mainImageUrl ? (
                    <img src={getOptimizedImageUrl(product.mainImageUrl)} alt={product.name} loading="lazy" />
                  ) : (
                    <div className="product-image-placeholder"><span>No image</span></div>
                  )}
                </div>
                <div className="product-card-body">
                  <span className="product-category-tag">{product.categoryName}</span>
                  <h3 className="product-card-name">{product.name}</h3>
                  <div className="product-card-footer">
                    <span className="product-price">
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
