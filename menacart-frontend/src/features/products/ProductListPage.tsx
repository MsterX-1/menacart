import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useBrowseProducts } from './hooks/useProducts';
import { useCategoriesTree } from './hooks/useCategories';
import { usePublicSellers } from '../seller-onboarding/hooks/useSellerOnboarding';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from '../wishlist/hooks/useWishlist';
import type { Category } from '../../types/category';
import { getOptimizedImageUrl } from '../../utils/cloudinary';
import { 
  LuSearch, LuSlidersHorizontal, LuSmartphone, LuLaptop, 
  LuPlug, LuShirt, LuDribbble, LuSparkles, 
  LuGamepad2, LuPalette, LuShoppingBag, LuBox, LuBook, LuShoppingCart, LuGem, LuCar,
  LuStore, LuGlobe, LuHeart, LuStar
} from 'react-icons/lu';
import { FiHome } from 'react-icons/fi';
import { GiDress } from 'react-icons/gi';
import './ProductListPage.css';

const getCategoryIcon = (name: string) => {
  if (!name) return <LuBox size={16} />;
  const n = name.toLowerCase();
  if (n.includes('women') || n.includes('dress') || n.includes('girl')) return <GiDress size={16} />;
  if (n.includes('electronic') || n.includes('tech') || n.includes('computer') || n.includes('phone') || n.includes('gadget')) return <LuPlug size={16} />;
  if (n.includes('clothing') || n.includes('apparel') || n.includes('fashion') || n.includes('shirt') || n.includes('men')) return <LuShirt size={16} />;
  if (n.includes('home') || n.includes('furniture') || n.includes('kitchen') || n.includes('decor')) return <FiHome size={16} />;
  if (n.includes('sport') || n.includes('outdoor') || n.includes('fitness')) return <LuDribbble size={16} />;
  if (n.includes('beauty') || n.includes('health') || n.includes('makeup') || n.includes('care')) return <LuSparkles size={16} />;
  if (n.includes('toy') || n.includes('game') || n.includes('kids')) return <LuGamepad2 size={16} />;
  if (n.includes('book') || n.includes('stationery')) return <LuBook size={16} />;
  if (n.includes('grocery') || n.includes('food') || n.includes('drink')) return <LuShoppingCart size={16} />;
  if (n.includes('jewelry') || n.includes('accessor') || n.includes('watch')) return <LuGem size={16} />;
  if (n.includes('auto') || n.includes('car') || n.includes('vehicle')) return <LuCar size={16} />;
  return <LuBox size={16} />;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export const ProductListPage: React.FC = () => {
  const { isAuthenticated, roles } = useAuth();
  const isCustomer = isAuthenticated && (roles.includes('Customer') || roles.includes('Seller'));
  const { data: wishlist } = useWishlist(isCustomer);
  const addToWishlistMutation = useAddToWishlist();
  const removeFromWishlistMutation = useRemoveFromWishlist();

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const currentPage = Number(searchParams.get('page')) || 1;
  const categoryId = searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined;
  const sellerId = searchParams.get('sellerId') ? Number(searchParams.get('sellerId')) : undefined;
  const search = searchParams.get('search') || undefined;

  const { data: products, isLoading, isFetching, error } = useBrowseProducts({
    search,
    categoryId,
    sellerId,
    page: currentPage,
    pageSize: 20,
  });

  const { data: categories } = useCategoriesTree();

  const { data: publicSellers } = usePublicSellers('', 1, 100);

  // Debounced search on character change
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearchParams((prev) => {
        const currentSearch = prev.get('search') || '';
        const trimmedInput = searchInput.trim();
        
        // Only update URL and reset page if the search query ACTUALLY changed
        if (currentSearch === trimmedInput) {
          return prev;
        }

        const params = new URLSearchParams(prev);
        if (trimmedInput) {
          params.set('search', trimmedInput);
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

  const handleSellerChange = (sId: string) => {
    const params = new URLSearchParams(searchParams);
    if (sId) {
      params.set('sellerId', sId);
    } else {
      params.delete('sellerId');
    }
    params.set('page', '1');
    setSearchParams(params, { replace: true });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const hasActiveFilters = !!(search || categoryId || sellerId);

  const activeParentId = useMemo(() => {
    if (!categoryId || !categories) return null;
    for (const root of categories) {
      if (root.categoryId === categoryId) return root.categoryId;
      const findInTree = (cats: Category[]): boolean => {
        for (const c of cats) {
          if (c.categoryId === categoryId) return true;
          if (c.childCategories && findInTree(c.childCategories)) return true;
        }
        return false;
      };
      if (root.childCategories && findInTree(root.childCategories)) {
        return root.categoryId;
      }
    }
    return null;
  }, [categoryId, categories]);

  return (
    <motion.div 
      className="product-list-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <header className="catalog-header">
        <h1 className="catalog-title">Product Catalog</h1>
        <p className="catalog-subtitle">Browse collections from independent sellers across the marketplace</p>
      </header>

      <div className="catalog-filters-section">
        <div className="search-bar-wrapper">
          <span className="search-icon-prefix"><LuSearch /></span>
          <input
            type="text"
            className="search-input"
            placeholder="Search products by name, brand, or style..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search products"
          />
          <button 
            className={`filter-toggle-btn ${hasActiveFilters ? 'has-filters' : ''}`}
            onClick={() => setIsFilterOpen(true)}
            aria-label="Open Filters"
          >
            <LuSlidersHorizontal size={20} />
            {hasActiveFilters && <span className="filter-badge" />}
          </button>
        </div>

        <AnimatePresence>
          {isFilterOpen && (
            <div className="filter-modal-overlay" onClick={() => setIsFilterOpen(false)}>
              <motion.div 
                className="filter-modal-content"
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="filter-modal-header">
                  <h3>Filters</h3>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="clear-filters-btn">
                      Clear All
                    </Button>
                  )}
                </div>

                <div className="filter-section">
                  <h4>Category & Gender</h4>
                  <div className="parent-category-filters">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`parent-category-btn ${!activeParentId ? 'active' : ''}`}
                      onClick={() => handleCategoryChange('')}
                    >
                      <LuGlobe size={16} /> All
                    </motion.button>
                    {categories?.map(cat => (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        key={cat.categoryId}
                        className={`parent-category-btn ${activeParentId === cat.categoryId ? 'active' : ''}`}
                        onClick={() => handleCategoryChange(String(cat.categoryId))}
                      >
                        {getCategoryIcon(cat.name)} {cat.name}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="filter-section">
                  <h4>Store</h4>
                  <div className="parent-category-filters">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`parent-category-btn ${!sellerId ? 'active' : ''}`}
                      onClick={() => handleSellerChange('')}
                    >
                      <LuStore size={16} /> All Stores
                    </motion.button>
                    {publicSellers?.items.map((seller) => (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        key={seller.sellerId}
                        className={`parent-category-btn ${sellerId === seller.sellerId ? 'active' : ''}`}
                        onClick={() => handleSellerChange(String(seller.sellerId))}
                      >
                        {seller.storeName}
                      </motion.button>
                    ))}
                  </div>
                </div>
                
                <div className="filter-modal-footer">
                  <Button variant="primary" onClick={() => setIsFilterOpen(false)} style={{ width: '100%' }}>
                    View Results
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Child Categories Sub-filters */}
      {(() => {
        const selectedParent = activeParentId && categories ? categories.find(c => c.categoryId === activeParentId) : null;
        if (selectedParent && selectedParent.childCategories?.length) {
          return (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="child-categories-pills"
            >
              <span className="child-pills-label">Subcategories:</span>
              <div className="child-pills-container">
                <button
                  className={`category-pill-btn ${categoryId === activeParentId ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(String(activeParentId))}
                >
                  All {selectedParent.name}
                </button>
                {selectedParent.childCategories.map((child: any) => (
                  <button
                    key={child.categoryId}
                    className={`category-pill-btn ${categoryId === child.categoryId ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(String(child.categoryId))}
                  >
                    {getCategoryIcon(child.name)} {child.name}
                  </button>
                ))}
              </div>
            </motion.div>
          );
        }
        return null;
      })()}


      {isLoading && !products && (
        <div className="product-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div className="product-card-skeleton" key={i}>
              <LoadingSkeleton variant="rect" height={260} />
              <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
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
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="catalog-empty"
        >
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
            className={`product-grid ${isFetching ? 'catalog-fetching' : ''}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {products.map((product) => {
              const firstVariantId = product.variants[0]?.variantId;
              const isInWishlist = wishlist?.some(item => item.variantId === firstVariantId) ?? false;
              
              return (
                <motion.div variants={itemVariants} key={product.productId} style={{ height: '100%' }}>
                  <Link
                    to={`/products/${product.productId}`}
                    className="product-card"
                  >
                    <div className="product-card-image">
                      {product.mainImageUrl ? (
                        <img src={getOptimizedImageUrl(product.mainImageUrl)} alt={product.name} loading="lazy" />
                      ) : (
                        <div className="product-image-placeholder">
                          <span>No image</span>
                        </div>
                      )}
                      {isCustomer && firstVariantId && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className={`wishlist-heart-btn ${isInWishlist ? 'is-active' : ''}`}
                          onClick={(e) => handleWishlistToggle(e, firstVariantId, isInWishlist)}
                          title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                          type="button"
                        >
                          <LuHeart fill={isInWishlist ? 'currentColor' : 'none'} size={20} />
                        </motion.button>
                      )}
                    </div>
                    <div className="product-card-body">
                      <span className="product-category-tag">{product.categoryName}</span>
                      <h3 className="product-card-name">{product.name}</h3>
                      {product.brand && <span className="product-brand">{product.brand}</span>}
                      <div className="product-card-footer">
                        <span className="product-price">
                          {product.variants.length > 0
                            ? `${Math.min(...product.variants.map(v => v.price)).toFixed(2)} EGP`
                            : `${product.basePrice.toFixed(2)} EGP`}
                        </span>
                        {product.reviewCount > 0 && (
                          <span className="product-rating">
                            <LuStar size={12} fill="currentColor" /> {product.averageRating.toFixed(1)} <span className="text-muted">({product.reviewCount})</span>
                          </span>
                        )}
                      </div>
                      <span className="product-store">by {product.storeName}</span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

          <div className="catalog-pagination">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </Button>
            <span className="page-indicator">Page {currentPage}</span>
            <Button
              variant="secondary"
              size="sm"
              disabled={products.length < 20}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </motion.div>
  );
};
