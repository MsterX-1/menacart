import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCategoriesTree } from '../products/api/categoriesApi';
import { browseProducts } from '../products/api/productsApi';
import { getPublicSellers } from '../seller-onboarding/api/sellerOnboardingApi';
import { Carousel } from '../../components/Carousel';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { getOptimizedImageUrl } from '../../utils/cloudinary';
import './HomePage.css';
import '../products/ProductListPage.css'; // For product-card styles

export const HomePage: React.FC = () => {
  // Fetch categories
  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategoriesTree,
  });

  // Fetch recent products (just browse without filters)
  const { data: recentProducts, isLoading: isProductsLoading } = useQuery({
    queryKey: ['products', 'recent'],
    queryFn: () => browseProducts({ page: 1, pageSize: 10 }),
  });

  // Fetch featured/active sellers
  const { data: sellersData, isLoading: isSellersLoading } = useQuery({
    queryKey: ['sellers', 'public'],
    queryFn: () => getPublicSellers(undefined, 1, 10),
  });

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg-accent"></div>
        <div className="hero-content">
          <h1 className="hero-title">Discover the Best Independent Fashion</h1>
          <p className="hero-subtitle">
            Shop directly from top-rated sellers. Curated collections, verified quality, and seamless checkout.
          </p>
          <Link to="/products" className="hero-cta">
            Shop All Collections
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section>
        <h2>Shop by Category</h2>
        <div className="categories-grid" style={{ marginTop: '1.5rem' }}>
          {isCategoriesLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <LoadingSkeleton key={i} variant="rect" height={160} />
            ))
          ) : (
            categories?.slice(0, 6).map((cat) => (
              <Link to={`/products?categoryId=${cat.categoryId}`} key={cat.categoryId} className="category-card">
                <div className="category-image-wrapper">
                  {cat.imageUrl ? (
                    <img 
                      src={getOptimizedImageUrl(cat.imageUrl)} 
                      alt={cat.name} 
                      className="category-image" 
                      loading="lazy" 
                    />
                  ) : (
                    <div className="category-icon">
                      {cat.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="category-name">{cat.name}</span>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Featured Sellers Carousel */}
      <Carousel title="Featured Sellers">
        {isSellersLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ width: 280, height: 280 }}>
              <LoadingSkeleton variant="rect" height={280} />
            </div>
          ))
        ) : (
          sellersData?.items.map((seller) => (
            <Link to={`/seller/${seller.sellerId}`} key={seller.sellerId} className="seller-card">
              {seller.storeBannerUrl ? (
                <img src={getOptimizedImageUrl(seller.storeBannerUrl)} alt="Banner" className="seller-banner" loading="lazy" />
              ) : (
                <div className="seller-banner-placeholder" />
              )}
              {seller.storeLogoUrl ? (
                <img src={getOptimizedImageUrl(seller.storeLogoUrl)} alt={seller.storeName} className="seller-logo" loading="lazy" />
              ) : (
                <div className="seller-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem', color: '#ccc' }}>
                  {seller.storeName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="seller-info">
                <h3 className="seller-name">{seller.storeName}</h3>
                <div className="seller-rating">
                  <span className="seller-rating-star">★</span> {seller.rating.toFixed(1)}
                  {seller.isVerified && <span style={{ color: 'var(--primary-color)', marginLeft: '4px' }}>✓</span>}
                </div>
                <p className="seller-desc">{seller.storeDescription || 'A great fashion store.'}</p>
                <div className="seller-visit-btn">Visit Store</div>
              </div>
            </Link>
          ))
        )}
      </Carousel>

      {/* Recent Products Carousel */}
      <Carousel title="New Arrivals">
        {isProductsLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ width: 250, height: 320 }}>
              <LoadingSkeleton variant="rect" height={320} />
            </div>
          ))
        ) : (
          recentProducts?.slice(0, 10).map((product) => (
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
                <span className="product-store">by {product.storeName}</span>
              </div>
            </Link>
          ))
        )}
      </Carousel>

      {/* Top Rated Products Carousel */}
      <Carousel title="Top Rated Products">
        {isProductsLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ width: 250, height: 320 }}>
              <LoadingSkeleton variant="rect" height={320} />
            </div>
          ))
        ) : (
          [...(recentProducts || [])]
            .sort((a, b) => b.averageRating - a.averageRating)
            .slice(0, 10)
            .map((product) => (
            <Link to={`/products/${product.productId}`} key={`top-${product.productId}`} className="product-card">
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
                  {product.averageRating > 0 && (
                    <span className="product-rating">
                      ★ {product.averageRating.toFixed(1)}
                    </span>
                  )}
                </div>
                <span className="product-store">by {product.storeName}</span>
              </div>
            </Link>
          ))
        )}
      </Carousel>
    </div>
  );
};
