import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useBrowseProducts } from './hooks/useProducts';
import { useCategoriesTree } from './hooks/useCategories';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from '../wishlist/hooks/useWishlist';
import type { Category } from '../../types/category';
import { getOptimizedImageUrl } from '../../utils/cloudinary';
import './ProductListPage.css';

export const ProductListPage: React.FC = () => {
  const { isAuthenticated, roles } = useAuth();
  const isCustomer = isAuthenticated && roles.includes('Customer');
  const { data: wishlist } = useWishlist(isCustomer);
  const addToWishlistMutation = useAddToWishlist();
  const removeFromWishlistMutation = useRemoveFromWishlist();

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const currentPage = Number(searchParams.get('page')) || 1;
  const categoryId = searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined;
  const search = searchParams.get('search') || undefined;

  const { data: products, isLoading, error } = useBrowseProducts({
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      params.set('search', searchInput.trim());
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleCategoryChange = (catId: string) => {
    const params = new URLSearchParams(searchParams);
    if (catId) {
      params.set('categoryId', catId);
    } else {
      params.delete('categoryId');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
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
    <div className="product-list-page">
      <header className="catalog-header">
        <h1 className="catalog-title">Product Catalog</h1>
        <p className="catalog-subtitle">Browse clothing from independent sellers across the marketplace</p>
      </header>

      <div className="catalog-toolbar">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Search products by name or brand…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search products"
          />
          <Button type="submit" size="sm">Search</Button>
        </form>

        <div className="filter-group">
          <select
            className="category-select"
            value={categoryId ?? ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {flatCategories.map((cat) => (
              <option key={cat.categoryId} value={cat.categoryId}>
                {cat.parentCategoryName ? `${cat.parentCategoryName} → ` : ''}{cat.name}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button className="clear-filters-btn" onClick={clearFilters} type="button">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="product-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div className="product-card-skeleton" key={i}>
              <LoadingSkeleton variant="rect" height={220} />
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

      {!isLoading && !error && products && products.length === 0 && (
        <div className="catalog-empty">
          <h2>No products found</h2>
          <p>
            {hasActiveFilters
              ? 'Try adjusting your search or category filters.'
              : 'There are no approved products in the catalog yet.'}
          </p>
          {hasActiveFilters && (
            <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>
          )}
        </div>
      )}

      {!isLoading && !error && products && products.length > 0 && (
        <>
          <div className="product-grid">
            {products.map((product) => {
              const firstVariantId = product.variants[0]?.variantId;
              const isInWishlist = wishlist?.some(item => item.variantId === firstVariantId) ?? false;
              
              return (
                <Link
                  to={`/products/${product.productId}`}
                  key={product.productId}
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
                      <button
                        className={`wishlist-heart-btn ${isInWishlist ? 'is-active' : ''}`}
                        onClick={(e) => handleWishlistToggle(e, firstVariantId, isInWishlist)}
                        title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                        type="button"
                      >
                        {isInWishlist ? '❤️' : '🤍'}
                      </button>
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
                          ★ {product.averageRating.toFixed(1)} ({product.reviewCount})
                        </span>
                      )}
                    </div>
                    <span className="product-store">by {product.storeName}</span>
                  </div>
                </Link>
              );
            })}
          </div>

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
    </div>
  );
};
