import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useBrowseProducts } from './hooks/useProducts';
import { useCategoriesTree } from './hooks/useCategories';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from '../wishlist/hooks/useWishlist';
import type { Category } from '../../types/category';
import { getOptimizedImageUrl } from '../../utils/cloudinary';
import { Search, Heart, Star, ChevronLeft, ChevronRight, X, ChevronDown } from 'lucide-react';
import './ProductListPage.css';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

export const ProductListPage: React.FC = () => {
  const { isAuthenticated, roles } = useAuth();
  const isCustomer = isAuthenticated && roles.includes('Customer');
  const { data: wishlist } = useWishlist(isCustomer);
  const addToWishlistMutation = useAddToWishlist();
  const removeFromWishlistMutation = useRemoveFromWishlist();

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const currentPage = Number(searchParams.get('page')) || 1;
  const categoryId = searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined;
  const search = searchParams.get('search') || undefined;

  const { data: products, isLoading, isFetching, error } = useBrowseProducts({
    search,
    categoryId,
    page: currentPage,
    pageSize: 20,
  });

  const { data: categories } = useCategoriesTree();

  const flatCategories = useMemo(() => {
    if (!categories) return [];
    const flatten = (cats: Category[]): Category[] =>
      cats.flatMap((c) => [c, ...flatten(c.childCategories)]);
    return flatten(categories);
  }, [categories]);

  // Debounced search on character change
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (searchInput.trim()) {
          params.set('search', searchInput.trim());
        } else {
          params.delete('search');
        }
        params.set('page', '1');
        return params;
      }, { replace: true });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchInput, setSearchParams]);

  const handleCategoryChange = (catId: string) => {
    const params = new URLSearchParams(searchParams);
    if (catId) {
      params.set('categoryId', catId);
    } else {
      params.delete('categoryId');
    }
    params.set('page', '1');
    setSearchParams(params, { replace: true });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
    setSearchInput('');
  };

  const handleWishlistToggle = async (e: React.MouseEvent, variantId: number, isInWishlist: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (isInWishlist) {
        await removeFromWishlistMutation.mutateAsync(variantId);
      } else {
        await addToWishlistMutation.mutateAsync(variantId);
      }
    } catch (err) {
      console.error('Failed to toggle wishlist:', err);
    }
  };

  const hasActiveFilters = !!(search || categoryId);

  return (
    <motion.div 
      className="product-list-page"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <header className="catalog-header">
        <motion.h1 className="catalog-title" variants={itemVariants}>Product Catalog</motion.h1>
        <motion.p className="catalog-subtitle" variants={itemVariants}>Browse curated collections from independent sellers</motion.p>
      </header>

      <motion.div className="catalog-toolbar-wrapper" style={{ width: '100%', marginBottom: 'var(--space-8)' }} variants={itemVariants}>
        <div className="catalog-toolbar-container">
          <div className="catalog-toolbar-unified">
            <div 
              className="custom-category-dropdown" 
              tabIndex={0}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setIsDropdownOpen(false);
                }
              }}
            >
              <div className="unified-select-display" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <span>{categoryId ? flatCategories.find(c => c.categoryId === categoryId)?.name || 'All Categories' : 'All Categories'}</span>
                <ChevronDown size={16} className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} />
              </div>

              {isDropdownOpen && (
                <div className="custom-dropdown-menu">
                  <div 
                    className="custom-dropdown-option" 
                    onClick={() => { handleCategoryChange(''); setIsDropdownOpen(false); }}
                  >
                    All Categories
                  </div>
                  {flatCategories.map((cat) => (
                    <div 
                      key={cat.categoryId} 
                      className="custom-dropdown-option" 
                      onClick={() => { handleCategoryChange(String(cat.categoryId)); setIsDropdownOpen(false); }}
                    >
                      {cat.parentCategoryName ? `${cat.parentCategoryName} → ` : ''}{cat.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="toolbar-divider"></div>

            <div className="unified-search-wrapper">
              <Search size={18} className="search-icon-prefix" />
              <input
                type="text"
                className="unified-search-input"
                placeholder="Search products by name or brand…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="Search products"
                autoComplete="off"
              />
              {searchInput && (
                <button className="search-clear-btn" onClick={() => setSearchInput('')} aria-label="Clear search">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {hasActiveFilters && (
            <div style={{ position: 'absolute', top: '100%', right: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
              <button className="clear-filters-btn" onClick={clearFilters} type="button">
                Clear filters
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {isLoading && !products && (
        <div className="catalog-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div className="catalog-skeleton-card" key={i}>
              <LoadingSkeleton variant="rect" height={280} />
              <div className="skeleton-body">
                <LoadingSkeleton variant="text" width="70%" />
                <LoadingSkeleton variant="text" width="40%" />
                <LoadingSkeleton variant="text" width="30%" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="catalog-error">
          <p>Failed to load products. Please try again.</p>
          <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      )}

      {products && products.length === 0 && !isLoading && (
        <motion.div className="catalog-empty" variants={itemVariants}>
          <h2>No products found</h2>
          <p>
            {hasActiveFilters
              ? 'Try adjusting your search or category filters.'
              : 'There are no approved products in the catalog yet.'}
          </p>
          {hasActiveFilters && (
            <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>
          )}
        </motion.div>
      )}

      {products && products.length > 0 && (
        <>
          <motion.div 
            className={`catalog-grid ${isFetching ? 'catalog-fetching' : ''}`}
            variants={containerVariants}
          >
            {products.map((product) => {
              const firstVariantId = product.variants[0]?.variantId;
              const isInWishlist = wishlist?.some(item => item.variantId === firstVariantId) ?? false;
              
              return (
                <motion.div variants={itemVariants} key={product.productId} className="catalog-product-wrapper">
                  <Link
                    to={`/products/${product.productId}`}
                    className="editorial-product-card"
                  >
                    <div className="editorial-product-visual">
                      {product.mainImageUrl ? (
                        <img src={getOptimizedImageUrl(product.mainImageUrl)} alt={product.name} loading="lazy" />
                      ) : (
                        <div className="product-placeholder">No Image</div>
                      )}
                      
                      {product.averageRating > 0 && (
                        <div className="editorial-product-rating-badge">
                          <Star size={12} fill="currentColor" /> {product.averageRating.toFixed(1)}
                        </div>
                      )}

                      {isCustomer && firstVariantId && (
                        <button
                          className={`wishlist-heart-btn ${isInWishlist ? 'is-active' : ''}`}
                          onClick={(e) => handleWishlistToggle(e, firstVariantId, isInWishlist)}
                          title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                          type="button"
                        >
                          <Heart size={18} fill={isInWishlist ? 'currentColor' : 'none'} />
                        </button>
                      )}
                    </div>
                    <div className="editorial-product-body">
                      <span className="editorial-product-category">{product.categoryName}</span>
                      <h3 className="editorial-product-name">{product.name}</h3>
                      {product.brand && <span className="editorial-product-brand">{product.brand}</span>}
                      <div className="editorial-product-footer">
                        <span className="editorial-product-price">
                          {product.variants.length > 0
                            ? `${Math.min(...product.variants.map(v => v.price)).toFixed(2)} EGP`
                            : `${product.basePrice.toFixed(2)} EGP`}
                        </span>
                        <span className="editorial-product-store-text">by {product.storeName}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div className="catalog-pagination" variants={itemVariants}>
            <button
              className="pagination-btn"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="page-indicator">Page {currentPage}</span>
            <button
              className="pagination-btn"
              disabled={products.length < 20}
              onClick={() => handlePageChange(currentPage + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={20} />
            </button>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};
