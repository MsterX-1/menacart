import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { getCategoriesTree } from '../products/api/categoriesApi';
import { browseProducts } from '../products/api/productsApi';
import { getPublicSellers } from '../seller-onboarding/api/sellerOnboardingApi';
import { Carousel } from '../../components/Carousel';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { LuArrowRight as ArrowRight, LuStar as Star, LuShieldCheck as ShieldCheck } from 'react-icons/lu';
import { getOptimizedImageUrl } from '../../utils/cloudinary';
import './HomePage.css';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

export const HomePage: React.FC = () => {
  // Fetch categories
  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategoriesTree,
  });

  // Fetch recent products
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
    <motion.div 
      className="home-page"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Editorial Hero Section */}
      <motion.section className="editorial-hero" variants={itemVariants}>

        <div className="editorial-hero-content">
          <motion.div className="hero-badge" variants={itemVariants}>
            <ShieldCheck size={16} /> Verified Independent Sellers
          </motion.div>
          <motion.h1 className="hero-title" variants={itemVariants}>
            Curated Commerce. <br/> <span className="hero-title-highlight">Elevated Style.</span>
          </motion.h1>
          <motion.p className="hero-subtitle" variants={itemVariants}>
            Shop directly from top-rated independent sellers. Experience seamless checkout and guaranteed quality with premium delivery.
          </motion.p>
          <motion.div variants={itemVariants} className="hero-actions">
            <Link to="/products" className="hero-cta primary">
              Shop Collections <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
        <div className="editorial-hero-visual">
          <div className="hero-img-main" />
        </div>
      </motion.section>

      {/* Categories Grid */}
      <motion.section variants={itemVariants} className="home-section">
        <div className="section-header">
          <h2>Shop by Category</h2>
        </div>
        <div className="editorial-categories-grid">
          {isCategoriesLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <LoadingSkeleton key={i} variant="rect" height={320} />
            ))
          ) : (
            categories?.slice(0, 6).map((cat) => (
              <Link to={`/products?categoryId=${cat.categoryId}`} key={cat.categoryId} className="editorial-category-card">
                <div className="editorial-cat-bg">
                  {cat.imageUrl ? (
                    <img 
                      src={getOptimizedImageUrl(cat.imageUrl)} 
                      alt={cat.name} 
                      className="editorial-cat-img" 
                      loading="lazy" 
                    />
                  ) : (
                    <div className="editorial-cat-placeholder" style={{ width: '100%', height: '100%', background: 'var(--color-bg-panel)' }} />
                  )}
                  <div className="editorial-cat-overlay" />
                </div>
                <div className="editorial-cat-content">
                  <span className="editorial-cat-name">{cat.name}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </motion.section>

      {/* Featured Sellers Carousel */}
      <motion.section variants={itemVariants} className="home-section">
        <Carousel title="Featured Boutiques">
          {isSellersLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ width: 320, height: 380 }}>
                <LoadingSkeleton variant="rect" height={380} />
              </div>
            ))
          ) : (
            sellersData?.items.map((seller) => (
              <div key={seller.sellerId} style={{ width: 320, padding: '10px' }}>
                <Link to={`/seller/${seller.sellerId}`} className="editorial-seller-card">
                  <div className="editorial-seller-banner">
                    {seller.storeBannerUrl ? (
                      <img src={getOptimizedImageUrl(seller.storeBannerUrl)} alt={`${seller.storeName} banner`} loading="lazy" />
                    ) : (
                      <div className="editorial-seller-banner-placeholder" />
                    )}
                  </div>
                  <div className="editorial-seller-body">
                    <div className="editorial-seller-avatar">
                      {seller.storeLogoUrl ? (
                        <img src={getOptimizedImageUrl(seller.storeLogoUrl)} alt={seller.storeName} loading="lazy" />
                      ) : (
                        <span>{seller.storeName.charAt(0)}</span>
                      )}
                    </div>
                    <h3 className="editorial-seller-name">{seller.storeName}</h3>
                    <div className="editorial-seller-meta">
                      <span className="seller-rating">
                        <Star size={14} className="star-icon" fill="currentColor" /> {seller.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))
          )}
        </Carousel>
      </motion.section>

      {/* New Arrivals Carousel */}
      <motion.section variants={itemVariants} className="home-section">
        <Carousel title="The Latest Edit">
          {isProductsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ width: 280, height: 420 }}>
                <LoadingSkeleton variant="rect" height={420} />
              </div>
            ))
          ) : (
            recentProducts?.slice(0, 10).map((product) => (
              <div key={product.productId} style={{ width: 280, padding: '10px' }}>
                <Link to={`/products/${product.productId}`} className="editorial-product-card">
                  <div className="editorial-product-visual">
                    {product.mainImageUrl ? (
                      <img src={getOptimizedImageUrl(product.mainImageUrl)} alt={product.name} loading="lazy" />
                    ) : (
                      <div className="product-placeholder">No Image</div>
                    )}
                    <div className="editorial-product-store-badge">{product.storeName}</div>
                    {product.averageRating > 0 && (
                      <div className="editorial-product-rating-badge">
                        <Star size={12} fill="currentColor" /> {product.averageRating.toFixed(1)}
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
              </div>
            ))
          )}
        </Carousel>
      </motion.section>

    </motion.div>
  );
};
